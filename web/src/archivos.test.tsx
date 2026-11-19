import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Archivos } from './archivos'
import { tipoVista } from './api/adjuntos'
import { EditorContenido } from './editor'

const respuesta = (status: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status })
const adjunto = (o: object = {}) => ({
  guid: 'a1', nombre: 'foto.png', tipoMime: 'image/png', tamanoBytes: 2048, fechaCreacion: '2026-11-19T10:00:00Z',
  subidoPor: { guid: 'u1', nombre: 'Ana' }, puedeEliminar: true, ...o,
})

type Ruta = unknown | ((init?: RequestInit) => Response)
let fetchMock: ReturnType<typeof vi.fn>
let rutas: Record<string, Ruta>
const llamadas = (clave: string) =>
  fetchMock.mock.calls.filter(([u, i]) => `${i?.method ?? 'GET'} ${String(u).replace('/api/v1', '')}` === clave)

beforeEach(() => {
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const v = rutas[`${init?.method ?? 'GET'} ${url.replace('/api/v1', '')}`]
    if (v === undefined) return respuesta(404, {})
    return typeof v === 'function' ? (v as (i?: RequestInit) => Response)(init) : respuesta(200, v)
  })
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('confirm', vi.fn(() => true))
  rutas = { 'GET /paginas/p1/adjuntos': [adjunto()] }
})
afterEach(() => vi.unstubAllGlobals())

const archivo = (nombre = 'n.txt', tipo = 'text/plain') => new File(['x'], nombre, { type: tipo })
const subirCon = (f: File) => fireEvent.change(screen.getByLabelText('Archivo a subir'), { target: { files: [f] } })

test('lista los archivos con tipo, tamaño y autor', async () => {
  render(<Archivos guid="p1" editable />)
  expect(await screen.findByText('foto.png')).toBeInTheDocument()
  expect(screen.getByText(/image\/png · 2\.0 KB/)).toHaveTextContent('Ana')
})

test('subir envía FormData con "archivo" y agrega el elemento', async () => {
  rutas['POST /paginas/p1/adjuntos'] = () => respuesta(201, adjunto({ guid: 'a2', nombre: 'n.txt', tipoMime: 'text/plain' }))
  render(<Archivos guid="p1" editable />)
  await screen.findByText('foto.png')
  subirCon(archivo())
  expect(await screen.findByText('n.txt')).toBeInTheDocument()
  const cuerpo = llamadas('POST /paginas/p1/adjuntos')[0][1].body as FormData
  expect(cuerpo).toBeInstanceOf(FormData)
  expect((cuerpo.get('archivo') as File).name).toBe('n.txt')
  expect(llamadas('POST /paginas/p1/adjuntos')[0][1].headers).toBeUndefined()
})

test('un archivo de más de 25 MB se rechaza sin llamar a la API', async () => {
  render(<Archivos guid="p1" editable />)
  await screen.findByText('foto.png')
  const grande = archivo()
  Object.defineProperty(grande, 'size', { value: 26 * 1024 * 1024 })
  subirCon(grande)
  expect(await screen.findByRole('alert')).toHaveTextContent('El archivo supera el máximo de 25 MB')
  expect(llamadas('POST /paginas/p1/adjuntos')).toHaveLength(0)
})

test('un 400 muestra el detail y un 429 el aviso de límite', async () => {
  rutas['POST /paginas/p1/adjuntos'] = () => respuesta(400, { status: 400, detail: 'El archivo está vacío' })
  render(<Archivos guid="p1" editable />)
  await screen.findByText('foto.png')
  subirCon(archivo())
  expect(await screen.findByRole('alert')).toHaveTextContent('El archivo está vacío')
  rutas['POST /paginas/p1/adjuntos'] = () => respuesta(429, { status: 429 })
  subirCon(archivo())
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Demasiadas subidas, espera un momento'))
})

test('eliminar pide confirmación y llama DELETE', async () => {
  rutas['DELETE /adjuntos/a1'] = () => respuesta(204)
  render(<Archivos guid="p1" editable />)
  fireEvent.click(await screen.findByRole('button', { name: 'Eliminar foto.png' }))
  await waitFor(() => expect(screen.queryByText('foto.png')).toBeNull())
  expect(confirm).toHaveBeenCalled()
  expect(llamadas('DELETE /adjuntos/a1')).toHaveLength(1)
})

test('sin puedeEliminar no hay botón de eliminar', async () => {
  rutas['GET /paginas/p1/adjuntos'] = [adjunto({ puedeEliminar: false })]
  render(<Archivos guid="p1" editable />)
  await screen.findByText('foto.png')
  expect(screen.queryByRole('button', { name: /Eliminar/ })).toBeNull()
})

