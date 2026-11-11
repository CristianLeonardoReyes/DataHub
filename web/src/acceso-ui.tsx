import { useState, type ReactNode } from 'react'
import { ArrowRight, CircleAlert, CircleCheck, Eye, EyeOff, LoaderCircle, ShieldCheck, type LucideIcon } from 'lucide-react'

export const linkAccesoCls =
  'rounded-[var(--r-xs)] text-[13px] font-medium text-brand-text underline-offset-[3px] hover:underline'

export function PantallaAcceso({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ground px-4 py-8 font-sans text-ink">
      <div className="w-full max-w-[400px] space-y-6 rounded-lg border border-line bg-surface p-6 sm:p-8">
        <div className="flex items-center justify-center gap-2.5">
          <img src="/logo-datahub.svg" alt="" className="logo-claro size-8" />
          <img src="/logo-datahub-oscuro.svg" alt="" className="logo-oscuro size-8" />
          <span className="text-lg font-semibold tracking-[-0.01em]">DataHub</span>
        </div>
        <div className="space-y-1 text-center">
          <h1 className="text-2xl/8 font-semibold tracking-[-0.015em]">{titulo}</h1>
          <p className="text-sm text-muted">{subtitulo}</p>
        </div>
        {children}
        <p className="border-t border-rule pt-4 text-center text-xs text-faint">DataHub · by DataGlobal</p>
      </div>
    </main>
  )
}

export function CampoAcceso(p: {
  id: string
  label: string
  type?: 'text' | 'email' | 'password'
  value: string
  onChange: (v: string) => void
  icono: LucideIcon
  auto?: string
  ayuda?: string
  error?: string | null
  accion?: ReactNode
  invalido?: boolean
}) {
  const [visible, setVisible] = useState(false)
  const esClave = p.type === 'password'
  const Icono = p.icono
  const descrito = p.error ? `${p.id}-error` : p.ayuda ? `${p.id}-ayuda` : undefined
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={p.id} className="text-sm font-medium">{p.label}</label>
        {p.accion}
      </div>
      <div className="relative">
        <Icono aria-hidden className="pointer-events-none absolute top-3 left-3 size-4 text-faint" />
        <input id={p.id} type={esClave && visible ? 'text' : (p.type ?? 'text')} value={p.value}
          onChange={(e) => p.onChange(e.target.value)} required autoComplete={p.auto}
          aria-invalid={!!p.error || p.invalido || undefined} aria-describedby={descrito}
          className={`h-10 w-full rounded-md border bg-surface pl-9 text-sm text-ink hover:border-faint focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none ${esClave ? 'pr-10' : 'pr-3'} ${p.error ? 'border-danger' : 'border-control'}`} />
        {esClave && (
          <button type="button" onClick={() => setVisible(!visible)} aria-pressed={visible}
            aria-label="Mostrar contraseña"
            className="absolute top-1 right-1 flex size-8 items-center justify-center rounded-md text-muted hover:bg-active hover:text-ink">
            {visible ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
          </button>
        )}
      </div>
      {p.error ? (
        <p id={`${p.id}-error`} role="alert" className="text-[13px] text-danger">{p.error}</p>
      ) : p.ayuda ? (
        <p id={`${p.id}-ayuda`} className="text-[13px] text-muted">{p.ayuda}</p>
      ) : null}
    </div>
  )
}

export function BotonAcceso({ cargando, textoCarga, children }: { cargando: boolean; textoCarga: string; children: ReactNode }) {
  return (
    <button type="submit" disabled={cargando}
      className="flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-brand px-4 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover active:translate-y-px disabled:opacity-60">
      {cargando ? (
        <>
          <LoaderCircle aria-hidden className="size-4 animate-spin" />
          {textoCarga}
        </>
      ) : (
        <>
          {children}
          <ArrowRight aria-hidden className="size-4" />
        </>
      )}
    </button>
  )
}

export function Aviso({ tipo, children }: { tipo: 'ok' | 'error'; children: ReactNode }) {
  const ok = tipo === 'ok'
  const Icono = ok ? CircleCheck : CircleAlert
  return (
    <div role={ok ? 'status' : 'alert'}
      className={`flex items-start gap-2 rounded-lg border p-3 text-[13px] ${ok ? 'border-ok-ink/30 bg-ok-bg text-ok-ink' : 'border-danger/30 bg-danger-bg text-danger-ink'}`}>
      <Icono aria-hidden className="mt-px size-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

export const InsigniaInvitacion = () => (
  <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
    <ShieldCheck aria-hidden className="size-3.5" />
    Acceso privado exclusivo por invitación
  </p>
)
