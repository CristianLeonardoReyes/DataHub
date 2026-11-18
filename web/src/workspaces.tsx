import { useEffect, useId, useState, type FormEvent } from 'react'
import { Layers, Pencil, Plus, Trash2, UserCog } from 'lucide-react'
import * as api from './api/jerarquia'
import { useArbol } from './arbol'
import { errorDe } from './jerarquia-ui'
import { useSesion } from './Sesion'
import { Alerta, AvisoOk, Boton, btnCls, btnSmCls, Campo, Encabezado, inputCls, panelCls } from './ui'

const PERFIL = { coordinador: 'Coordinador', colaborador: 'Colaborador' } as Record<string, string>

function FormWorkspace(p: {
  inicial?: { nombre: string; descripcion: string | null }
  boton: string
  onEnviar: (nombre: string, descripcion: string | null) => Promise<string | null>
  onCancelar: () => void
}) {
  const id = useId()
  const [nombre, setNombre] = useState(p.inicial?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(p.inicial?.descripcion ?? '')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('Escribe un nombre')
      return
    }
    setEnviando(true)
    setError(await p.onEnviar(nombre.trim(), descripcion.trim() || null))
    setEnviando(false)
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      <Campo id={`${id}-n`} label="Nombre" value={nombre} onChange={setNombre} />
      <div className="space-y-2">
        <label htmlFor={`${id}-d`} className="block text-sm font-medium">Descripción (opcional)</label>
        <input id={`${id}-d`} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={inputCls} />
      </div>
      <Alerta texto={error} />
      <div className="flex gap-2">
        <Boton type="submit" cargando={enviando} textoCarga="Guardando…" className={`${btnCls} w-auto`}>{p.boton}</Boton>
        <button type="button" className={`${btnSmCls} h-10 px-4`} onClick={p.onCancelar}>Cancelar</button>
      </div>
    </form>
  )
}

