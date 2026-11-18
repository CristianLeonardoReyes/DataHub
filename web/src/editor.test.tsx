import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { EditorContenido } from './editor'

const respuesta = (status: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status })
const DOC = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hola mundo' }] }] }

let fetchMock: ReturnType<typeof vi.fn>
let puts: { body: { version: number }; resolver: (r: Response) => void }[]
let gets: number

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  puts = []
  gets = 0
  fetchMock = vi.fn((_url: string, init?: RequestInit) => {
    if (init?.method === 'PUT')
      return new Promise<Response>((resolver) => puts.push({ body: JSON.parse(String(init.body)), resolver }))
    gets++
    return Promise.resolve(respuesta(200, { contenido: DOC, version: 3 }))
  })
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

// Guid distinto por prueba: los guardados en curso se recuerdan por página entre montajes.
let n = 0
async function abrir() {
  render(<EditorContenido guid={`p${++n}`} editable />)
  expect(await screen.findByText('Hola mundo')).toBeInTheDocument()
}
const editar = () => fireEvent.click(screen.getByRole('button', { name: 'Cita' }))
const pasar = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))
const responder = (i: number, r: Response) => act(async () => puts[i].resolver(r))

test('carga el contenido inicial y no guarda sin ediciones', async () => {
  await abrir()
  await pasar(3000)
  expect(puts).toHaveLength(0)
})

test('guarda tras 1,5 s con la versión y muestra Guardado', async () => {
  await abrir()
  editar()
  expect(screen.getByRole('status')).toHaveTextContent('Editando')
  await pasar(1400)
  expect(puts).toHaveLength(0)
  await pasar(200)
  expect(puts).toHaveLength(1)
  expect(puts[0].body.version).toBe(3)
  expect(screen.getByRole('status')).toHaveTextContent('Guardando…')
  await responder(0, respuesta(200, { version: 4 }))
  expect(screen.getByRole('status')).toHaveTextContent('Guardado')
})

test('ediciones durante un guardado encadenan otro PUT con la versión nueva, sin paralelo', async () => {
  await abrir()
  editar()
  await pasar(1600)
  editar()
  await pasar(1600)
  expect(puts).toHaveLength(1)
  await responder(0, respuesta(200, { version: 4 }))
  expect(puts).toHaveLength(2)
  expect(puts[1].body.version).toBe(4)
  await responder(1, respuesta(200, { version: 5 }))
  expect(screen.getByRole('status')).toHaveTextContent('Guardado')
})

test('409 muestra la alerta, deja de guardar y Recargar vuelve a pedir el contenido', async () => {
  await abrir()
  editar()
  await pasar(1600)
  await responder(0, respuesta(409, { status: 409 }))
  expect(screen.getByRole('alert')).toHaveTextContent('Otra persona guardó cambios')
  // En conflicto se bloquea la escritura: sin barra y editor no editable.
  expect(screen.queryByRole('button', { name: 'Cita' })).toBeNull()
  expect(screen.getByRole('textbox', { name: 'Contenido de la página' })).toHaveAttribute('contenteditable', 'false')
  await pasar(3000)
  expect(puts).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: 'Recargar' }))
  expect(await screen.findByText('Hola mundo')).toBeInTheDocument()
  expect(gets).toBe(2)
  expect(screen.queryByRole('alert')).toBeNull()
})

test('un error de validación muestra el detalle y permite reintentar', async () => {
  await abrir()
  editar()
  await pasar(1600)
  await responder(0, respuesta(400, { status: 400, detail: 'Contenido inválido' }))
  expect(screen.getByRole('status')).toHaveTextContent('Error al guardar')
  expect(screen.getByText('Contenido inválido')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
  await pasar(0)
  expect(puts).toHaveLength(2)
})

test('un enlace javascript: se rechaza y uno https se acepta', async () => {
  await abrir()
  fireEvent.click(screen.getByRole('button', { name: 'Enlace' }))
  const url = screen.getByLabelText('Dirección del enlace')
  fireEvent.change(url, { target: { value: 'javascript:alert(1)' } })
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Solo se permiten enlaces http, https o mailto')
  fireEvent.change(url, { target: { value: 'https://example.com' } })
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
  expect(screen.queryByLabelText('Dirección del enlace')).toBeNull()
})

test('la barra aplica negrita y refleja aria-pressed', async () => {
  await abrir()
  const b = screen.getByRole('button', { name: 'Negrita' })
  expect(b).toHaveAttribute('aria-pressed', 'false')
  fireEvent.click(b)
  expect(await screen.findByRole('button', { name: 'Negrita', pressed: true })).toBeInTheDocument()
})

test('al volver a abrir la página espera el guardado en curso antes de leer', async () => {
  const { unmount } = render(<EditorContenido guid="vuelta" editable />)
  expect(await screen.findByText('Hola mundo')).toBeInTheDocument()
  editar()
  unmount() // guarda de inmediato al salir
  expect(puts).toHaveLength(1)
  render(<EditorContenido guid="vuelta" editable />)
  await pasar(100)
  expect(gets).toBe(1) // no lee mientras el guardado sigue en curso
  await responder(0, respuesta(200, { version: 4 }))
  expect(await screen.findByText('Hola mundo')).toBeInTheDocument()
  expect(gets).toBe(2)
})

test('un error de red reintenta solo a los 5 s', async () => {
  await abrir()
  editar()
  await pasar(1600)
  await responder(0, respuesta(503, { status: 503 }))
  expect(screen.getByRole('status')).toHaveTextContent('Error al guardar')
  await pasar(5100)
  expect(puts).toHaveLength(2)
  expect(puts[1].body.version).toBe(3)
})
