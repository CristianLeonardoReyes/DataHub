import type { components } from './esquema'
import { pedir } from './http'

type S = components['schemas']
export type Cliente = S['ClienteDto']

const enviar = <T>(metodo: 'GET' | 'POST' | 'PUT', ruta: string, cuerpo?: unknown) =>
  pedir<T>(metodo, `/clientes${ruta}`, cuerpo)

export const listar = () => enviar<Cliente[]>('GET', '')
export const obtener = (guid: string) => enviar<Cliente>('GET', `/${guid}`)
export const crear = (b: S['CrearClienteRequest']) => enviar<Cliente>('POST', '', b)
export const actualizar = (guid: string, b: S['ActualizarClienteRequest']) => enviar<Cliente>('PUT', `/${guid}`, b)
