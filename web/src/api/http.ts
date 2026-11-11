import type { components } from './esquema'

export type ProblemDetails = components['schemas']['ProblemDetails']
export type Resultado<T> = { ok: true; datos: T } | { ok: false; status: number; problema: ProblemDetails }

// Un 401 en estas rutas significa otra cosa (credenciales malas, sin sesión al arrancar, etc.).
const SIN_AVISO = [
  '/auth/login', '/auth/me', '/auth/logout', '/auth/aceptar-invitacion',
  '/auth/olvide-contrasena', '/auth/restablecer-contrasena',
]

let oyente: (() => void) | null = null

export function alNoAutorizado(fn: () => void) {
  oyente = fn
  return () => {
    if (oyente === fn) oyente = null
  }
}

let oyenteExpira: ((expira: string) => void) | null = null

/** La API renueva la sesión con el uso y manda el vencimiento vigente en X-Sesion-Expira. */
export function alCambiarExpira(fn: (expira: string) => void) {
  oyenteExpira = fn
  return () => {
    if (oyenteExpira === fn) oyenteExpira = null
  }
}

export async function pedir<T>(metodo: 'GET' | 'POST' | 'PUT', ruta: string, cuerpo?: unknown): Promise<Resultado<T>> {
  let r: Response
  try {
    r = await fetch(`/api/v1${ruta}`, {
      method: metodo,
      credentials: 'same-origin',
      headers: cuerpo === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
  } catch {
    return { ok: false, status: 0, problema: { status: 0 } }
  }
  const expira = r.headers.get('X-Sesion-Expira')
  if (expira) oyenteExpira?.(expira)
  const texto = await r.text()
  let json: unknown
  try {
    json = texto ? JSON.parse(texto) : undefined
  } catch {
    json = undefined
  }
  if (r.status === 401 && !SIN_AVISO.includes(ruta)) oyente?.()
  return r.ok
    ? { ok: true, datos: json as T }
    : { ok: false, status: r.status, problema: (json ?? { status: r.status }) as ProblemDetails }
}
