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
  await userEvent.type(await screen.findByLabelText('Correo'), 'a@b.co')
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
  await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('al menos 10')
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

test('olvidé contraseña muestra el mensaje genérico', async () => {
  fetchMock.mockImplementation(async (url: string) => (url.endsWith('/me') ? respuesta(401, {}) : respuesta(202)))
  montar('/olvide-contrasena')
  await userEvent.type(screen.getByLabelText('Correo'), 'x@y.co')
  await userEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))
  expect(await screen.findByText('Si el correo está registrado, te enviamos un enlace')).toBeInTheDocument()
})
