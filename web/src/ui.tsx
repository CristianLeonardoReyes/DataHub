import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, LoaderCircle } from 'lucide-react'

// Componentes base con los tokens de docs/diseno/DESIGN.md (index.css): brand, ink, line, surface…
export const inputCls =
  'h-10 w-full rounded-md border border-control bg-surface px-3 text-sm text-ink hover:border-faint focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none aria-[invalid=true]:border-danger disabled:opacity-60'
export const btnCls =
  'inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-brand px-4 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover active:translate-y-px disabled:opacity-60'
export const btnSmCls =
  'inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-control bg-surface px-3 text-[13px] font-medium whitespace-nowrap text-ink transition-colors hover:bg-raised active:translate-y-px disabled:opacity-60'
/** Botón con estado de carga: spinner, texto de progreso y deshabilitado mientras dura la petición. */
export function Boton({ cargando = false, textoCarga, children, disabled, ...r }:
  { cargando?: boolean; textoCarga?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...r} disabled={disabled || cargando} aria-busy={cargando}>
      {cargando ? <><LoaderCircle aria-hidden className="size-4 animate-spin" />{textoCarga ?? children}</> : children}
    </button>
  )
}
export const linkCls = 'rounded-[var(--r-xs)] font-medium text-brand-text underline-offset-[3px] hover:underline'

export function Campo(p: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  invalido?: boolean
  auto?: string
  error?: string | null
  ayuda?: string
  mono?: boolean
}) {
  const invalido = p.invalido || !!p.error
  const descrito = p.error ? `${p.id}-error` : p.ayuda ? `${p.id}-ayuda` : undefined
  return (
    <div className="space-y-2">
      <label htmlFor={p.id} className="block text-sm font-medium">{p.label}</label>
      <input id={p.id} type={p.type ?? 'text'} value={p.value} onChange={(e) => p.onChange(e.target.value)}
        required autoComplete={p.auto} aria-invalid={invalido || undefined}
        aria-describedby={descrito} className={`${inputCls} ${p.mono ? 'font-mono text-[13px]' : ''}`} />
      {p.error ? (
        <p id={`${p.id}-error`} className="text-[13px] text-danger">{p.error}</p>
      ) : p.ayuda ? (
        <p id={`${p.id}-ayuda`} className="text-[13px] text-muted">{p.ayuda}</p>
      ) : null}
    </div>
  )
}

export const Alerta = ({ texto }: { texto: string | null }) =>
  texto ? (
    <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-bg p-3 text-[13px] text-danger-ink">
      <CircleAlert aria-hidden className="mt-px size-4 shrink-0" />
      <span>{texto}</span>
    </p>
  ) : null

export const AvisoOk = ({ texto }: { texto: string | null }) =>
  texto ? (
    <p role="status" className="flex items-start gap-2 rounded-lg border border-ok-ink/30 bg-ok-bg p-3 text-[13px] text-ok-ink">
      <CircleCheck aria-hidden className="mt-px size-4 shrink-0" />
      <span>{texto}</span>
    </p>
  ) : null

export const AvisoInfo = ({ texto }: { texto: string | null }) =>
  texto ? (
    <p role="status" className="flex items-start gap-2 rounded-lg border border-line bg-surface p-3 text-[13px] text-muted">
      <Info aria-hidden className="mt-px size-4 shrink-0" />
      <span>{texto}</span>
    </p>
  ) : null

/** Título de pantalla con una línea de contexto y las acciones a la derecha. */
export function Encabezado({ titulo, linea, acciones }: { titulo: ReactNode; linea?: ReactNode; acciones?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-2xl/8 font-semibold tracking-[-0.015em]">{titulo}</h1>
        {linea && <p className="mt-1 text-[15px] text-muted">{linea}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </div>
  )
}

export const panelCls = 'rounded-lg border border-line bg-surface'

/** Estado en una tabla: tinte pálido con texto del mismo tono. */
export function Insignia({ tono, children }: { tono: 'ok' | 'pendiente' | 'off'; children: ReactNode }) {
  const cls = tono === 'ok' ? 'bg-ok-bg text-ok-ink' : tono === 'pendiente' ? 'bg-review-bg text-review-ink' : 'bg-archived-bg text-archived-ink'
  return (
    <span className={`inline-flex h-[22px] items-center gap-1.5 rounded px-2 text-xs font-medium whitespace-nowrap ${cls}`}>
      {tono === 'ok' && <span aria-hidden className="size-1.5 rounded-full bg-leaf" />}
      {children}
    </span>
  )
}

// Tintes pálidos de identidad por persona (no son datos).
const TINTES = [
  ['#e6ecfb', '#24357f'], ['#e5f4ec', '#1d5b3a'], ['#fbe9e4', '#7e3220'],
  ['#efe8fa', '#4d2f80'], ['#fbf1dd', '#6d4a07'], ['#e3f2f5', '#165460'],
]

export function Avatar({ nombre, semilla, size = 28 }: { nombre: string; semilla: string; size?: number }) {
  const [bg, fg] = TINTES[[...semilla].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTES.length]
  const iniciales = nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?'
  return (
    <span aria-hidden className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size <= 28 ? 11 : 13 }}>
      {iniciales}
    </span>
  )
}
