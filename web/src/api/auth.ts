import type { components } from './esquema'

type S = components['schemas']
export type UsuarioActual = S['UsuarioActualDto']
export type ProblemDetails = S['ProblemDetails']

export type Resultado<T> = { ok: true; datos: T } | { ok: false; status: number; problema: ProblemDetails }

async function enviar<T>(metodo: 'GET' | 'POST', ruta: string, cuerpo?: unknown): Promise<Resultado<T>> {
  const r = await fetch(`/api/v1/auth${ruta}`, {
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
    : { ok: false, status: r.status, problema: (json ?? { status: r.status }) as ProblemDetails }
}

export const login = (b: S['LoginRequest']) => enviar<void>('POST', '/login', b)
export const logout = () => enviar<void>('POST', '/logout')
export const me = () => enviar<UsuarioActual>('GET', '/me')
export const aceptarInvitacion = (b: S['AceptarInvitacionRequest']) => enviar<void>('POST', '/aceptar-invitacion', b)
export const olvideContrasena = (b: S['OlvideContrasenaRequest']) => enviar<void>('POST', '/olvide-contrasena', b)
export const restablecerContrasena = (b: S['RestablecerContrasenaRequest']) =>
  enviar<void>('POST', '/restablecer-contrasena', b)
