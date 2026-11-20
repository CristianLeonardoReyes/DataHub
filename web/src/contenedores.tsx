import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { FileText, Folder, FolderPlus, Layers, Trash2, Users } from 'lucide-react'
import * as api from './api/jerarquia'
import { useArbol } from './arbol'
import { HIJO, RECURSO, usePermisosNodo, type Tipo } from './jerarquia-nodos'
import { errorDe, FormNombre } from './jerarquia-ui'
import { Alerta, AvisoOk, Boton, btnSmCls, Campo, Encabezado, inputCls, panelCls } from './ui'
import { useSesion } from './Sesion'

type Contenedor = Exclude<Tipo, 'pagina'>
type Hijo = { guid: string; nombre: string; ruta: string }
type Encontrado = { nodo: { guid: string; nombre: string; descripcion?: string | null }; ruta: { nombre: string; ruta: string }[]; hijos: Hijo[] }

const TITULO_HIJOS = { workspace: 'Espacios', espacio: 'Colecciones', coleccion: 'Páginas' }
const VACIO = { workspace: 'Este workspace no tiene espacios.', espacio: 'Este espacio no tiene colecciones.', coleccion: 'Esta colección no tiene páginas.' }
const ICONO_HIJO = { workspace: Layers, espacio: Folder, coleccion: FileText }

function buscar(arbol: api.WorkspaceArbol[], tipo: Contenedor, guid: string): Encontrado | null {
  for (const w of arbol) {
    const wRuta = { nombre: w.nombre, ruta: `/workspaces/${w.guid}` }
    if (tipo === 'workspace' && w.guid === guid)
      return { nodo: w, ruta: [], hijos: w.espacios.map((e) => ({ guid: e.guid, nombre: e.nombre, ruta: `/espacios/${e.guid}` })) }
    for (const e of w.espacios) {
      const eRuta = { nombre: e.nombre, ruta: `/espacios/${e.guid}` }
      if (tipo === 'espacio' && e.guid === guid)
        return { nodo: e, ruta: [wRuta], hijos: e.colecciones.map((c) => ({ guid: c.guid, nombre: c.nombre, ruta: `/colecciones/${c.guid}` })) }
      for (const c of e.colecciones)
        if (tipo === 'coleccion' && c.guid === guid)
          return { nodo: c, ruta: [wRuta, eRuta], hijos: c.paginas.map((p) => ({ guid: p.guid, nombre: p.titulo, ruta: `/paginas/${p.guid}` })) }
    }
  }
  return null
}

const ERROR_NOMBRE = 'Escribe un nombre'

// El aviso de éxito lo guarda el padre: al guardar, el árbol recarga y la key remonta este formulario.
function FormDetalles({ nombre, descripcion, ok, onEnviar }: { nombre: string; descripcion: string; ok: string | null; onEnviar: (n: string, d: string | null) => Promise<string | null> }) {
  const id = useId()
  const [n, setN] = useState(nombre)
  const [d, setD] = useState(descripcion)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!n.trim()) return setError(ERROR_NOMBRE)
    setEnviando(true)
    setError(null)
    const err = await onEnviar(n.trim(), d.trim() || null)
    setError(err)
    setEnviando(false)
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      <Campo id={`${id}-n`} label="Nombre" value={n} onChange={setN} error={error === ERROR_NOMBRE ? error : null} />
      <div className="space-y-2">
        <label htmlFor={`${id}-d`} className="block text-sm font-medium">Descripción</label>
        <textarea id={`${id}-d`} value={d} maxLength={500} rows={3} onChange={(e) => setD(e.target.value)} className={`${inputCls} h-auto py-2`} />
      </div>
      <Alerta texto={error === ERROR_NOMBRE ? null : error} />
      <AvisoOk texto={ok} />
      <Boton type="submit" cargando={enviando} textoCarga="Guardando…" className={btnSmCls}>Guardar</Boton>
    </form>
  )
}

