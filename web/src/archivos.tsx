import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, FileIcon, Trash2, Upload, X } from 'lucide-react'
import * as api from './api/adjuntos'
import { Alerta, Boton, btnSmCls, panelCls } from './ui'

const IMAGENES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
// SVG no está en la lista a propósito: puede llevar scripts.
function tipoVista(mime: string): 'imagen' | 'pdf' | 'video' | 'audio' | null {
  const m = mime.toLowerCase()
  if (IMAGENES.includes(m)) return 'imagen'
  if (m === 'application/pdf') return 'pdf'
  if (m.startsWith('video/')) return 'video'
  if (m.startsWith('audio/')) return 'audio'
  return null
}

export function tamano(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}
const fecha = (f: string) => new Date(f).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })

/** URL firmada del adjunto (caduca a los 10 min); `reintentar` la vuelve a pedir una sola vez. */
export function useUrlAdjunto(guid: string) {
  const [estado, setEstado] = useState<{ url?: string; status?: number }>({})
  const [intento, setIntento] = useState(0)
  useEffect(() => {
    let vigente = true
    void api.adjuntos.url(guid, false).then((r) => {
      if (vigente) setEstado(r.ok ? { url: r.datos.url } : { status: r.status })
    })
    return () => {
      vigente = false
    }
  }, [guid, intento])
  // Un enlace dura 10 min: si la carga falla, se pide otro; como mucho uno por minuto para no
  // entrar en bucle con un archivo que de verdad no carga.
  const ultimo = useRef(0)
  const reintentar = useCallback(() => {
    if (Date.now() - ultimo.current < 60_000) return
    ultimo.current = Date.now()
    setIntento((i) => i + 1)
  }, [])
  return { ...estado, reintentar }
}

function Ficha({ a }: { a: api.Adjunto }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
      <dt className="text-muted">Nombre</dt><dd className="break-all">{a.nombre}</dd>
      <dt className="text-muted">Tipo</dt><dd>{a.tipoMime}</dd>
      <dt className="text-muted">Tamaño</dt><dd>{tamano(a.tamanoBytes)}</dd>
      <dt className="text-muted">Fecha</dt><dd>{fecha(a.fechaCreacion)}</dd>
      <dt className="text-muted">Subido por</dt><dd>{a.subidoPor.nombre}</dd>
    </dl>
  )
}

function Vista({ a, tipo }: { a: api.Adjunto; tipo: NonNullable<ReturnType<typeof tipoVista>> }) {
  const { url, status, reintentar } = useUrlAdjunto(a.guid)
  if (status) return <Alerta texto="No se pudo cargar la vista previa" />
  if (!url) return <p className="text-sm text-muted">Cargando vista previa…</p>
  if (tipo === 'imagen') return <img src={url} alt={a.nombre} onError={reintentar} className="mx-auto max-h-[70vh] max-w-full" />
  if (tipo === 'pdf') return <iframe src={url} title={a.nombre} className="h-[70vh] w-full rounded-md border border-line" />
  if (tipo === 'video') return <video src={url} controls onError={reintentar} className="mx-auto max-h-[70vh] max-w-full" />
  return <audio src={url} controls onError={reintentar} className="w-full" />
}

function Previa({ a, alCerrar }: { a: api.Adjunto; alCerrar: () => void }) {
  const cerrar = useRef<HTMLButtonElement>(null)
  const [descargando, setDescargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tipo = tipoVista(a.tipoMime)
  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null
    cerrar.current?.focus()
    return () => previo?.focus()
  }, [])

  async function descargar() {
    setDescargando(true)
    setError(null)
    const r = await api.adjuntos.url(a.guid, true)
    if (r.ok) window.location.assign(r.datos.url)
    else setError(r.status === 404 ? 'El archivo ya no existe' : 'No se pudo descargar el archivo')
    setDescargando(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={alCerrar}>
      <div role="dialog" aria-modal="true" aria-labelledby="previa-titulo" onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') alCerrar() }}
        className={`${panelCls} max-h-full w-full max-w-3xl space-y-4 overflow-auto p-4 shadow-lg`}>
        <div className="flex items-start justify-between gap-3">
          <h2 id="previa-titulo" className="min-w-0 text-[15px] font-semibold break-all">{a.nombre}</h2>
          <button ref={cerrar} type="button" aria-label="Cerrar vista previa" className={`${btnSmCls} w-8 px-0`} onClick={alCerrar}>
            <X aria-hidden className="size-4" />
          </button>
        </div>
        {tipo ? <Vista a={a} tipo={tipo} /> : <Ficha a={a} />}
        <Alerta texto={error} />
        <Boton type="button" cargando={descargando} textoCarga="Descargando…" className={btnSmCls} onClick={() => void descargar()}>
          <Download aria-hidden className="size-3.5" />Descargar
        </Boton>
      </div>
    </div>
  )
}

