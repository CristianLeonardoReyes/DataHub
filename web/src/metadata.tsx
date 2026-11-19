import { useEffect, useId, useState } from 'react'
import { X } from 'lucide-react'
import * as api from './api/jerarquia'
import { errorDe } from './jerarquia-ui'
import { Alerta, Boton, inputCls, panelCls } from './ui'

const ESTADOS: [api.EstadoPagina, string][] = [['borrador', 'Borrador'], ['en_revision', 'En revisión'], ['aprobado', 'Aprobado'], ['archivado', 'Archivado']]
const TIPOS: [api.TipoDocumento, string][] = [
  ['general', 'General'], ['adr', 'ADR'], ['api', 'API'], ['runbook', 'Runbook'], ['arquitectura', 'Arquitectura'],
  ['onboarding', 'Onboarding'], ['guia', 'Guía'], ['procedimiento', 'Procedimiento'], ['manual', 'Manual'], ['acta', 'Acta de reunión'],
]
const MAX_ETIQUETAS = 20
const TONO: Record<api.EstadoPagina, string> = {
  borrador: 'bg-raised text-muted',
  en_revision: 'bg-review-bg text-review-ink',
  aprobado: 'bg-ok-bg text-ok-ink',
  archivado: 'bg-archived-bg text-archived-ink',
}
const nombreDe = (lista: [string, string][], v: string) => lista.find(([k]) => k === v)?.[1] ?? v
// Misma normalización que el servidor: trim, espacios internos colapsados, minúsculas.
const normalizar = (t: string) => t.trim().replace(/\s+/g, ' ').toLowerCase()
const labelCls = 'block text-sm font-medium'

export function InsigniaEstado({ estado }: { estado: api.EstadoPagina }) {
  return (
    <span className={`inline-flex h-[22px] items-center rounded px-2 text-xs font-medium whitespace-nowrap ${TONO[estado]}`}>
      {nombreDe(ESTADOS, estado)}
    </span>
  )
}