export function ContenedorVista({ tipo }: { tipo: Contenedor }) {
  const { guid = '' } = useParams()
  const { puede, usuario } = useSesion()
  const { arbol, error: errorArbol, recargarArbol } = useArbol()
  const permisos = usePermisosNodo(tipo)
  const nav = useNavigate()
  const [nuevo, setNuevo] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [guardado, setGuardado] = useState<string | null>(null) // guid del último guardado con éxito

  // Si el nodo (o un ancestro) se elimina mientras está abierto, volver a Inicio como en las páginas.
  const visto = useRef<string | null>(null)
  const encontrado = arbol === null ? null : !!buscar(arbol, tipo, guid)
  useEffect(() => {
    if (encontrado) visto.current = guid
    else if (encontrado === false && visto.current === guid) nav('/')
  }, [encontrado, guid, nav])

  if (usuario?.perfil === 'super_admin' && !usuario.cliente) return <Alerta texto="Selecciona un cliente para operar" />
  if (arbol === null) return errorArbol ? <Alerta texto="No se pudo cargar el contenido" /> : <p className="text-sm text-muted">Cargando…</p>
  const f = buscar(arbol, tipo, guid)
  if (!f)
    return (
      <section>
        <Encabezado titulo="No encontrado" />
        <Alerta texto="No encontrado o sin acceso" />
      </section>
    )
  const { nodo, ruta, hijos } = f
  const IconoHijo = ICONO_HIJO[tipo]

  async function eliminar() {
    if (!window.confirm(`¿Eliminar "${nodo.nombre}"? Se eliminará todo lo que contiene.`)) return
    setEliminando(true)
    setError(null)
    const r = await RECURSO[tipo].eliminar(guid)
    if (r.ok) {
      await recargarArbol()
      nav('/')
      return
    }
    setError(errorDe(r, 'No se pudo eliminar'))
    setEliminando(false)
  }

  const crear = (n: string) =>
    tipo === 'workspace' ? api.espacios.crear({ workspaceGuid: guid, nombre: n })
    : tipo === 'espacio' ? api.colecciones.crear({ espacioGuid: guid, nombre: n })
    : api.paginas.crear({ coleccionGuid: guid, titulo: n })

  return (
    <section className="max-w-[760px]">
      {ruta.length > 0 && (
        <nav aria-label="Ruta" className="mb-3">
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-muted">
            {ruta.map((r, i) => (
              <li key={r.ruta} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden>/</span>}
                <Link to={r.ruta} className="hover:text-ink hover:underline">{r.nombre}</Link>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <Encabezado titulo={nodo.nombre}
        acciones={permisos.eliminar && (
          <Boton type="button" cargando={eliminando} textoCarga="Eliminando…" className={`${btnSmCls} text-danger hover:bg-danger-bg`} onClick={() => void eliminar()}>
            <Trash2 aria-hidden className="size-3.5" />Eliminar
          </Boton>
        )} />
      <div className="space-y-6">
        <Alerta texto={error} />
        <section aria-labelledby="h-det" className={`${panelCls} p-4`}>
          <h2 id="h-det" className="mb-3 text-[15px] font-semibold">Detalles</h2>
          {permisos.propio ? (
            <FormDetalles key={`${guid}:${nodo.nombre}:${nodo.descripcion ?? ''}`} nombre={nodo.nombre} descripcion={nodo.descripcion ?? ''}
              ok={guardado === guid ? 'Cambios guardados' : null}
              onEnviar={async (nombre, descripcion) => {
                setGuardado(null)
                // PUT de reemplazo: sin posicion para no mover el elemento.
                const r = await RECURSO[tipo].editar(guid, { nombre, descripcion })
                if (!r.ok) return errorDe(r, 'No se pudo guardar')
                setGuardado(guid)
                await recargarArbol()
                return null
              }} />
          ) : (
            <dl className="space-y-2 text-sm">
              <div><dt className="text-[13px] text-muted">Nombre</dt><dd>{nodo.nombre}</dd></div>
              {nodo.descripcion && <div><dt className="text-[13px] text-muted">Descripción</dt><dd className="whitespace-pre-line">{nodo.descripcion}</dd></div>}
            </dl>
          )}
          {tipo === 'workspace' && puede('workspacesGestionar') && (
            <Link to="/workspaces" className={`${btnSmCls} mt-4`}><Users aria-hidden className="size-3.5" />Gestionar miembros</Link>
          )}
        </section>
        <section aria-labelledby="h-hijos">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="h-hijos" className="text-[15px] font-semibold">{TITULO_HIJOS[tipo]}</h2>
            {permisos.hijo && !nuevo && (
              <button type="button" className={btnSmCls} onClick={() => setNuevo(true)}>
                <FolderPlus aria-hidden className="size-3.5" />Agregar {HIJO[tipo]}
              </button>
            )}
          </div>
          {nuevo && (
            <div className={`${panelCls} mb-3 p-4`}>
              <FormNombre compacto label={`Nombre del nuevo ${HIJO[tipo]}`} boton="Crear" textoCarga="Creando…" onCancelar={() => setNuevo(false)}
                onEnviar={async (n) => {
                  const r = await crear(n)
                  if (!r.ok) return errorDe(r, 'No se pudo crear')
                  await recargarArbol()
                  setNuevo(false)
                  return null
                }} />
            </div>
          )}
          {hijos.length === 0 ? (
            <p className="text-sm text-muted">{VACIO[tipo]}</p>
          ) : (
            <ul className={`${panelCls} divide-y divide-rule`}>
              {hijos.map((h) => (
                <li key={h.guid}>
                  <Link to={h.ruta} className="flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-raised">
                    <IconoHijo aria-hidden className="size-4 text-faint" />{h.nombre}
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
