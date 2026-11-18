import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { FilePlus, FileText, Trash2 } from 'lucide-react'
import * as api from './api/jerarquia'
import { useArbol } from './arbol'
import { EditorContenido } from './editor'
import { errorDe, FormNombre } from './jerarquia-ui'
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
  const [error, setError] = useState<string | null>(null)

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
        linea={`Actualizada ${new Date(pagina.fechaActualizacion).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}`}
        acciones={pagina.puedeEliminar && (
          <Boton type="button" cargando={eliminando} textoCarga="Eliminando…" className={`${btnSmCls} text-danger hover:bg-danger-bg`} onClick={() => void eliminar(pagina)}>
            <Trash2 aria-hidden className="size-3.5" />Eliminar página
          </Boton>
        )} />
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
        <EditorContenido key={guid} guid={guid} editable={puede('paginasEditar')} />
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
