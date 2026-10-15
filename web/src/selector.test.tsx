import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Rutas } from './App'
import { SesionProvider } from './Sesion'

const respuesta = (status: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status })

const yo = (perfil: string, cliente: { guid: string; nombre: string } | null) => ({
  guid: 'u1', nombre: 'Ana', correo: 'a@b.co', perfil, cliente, permisos: ['clientesGestionar', 'usuariosGestionar'],
})
const ACME = { guid: 'c1', nombre: 'Acme' }
const cli = (guid: string, nombre: string, activo: boolean) =>
  ({ guid, nombre, slug: nombre.toLowerCase(), activo, fechaCreacion: '2026-01-05T10:00:00Z' })
const CLIENTES = [cli('c2', 'Zeta', true), cli('c1', 'Acme', true), cli('c3', 'Inactivo SA', false)]

let fetchMock: ReturnType<typeof vi.fn>
let actual: unknown // lo que devuelve /auth/me
let postStatus: number
beforeEach(() => {
  actual = yo('super_admin', null)
  postStatus = 204
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/auth/me')) return respuesta(200, actual)
    if (url.endsWith('/auth/cliente-operando')) {
      if (postStatus !== 204) return respuesta(postStatus, { status: postStatus, detail: 'No puedes operar dentro de un cliente inactivo.' })
      const g = JSON.parse(String(init?.body)).clienteGuid as string | null
      actual = yo('super_admin', g ? { guid: g, nombre: CLIENTES.find((c) => c.guid === g)!.nombre } : null)
      return respuesta(204)
    }
    if (url === '/api/v1/clientes') return respuesta(200, CLIENTES)
    return respuesta(404)
  })
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

const montar = (ruta = '/') =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <SesionProvider><Rutas /></SesionProvider>
    </MemoryRouter>,
  )

test('el selector no aparece para un Admin', async () => {
  actual = yo('admin', ACME)
  montar()
  await screen.findByRole('link', { name: 'Inicio' })
  expect(screen.queryByLabelText('Operar en:')).toBeNull()
})

test('lista solo clientes activos más Ninguno, ordenados', async () => {
  montar()
  const sel = await screen.findByLabelText('Operar en:')
  await waitFor(() => expect(sel.querySelectorAll('option')).toHaveLength(3))
  expect([...sel.querySelectorAll('option')].map((o) => o.textContent)).toEqual(['Ninguno (vista global)', 'Acme', 'Zeta'])
})

test('elegir un cliente envía el POST, recarga /me y muestra Usuarios', async () => {
  montar()
  expect(screen.queryByRole('link', { name: 'Usuarios' })).toBeNull()
  const sel = await screen.findByRole('combobox', { name: 'Operar en:' })
  await waitFor(() => expect(sel.querySelectorAll('option')).toHaveLength(3))
  await userEvent.selectOptions(sel, 'c1')
  expect(await screen.findByRole('link', { name: 'Usuarios' })).toBeInTheDocument()
  expect(screen.getByText('Operando en Acme')).toBeInTheDocument()
  const post = fetchMock.mock.calls.find(([u]) => u.endsWith('/auth/cliente-operando'))!
  expect(JSON.parse(post[1].body)).toEqual({ clienteGuid: 'c1' })
})

test('elegir Ninguno envía null y oculta Usuarios', async () => {
  actual = yo('super_admin', ACME)
  montar()
  await screen.findByRole('link', { name: 'Usuarios' })
  await userEvent.selectOptions(screen.getByLabelText('Operar en:'), '')
  await waitFor(() => expect(screen.queryByRole('link', { name: 'Usuarios' })).toBeNull())
  const post = fetchMock.mock.calls.find(([u]) => u.endsWith('/auth/cliente-operando'))!
  expect(JSON.parse(post[1].body)).toEqual({ clienteGuid: null })
})

test('error 400 muestra el detalle y el selector vuelve al valor anterior', async () => {
  postStatus = 400
  montar()
  const sel = await screen.findByLabelText('Operar en:')
  await waitFor(() => expect(sel.querySelectorAll('option')).toHaveLength(3))
  await userEvent.selectOptions(sel, 'c1')
  expect(await screen.findByRole('alert')).toHaveTextContent('No puedes operar dentro de un cliente inactivo.')
  expect(sel).toHaveValue('')
})