export function Archivos({ guid, editable, recarga = 0 }: { guid: string; editable: boolean; recarga?: number }) {
  const [lista, setLista] = useState<api.Adjunto[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [abierto, setAbierto] = useState<api.Adjunto | null>(null)
  const [arrastrando, setArrastrando] = useState(false)
  const entrada = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let vigente = true
    void api.adjuntos.listar(guid).then((r) => {
      if (!vigente) return
      if (r.ok) setLista(r.datos)
      else setError(r.status === 404 ? 'Página no encontrada o sin acceso' : (r.problema.detail ?? 'No se pudieron cargar los archivos'))
    })
    return () => {
      vigente = false
    }
  }, [guid, recarga])

  async function subir(archivos: File[]) {
    if (!editable || subiendo || archivos.length === 0) return
    setSubiendo(true)
    setError(null)
    for (const f of archivos) {
      const r = await api.subirArchivo(guid, f)
      if ('error' in r) {
        setError(r.error)
        break
      }
      setLista((l) => [...(l ?? []), r.adjunto])
    }
    setSubiendo(false)
  }

  async function eliminar(a: api.Adjunto) {
    if (!window.confirm(`¿Eliminar "${a.nombre}"?`)) return
    setEliminando(a.guid)
    setError(null)
    const r = await api.adjuntos.eliminar(a.guid)
    if (r.ok || r.status === 404) setLista((l) => (l ?? []).filter((x) => x.guid !== a.guid))
    else setError(r.status === 403 ? 'No tienes permiso para eliminar este archivo' : 'No se pudo eliminar el archivo')
    setEliminando(null)
  }

  return (
    <section aria-labelledby="h-arch"
      onDragOver={(e) => { if (editable) { e.preventDefault(); setArrastrando(true) } }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={(e) => { e.preventDefault(); setArrastrando(false); void subir([...e.dataTransfer.files]) }}
      className={`rounded-lg ${arrastrando ? 'outline-2 outline-dashed outline-brand' : ''}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="h-arch" className="text-[15px] font-semibold">Archivos</h2>
        {editable && (
          <>
            <input ref={entrada} type="file" hidden aria-label="Archivo a subir" onChange={(e) => {
              void subir([...(e.target.files ?? [])])
              e.target.value = ''
            }} />
            <Boton type="button" cargando={subiendo} textoCarga="Subiendo…" className={btnSmCls} onClick={() => entrada.current?.click()}>
              <Upload aria-hidden className="size-3.5" />Subir archivo
            </Boton>
          </>
        )}
      </div>
      <div className="space-y-3">
        <Alerta texto={error} />
        {lista === null ? (
          !error && <p className="text-sm text-muted">Cargando archivos…</p>
        ) : lista.length === 0 ? (
          <p className="text-sm text-muted">Esta página no tiene archivos.{editable && ' Arrastra uno aquí o usa Subir archivo.'}</p>
        ) : (
          <ul className={`${panelCls} divide-y divide-rule`}>
            {lista.map((a) => (
              <li key={a.guid} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                <FileIcon aria-hidden className="size-4 shrink-0 text-faint" />
                <div className="min-w-0 flex-1">
                  <button type="button" className="max-w-full truncate text-left text-sm font-medium text-brand-text hover:underline"
                    onClick={() => setAbierto(a)}>{a.nombre}</button>
                  <p className="text-[13px] text-muted">
                    {a.tipoMime} · {tamano(a.tamanoBytes)} · {fecha(a.fechaCreacion)} · {a.subidoPor.nombre}
                  </p>
                </div>
                {a.puedeEliminar && (
                  <Boton type="button" cargando={eliminando === a.guid} textoCarga="Eliminando…" aria-label={`Eliminar ${a.nombre}`}
                    className={`${btnSmCls} text-danger hover:bg-danger-bg`} onClick={() => void eliminar(a)}>
                    <Trash2 aria-hidden className="size-3.5" />Eliminar
                  </Boton>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {abierto && <Previa a={abierto} alCerrar={() => setAbierto(null)} />}
    </section>
  )
}
