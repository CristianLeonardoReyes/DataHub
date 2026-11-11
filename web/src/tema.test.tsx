import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { Layout, SesionProvider } from './Sesion'

afterEach(() => { delete document.documentElement.dataset.theme; localStorage.clear(); vi.unstubAllGlobals() })

it('alterna el tema y recuerda la preferencia', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
    guid: 'g', nombre: 'Ana', correo: 'a@b.co', perfil: 'colaborador', cliente: { guid: 'c', nombre: 'Acme' }, permisos: [],
    sesionExpira: new Date(Date.now() + 3600_000).toISOString(),
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })))
  render(<MemoryRouter><SesionProvider><Layout /></SesionProvider></MemoryRouter>)

  await userEvent.click(await screen.findByRole('button', { name: 'Cambiar a tema oscuro' }))
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(localStorage.getItem('datahub-tema')).toBe('dark')

  await userEvent.click(screen.getByRole('button', { name: 'Cambiar a tema claro' }))
  expect(document.documentElement.dataset.theme).toBe('light')
  expect(localStorage.getItem('datahub-tema')).toBe('light')
})