function Miembros({ ws, onListo }: { ws: api.WorkspaceArbol; onListo: (aviso: string | null) => void }) {
  const [lista, setLista] = useState<api.Miembro[] | null>(null)
  const [marcados, setMarcados] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    void api.miembros(ws.guid).then((r) => {
      if (!r.ok) return setError(errorDe(r, 'No se pudo cargar la lista de personas'))
      // Los Admin ven todos los workspaces: no se asignan.
      const asignables = r.datos.filter((m) => m.perfil === 'coordinador' || m.perfil === 'colaborador')
      setLista(asignables)
      setMarcados(new Set(asignables.filter((m) => m.asignado).map((m) => m.guid)))
    })
  }, [ws.guid])

  const alternar = (guid: string) =>
    setMarcados((s) => {
      const n = new Set(s)
      if (!n.delete(guid)) n.add(guid)
      return n
    })

  async function guardar() {
    setEnviando(true)
    setError(null)
    const r = await api.asignarMiembros(ws.guid, { usuarios: [...marcados] })
    if (r.ok) return onListo(`Miembros de "${ws.nombre}" actualizados`)
    setError(errorDe(r, 'No se pudieron guardar los miembros'))
    setEnviando(false)
  }

  return (
    <fieldset className="space-y-3 border-t border-rule px-4 py-4">
      <legend className="sr-only">Miembros de {ws.nombre}</legend>
      <p className="text-[13px] text-muted">
        Elige quiénes (coordinadores y colaboradores) acceden a este workspace. Los Admin ven todos los workspaces y no se asignan.
      </p>
      {lista === null ? (
        !error && <p className="text-sm text-muted">Cargando…</p>
      ) : lista.length === 0 ? (
        <p className="text-sm text-muted">No hay coordinadores ni colaboradores en este cliente.</p>
      ) : (
        <ul className="grid gap-1 sm:grid-cols-2">
          {lista.map((m) => (
            <li key={m.guid}>
              <label className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-raised">
                <input type="checkbox" checked={marcados.has(m.guid)} onChange={() => alternar(m.guid)} className="size-4 accent-brand" />
                <span className="min-w-0 flex-1 truncate">{m.nombre} <span className="text-[13px] text-muted">· {m.correo}</span></span>
                <span className="text-xs text-faint">{PERFIL[m.perfil]}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <Alerta texto={error} />
      <div className="flex gap-2">
        {lista && <Boton type="button" cargando={enviando} textoCarga="Guardando…" className={btnSmCls} onClick={() => void guardar()}>Guardar miembros</Boton>}
        <button type="button" className={btnSmCls} onClick={() => onListo(null)}>Cerrar</button>
      </div>
    </fieldset>
  )
}

export function Workspaces() {
  const { arbol, recargarArbol } = useArbol()
  const { puede } = useSesion()
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [miembros, setMiembros] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  async function eliminar(w: api.WorkspaceArbol) {
    if (!window.confirm(`¿Eliminar "${w.nombre}"? Se eliminarán todos sus espacios, colecciones y páginas.`)) return
    setEliminando(w.guid)
    setError(null)
    setAviso(null)
    const r = await api.workspaces.eliminar(w.guid)
    if (r.ok) await recargarArbol()
    else setError(errorDe(r, 'No se pudo eliminar el workspace'))
    setEliminando(null)
  }

  return (
    <section>
      <Encabezado titulo="Workspaces" linea="Agrupan los espacios, colecciones y páginas de un equipo."
        acciones={!creando && (
          <button type="button" className={`${btnCls} w-auto`} onClick={() => { setCreando(true); setAviso(null) }}>
            <Plus aria-hidden className="size-4" />Nuevo workspace
          </button>
        )} />
      <div className="space-y-4">
        <AvisoOk texto={aviso} />
        <Alerta texto={error} />
        {creando && (
          <div className={`${panelCls} max-w-[560px] p-6`}>
            <FormWorkspace boton="Crear workspace" onCancelar={() => setCreando(false)}
              onEnviar={async (nombre, descripcion) => {
                const r = await api.workspaces.crear({ nombre, descripcion })
                if (!r.ok) return errorDe(r, 'No se pudo crear el workspace')
                await recargarArbol()
                setCreando(false)
                setAviso(`Workspace "${nombre}" creado`)
                return null
              }} />
          </div>
        )}
        {arbol === null ? (
          <p className="text-sm text-muted">Cargando…</p>
        ) : arbol.length === 0 ? (
          <div className={`${panelCls} flex flex-col items-center gap-3 px-6 py-12 text-center`}>
            <Layers aria-hidden className="size-6 text-faint" />
            <p className="text-sm text-muted">Aún no hay workspaces</p>
          </div>
        ) : (
          <ul className={`${panelCls} divide-y divide-rule`}>
            {arbol.map((w) => (
              <li key={w.guid}>
                {editando === w.guid ? (
                  <div className="max-w-[560px] p-4">
                    <FormWorkspace inicial={w} boton="Guardar cambios" onCancelar={() => setEditando(null)}
                      onEnviar={async (nombre, descripcion) => {
                        const r = await api.workspaces.editar(w.guid, { nombre, descripcion })
                        if (!r.ok) return errorDe(r, 'No se pudo guardar el workspace')
                        await recargarArbol()
                        setEditando(null)
                        return null
                      }} />
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{w.nombre}</p>
                      <p className="truncate text-[13px] text-muted">
                        {w.descripcion ? `${w.descripcion} · ` : ''}{w.espacios.length} {w.espacios.length === 1 ? 'espacio' : 'espacios'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {puede('workspacesAsignarUsuarios') && (
                        <button type="button" className={btnSmCls} aria-label={`Miembros de ${w.nombre}`} aria-expanded={miembros === w.guid}
                          onClick={() => setMiembros(miembros === w.guid ? null : w.guid)}>
                          <UserCog aria-hidden className="size-3.5" />Miembros
                        </button>
                      )}
                      <button type="button" className={btnSmCls} aria-label={`Editar ${w.nombre}`} onClick={() => { setEditando(w.guid); setAviso(null) }}>
                        <Pencil aria-hidden className="size-3.5" />Editar
                      </button>
                      <Boton type="button" cargando={eliminando === w.guid} textoCarga="Eliminando…" className={`${btnSmCls} text-danger hover:bg-danger-bg`}
                        aria-label={`Eliminar ${w.nombre}`} onClick={() => void eliminar(w)}>
                        <Trash2 aria-hidden className="size-3.5" />Eliminar
                      </Boton>
                    </div>
                  </div>
                )}
                {miembros === w.guid && editando !== w.guid && (
                  <Miembros ws={w} onListo={(a) => { setMiembros(null); if (a) setAviso(a) }} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
