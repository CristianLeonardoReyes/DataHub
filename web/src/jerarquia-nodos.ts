import * as api from './api/jerarquia'
import { useSesion } from './Sesion'

export type Tipo = 'workspace' | 'espacio' | 'coleccion' | 'pagina'
export const HIJO: Record<Tipo, string> = { workspace: 'espacio', espacio: 'colección', coleccion: 'página', pagina: 'subpágina' }
export const RECURSO = { workspace: api.workspaces, espacio: api.espacios, coleccion: api.colecciones }
export const SEGMENTO: Record<Tipo, string> = { workspace: 'workspaces', espacio: 'espacios', coleccion: 'colecciones', pagina: 'paginas' }

/** Permisos de UX por tipo de nodo (hijo = agregar hijo, propio = renombrar/editar). Solo UX: decide la API. */
export function usePermisosNodo(tipo: Tipo) {
  const { puede } = useSesion()
  const gestion = puede('espaciosColeccionesGestionar')
  const paginas = puede('paginasEditar')
  return {
    workspace: { hijo: gestion, propio: puede('workspacesGestionar'), eliminar: puede('workspacesGestionar') },
    espacio: { hijo: gestion, propio: gestion, eliminar: gestion },
    coleccion: { hijo: paginas, propio: gestion, eliminar: gestion },
    pagina: { hijo: paginas, propio: paginas, eliminar: puede('paginasEliminar') },
  }[tipo]
}
