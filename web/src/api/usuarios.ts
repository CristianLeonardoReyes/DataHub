import type { components } from './esquema'
import { pedir } from './http'

type S = components['schemas']
export type Usuario = S['UsuarioDto']

const enviar = <T>(metodo: 'GET' | 'POST' | 'PUT', ruta: string, cuerpo?: unknown) =>
  pedir<T>(metodo, `/usuarios${ruta}`, cuerpo)

export const listar = () => enviar<Usuario[]>('GET', '')
export const invitar = (b: S['InvitarUsuarioRequest']) => enviar<Usuario>('POST', '', b)
export const reenviarInvitacion = (guid: string) => enviar<void>('POST', `/${guid}/reenviar-invitacion`)
export const actualizar = (guid: string, b: S['ActualizarUsuarioRequest']) => enviar<Usuario>('PUT', `/${guid}`, b)
