import type { components } from './esquema'
import { pedir } from './http'

type S = components['schemas']
export type WorkspaceArbol = S['WorkspaceArbolDto']
export type EspacioArbol = S['EspacioArbolDto']
export type ColeccionArbol = S['ColeccionArbolDto']
export type PaginaArbol = S['PaginaArbolDto']
export type Miembro = S['MiembroDto']
export type EstadoPagina = 'borrador' | 'en_revision' | 'aprobado' | 'archivado'
export type TipoDocumento = 'general' | 'adr' | 'api' | 'runbook' | 'arquitectura' | 'onboarding' | 'guia' | 'procedimiento' | 'manual' | 'acta'
export type Responsable = { guid: string; nombre: string }
export type MetadataPagina = {
  estado: EstadoPagina
  tipoDocumento: TipoDocumento
  responsableGuid: string | null
  fechaRevision: string | null
  etiquetas: string[]
}
// La API expone estado y tipo como string: estos tipos los estrechan a sus valores.
export type PaginaDetalle = S['PaginaDetalleDto'] & Omit<MetadataPagina, 'responsableGuid'> & { responsable: Responsable | null; puedeAprobar: boolean }
export type PaginaReciente = S['PaginaRecienteDto']

type Elemento = S['ActualizarElementoRequest']
const editar = (r: string) => (guid: string, b: Elemento) => pedir<void>('PUT', `/${r}/${guid}`, b)
const eliminar = (r: string) => (guid: string) => pedir<void>('DELETE', `/${r}/${guid}`)

export const arbol = () => pedir<WorkspaceArbol[]>('GET', '/arbol')

export const workspaces = {
  crear: (b: S['CrearWorkspaceRequest']) => pedir<S['CreadoDto']>('POST', '/workspaces', b),
  editar: editar('workspaces'),
  eliminar: eliminar('workspaces'),
}
export const miembros = (guid: string) => pedir<Miembro[]>('GET', `/workspaces/${guid}/miembros`)
export const asignarMiembros = (guid: string, b: S['AsignarMiembrosRequest']) =>
  pedir<void>('PUT', `/workspaces/${guid}/miembros`, b)

export const espacios = {
  crear: (b: S['CrearEspacioRequest']) => pedir<S['CreadoDto']>('POST', '/espacios', b),
  editar: editar('espacios'),
  eliminar: eliminar('espacios'),
}
export const colecciones = {
  crear: (b: S['CrearColeccionRequest']) => pedir<S['CreadoDto']>('POST', '/colecciones', b),
  editar: editar('colecciones'),
  eliminar: eliminar('colecciones'),
}
export const paginas = {
  crear: (b: S['CrearPaginaRequest']) => pedir<S['CreadoDto']>('POST', '/paginas', b),
  // paginaPadreGuid es de reemplazo: reenvía siempre el padre actual (null = raíz de la colección).
  editar: (guid: string, b: S['ActualizarPaginaRequest']) => pedir<void>('PUT', `/paginas/${guid}`, b),
  eliminar: eliminar('paginas'),
  obtener: (guid: string) => pedir<PaginaDetalle>('GET', `/paginas/${guid}`),
  recientes: () => pedir<PaginaReciente[]>('GET', '/paginas/recientes'),
}
export const metadata = (guid: string, b: MetadataPagina) => pedir<void>('PUT', `/paginas/${guid}/metadata`, b)
export const etiquetas = (q: string) => pedir<string[]>('GET', `/etiquetas?q=${encodeURIComponent(q)}`)
export const responsables = () => pedir<Responsable[]>('GET', '/responsables')
