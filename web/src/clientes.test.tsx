import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Rutas } from './App'
import { SesionProvider } from './Sesion'

const respuesta = (status: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status })

const usuario = (perfil: string, permisos: string[]) => ({
  guid: 'u1', nombre: 'Ana', correo: 'a@b.co', perfil, cliente: null, permisos,
})
const SUPER = usuario('super_admin', ['clientesGestionar'])
const ADMIN = usuario('admin', ['usuariosGestionar'])

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

// /me devuelve `u`; el resto lo resuelve `otras`.
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

test('el menú muestra Clientes solo con el permiso', async () => {
  simular(ADMIN)
  const { unmount } = montar('/')
  await screen.findByRole('link', { name: 'Inicio' })
  expect(screen.queryByRole('link', { name: 'Clientes' })).toBeNull()
  unmount()
  simular(SUPER)
  montar('/')
  expect(await screen.findByRole('link', { name: 'Clientes' })).toBeInTheDocument()
})

test('un Admin que va a /clientes termina en /', async () => {
  simular(ADMIN)
  montar('/clientes')
  expect(await screen.findByText('Bienvenido a Data Hub.')).toBeInTheDocument()
  expect(llamadasA('GET').some(([u]) => u === '/api/v1/clientes')).toBe(false)
})

test('la lista pinta filas Activo/Inactivo', async () => {
  simular(SUPER, () =>
    respuesta(200, [
      { guid: 'c1', nombre: 'Acme', slug: 'acme', activo: true, fechaCreacion: '2026-01-05T10:00:00Z' },
      { guid: 'c2', nombre: 'Beta', slug: 'beta', activo: false, fechaCreacion: '2026-02-05T10:00:00Z' },
    ]))
  montar('/clientes')
  expect(await screen.findByRole('cell', { name: 'Acme' })).toBeInTheDocument()
  expect(screen.getByText('Activo')).toBeInTheDocument()
  expect(screen.getByText('Inactivo')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Desactivar Acme' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Activar Beta' })).toBeInTheDocument()
})

test('nuevo cliente: el slug se sugiere desde el nombre', async () => {
  simular(SUPER)
  montar('/clientes/nuevo')
  await userEvent.type(await screen.findByLabelText('Nombre'), 'Clínica Ñandú')
  expect(screen.getByLabelText('Slug')).toHaveValue('clinica-nandu')
})

test('nuevo cliente: slug inválido no llama a la API', async () => {
  simular(SUPER)
  montar('/clientes/nuevo')
  await userEvent.type(await screen.findByLabelText('Nombre'), 'Mi Cliente')
  const slug = screen.getByLabelText('Slug')
  await userEvent.clear(slug)
  await userEvent.type(slug, 'Mi Cliente')
  await userEvent.type(screen.getByLabelText('Correo del Admin'), 'admin@acme.co')
  await userEvent.click(screen.getByRole('button', { name: 'Crear cliente' }))
  expect(await screen.findByText(/El slug debe tener/)).toBeInTheDocument()
  expect(llamadasA('POST')).toHaveLength(0)
})

test('nuevo cliente: 409 de correo se muestra junto al campo correo', async () => {
  simular(SUPER, (_u, i) =>
    i?.method === 'POST' ? respuesta(409, { status: 409, detail: 'Ya existe un usuario con ese correo', campo: 'correoAdmin' }) : respuesta(404))
  montar('/clientes/nuevo')
  await userEvent.type(await screen.findByLabelText('Nombre'), 'Acme')
  await userEvent.type(screen.getByLabelText('Correo del Admin'), 'admin@acme.co')
  await userEvent.click(screen.getByRole('button', { name: 'Crear cliente' }))
  const msg = await screen.findByText('Ya existe un usuario con ese correo')
  expect(msg).toHaveAttribute('id', 'correoAdmin-error')
  expect(screen.getByLabelText('Correo del Admin')).toHaveAttribute('aria-invalid', 'true')
})
