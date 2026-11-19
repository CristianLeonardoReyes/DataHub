import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Rutas } from './App'
import { SesionProvider } from './Sesion'

const respuesta = (status: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status })

const CLIENTE = { guid: 'cl1', nombre: 'Acme' }
const ADMIN = {
  guid: 'u1', nombre: 'Ana', correo: 'a@b.co', perfil: 'admin', cliente: CLIENTE,
  permisos: ['workspacesGestionar', 'workspacesAsignarUsuarios', 'espaciosColeccionesGestionar', 'paginasEditar', 'paginasEliminar'],
}
const COLABORADOR = { ...ADMIN, perfil: 'colaborador', permisos: ['paginasEditar'] }

const ARBOL = [{
  guid: 'w1', nombre: 'Soporte', descripcion: 'Equipo', espacios: [{
    guid: 'e1', nombre: 'Manuales', descripcion: null, colecciones: [{
      guid: 'c1', nombre: 'Guias', descripcion: null, paginas: [{ guid: 'p1', titulo: 'Inicio rapido', paginas: [] }],
    }],
  }],
}]

const DETALLE = {
  guid: 'p2', titulo: 'Alta de clientes', coleccionGuid: 'c1', paginaPadreGuid: 'p1', fechaActualizacion: new Date().toISOString(),
  puedeEliminar: false,
  estado: 'borrador', tipoDocumento: 'general', responsable: null, fechaRevision: null, etiquetas: [], puedeAprobar: false,
  ruta: [
    { tipo: 'workspace', guid: 'w1', nombre: 'Soporte' },
    { tipo: 'espacio', guid: 'e1', nombre: 'Manuales' },
    { tipo: 'coleccion', guid: 'c1', nombre: 'Guias' },
    { tipo: 'pagina', guid: 'p1', nombre: 'Inicio rapido' },
  ],
  subpaginas: [],
}

type Ruta = unknown | ((cuerpo: unknown) => Response)
let fetchMock: ReturnType<typeof vi.fn>
let rutas: Record<string, Ruta>

const llamadas = (clave: string) => fetchMock.mock.calls.filter(([u, i]) => `${i?.method ?? 'GET'} ${String(u).replace('/api/v1', '')}` === clave)

beforeEach(() => {
  rutas = {}
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const v = rutas[`${init?.method ?? 'GET'} ${url.replace('/api/v1', '')}`]
    if (v === undefined) return respuesta(404, {})
    return typeof v === 'function' ? v(init?.body ? JSON.parse(String(init.body)) : undefined) : respuesta(200, v)
  })
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

function montar(ruta: string, usuario: unknown = ADMIN, extra: Record<string, Ruta> = {}) {
  rutas = {
    'GET /auth/me': { ...(usuario as object), sesionExpira: new Date(Date.now() + 3_600_000).toISOString() },
    'GET /arbol': ARBOL,
    'GET /paginas/recientes': [],
    ...extra,
  }
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <SesionProvider><Rutas /></SesionProvider>
    </MemoryRouter>,
  )
}

