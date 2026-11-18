import type { JSONContent } from '@tiptap/react'
import { pedir } from './http'

export type TiptapDoc = JSONContent
export type ContenidoPagina = { contenido: TiptapDoc | null; version: number }

export const contenido = {
  obtener: (guid: string) => pedir<ContenidoPagina>('GET', `/paginas/${guid}/contenido`),
  guardar: (guid: string, b: { contenido: TiptapDoc; version: number }) =>
    pedir<{ version: number }>('PUT', `/paginas/${guid}/contenido`, b),
}
