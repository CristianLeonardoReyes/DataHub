import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Rutas } from './App'
import { SesionProvider } from './Sesion'
import * as apiClientes from './api/clientes'

const respuesta = (status: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status })

const SUPER = { guid: 'u1', nombre: 'Ana', correo: 'a@b.co', perfil: 'super_admin', cliente: null, permisos: ['clientesGestionar'] }
const EXPIRO = 'Tu sesión expiró'
const modal = () => screen.findByRole('dialog', { name: EXPIRO })
const enUnMinuto = () => ({ ...SUPER, sesionExpira: new Date(Date.now() + 60_000).toISOString() })

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const montar = (ruta: string) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <SesionProvider><Rutas /></SesionProvider>
    </MemoryRouter>,
  )

test('un 401 en /clientes muestra el modal; Iniciar sesión lleva a /login limpio y tras entrar vuelve a /clientes', async () => {
  let sesion = true
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/auth/me')) return sesion ? respuesta(200, SUPER) : respuesta(401, {})
    if (url.endsWith('/clientes') && init?.method === 'GET') {
      sesion = false
      return respuesta(401, {})
    }
    return respuesta(404)
  })
  montar('/clientes')
  const dlg = await modal()
  expect(screen.getAllByRole('dialog')).toHaveLength(1)
  expect(dlg).toHaveAttribute('aria-modal', 'true')
  await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
  await userEvent.type(await screen.findByLabelText('Correo corporativo'), 'a@b.co')
  expect(screen.queryByText(/Inicia sesión de nuevo\.$/)).toBeNull()
  await userEvent.type(screen.getByLabelText('Contraseña'), 'correcta123')
  fetchMock.mockImplementation(async (url: string) =>
    url.endsWith('/auth/me') ? respuesta(200, SUPER) : url.endsWith('/auth/login') ? respuesta(204) : respuesta(200, []))
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByRole('heading', { name: 'Clientes' })).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('al vencer sesionExpira aparece el modal con el foco en el botón', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  fetchMock.mockImplementation(async (url: string) =>
    url.endsWith('/auth/me') ? respuesta(200, enUnMinuto()) : respuesta(200, []))
  montar('/')
  await screen.findByRole('button', { name: 'Cerrar sesión' })
  expect(screen.queryByRole('dialog')).toBeNull()
  await act(() => vi.advanceTimersByTimeAsync(60_000))
  await modal()
  expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toHaveFocus()
})

test('Escape en el modal lleva al login', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  fetchMock.mockImplementation(async (url: string) =>
    url.endsWith('/auth/me') ? respuesta(200, enUnMinuto()) : respuesta(200, []))
  montar('/usuarios')
  await screen.findByRole('button', { name: 'Cerrar sesión' })
  await act(() => vi.advanceTimersByTimeAsync(60_000))
  await modal()
  await userEvent.keyboard('{Escape}')
  expect(await screen.findByLabelText('Correo corporativo')).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('un 401 en /auth/login no muestra el aviso de expiración', async () => {
  fetchMock.mockImplementation(async (url: string) => respuesta(401, url.endsWith('/auth/login') ? { detail: 'Correo o contraseña incorrectos.' } : {}))
  montar('/login')
  await userEvent.type(await screen.findByLabelText('Correo corporativo'), 'a@b.co')
  await userEvent.type(screen.getByLabelText('Contraseña'), 'mala')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('Cerrar sesión lleva a /login sin modal y limpia el temporizador', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  fetchMock.mockImplementation(async (url: string) =>
    url.endsWith('/auth/me') ? respuesta(200, enUnMinuto()) : url.endsWith('/auth/logout') ? respuesta(204) : respuesta(200, []))
  montar('/')
  await userEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }))
  expect(await screen.findByLabelText('Correo corporativo')).toBeInTheDocument()
  await act(() => vi.advanceTimersByTimeAsync(120_000))
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('un error de red en clientes.ts devuelve status 0 sin lanzar', async () => {
  fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
  const r = await apiClientes.listar()
  expect(r).toMatchObject({ ok: false, status: 0 })
})

test('X-Sesion-Expira de una respuesta renueva el temporizador', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const enUnaHora = new Date(Date.now() + 3_600_000).toISOString()
  fetchMock.mockImplementation(async (url: string) =>
    url.endsWith('/auth/me')
      ? respuesta(200, enUnMinuto())
      : new Response('[]', { status: 200, headers: { 'X-Sesion-Expira': enUnaHora } }))
  montar('/clientes')
  expect(await screen.findByRole('heading', { name: 'Clientes' })).toBeInTheDocument()
  await act(() => vi.advanceTimersByTimeAsync(30_000)) // deja llegar las respuestas con el header
  await act(() => vi.advanceTimersByTimeAsync(90_000)) // ya pasó el minuto original
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('Recordarme viaja en el login', async () => {
  fetchMock.mockImplementation(async (url: string) =>
    url.endsWith('/auth/login') ? respuesta(204) : url.endsWith('/auth/me') ? respuesta(401, {}) : respuesta(200, []))
  montar('/login')
  await userEvent.type(await screen.findByLabelText('Correo corporativo'), 'a@b.co')
  await userEvent.type(screen.getByLabelText('Contraseña'), 'correcta123')
  await userEvent.click(screen.getByLabelText('Recordarme en este equipo'))
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  const login = fetchMock.mock.calls.find(([u]) => String(u).endsWith('/auth/login'))
  expect(JSON.parse(login![1].body)).toMatchObject({ recordarme: true })
})
