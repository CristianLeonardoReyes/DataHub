import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { FileDown, FilePlus, FileText, Trash2 } from 'lucide-react'
import * as api from './api/jerarquia'
import { useArbol } from './arbol'
import { Archivos } from './archivos'
import { EditorContenido } from './editor'
import { errorDe, FormNombre } from './jerarquia-ui'
import { InsigniaEstado, PanelDetalles } from './metadata'
import { useSesion } from './Sesion'
import { Alerta, Boton, btnSmCls, Encabezado, panelCls } from './ui'

export function PaginaVista() {
  const { guid = '' } = useParams()
  const { puede } = useSesion()
  const { recargarArbol, version } = useArbol()
  const nav = useNavigate()
  const cargada = useRef<string | null>(null)
  const [pagina, setPagina] = useState<api.PaginaDetalle | null>(null)
  const [fallo, setFallo] = useState<{ status: number; detalle?: string | null } | null>(null)
  const [nueva, setNueva] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recargaArchivos, setRecargaArchivos] = useState(0)

  // `version` cambia tras cada recarga del árbol: refresca título y subpáginas tras renombrar o crear.
  useEffect(() => {
    let vigente = true
    void api.paginas.obtener(guid).then((r) => {
      if (!vigente) return
      // Se eliminó la página (o un ancestro) mientras estaba abierta: volver a Inicio.
      if (!r.ok && r.status === 404 && cargada.current === guid) return void nav('/')
      cargada.current = r.ok ? guid : null
      setPagina(r.ok ? r.datos : null)
      setFallo(r.ok ? null : { status: r.status, detalle: r.problema.detail })
    })
    return () => {
      vigente = false
    }
  }, [guid, version])

  async function eliminar(p: api.PaginaDetalle) {
    if (!window.confirm(`¿Eliminar "${p.titulo}"? También se eliminan sus subpáginas.`)) return
    setEliminando(true)
    setError(null)
    const r = await api.paginas.eliminar(p.guid)
    if (r.ok) {
      await recargarArbol()
      nav('/')
      return
    }
    setError(errorDe(r, 'No se pudo eliminar la página'))
    setEliminando(false)
  }

  async function exportar(paginaGuid: string) {
    setExportando(true)
    setError(null)
    const r = await api.paginas.markdown(paginaGuid)
    if (r.ok) {
      const url = URL.createObjectURL(r.datos.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = r.datos.nombre ?? 'pagina.md'
      a.click()
      // Revocar en el mismo tick puede cancelar la descarga en Firefox/Safari.
      setTimeout(() => URL.revokeObjectURL(url), 0)
    } else if (r.status !== 401) {
      setError(r.status === 403 ? 'No tienes permiso para exportar' : r.status === 404 ? 'Página no encontrada o sin acceso' : 'No se pudo exportar')
    }
    setExportando(false)
  }

  if (fallo)
    return (
      <section>
        <Encabezado titulo="Página" />
        <Alerta texto={fallo.status === 404 ? 'Página no encontrada o sin acceso' : (fallo.detalle ?? 'No se pudo cargar la página')} />
      </section>
    )
  if (!pagina) return <p className="text-sm text-muted">Cargando…</p>

  return (
    <section className="max-w-[760px]">
      <nav aria-label="Ruta" className="mb-3">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-muted">
          {pagina.ruta.map((r, i) => (
            <li key={`${r.tipo}-${r.guid}`} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden>/</span>}
              {r.tipo === 'pagina' ? <Link to={`/paginas/${r.guid}`} className="hover:text-ink hover:underline">{r.nombre}</Link> : <span>{r.nombre}</span>}
            </li>
          ))}
        </ol>
      </nav>
      <Encabezado titulo={pagina.titulo}
        linea={<span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
          <InsigniaEstado estado={pagina.estado} />
          {`Actualizada ${new Date(pagina.fechaActualizacion).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}`}
        </span>}
        acciones={<div className="flex flex-wrap gap-2">
          {puede('exportarMarkdown') && (
            <Boton type="button" cargando={exportando} textoCarga="Exportando…" className={btnSmCls} onClick={() => void exportar(pagina.guid)}>
              <FileDown aria-hidden className="size-3.5" />Exportar a Markdown
            </Boton>
          )}
          {pagina.puedeEliminar && (
            <Boton type="button" cargando={eliminando} textoCarga="Eliminando…" className={`${btnSmCls} text-danger hover:bg-danger-bg`} onClick={() => void eliminar(pagina)}>
              <Trash2 aria-hidden className="size-3.5" />Eliminar página
            </Boton>
          )}
        </div>} />
      <div className="space-y-6">
        <Alerta texto={error} />
        {puede('paginasEditar') && (
          <div className={`${panelCls} p-4`}>
            <FormNombre key={`${pagina.guid}:${pagina.titulo}`} label="Título" inicial={pagina.titulo} boton="Guardar título" textoCarga="Guardando…"
              onEnviar={async (titulo) => {
                // PUT de reemplazo: se reenvía el padre actual (null = raíz de la colección).
                const r = await api.paginas.editar(pagina.guid, { titulo, paginaPadreGuid: pagina.paginaPadreGuid })
                if (!r.ok) return errorDe(r, 'No se pudo guardar el título')
                await recargarArbol()
                return null
              }} />
          </div>
        )}
        <PanelDetalles key={pagina.guid} pagina={pagina} editable={puede('metadataEditar')}
          onGuardado={async () => { await recargarArbol() }} />
        <EditorContenido key={guid} guid={guid} editable={puede('paginasEditar')} alSubirImagen={() => setRecargaArchivos((n) => n + 1)} />
        <Archivos key={`a${guid}`} guid={guid} editable={puede('paginasEditar')} recarga={recargaArchivos} />
        <section aria-labelledby="h-sub">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="h-sub" className="text-[15px] font-semibold">Subpáginas</h2>
            {puede('paginasEditar') && !nueva && (
              <button type="button" className={btnSmCls} onClick={() => setNueva(true)}>
                <FilePlus aria-hidden className="size-3.5" />Nueva subpágina
              </button>
            )}
          </div>
          {nueva && (
            <div className={`${panelCls} mb-3 p-4`}>
              <FormNombre compacto label="Título de la nueva subpágina" boton="Crear subpágina" textoCarga="Creando…" onCancelar={() => setNueva(false)}
                onEnviar={async (titulo) => {
                  const r = await api.paginas.crear({ coleccionGuid: pagina.coleccionGuid, paginaPadreGuid: pagina.guid, titulo })
                  if (!r.ok) return errorDe(r, 'No se pudo crear la subpágina')
                  await recargarArbol()
                  setNueva(false)
                  return null
                }} />
            </div>
          )}
          {pagina.subpaginas.length === 0 ? (
            <p className="text-sm text-muted">Esta página no tiene subpáginas.</p>
          ) : (
            <ul className={`${panelCls} divide-y divide-rule`}>
              {pagina.subpaginas.map((s) => (
                <li key={s.guid}>
                  <Link to={`/paginas/${s.guid}`} className="flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-raised">
                    <FileText aria-hidden className="size-4 text-faint" />{s.titulo}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  )
}