test('el árbol se muestra y se expande y contrae', async () => {
  montar('/')
  const ws = await screen.findByRole('button', { name: 'Soporte' })
  expect(ws).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('link', { name: 'Inicio rapido' })).toHaveAttribute('href', '/paginas/p1')
  await userEvent.click(ws)
  expect(ws).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('link', { name: 'Inicio rapido' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Manuales' })).toBeNull()
})

test('sin árbol muestra el estado vacío', async () => {
  montar('/', ADMIN, { 'GET /arbol': [] })
  expect(await screen.findByText('Aún no hay workspaces')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Crear workspace' })).toHaveAttribute('href', '/workspaces')
})

test('un colaborador no ve acciones de workspace ni espacio; en colección y páginas solo las de páginas', async () => {
  montar('/', COLABORADOR)
  await screen.findByRole('button', { name: 'Soporte' })
  expect(screen.queryByRole('button', { name: 'Acciones de Soporte' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Acciones de Manuales' })).toBeNull()
  await userEvent.click(screen.getByRole('button', { name: 'Acciones de Guias' }))
  expect(screen.getByRole('button', { name: 'Agregar página' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Renombrar' })).toBeNull()
  await userEvent.click(screen.getByRole('button', { name: 'Acciones de Inicio rapido' }))
  expect(screen.getByRole('button', { name: 'Agregar subpágina' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Agregar espacio' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Eliminar' })).toBeNull()
})

test('crear un espacio envía POST y recarga el árbol', async () => {
  montar('/', ADMIN, { 'POST /espacios': () => respuesta(201, { guid: 'e2' }) })
  await userEvent.click(await screen.findByRole('button', { name: 'Acciones de Soporte' }))
  await userEvent.click(screen.getByRole('button', { name: 'Agregar espacio' }))
  await userEvent.type(screen.getByLabelText('Nombre del nuevo espacio'), 'Procesos')
  await userEvent.click(screen.getByRole('button', { name: 'Crear' }))
  await waitFor(() => expect(llamadas('GET /arbol')).toHaveLength(2))
  expect(JSON.parse(llamadas('POST /espacios')[0][1].body)).toEqual({ workspaceGuid: 'w1', nombre: 'Procesos' })
})

test('Subir reenvía el nombre y la posición anterior entre hermanos', async () => {
  const dos = [{ ...ARBOL[0], guid: 'w0', nombre: 'Primero', espacios: [] }, ARBOL[0]]
  montar('/', ADMIN, { 'GET /arbol': dos, 'PUT /workspaces/w1': () => respuesta(204) })
  await userEvent.click(await screen.findByRole('button', { name: 'Acciones de Soporte' }))
  await userEvent.click(screen.getByRole('button', { name: 'Subir' }))
  await waitFor(() => expect(llamadas('PUT /workspaces/w1')).toHaveLength(1))
  expect(JSON.parse(llamadas('PUT /workspaces/w1')[0][1].body)).toEqual({ nombre: 'Soporte', descripcion: 'Equipo', posicion: 0 })
})

test('renombrar una página reenvía su paginaPadreGuid', async () => {
  montar('/paginas/p2', ADMIN, {
    'GET /paginas/p2': { ...DETALLE, puedeEliminar: true },
    'PUT /paginas/p2': () => respuesta(204),
  })
  const campo = await screen.findByLabelText('Título')
  await userEvent.clear(campo)
  await userEvent.type(campo, 'Alta de cuentas')
  await userEvent.click(screen.getByRole('button', { name: 'Guardar título' }))
  await waitFor(() => expect(llamadas('PUT /paginas/p2')).toHaveLength(1))
  expect(JSON.parse(llamadas('PUT /paginas/p2')[0][1].body)).toEqual({ titulo: 'Alta de cuentas', paginaPadreGuid: 'p1' })
  expect(screen.getByRole('button', { name: 'Eliminar página' })).toBeInTheDocument()
})

test('la página muestra su ruta y oculta Eliminar si puedeEliminar es false', async () => {
  montar('/paginas/p2', ADMIN, { 'GET /paginas/p2': DETALLE, 'GET /paginas/p2/contenido': { contenido: null, version: 0 } })
  const ruta = within(await screen.findByRole('navigation', { name: 'Ruta' }))
  expect(ruta.getByText('Soporte')).toBeInTheDocument()
  expect(ruta.getByText('Manuales')).toBeInTheDocument()
  expect(ruta.getByRole('link', { name: 'Inicio rapido' })).toHaveAttribute('href', '/paginas/p1')
  expect(screen.getByRole('heading', { name: 'Alta de clientes' })).toBeInTheDocument()
  expect(await screen.findByRole('textbox', { name: 'Contenido de la página' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Eliminar página' })).toBeNull()
})

test('una página inexistente muestra el mensaje de no encontrada', async () => {
  montar('/paginas/zz')
  expect(await screen.findByText('Página no encontrada o sin acceso')).toBeInTheDocument()
})

test('Miembros envía PUT con los guid marcados y omite a los Admin', async () => {
  montar('/workspaces', ADMIN, {
    'GET /workspaces/w1/miembros': [
      { guid: 'm1', nombre: 'Luis', correo: 'l@x.co', perfil: 'colaborador', asignado: false },
      { guid: 'm2', nombre: 'Marta', correo: 'm@x.co', perfil: 'coordinador', asignado: true },
      { guid: 'm3', nombre: 'Jefe', correo: 'j@x.co', perfil: 'admin', asignado: false },
    ],
    'PUT /workspaces/w1/miembros': () => respuesta(204),
  })
  await userEvent.click(await screen.findByRole('button', { name: 'Miembros de Soporte' }))
  expect(await screen.findByRole('checkbox', { name: /Marta/ })).toBeChecked()
  expect(screen.queryByRole('checkbox', { name: /Jefe/ })).toBeNull()
  await userEvent.click(screen.getByRole('checkbox', { name: /Luis/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Guardar miembros' }))
  await waitFor(() => expect(llamadas('PUT /workspaces/w1/miembros')).toHaveLength(1))
  expect(JSON.parse(llamadas('PUT /workspaces/w1/miembros')[0][1].body).usuarios.sort()).toEqual(['m1', 'm2'])
})

test('Inicio muestra las páginas actualizadas recientemente', async () => {
  montar('/', ADMIN, {
    'GET /paginas/recientes': [{
      guid: 'p1', titulo: 'Guía de alta', workspace: 'Soporte', coleccion: 'Guias',
      fechaActualizacion: new Date(Date.now() - 5 * 60_000).toISOString(),
    }],
  })
  const bloque = within(await screen.findByRole('region', { name: 'Actualizadas recientemente' }))
  expect(bloque.getByRole('link', { name: /Guía de alta/ })).toHaveAttribute('href', '/paginas/p1')
  expect(bloque.getByText('Soporte / Guias')).toBeInTheDocument()
  expect(bloque.getByText('hace 5 minutos')).toBeInTheDocument()
})
