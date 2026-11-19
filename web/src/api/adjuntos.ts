import { pedir } from './http'

export type Adjunto = {
  guid: string
  nombre: string
  tipoMime: string
  tamanoBytes: number
  fechaCreacion: string
  subidoPor: { guid: string; nombre: string }
  puedeEliminar: boolean
}
export type UrlAdjunto = { url: string; expira: string }

export const MAX_BYTES = 25 * 1024 * 1024
export const MSG_MAX = 'El archivo supera el máximo de 25 MB'

export const adjuntos = {
  listar: (paginaGuid: string) => pedir<Adjunto[]>('GET', `/paginas/${paginaGuid}/adjuntos`),
  subir: (paginaGuid: string, archivo: File) => {
    const f = new FormData()
    f.append('archivo', archivo)
    return pedir<Adjunto>('POST', `/paginas/${paginaGuid}/adjuntos`, f)
  },
  url: (guid: string, descargar: boolean) => pedir<UrlAdjunto>('GET', `/adjuntos/${guid}/url?descargar=${descargar}`),
  eliminar: (guid: string) => pedir<void>('DELETE', `/adjuntos/${guid}`),
}

/** Valida y sube; devuelve el adjunto o el mensaje de error listo para mostrar. */
export async function subirArchivo(paginaGuid: string, archivo: File): Promise<{ adjunto: Adjunto } | { error: string }> {
  if (archivo.size > MAX_BYTES) return { error: MSG_MAX }
  const r = await adjuntos.subir(paginaGuid, archivo)
  if (r.ok) return { adjunto: r.datos }
  return {
    error: r.status === 429 ? 'Demasiadas subidas, espera un momento'
      : r.status === 400 && r.problema.detail ? r.problema.detail
      : r.status === 403 ? 'No tienes permiso para subir archivos'
      : 'No se pudo subir el archivo',
  }
}

const IMAGENES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
const VIDEOS = ['video/mp4', 'video/webm', 'video/ogg']
const AUDIOS = ['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm']
// SVG no está en la lista a propósito: puede llevar scripts. Video y audio también van por lista blanca.
export function tipoVista(mime: string): 'imagen' | 'pdf' | 'video' | 'audio' | null {
  const m = mime.toLowerCase()
  if (IMAGENES.includes(m)) return 'imagen'
  if (m === 'application/pdf') return 'pdf'
  if (VIDEOS.includes(m)) return 'video'
  if (AUDIOS.includes(m)) return 'audio'
  return null
}
