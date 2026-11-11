import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Rutas } from './App'
import { SesionProvider } from './Sesion'

const respuesta = (status: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status })

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

const montar = (ruta: string) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <SesionProvider><Rutas /></SesionProvider>
    </MemoryRouter>,
  )

test('login 401 muestra el error y no navega', async () => {
  fetchMock.mockImplementation(async (url: string) =>
    url.endsWith('/me') ? respuesta(401, { status: 401 }) : respuesta(401, { status: 401, detail: 'Correo o contraseña incorrectos.' }))
  montar('/login')
  await userEvent.type(await screen.findByLabelText('Correo corporativo'), 'a@b.co')
  await userEvent.type(screen.getByLabelText('Contraseña'), 'incorrecta')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.')
  expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
})

test('ruta protegida con /me 401 redirige a /login', async () => {
  fetchMock.mockResolvedValue(respuesta(401, { status: 401 }))
  montar('/')
  expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
})

test('aceptar invitación con 9 caracteres no llama a la API', async () => {
  fetchMock.mockResolvedValue(respuesta(401, {}))
  montar('/aceptar-invitacion?token=abc')
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1)) // solo /me
  await userEvent.type(screen.getByLabelText('Nombre'), 'Ana')
  await userEvent.type(screen.getByLabelText('Contraseña'), '123456789')
  await userEvent.type(screen.getByLabelText('Confirmar contraseña'), '123456789')
  await userEvent.click(screen.getByRole('button', { name: 'Activar cuenta' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('al menos 10')
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

test('olvidé contraseña muestra el mensaje genérico', async () => {
  fetchMock.mockImplementation(async (url: string) => (url.endsWith('/me') ? respuesta(401, {}) : respuesta(202)))
  montar('/olvide-contrasena')
  await userEvent.type(screen.getByLabelText('Correo corporativo'), 'x@y.co')
  await userEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))
  expect(await screen.findByText('Si el correo está registrado, te enviamos un enlace')).toBeInTheDocument()
})

const yo = { guid: 'u1', nombre: 'Ana', correo: 'a@b.co', perfil: 'admin', cliente: null, permisos: [] }

test('mostrar/ocultar contraseña cambia el type y el aria-label', async () => {
  fetchMock.mockResolvedValue(respuesta(401, {}))
  montar('/login')
  const campo = await screen.findByLabelText('Contraseña')
  expect(campo).toHaveAttribute('type', 'password')
  await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
  expect(campo).toHaveAttribute('type', 'text')
  expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toHaveAttribute('aria-pressed', 'true')
})

test('con sesión activa /login redirige a /', async () => {
  fetchMock.mockResolvedValue(respuesta(200, yo))
  montar('/login')
  expect(await screen.findByText('Hola, Ana')).toBeInTheDocument()
  expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument()
})

test('tras login vuelve a la ruta protegida pedida', async () => {
  let sesion = false
  fetchMock.mockImplementation(async (url: string) => {
    if (url.endsWith('/me')) return sesion ? respuesta(200, { ...yo, permisos: ['usuariosGestionar'] }) : respuesta(401, {})
    sesion = true
    return respuesta(204)
  })
  montar('/usuarios/nuevo')
  await userEvent.type(await screen.findByLabelText('Correo corporativo'), 'a@b.co')
  await userEvent.type(screen.getByLabelText('Contraseña'), 'correcta123')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByRole('heading', { name: 'Invitar usuario' })).toBeInTheDocument()
})

test('error de red muestra el mensaje de conexión', async () => {
  fetchMock.mockImplementation(async (url: string) => {
    if (url.endsWith('/me')) return respuesta(401, {})
    throw new TypeError('Failed to fetch')
  })
  montar('/login')
  await userEvent.type(await screen.findByLabelText('Correo corporativo'), 'a@b.co')
  await userEvent.type(screen.getByLabelText('Contraseña'), 'x')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos conectar con el servidor')
})

test('el botón muestra estado de carga mientras envía', async () => {
  let liberar!: () => void
  fetchMock.mockImplementation(async (url: string) => {
    if (url.endsWith('/me')) return respuesta(401, {})
    await new Promise<void>((r) => (liberar = r))
    return respuesta(401, { status: 401 })
  })
  montar('/login')
  await userEvent.type(await screen.findByLabelText('Correo corporativo'), 'a@b.co')
  await userEvent.type(screen.getByLabelText('Contraseña'), 'x')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByRole('button', { name: 'Entrando…' })).toBeDisabled()
  liberar()
  expect(await screen.findByRole('button', { name: 'Entrar' })).toBeEnabled()
})
