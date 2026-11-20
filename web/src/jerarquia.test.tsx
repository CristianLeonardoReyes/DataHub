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

test('el árbol se muestra; el chevron expande y contrae y el nombre navega', async () => {
  montar('/')
  const ws = await screen.findByRole('button', { name: 'Contraer Soporte' })
  expect(ws).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('link', { name: 'Inicio rapido' })).toHaveAttribute('href', '/paginas/p1')
  await userEvent.click(ws)
  expect(screen.getByRole('button', { name: 'Expandir Soporte' })).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('link', { name: 'Inicio rapido' })).toBeNull()
  expect(screen.queryByRole('link', { name: 'Manuales' })).toBeNull()
})

test('en el árbol, clic en el nombre navega a su vista', async () => {
  montar('/')
  await userEvent.click(await screen.findByRole('link', { name: 'Guias' }))
  expect(await screen.findByRole('heading', { name: 'Guias' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Contraer Soporte' })).toHaveAttribute('aria-expanded', 'true')
})

test('sin árbol muestra el estado vacío', async () => {
  montar('/', ADMIN, { 'GET /arbol': [] })
  expect(await screen.findByText('Aún no hay workspaces')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Crear workspace' })).toHaveAttribute('href', '/workspaces')
})

test('un colaborador no ve acciones de workspace ni espacio; en colección y páginas solo las de páginas', async () => {
  montar('/', COLABORADOR)
  await screen.findByRole('link', { name: 'Soporte' })
  expect(screen.queryByRole('button', { name: 'Acciones de Soporte' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Acciones de Manuales' })).toBeNull()
  await userEvent.click(screen.getByRole('button', { name: 'Acciones de Guias' }))
  expect(screen.getByRole('menuitem', { name: 'Agregar página' })).toBeInTheDocument()
  expect(screen.queryByRole('menuitem', { name: 'Renombrar' })).toBeNull()
  await userEvent.click(screen.getByRole('button', { name: 'Acciones de Inicio rapido' }))
  expect(screen.getByRole('menuitem', { name: 'Agregar subpágina' })).toBeInTheDocument()
  expect(screen.queryByRole('menuitem', { name: 'Agregar espacio' })).toBeNull()
  expect(screen.queryByRole('menuitem', { name: 'Eliminar' })).toBeNull()
})

test('crear un espacio envía POST y recarga el árbol', async () => {
  montar('/', ADMIN, { 'POST /espacios': () => respuesta(201, { guid: 'e2' }) })
  await userEvent.click(await screen.findByRole('button', { name: 'Acciones de Soporte' }))
  await userEvent.click(screen.getByRole('menuitem', { name: 'Agregar espacio' }))
  await userEvent.type(screen.getByLabelText('Nombre del nuevo espacio'), 'Procesos')
  await userEvent.click(screen.getByRole('button', { name: 'Crear' }))
  await waitFor(() => expect(llamadas('GET /arbol')).toHaveLength(2))
  expect(JSON.parse(llamadas('POST /espacios')[0][1].body)).toEqual({ workspaceGuid: 'w1', nombre: 'Procesos' })
})

test('Subir reenvía el nombre y la posición anterior entre hermanos', async () => {
  const dos = [{ ...ARBOL[0], guid: 'w0', nombre: 'Primero', espacios: [] }, ARBOL[0]]
  montar('/', ADMIN, { 'GET /arbol': dos, 'PUT /workspaces/w1': () => respuesta(204) })
  await userEvent.click(await screen.findByRole('button', { name: 'Acciones de Soporte' }))
  await userEvent.click(screen.getByRole('menuitem', { name: 'Subir' }))
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
  // ADMIN no tiene exportarMarkdown en este fixture: no aparece el botón.
  expect(screen.queryByRole('button', { name: 'Exportar a Markdown' })).toBeNull()
})

const CON_EXPORTAR = { ...ADMIN, permisos: [...ADMIN.permisos, 'exportarMarkdown'] }
const rutasPagina = { 'GET /paginas/p2': DETALLE, 'GET /paginas/p2/contenido': { contenido: null, version: 0 } }

test('Exportar a Markdown pide el archivo y lo descarga con el nombre de Content-Disposition', async () => {
  const crear = vi.fn(() => 'blob:x')
  const revocar = vi.fn()
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: crear, revokeObjectURL: revocar }))
  let nombre = ''
  const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { nombre = this.download })
  montar('/paginas/p2', CON_EXPORTAR, {
    ...rutasPagina,
    'GET /paginas/p2/markdown': () => new Response('# x', { status: 200, headers: { 'Content-Disposition': 'attachment; filename="alta-de-clientes.md"' } }),
  })
  await userEvent.click(await screen.findByRole('button', { name: 'Exportar a Markdown' }))
  await waitFor(() => expect(revocar).toHaveBeenCalledWith('blob:x'))
  expect(nombre).toBe('alta-de-clientes.md')
  clic.mockRestore()
})

test('Exportar a Markdown con 401 abre el modal de sesión expirada', async () => {
  montar('/paginas/p2', CON_EXPORTAR, { ...rutasPagina, 'GET /paginas/p2/markdown': () => respuesta(401, {}) })
  await userEvent.click(await screen.findByRole('button', { name: 'Exportar a Markdown' }))
  expect(await screen.findByRole('dialog', { name: 'Tu sesión expiró' })).toBeInTheDocument()
})

test('Exportar a Markdown con 404 muestra la alerta', async () => {
  montar('/paginas/p2', CON_EXPORTAR, { ...rutasPagina, 'GET /paginas/p2/markdown': () => respuesta(404, {}) })
  await userEvent.click(await screen.findByRole('button', { name: 'Exportar a Markdown' }))
  // La lista de archivos (sin ruta simulada) también responde 404, de ahí varias alertas.
  expect((await screen.findAllByText('Página no encontrada o sin acceso')).length).toBeGreaterThan(0)
  expect(llamadas('GET /paginas/p2/markdown')).toHaveLength(1)
})

test('menú de acciones: abrir con teclado enfoca el primer ítem, las flechas recorren y Esc devuelve el foco', async () => {
  montar('/')
  const boton = await screen.findByRole('button', { name: 'Acciones de Guias' })
  boton.focus()
  await userEvent.keyboard('{Enter}')
  const items = within(screen.getByRole('menu', { name: 'Acciones de Guias' })).getAllByRole('menuitem')
  expect(items[0]).toHaveFocus()
  await userEvent.keyboard('{ArrowDown}')
  expect(items[1]).toHaveFocus()
  await userEvent.keyboard('{ArrowUp}{ArrowUp}')
  expect(items[items.length - 1]).toHaveFocus()
  await userEvent.keyboard('{Home}')
  expect(items[0]).toHaveFocus()
  await userEvent.keyboard('{End}')
  expect(items[items.length - 1]).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  expect(screen.queryByRole('menu')).toBeNull()
  expect(boton).toHaveFocus()
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

const COORDINADOR = { ...ADMIN, perfil: 'coordinador', permisos: ['espaciosColeccionesGestionar', 'paginasEditar', 'paginasEliminar'] }
const ARBOL_DESC = [{
  ...ARBOL[0], espacios: [{ ...ARBOL[0].espacios[0], colecciones: [{ ...ARBOL[0].espacios[0].colecciones[0], descripcion: 'Guias de uso' }] }],
}]

test('la vista de colección muestra nombre, descripción, ruta e hijos', async () => {
  montar('/colecciones/c1', COLABORADOR, { 'GET /arbol': ARBOL_DESC })
  expect(await screen.findByRole('heading', { name: 'Guias' })).toBeInTheDocument()
  expect(screen.getByText('Guias de uso')).toBeInTheDocument()
  const ruta = within(screen.getByRole('navigation', { name: 'Ruta' }))
  expect(ruta.getByRole('link', { name: 'Soporte' })).toHaveAttribute('href', '/workspaces/w1')
  expect(ruta.getByRole('link', { name: 'Manuales' })).toHaveAttribute('href', '/espacios/e1')
  const lista = within(screen.getByRole('region', { name: 'Páginas' }))
  expect(lista.getByRole('link', { name: 'Inicio rapido' })).toHaveAttribute('href', '/paginas/p1')
})

test('guardar los detalles envía PUT con nombre y descripcion y sin posicion', async () => {
  montar('/colecciones/c1', ADMIN, { 'GET /arbol': ARBOL_DESC, 'PUT /colecciones/c1': () => respuesta(204) })
  const desc = await screen.findByLabelText('Descripción')
  expect(desc).toHaveValue('Guias de uso')
  await userEvent.clear(desc)
  await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
  await waitFor(() => expect(llamadas('PUT /colecciones/c1')).toHaveLength(1))
  expect(JSON.parse(llamadas('PUT /colecciones/c1')[0][1].body)).toEqual({ nombre: 'Guias', descripcion: null })
  await waitFor(() => expect(llamadas('GET /arbol')).toHaveLength(2))
  expect(await screen.findByText('Cambios guardados')).toBeInTheDocument()
})

test('el colaborador ve la colección en solo lectura y puede agregar páginas', async () => {
  montar('/colecciones/c1', COLABORADOR)
  await screen.findByRole('heading', { name: 'Guias' })
  expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Eliminar' })).toBeNull()
  await userEvent.click(screen.getByRole('button', { name: 'Agregar página' }))
  expect(screen.getByLabelText('Nombre del nuevo página')).toBeInTheDocument()
})

test('el coordinador edita espacio y colección pero no el workspace', async () => {
  montar('/workspaces/w1', COORDINADOR)
  await screen.findByRole('heading', { name: 'Soporte' })
  expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Eliminar' })).toBeNull()
  expect(screen.getByRole('button', { name: 'Agregar espacio' })).toBeInTheDocument()
  await userEvent.click(within(screen.getByRole('region', { name: 'Espacios' })).getByRole('link', { name: 'Manuales' }))
  expect(await screen.findByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  await userEvent.click(within(screen.getByRole('region', { name: 'Colecciones' })).getByRole('link', { name: 'Guias' }))
  expect(await screen.findByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument()
})

test('un guid inexistente muestra no encontrado o sin acceso', async () => {
  montar('/espacios/zz')
  expect(await screen.findByText('No encontrado o sin acceso')).toBeInTheDocument()
})
