import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Rutas } from './App'
import { SesionProvider } from './Sesion'
import { Resaltado } from './busqueda'

const respuesta = (status: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status })

const USUARIO = {
  guid: 'u1', nombre: 'Ana', correo: 'a@b.co', perfil: 'admin', cliente: { guid: 'cl1', nombre: 'Acme' },
  permisos: ['buscar'],
}

const resultado = (n: number) => ({
  guid: `p${n}`, titulo: `Guia ${n}`, ruta: 'Soporte / Manuales / Guias', fragmento: 'Cómo hacer la facturación mensual',
  fechaActualizacion: '2026-05-04T10:00:00Z',
})

let rutas: Record<string, Response | (() => Response)>
let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  rutas = {}
  fetchMock = vi.fn(async (url: string) => {
    const v = rutas[url.replace('/api/v1', '')]
    return v === undefined ? respuesta(404, {}) : typeof v === 'function' ? v() : v
  })
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

function montar(ruta: string, usuario: object = USUARIO) {
  const pedido = (cuerpo: unknown) => () => respuesta(200, cuerpo)
  rutas = {
    '/auth/me': pedido({ ...usuario, sesionExpira: new Date(Date.now() + 3_600_000).toISOString() }),
    '/arbol': pedido([]),
    '/paginas/recientes': pedido([]),
    ...rutas,
  }
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <SesionProvider><Rutas /></SesionProvider>
    </MemoryRouter>,
  )
}

const pedidos = () => fetchMock.mock.calls.map(([u]) => String(u).replace('/api/v1', ''))

test('escribir en la cabecera y Enter navega a /buscar', async () => {
  rutas['/buscar?q=factura&pagina=1'] = respuesta(200, { total: 0, pagina: 1, porPagina: 20, resultados: [] })
  montar('/')
  await userEvent.type(await screen.findByLabelText('Buscar páginas'), 'factura{Enter}')
  expect(await screen.findByText('No encontramos páginas con «factura»')).toBeInTheDocument()
  expect(pedidos()).toContain('/buscar?q=factura&pagina=1')
})

test('muestra conteo, enlaces, ruta y fragmento resaltado; Siguiente pide la página 2', async () => {
  const cuerpo = (pagina: number) => ({ total: 25, pagina, porPagina: 20, resultados: [resultado(pagina)] })
  rutas['/buscar?q=facturacion&pagina=1'] = () => respuesta(200, cuerpo(1))
  rutas['/buscar?q=facturacion&pagina=2'] = () => respuesta(200, cuerpo(2))
  montar('/buscar?q=facturacion')
  expect(await screen.findByText('25 resultados para «facturacion»')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Guia 1' })).toHaveAttribute('href', '/paginas/p1')
  expect(screen.getByText(/Soporte \/ Manuales \/ Guias/)).toBeInTheDocument()
  expect(screen.getByText('facturación').tagName).toBe('MARK')
  expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
  expect(await screen.findByRole('link', { name: 'Guia 2' })).toBeInTheDocument()
  expect(pedidos()).toContain('/buscar?q=facturacion&pagina=2')
})

test('un 400 muestra el detail de la API', async () => {
  rutas['/buscar?q=a&pagina=1'] = respuesta(400, { status: 400, detail: 'Escribe al menos 2 letras para buscar' })
  montar('/buscar?q=a')
  expect(await screen.findByText('Escribe al menos 2 letras para buscar')).toBeInTheDocument()
})

test('sin permiso buscar no aparece el campo', async () => {
  montar('/', { ...USUARIO, permisos: [] })
  await screen.findByText('Inicio', { selector: 'a' })
  expect(screen.queryByLabelText('Buscar páginas')).toBeNull()
})

test('el resaltado no se desalinea con emojis ni marca términos de una letra', () => {
  const { container } = render(<Resaltado texto="🚀 Arquitectura a la API" q="arqui a api" />)
  expect([...container.querySelectorAll('mark')].map((m) => m.textContent)).toEqual(['Arqui', 'API'])
})
