import type { components } from './esquema'
import type { Resultado } from './auth'

type S = components['schemas']
export type Cliente = S['ClienteDto']

async function enviar<T>(metodo: 'GET' | 'POST' | 'PUT', ruta: string, cuerpo?: unknown): Promise<Resultado<T>> {
  const r = await fetch(`/api/v1/clientes${ruta}`, {
    method: metodo,
    credentials: 'same-origin',
    headers: cuerpo === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  })
  const texto = await r.text()
  let json: unknown
  try {
    json = texto ? JSON.parse(texto) : undefined
  } catch {
    json = undefined
  }
  return r.ok
    ? { ok: true, datos: json as T }
    : { ok: false, status: r.status, problema: (json ?? { status: r.status }) as S['ProblemDetails'] }
}

export const listar = () => enviar<Cliente[]>('GET', '')
export const obtener = (guid: string) => enviar<Cliente>('GET', `/${guid}`)
export const crear = (b: S['CrearClienteRequest']) => enviar<Cliente>('POST', '', b)
export const actualizar = (guid: string, b: S['ActualizarClienteRequest']) => enviar<Cliente>('PUT', `/${guid}`, b)
