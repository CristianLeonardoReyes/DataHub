import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Rutas } from './App'
import { SesionProvider } from './Sesion'

const respuesta = (status: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status })

const COORD = {
  guid: 'u1', nombre: 'Ana', correo: 'a@b.co', perfil: 'coordinador', cliente: { guid: 'cl1', nombre: 'Acme' },
  permisos: ['paginasEditar', 'metadataEditar'],
}
const DETALLE = {
  guid: 'p2', titulo: 'Alta de clientes', coleccionGuid: 'c1', paginaPadreGuid: null, fechaActualizacion: new Date().toISOString(),
  puedeEliminar: false, ruta: [], subpaginas: [],
  estado: 'en_revision', tipoDocumento: 'adr', responsable: { guid: 'r1', nombre: 'Luis' }, fechaRevision: '2026-12-01', etiquetas: ['api'],
  puedeAprobar: true,
}

type Ruta = unknown | ((cuerpo: unknown) => Response)
let fetchMock: ReturnType<typeof vi.fn>
let rutas: Record<string, Ruta>
const llamadas = (clave: string) => fetchMock.mock.calls.filter(([u, i]) => `${i?.method ?? 'GET'} ${String(u).replace('/api/v1', '')}` === clave)

beforeEach(() => {
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const v = rutas[`${init?.method ?? 'GET'} ${url.replace('/api/v1', '')}`]
    if (v === undefined) return respuesta(404, {})
    return typeof v === 'function' ? v(init?.body ? JSON.parse(String(init.body)) : undefined) : respuesta(200, v)
  })
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

function montar(usuario: object = COORD, detalle: object = DETALLE, extra: Record<string, Ruta> = {}) {
  rutas = {
    'GET /auth/me': { ...usuario, sesionExpira: new Date(Date.now() + 3_600_000).toISOString() },
    'GET /arbol': [],
    'GET /paginas/p2': detalle,
    'GET /responsables': [{ guid: 'r1', nombre: 'Luis' }, { guid: 'r2', nombre: 'Marta' }],
    ...extra,
  }
  return render(
    <MemoryRouter initialEntries={['/paginas/p2']}>
      <SesionProvider><Rutas /></SesionProvider>
    </MemoryRouter>,
  )
}

test('la insignia muestra el estado junto al título', async () => {
  montar()
  const titulo = await screen.findByRole('heading', { level: 1, name: 'Alta de clientes' })
  expect(titulo.parentElement).toHaveTextContent('En revisión')
})

test('guardar envía el PUT con todos los campos', async () => {
  montar(COORD, DETALLE, { 'PUT /paginas/p2/metadata': () => respuesta(204) })
  const u = userEvent.setup()
  await screen.findByLabelText('Estado')
  await screen.findByRole('option', { name: 'Marta' })
  expect(screen.getByRole('button', { name: 'Guardar detalles' })).toBeDisabled()
  await u.selectOptions(screen.getByLabelText('Estado'), 'aprobado')
  await u.selectOptions(screen.getByLabelText('Responsable'), 'r2')
  await u.type(screen.getByLabelText('Etiquetas'), 'Mi  Equipo{Enter}')
  await u.click(screen.getByRole('button', { name: 'Guardar detalles' }))
  await waitFor(() => expect(llamadas('PUT /paginas/p2/metadata')).toHaveLength(1))
  expect(JSON.parse(String(llamadas('PUT /paginas/p2/metadata')[0][1].body))).toEqual({
    estado: 'aprobado', tipoDocumento: 'adr', responsableGuid: 'r2', fechaRevision: '2026-12-01', etiquetas: ['api', 'mi equipo'],
  })
})

test('sin puedeAprobar la opción Aprobado está deshabilitada', async () => {
  montar(COORD, { ...DETALLE, puedeAprobar: false })
  expect(await screen.findByRole('option', { name: 'Aprobado' })).toBeDisabled()
  expect(screen.getByText('Solo un Coordinador o superior puede aprobar')).toBeInTheDocument()
})

test('etiquetas: Enter agrega sin duplicados y × quita', async () => {
  montar()
  const u = userEvent.setup()
  const campo = await screen.findByLabelText('Etiquetas')
  await u.type(campo, 'Backend {Enter}')
  await u.type(campo, 'backend,')
  expect(screen.getAllByRole('button', { name: 'Quitar etiqueta backend' })).toHaveLength(1)
  await u.click(screen.getByRole('button', { name: 'Quitar etiqueta backend' }))
  expect(screen.queryByRole('button', { name: 'Quitar etiqueta backend' })).toBeNull()
})

test('escribir una etiqueta consulta /etiquetas?q=', async () => {
  montar(COORD, DETALLE, { 'GET /etiquetas?q=ba': ['backend'] })
  await userEvent.type(await screen.findByLabelText('Etiquetas'), 'Ba')
  await waitFor(() => expect(llamadas('GET /etiquetas?q=ba')).toHaveLength(1))
})

test('un 403 muestra el detail', async () => {
  montar(COORD, DETALLE, { 'PUT /paginas/p2/metadata': () => respuesta(403, { detail: 'Solo un Coordinador o superior puede aprobar una página' }) })
  const u = userEvent.setup()
  await u.selectOptions(await screen.findByLabelText('Tipo'), 'manual')
  await u.click(screen.getByRole('button', { name: 'Guardar detalles' }))
  expect(await screen.findByText('Solo un Coordinador o superior puede aprobar una página')).toBeInTheDocument()
})

test('sin metadataEditar el panel es de solo lectura', async () => {
  montar({ ...COORD, permisos: ['paginasEditar'] })
  expect(await screen.findByText('Luis')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Guardar detalles' })).toBeNull()
  expect(screen.queryByLabelText('Estado')).toBeNull()
})