function Etiquetas({ valor, onChange }: { valor: string[]; onChange: (v: string[]) => void }) {
  const id = useId()
  const [texto, setTexto] = useState('')
  const [sugeridas, setSugeridas] = useState<string[]>([])

  useEffect(() => {
    const q = normalizar(texto)
    if (!q) return
    let vigente = true
    const t = setTimeout(() => {
      void api.etiquetas(q).then((r) => {
        if (vigente && r.ok && Array.isArray(r.datos)) setSugeridas(r.datos)
      })
    }, 250)
    return () => {
      vigente = false
      clearTimeout(t)
    }
  }, [texto])

  function agregar(crudo: string) {
    const e = normalizar(crudo).slice(0, 50)
    setTexto('')
    if (e && !valor.includes(e) && valor.length < MAX_ETIQUETAS) onChange([...valor, e])
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className={labelCls}>Etiquetas</label>
      {valor.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {valor.map((e) => (
            <li key={e} className="inline-flex h-7 items-center gap-1 rounded-md bg-brand-soft pr-1 pl-2.5 text-[13px] text-brand-text">
              {e}
              <button type="button" aria-label={`Quitar etiqueta ${e}`} onClick={() => onChange(valor.filter((x) => x !== e))}
                className="inline-flex size-5 items-center justify-center rounded hover:bg-brand/15">
                <X aria-hidden className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input id={id} list={`${id}-sug`} value={texto} className={inputCls} autoComplete="off" aria-describedby={`${id}-ayuda`}
        disabled={valor.length >= MAX_ETIQUETAS}
        onChange={(e) => {
          const v = e.target.value
          if (v.includes(',')) {
            const partes = v.split(',')
            partes.slice(0, -1).forEach(agregar)
            setTexto(partes[partes.length - 1])
          } else setTexto(v)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            agregar(texto)
          }
        }} />
      <datalist id={`${id}-sug`}>{sugeridas.filter((s) => !valor.includes(s)).map((s) => <option key={s} value={s} />)}</datalist>
      <p id={`${id}-ayuda`} className="text-[13px] text-muted">Enter o coma para agregar. Máximo {MAX_ETIQUETAS}.</p>
    </div>
  )
}

export function PanelDetalles({ pagina, editable, onGuardado }: { pagina: api.PaginaDetalle; editable: boolean; onGuardado: () => Promise<void> }) {
  const base: api.MetadataPagina = {
    estado: pagina.estado, tipoDocumento: pagina.tipoDocumento, responsableGuid: pagina.responsable?.guid ?? null,
    fechaRevision: pagina.fechaRevision, etiquetas: pagina.etiquetas,
  }
  const [m, setM] = useState(base)
  const [responsables, setResponsables] = useState<api.Responsable[]>([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const uid = useId()

  useEffect(() => {
    if (!editable) return
    let vigente = true
    void api.responsables().then((r) => {
      if (vigente && r.ok && Array.isArray(r.datos)) setResponsables(r.datos)
    })
    return () => {
      vigente = false
    }
  }, [editable])

  const opciones = pagina.responsable && !responsables.some((r) => r.guid === pagina.responsable?.guid) ? [pagina.responsable, ...responsables] : responsables
  // El servidor devuelve las etiquetas en orden alfabético: se comparan ordenadas.
  const firma = (x: api.MetadataPagina) => JSON.stringify({ ...x, etiquetas: [...(x.etiquetas ?? [])].sort() })
  const cambios = firma(m) !== firma(base)
  const set = (p: Partial<api.MetadataPagina>) => setM((a) => ({ ...a, ...p }))

  async function guardar() {
    setGuardando(true)
    setError(null)
    const r = await api.metadata(pagina.guid, m)
    setGuardando(false)
    if (!r.ok) return setError(errorDe(r, 'No se pudieron guardar los detalles'))
    await onGuardado()
  }

  if (!editable)
    return (
      <section aria-labelledby={`${uid}-h`} className={`${panelCls} p-4`}>
        <h2 id={`${uid}-h`} className="mb-3 text-[15px] font-semibold">Detalles</h2>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">Estado</dt><dd>{nombreDe(ESTADOS, pagina.estado)}</dd></div>
          <div><dt className="text-muted">Tipo</dt><dd>{nombreDe(TIPOS, pagina.tipoDocumento)}</dd></div>
          <div><dt className="text-muted">Responsable</dt><dd>{pagina.responsable?.nombre ?? 'Sin responsable'}</dd></div>
          <div><dt className="text-muted">Fecha de revisión</dt><dd>{pagina.fechaRevision ?? 'Sin fecha'}</dd></div>
          <div className="sm:col-span-2"><dt className="text-muted">Etiquetas</dt><dd>{pagina.etiquetas.length ? pagina.etiquetas.join(', ') : 'Sin etiquetas'}</dd></div>
        </dl>
      </section>
    )

  return (
    <section aria-labelledby={`${uid}-h`} className={`${panelCls} p-4`}>
      <h2 id={`${uid}-h`} className="mb-3 text-[15px] font-semibold">Detalles</h2>
      <div className="space-y-4">
        <Alerta texto={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor={`${uid}-estado`} className={labelCls}>Estado</label>
            <select id={`${uid}-estado`} className={inputCls} value={m.estado} aria-describedby={`${uid}-aprobar`}
              onChange={(e) => set({ estado: e.target.value as api.EstadoPagina })}>
              {ESTADOS.map(([k, t]) => <option key={k} value={k} disabled={k === 'aprobado' && !pagina.puedeAprobar && pagina.estado !== 'aprobado'}>{t}</option>)}
            </select>
            {!pagina.puedeAprobar && <p id={`${uid}-aprobar`} className="text-[13px] text-muted">Solo un Coordinador o superior puede aprobar</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor={`${uid}-tipo`} className={labelCls}>Tipo</label>
            <select id={`${uid}-tipo`} className={inputCls} value={m.tipoDocumento} onChange={(e) => set({ tipoDocumento: e.target.value as api.TipoDocumento })}>
              {TIPOS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor={`${uid}-resp`} className={labelCls}>Responsable</label>
            <select id={`${uid}-resp`} className={inputCls} value={m.responsableGuid ?? ''} onChange={(e) => set({ responsableGuid: e.target.value || null })}>
              <option value="">Sin responsable</option>
              {opciones.map((r) => <option key={r.guid} value={r.guid}>{r.nombre}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor={`${uid}-fecha`} className={labelCls}>Fecha de revisión</label>
            <div className="flex items-center gap-2">
              <input id={`${uid}-fecha`} type="date" className={inputCls} value={m.fechaRevision ?? ''} onChange={(e) => set({ fechaRevision: e.target.value || null })} />
              {m.fechaRevision && (
                <button type="button" className="text-[13px] whitespace-nowrap text-brand-text hover:underline" onClick={() => set({ fechaRevision: null })}>Limpiar fecha</button>
              )}
            </div>
          </div>
        </div>
        <Etiquetas valor={m.etiquetas} onChange={(etiquetas) => set({ etiquetas })} />
        <Boton type="button" cargando={guardando} textoCarga="Guardando…" disabled={!cambios}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-brand px-4 text-sm font-medium text-on-brand hover:bg-brand-hover disabled:opacity-60"
          onClick={() => void guardar()}>
          Guardar detalles
        </Boton>
      </div>
    </section>
  )
}
