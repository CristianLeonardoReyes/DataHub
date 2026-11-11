import type { components } from './esquema'
import { pedir, type Resultado } from './http'

type S = components['schemas']
export type UsuarioActual = S['UsuarioActualDto']
export type ProblemDetails = S['ProblemDetails']

export type { Resultado }

const enviar = <T>(metodo: 'GET' | 'POST', ruta: string, cuerpo?: unknown) =>
  pedir<T>(metodo, `/auth${ruta}`, cuerpo)

export const login = (b: S['LoginRequest']) => enviar<void>('POST', '/login', b)
export const logout = () => enviar<void>('POST', '/logout')
export const me = () => enviar<UsuarioActual>('GET', '/me')
export const aceptarInvitacion = (b: S['AceptarInvitacionRequest']) => enviar<void>('POST', '/aceptar-invitacion', b)
export const olvideContrasena = (b: S['OlvideContrasenaRequest']) => enviar<void>('POST', '/olvide-contrasena', b)
export const restablecerContrasena = (b: S['RestablecerContrasenaRequest']) =>
  enviar<void>('POST', '/restablecer-contrasena', b)
export const clienteOperando = (clienteGuid: string | null) =>
  enviar<void>('POST', '/cliente-operando', { clienteGuid } satisfies S['ClienteOperandoRequest'])
