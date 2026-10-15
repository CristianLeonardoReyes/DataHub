import type { ReactNode } from 'react'

export const inputCls =
  'w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 aria-[invalid=true]:border-red-400'
export const btnCls =
  'w-full rounded bg-violet-500 px-3 py-2 font-medium text-white hover:bg-violet-400 focus-visible:ring-2 focus-visible:ring-violet-300 focus:outline-none disabled:opacity-50'
export const btnSmCls =
  'rounded border border-zinc-700 px-3 py-1 text-sm text-zinc-100 hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-violet-400 focus:outline-none disabled:opacity-50'
export const linkCls = 'text-violet-300 underline hover:text-violet-200 focus-visible:ring-2 focus-visible:ring-violet-400 focus:outline-none'

export function Tarjeta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 text-zinc-100">
      <div className="w-full max-w-sm space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
        <h1 className="text-xl font-semibold">Data Hub</h1>
        <h2 className="text-zinc-400">{titulo}</h2>
        {children}
      </div>
    </main>
  )
}

export function Campo(p: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  invalido?: boolean
  auto?: string
  error?: string | null
}) {
  const invalido = p.invalido || !!p.error
  return (
    <div className="space-y-1">
      <label htmlFor={p.id} className="block text-sm text-zinc-300">{p.label}</label>
      <input id={p.id} type={p.type ?? 'text'} value={p.value} onChange={(e) => p.onChange(e.target.value)}
        required autoComplete={p.auto} aria-invalid={invalido || undefined}
        aria-describedby={p.error ? `${p.id}-error` : undefined} className={inputCls} />
      {p.error && <p id={`${p.id}-error`} className="text-sm text-red-300">{p.error}</p>}
    </div>
  )
}

export const Alerta = ({ texto }: { texto: string | null }) =>
  texto ? <p role="alert" className="text-sm text-red-300">{texto}</p> : null
