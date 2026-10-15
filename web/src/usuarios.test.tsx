import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Rutas } from './App'
import { SesionProvider } from './Sesion'

const respuesta = (status: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status })

const usuario = (perfil: string, permisos: string[]) => ({
  guid: 'u1', nombre: 'Ana', correo: 'ana@b.co', perfil, cliente: null, permisos,
})
const ADMIN = usuario('admin', ['usuariosGestionar'])
const COLAB = usuario('colaborador', [])
const SUPER = usuario('super_admin', ['clientesGestionar', 'usuariosGestionar'])

const fila = (guid: string, nombre: string, perfil: string, estado: string) =>
  ({ guid, nombre, correo: `${nombre.toLowerCase()}@b.co`, perfil, estado, fechaCreacion: '2026-01-05T10:00:00Z' })
const LISTA = [
  fila('u1', 'Ana', 'admin', 'activo'),
  fila('u2', 'Beto', 'colaborador', 'invitado'),
  fila('u3', 'Carla', 'coordinador', 'inactivo'),
]

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

const simular = (u: unknown, otras: (url: string, init?: RequestInit) => Response = () => respuesta(404)) =>
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) =>
    url.endsWith('/auth/me') ? respuesta(200, u) : otras(url, init))

const montar = (ruta: string) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <SesionProvider><Rutas /></SesionProvider>
    </MemoryRouter>,
  )

const llamadasA = (metodo: string) => fetchMock.mock.calls.filter(([, i]) => i?.method === metodo)

test('el menú muestra Usuarios solo con el permiso; Colaborador en /usuarios termina en /', async () => {
  simular(COLAB)
  const { unmount } = montar('/usuarios')
  expect(await screen.findByText('Bienvenido a Data Hub.')).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Usuarios' })).toBeNull()
  unmount()
  simular(ADMIN, () => respuesta(200, []))
  montar('/')
  expect(await screen.findByRole('link', { name: 'Usuarios' })).toBeInTheDocument()
})

test('la lista muestra insignias, reenviar solo en invitados y sin acciones en la fila propia', async () => {
  simular(ADMIN, () => respuesta(200, LISTA))
  montar('/usuarios')
  await screen.findByText('Beto')
  expect(screen.getByText('Invitado')).toBeInTheDocument()
  expect(screen.getByText('Activo')).toBeInTheDocument()
  expect(screen.getByText('Inactivo')).toBeInTheDocument()
  expect(screen.getAllByRole('button', { name: /Reenviar invitación/ })).toHaveLength(1)
  expect(screen.getByRole('button', { name: 'Activar Carla' })).toBeInTheDocument()
  const propia = screen.getByText('Ana', { selector: 'td' }).closest('tr')!
  expect(within(propia).queryAllByRole('button')).toHaveLength(0)
  expect(within(propia).queryByRole('combobox')).toBeNull()
})

test('reenviar invitación muestra el aviso', async () => {
  simular(ADMIN, (_u, i) => (i?.method === 'POST' ? respuesta(204) : respuesta(200, LISTA)))
  montar('/usuarios')
  await userEvent.click(await screen.findByRole('button', { name: /Reenviar invitación/ }))
  expect(await screen.findByText('Invitación reenviada')).toBeInTheDocument()
})

test('invitar: correo inválido no llama a la API', async () => {
  simular(ADMIN)
  montar('/usuarios/nuevo')
  await userEvent.type(await screen.findByLabelText('Correo'), 'no-es-correo')
  await userEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }))
  expect(await screen.findByText(/Ingresa un correo válido/)).toBeInTheDocument()
  expect(llamadasA('POST')).toHaveLength(0)
})

test('invitar: 409 campo=correo se muestra junto al campo', async () => {
  simular(ADMIN, (_u, i) =>
    i?.method === 'POST' ? respuesta(409, { status: 409, detail: 'Ya existe un usuario con ese correo.', campo: 'correo' }) : respuesta(404))
  montar('/usuarios/nuevo')
  await userEvent.type(await screen.findByLabelText('Correo'), 'x@b.co')
  await userEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }))
  expect(await screen.findByText('Ya existe un usuario con ese correo.')).toHaveAttribute('id', 'correo-error')
})

test('invitar con éxito vuelve a la lista con aviso', async () => {
  simular(ADMIN, (_u, i) => (i?.method === 'POST' ? respuesta(201, fila('u9', 'Nuevo', 'colaborador', 'invitado')) : respuesta(200, LISTA)))
  montar('/usuarios/nuevo')
  await userEvent.type(await screen.findByLabelText('Correo'), 'x@b.co')
  await userEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }))
  expect(await screen.findByText('Invitación enviada a x@b.co')).toBeInTheDocument()
  expect(JSON.parse(llamadasA('POST')[0][1].body)).toEqual({ correo: 'x@b.co', perfil: 'colaborador' })
})

test('cambiar perfil envía PUT con perfil y activo y actualiza la fila', async () => {
  simular(ADMIN, (_u, i) =>
    i?.method === 'PUT' ? respuesta(200, fila('u3', 'Carla', 'colaborador', 'inactivo')) : respuesta(200, LISTA))
  montar('/usuarios')
  const sel = await screen.findByLabelText('Perfil de carla@b.co')
  await userEvent.selectOptions(sel, 'colaborador')
  expect(JSON.parse(llamadasA('PUT')[0][1].body)).toEqual({ perfil: 'colaborador', activo: false })
  expect(await screen.findByLabelText('Perfil de carla@b.co')).toHaveValue('colaborador')
})

test('super admin sin cliente que va a /usuarios termina en /', async () => {
  simular(SUPER, () => respuesta(200, []))
  montar('/usuarios')
  expect(await screen.findByText('Bienvenido a Data Hub.')).toBeInTheDocument()
  expect(llamadasA('GET').some(([u]) => u === '/api/v1/usuarios')).toBe(false)
})
