import { HOY } from './mock';
import type { EstadoPagina, EstadoUsuario, Pagina, Perfil, TipoPagina } from './types';

export const ESTADO_LABEL: Record<EstadoPagina, string> = {
  borrador: 'Borrador',
  en_revision: 'En revisión',
  aprobado: 'Aprobado',
  archivado: 'Archivado',
};

export const TIPO_LABEL: Record<TipoPagina, string> = {
  general: 'General',
  adr: 'ADR',
  api: 'API',
  runbook: 'Runbook',
  arquitectura: 'Arquitectura',
  onboarding: 'Onboarding',
  guia: 'Guía',
  procedimiento: 'Procedimiento',
  manual: 'Manual',
  acta: 'Acta de reunión',
};

export const PERFIL_LABEL: Record<Perfil, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  coordinador: 'Coordinador',
  colaborador: 'Colaborador',
};

export const ESTADO_USUARIO_LABEL: Record<EstadoUsuario, string> = {
  activo: 'Activo',
  invitado: 'Invitación enviada',
  inactivo: 'Inactivo',
};

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function diaUTC(iso: string): number {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(a, m - 1, d) / 86_400_000;
}

/** Días desde hoy hasta la fecha (negativo = en el pasado). */
export function diasHasta(iso: string): number {
  return diaUTC(iso) - diaUTC(HOY);
}

/** "Hoy, 09:42", "Ayer, 18:20", "hace 4 días", "12 jun", "12 jun 2025". */
export function cuando(iso: string): string {
  const d = -diasHasta(iso);
  const hora = iso.length > 10 ? iso.slice(11, 16) : '';
  if (d === 0) return hora ? `Hoy, ${hora}` : 'Hoy';
  if (d === 1) return hora ? `Ayer, ${hora}` : 'Ayer';
  if (d < 7) return `hace ${d} días`;
  return fechaCorta(iso);
}

export function fechaCorta(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  const base = `${d} ${MESES[m - 1]}`;
  return a === Number(HOY.slice(0, 4)) ? base : `${base} ${a}`;
}

export function fechaLarga(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MESES[m - 1]} ${a}`;
}

export function tamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

export type Vigencia =
  | { tipo: 'vencida'; dias: number }
  | { tipo: 'proxima'; dias: number }
  | { tipo: 'vigente'; dias: number }
  | { tipo: 'sin_fecha' };

/** Una página archivada no vence. Próxima = 21 días o menos. */
export function vigencia(p: Pagina): Vigencia {
  if (!p.fechaRevision || p.estado === 'archivado') return { tipo: 'sin_fecha' };
  const dias = diasHasta(p.fechaRevision);
  if (dias < 0) return { tipo: 'vencida', dias: -dias };
  if (dias <= 21) return { tipo: 'proxima', dias };
  return { tipo: 'vigente', dias };
}

export function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

/** Normaliza para buscar sin tildes ni mayúsculas (como utf8mb4_0900_ai_ci). */
export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function plural(n: number, uno: string, varios: string): string {
  return `${n} ${n === 1 ? uno : varios}`;
}
