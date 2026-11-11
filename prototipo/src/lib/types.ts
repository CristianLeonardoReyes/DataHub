// Tipos del prototipo, alineados con el modelo de datos v1.0 (Cliente, Usuario, Workspace,
// Espacio, Coleccion, Pagina, Etiqueta, Adjunto). Los Guid se simulan con ids legibles.

export type Perfil = 'super_admin' | 'admin' | 'coordinador' | 'colaborador';
export type EstadoUsuario = 'activo' | 'invitado' | 'inactivo';
export type EstadoPagina = 'borrador' | 'en_revision' | 'aprobado' | 'archivado';
export type TipoPagina =
  | 'general'
  | 'adr'
  | 'api'
  | 'runbook'
  | 'arquitectura'
  | 'onboarding'
  | 'guia'
  | 'procedimiento'
  | 'manual'
  | 'acta';

export interface Cliente {
  id: string;
  nombre: string;
  identificador: string;
  activo: boolean;
  fechaCreacion: string; // ISO
}

export interface Usuario {
  id: string;
  clienteId: string | null; // null = Super admin
  nombre: string;
  correo: string;
  perfil: Perfil;
  estado: EstadoUsuario;
  ultimoAcceso: string | null; // ISO fecha-hora
  workspaces: string[]; // asignados (Coordinador / Colaborador)
}

export interface Workspace {
  id: string;
  clienteId: string;
  nombre: string;
  descripcion: string;
}

export interface Espacio {
  id: string;
  workspaceId: string;
  nombre: string;
  descripcion: string;
}

export interface Coleccion {
  id: string;
  espacioId: string;
  nombre: string;
}

export type Bloque =
  | { t: 'p'; html: string }
  | { t: 'h2'; texto: string }
  | { t: 'h3'; texto: string }
  | { t: 'ul'; items: string[] }
  | { t: 'ol'; items: string[] }
  | { t: 'check'; items: { texto: string; hecho: boolean }[] }
  | { t: 'code'; lenguaje: string; codigo: string }
  | { t: 'quote'; texto: string }
  | { t: 'table'; cabecera: string[]; filas: string[][] };

export interface Adjunto {
  id: string;
  nombre: string;
  tipo: 'imagen' | 'pdf' | 'video' | 'audio' | 'otro';
  bytes: number;
  subidoPor: string; // usuarioId
  fecha: string; // ISO
  /** Solo prototipo: URL local (blob:) del archivo recién subido, para la vista previa real. */
  url?: string;
}

export interface Pagina {
  id: string;
  coleccionId: string;
  padreId: string | null;
  titulo: string;
  tipo: TipoPagina;
  estado: EstadoPagina;
  responsableId: string;
  fechaRevision: string | null; // ISO fecha
  actualizada: string; // ISO fecha-hora
  actualizadaPor: string;
  creadaPor: string;
  etiquetas: string[];
  resumen: string;
  contenido: Bloque[];
  adjuntos: Adjunto[];
}