test('la vista previa de una imagen pide url con descargar=false y muestra <img>', async () => {
  rutas['GET /adjuntos/a1/url?descargar=false'] = { url: 'https://blob.test/foto.png?sas=1', expira: 'x' }
  render(<Archivos guid="p1" editable />)
  fireEvent.click(await screen.findByRole('button', { name: 'foto.png' }))
  const dialogo = await screen.findByRole('dialog')
  expect(await within(dialogo).findByRole('img')).toHaveAttribute('src', 'https://blob.test/foto.png?sas=1')
  expect(llamadas('GET /adjuntos/a1/url?descargar=false')).toHaveLength(1)
  fireEvent(dialogo, new Event('cancel', { cancelable: true }))
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('al cerrar la vista previa el foco vuelve al botón que la abrió', async () => {
  rutas['GET /adjuntos/a1/url?descargar=false'] = { url: 'https://blob.test/foto.png?sas=1', expira: 'x' }
  render(<Archivos guid="p1" editable />)
  const abrir = await screen.findByRole('button', { name: 'foto.png' })
  abrir.focus()
  fireEvent.click(abrir)
  const dialogo = await screen.findByRole('dialog')
  expect(screen.getByRole('button', { name: 'Cerrar vista previa' })).toHaveFocus()
  fireEvent.click(dialogo)
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(abrir).toHaveFocus()
})

test('tipoVista: solo subtipos de video y audio de la lista blanca tienen vista previa', () => {
  for (const m of ['video/mp4', 'video/webm', 'video/ogg']) expect(tipoVista(m)).toBe('video')
  for (const m of ['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm', 'AUDIO/MPEG']) expect(tipoVista(m)).toBe('audio')
  for (const m of ['video/x-matroska', 'video/quicktime', 'audio/x-flac', 'image/svg+xml', 'text/html']) expect(tipoVista(m)).toBeNull()
})

test('un SVG no se previsualiza: ficha con Descargar y sin <img>', async () => {
  rutas['GET /paginas/p1/adjuntos'] = [adjunto({ guid: 'a3', nombre: 'logo.svg', tipoMime: 'image/svg+xml' })]
  render(<Archivos guid="p1" editable />)
  fireEvent.click(await screen.findByRole('button', { name: 'logo.svg' }))
  const dialogo = await screen.findByRole('dialog')
  expect(within(dialogo).getByRole('button', { name: 'Descargar' })).toBeInTheDocument()
  expect(within(dialogo).getByText('Subido por')).toBeInTheDocument()
  expect(dialogo.querySelector('img')).toBeNull()
  expect(llamadas('GET /adjuntos/a3/url?descargar=false')).toHaveLength(0)
})

test('el editor renderiza un nodo image pidiendo la URL por attachmentId', async () => {
  rutas['GET /paginas/pe1/contenido'] = { contenido: { type: 'doc', content: [{ type: 'image', attrs: { attachmentId: 'img1' } }] }, version: 1 }
  rutas['GET /adjuntos/img1/url?descargar=false'] = { url: 'https://blob.test/i.png?sas=1', expira: 'x' }
  render(<EditorContenido guid="pe1" editable />)
  await waitFor(() => expect(document.querySelector('.contenido img')).toHaveAttribute('src', 'https://blob.test/i.png?sas=1'))
})

test('Insertar imagen sube el archivo y el PUT guarda el nodo con attachmentId y sin src', async () => {
  rutas['GET /paginas/pe2/contenido'] = { contenido: { type: 'doc', content: [{ type: 'paragraph' }] }, version: 1 }
  rutas['POST /paginas/pe2/adjuntos'] = () => respuesta(201, adjunto({ guid: 'img9' }))
  rutas['GET /adjuntos/img9/url?descargar=false'] = { url: 'https://blob.test/9.png', expira: 'x' }
  rutas['PUT /paginas/pe2/contenido'] = () => respuesta(200, { version: 2 })
  const alSubir = vi.fn()
  render(<EditorContenido guid="pe2" editable alSubirImagen={alSubir} />)
  const boton = await screen.findByRole('button', { name: 'Insertar imagen' })
  fireEvent.click(boton)
  fireEvent.change(screen.getByLabelText('Archivo de imagen'), { target: { files: [archivo('a.png', 'image/png')] } })
  await waitFor(() => expect(alSubir).toHaveBeenCalled())
  await waitFor(() => expect(llamadas('PUT /paginas/pe2/contenido')).toHaveLength(1), { timeout: 4000 })
  const cuerpo = String(llamadas('PUT /paginas/pe2/contenido')[0][1].body)
  expect(JSON.parse(cuerpo).contenido.content).toContainEqual({ type: 'image', attrs: { attachmentId: 'img9', alt: null } })
  expect(cuerpo).not.toContain('src')
})
