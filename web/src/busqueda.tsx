import { Fragment, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { LoaderCircle, Search } from 'lucide-react'
import * as api from './api/busqueda'
import { useSesion } from './Sesion'
import { Alerta, AvisoInfo, btnSmCls, Encabezado, linkCls, panelCls } from './ui'

// Cada unidad UTF-16 a su base sin tilde y en minúscula; si el cambio alteraría la longitud
// (emojis, 'İ'…) se deja igual, para que los índices de <mark> coincidan con el texto original.
const base = (c: string) => {
  const b = (c.normalize('NFD')[0] ?? c).toLowerCase()
  return b.length === 1 ? b : c
}
const plano = (s: string) => s.split('').map(base).join('')
const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Envuelve en <mark> las coincidencias de los términos (sin mayúsculas ni tildes), sin innerHTML. */
export function Resaltado({ texto, q }: { texto: string; q: string }) {
  // Igual que la API: solo letras y dígitos, términos de 2 o más caracteres.
  const terminos = plano(q).split(/[^\p{L}\p{N}]+/u).filter((t) => t.length >= 2)
  if (!terminos.length) return <>{texto}</>
  const re = new RegExp(terminos.map(escapar).join('|'), 'g')
  const partes: { t: string; m: boolean }[] = []
  let ultimo = 0
  for (const m of plano(texto).matchAll(re)) {
    if (m.index > ultimo) partes.push({ t: texto.slice(ultimo, m.index), m: false })
    partes.push({ t: texto.slice(m.index, m.index + m[0].length), m: true })
    ultimo = m.index + m[0].length
  }
  if (ultimo < texto.length) partes.push({ t: texto.slice(ultimo), m: false })
  return <>{partes.map((p, i) => (p.m ? <mark key={i} className="rounded-sm bg-review-bg px-0.5 text-ink">{p.t}</mark> : <Fragment key={i}>{p.t}</Fragment>))}</>
}

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'ok'; datos: api.RespuestaBusqueda }
  | { tipo: 'error'; texto: string }

export function Busqueda() {
  const [params, setParams] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  const pagina = Math.max(1, parseInt(params.get('pagina') ?? '1', 10) || 1)
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })
  const { usuario } = useSesion()
  const sinCliente = usuario?.perfil === 'super_admin' && !usuario.cliente

  useEffect(() => {
    if (!q || sinCliente) return
    let vigente = true
    setEstado({ tipo: 'cargando' })
    void api.buscar(q, pagina).then((r) => {
      if (!vigente) return
      if (r.ok) setEstado({ tipo: 'ok', datos: r.datos })
      else if (r.status === 429) setEstado({ tipo: 'error', texto: 'Demasiadas búsquedas, espera un momento' })
      else if (r.status === 400) setEstado({ tipo: 'error', texto: r.problema.detail ?? 'La búsqueda no es válida' })
      else if (r.status === 403) setEstado({ tipo: 'error', texto: 'No tienes permiso para buscar' })
      else setEstado({ tipo: 'error', texto: 'No se pudo buscar. Intenta de nuevo.' })
    })
    return () => { vigente = false }
  }, [q, pagina, sinCliente])

  const irA = (p: number) => setParams({ q, pagina: String(p) })

  if (sinCliente)
    return (
      <>
        <Encabezado titulo="Buscar" />
        <Alerta texto="Selecciona un cliente para operar" />
      </>
    )
  if (!q)
    return (
      <>
        <Encabezado titulo="Buscar" />
        <AvisoInfo texto="Escribe en el buscador de la cabecera para encontrar páginas por título o contenido." />
      </>
    )

  const datos = estado.tipo === 'ok' ? estado.datos : null
  // La API admite hasta la página 500.
  const paginas = datos ? Math.min(500, Math.max(1, Math.ceil(datos.total / (datos.porPagina || 20)))) : 1
  const conteo = datos ? (datos.total === 1 ? '1 resultado' : `${datos.total} resultados`) + ` para «${q}»` : ''

  return (
    <>
      <Encabezado titulo="Buscar" />
      <div aria-live="polite" className="mb-4 text-[15px] text-muted">
        {estado.tipo === 'cargando' && (
          <span className="flex items-center gap-2"><LoaderCircle aria-hidden className="size-4 animate-spin" />Buscando…</span>
        )}
        {datos && datos.total > 0 && conteo}
      </div>
      {estado.tipo === 'error' && <Alerta texto={estado.texto} />}
      {datos && datos.total === 0 && (
        <p className="flex items-center gap-2 text-[15px] text-muted"><Search aria-hidden className="size-4" />No encontramos páginas con «{q}»</p>
      )}
      {datos && datos.total > 0 && (
        <>
          <ul className={`${panelCls} divide-y divide-rule`}>
            {datos.resultados.map((r) => (
              <li key={r.guid} className="space-y-1 px-4 py-3">
                <Link to={`/paginas/${r.guid}`} className={`${linkCls} text-[15px]`}>{r.titulo}</Link>
                <p className="text-xs text-muted">{r.ruta} · {new Date(r.fechaActualizacion).toLocaleDateString('es-CO')}</p>
                {r.fragmento && <p className="text-sm text-ink"><Resaltado texto={r.fragmento} q={q} /></p>}
              </li>
            ))}
          </ul>
          <nav aria-label="Paginación" className="mt-4 flex items-center justify-between gap-3">
            <button type="button" className={btnSmCls} disabled={pagina <= 1} onClick={() => irA(pagina - 1)}>Anterior</button>
            <span className="text-[13px] text-muted">Página {pagina} de {paginas}</span>
            <button type="button" className={btnSmCls} disabled={pagina >= paginas} onClick={() => irA(pagina + 1)}>Siguiente</button>
          </nav>
        </>
      )}
    </>
  )
}
