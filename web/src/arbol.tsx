import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Ellipsis, Pencil, Plus, Trash2, type LucideIcon } from 'lucide-react'
import * as api from './api/jerarquia'
import type { Resultado } from './api/http'
import { useSesion } from './Sesion'
import { errorDe, FormNombre } from './jerarquia-ui'
import { Alerta, Boton } from './ui'

type Ctx = {
  arbol: api.WorkspaceArbol[] | null
  error: boolean
  /** Sube con cada recarga: las pantallas que muestran datos del árbol lo usan para refrescarse. */
  version: number
  recargarArbol: () => Promise<void>
}
const ArbolCtx = createContext<Ctx | null>(null)

export function ArbolProvider({ children }: { children: ReactNode }) {
  const { usuario } = useSesion()
  // El Super admin sin cliente operando no tiene árbol (la API respondería 400).
  const sinCliente = usuario?.perfil === 'super_admin' && !usuario.cliente
  const clienteGuid = usuario?.cliente?.guid
  const [arbol, setArbol] = useState<api.WorkspaceArbol[] | null>(null)
  const [error, setError] = useState(false)
  const [version, setVersion] = useState(0)

  const pedido = useRef(0)
  const recargarArbol = useCallback(async () => {
    if (sinCliente) return
    const n = ++pedido.current
    const r = await api.arbol()
    if (n !== pedido.current) return // llegó tarde: ya hay un pedido más nuevo (p. ej. cambio de cliente)
    if (r.ok && Array.isArray(r.datos)) setArbol(r.datos)
    setError(!r.ok)
    setVersion((v) => v + 1)
  }, [sinCliente])

  useEffect(() => {
    setArbol(null)
    void recargarArbol()
  }, [recargarArbol, clienteGuid])

  return <ArbolCtx.Provider value={{ arbol, error, version, recargarArbol }}>{children}</ArbolCtx.Provider>
}

export function useArbol() {
  const c = useContext(ArbolCtx)
  if (!c) throw new Error('useArbol fuera de ArbolProvider')
  return c
}

type Tipo = 'workspace' | 'espacio' | 'coleccion' | 'pagina'
const HIJO: Record<Tipo, string> = { workspace: 'espacio', espacio: 'colección', coleccion: 'página', pagina: 'subpágina' }
const RECURSO = { workspace: api.workspaces, espacio: api.espacios, coleccion: api.colecciones }

type Accion = { clave: string; texto: string; icono: LucideIcon; peligro?: boolean; ejecutar: () => void }

type FilaProps = {
  tipo: Tipo
  guid: string
  nombre: string
  descripcion?: string | null
  indice: number
  total: number
  nivel: number
  /** Solo páginas: colección a la que pertenecen y página padre (null = raíz de la colección). */
  coleccionGuid?: string
  padreGuid?: string | null
  tieneHijos: boolean
  children?: ReactNode
}

function Fila(p: FilaProps) {
  const { puede } = useSesion()
  const { recargarArbol } = useArbol()
  const { pathname } = useLocation()
  const nav = useNavigate()
  const [abierto, setAbierto] = useState(true)
  const [menu, setMenu] = useState(false)
  const [editor, setEditor] = useState<'crear' | 'renombrar' | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const raiz = useRef<HTMLDivElement>(null)
  const botonMenu = useRef<HTMLButtonElement>(null)
  const lista = useRef<HTMLUListElement>(null)
  const porTeclado = useRef(false)

  const items = () => [...(lista.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? [])]
  useEffect(() => {
    if (menu && porTeclado.current) items()[0]?.focus()
    porTeclado.current = false
  }, [menu])
  function teclaMenu(e: React.KeyboardEvent) {
    const lis = items()
    const i = lis.indexOf(document.activeElement as HTMLElement)
    const ir = (n: number) => {
      e.preventDefault()
      lis[(n + lis.length) % lis.length]?.focus()
    }
    if (e.key === 'ArrowDown') ir(i + 1)
    else if (e.key === 'ArrowUp') ir(i < 0 ? -1 : i - 1)
    else if (e.key === 'Home') ir(0)
    else if (e.key === 'End') ir(-1)
    else if (e.key === 'Escape') {
      e.preventDefault()
      setMenu(false)
      botonMenu.current?.focus()
    } else if (e.key === 'Tab') {
      setMenu(false)
      botonMenu.current?.focus()
    }
  }

  useEffect(() => {
    if (!menu) return
    const fuera = (e: MouseEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setMenu(false)
    }
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false)
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', tecla)
    }
  }, [menu])

  // Solo UX: decide la API.
  const gestion = puede('espaciosColeccionesGestionar')
  const paginas = puede('paginasEditar')
  const permisos = {
    workspace: { hijo: gestion, propio: puede('workspacesGestionar'), eliminar: puede('workspacesGestionar') },
    espacio: { hijo: gestion, propio: gestion, eliminar: gestion },
    coleccion: { hijo: paginas, propio: gestion, eliminar: gestion },
    pagina: { hijo: paginas, propio: paginas, eliminar: puede('paginasEliminar') },
  }[p.tipo]

  const crear = (n: string) =>
    p.tipo === 'workspace' ? api.espacios.crear({ workspaceGuid: p.guid, nombre: n })
    : p.tipo === 'espacio' ? api.colecciones.crear({ espacioGuid: p.guid, nombre: n })
    : api.paginas.crear({
        coleccionGuid: p.tipo === 'coleccion' ? p.guid : p.coleccionGuid,
        paginaPadreGuid: p.tipo === 'pagina' ? p.guid : undefined,
        titulo: n,
      })
  // PUT de reemplazo: se reenvían descripción y padre actuales.
  const editar = (n: string, posicion?: number) =>
    p.tipo === 'pagina'
      ? api.paginas.editar(p.guid, { titulo: n, paginaPadreGuid: p.padreGuid ?? null, posicion })
      : RECURSO[p.tipo].editar(p.guid, { nombre: n, descripcion: p.descripcion ?? null, posicion })
  const eliminar = () => (p.tipo === 'pagina' ? api.paginas.eliminar(p.guid) : RECURSO[p.tipo].eliminar(p.guid))

  async function ejecutar(clave: string, f: () => Promise<Resultado<unknown>>, alTerminar?: () => void) {
    setOcupado(clave)
    setError(null)
    const r = await f()
    if (r.ok) {
      await recargarArbol()
      alTerminar?.()
    } else setError(errorDe(r, 'No se pudo completar la acción'))
    setOcupado(null)
    setMenu(false)
  }

  const abrirEditor = (e: 'crear' | 'renombrar') => {
    setEditor(e)
    setMenu(false)
  }
  const acciones = [
    permisos.hijo && { clave: 'crear', texto: `Agregar ${HIJO[p.tipo]}`, icono: Plus, ejecutar: () => abrirEditor('crear') },
    permisos.propio && { clave: 'renombrar', texto: 'Renombrar', icono: Pencil, ejecutar: () => abrirEditor('renombrar') },
    permisos.propio && p.indice > 0 && {
      clave: 'subir', texto: 'Subir', icono: ArrowUp,
      ejecutar: () => void ejecutar('subir', () => editar(p.nombre, p.indice - 1)),
    },
    permisos.propio && p.indice < p.total - 1 && {
      clave: 'bajar', texto: 'Bajar', icono: ArrowDown,
      ejecutar: () => void ejecutar('bajar', () => editar(p.nombre, p.indice + 1)),
    },
    permisos.eliminar && {
      clave: 'eliminar', texto: 'Eliminar', icono: Trash2, peligro: true,
      ejecutar: () => {
        const aviso = p.tipo === 'pagina' ? '' : ' Se eliminará todo lo que contiene.'
        if (window.confirm(`¿Eliminar "${p.nombre}"?${aviso}`))
          void ejecutar('eliminar', eliminar, () => p.tipo === 'pagina' && pathname.endsWith(`/paginas/${p.guid}`) && nav('/'))
        else setMenu(false)
      },
    },
  ].filter((a): a is Accion => !!a)

  const nombreCls = `min-w-0 flex-1 truncate text-left ${p.tipo === 'workspace' ? 'font-medium text-ink' : ''}`
  const Chevron = abierto ? ChevronDown : ChevronRight
  return (
    <li>
      <div ref={raiz} className="group relative flex items-center rounded-md text-sm hover:bg-active/60" style={{ paddingLeft: p.nivel * 12 }}>
        {p.tipo === 'pagina' ? (
          <>
            {p.tieneHijos ? (
              <button type="button" aria-expanded={abierto} aria-label={`${abierto ? 'Contraer' : 'Expandir'} ${p.nombre}`}
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-faint hover:text-ink" onClick={() => setAbierto(!abierto)}>
                <Chevron aria-hidden className="size-3.5" />
              </button>
            ) : <span aria-hidden className="size-7 shrink-0" />}
            <NavLink to={`/paginas/${p.guid}`}
              className={({ isActive }) => `${nombreCls} flex h-8 items-center rounded-md ${isActive ? 'bg-active font-medium text-ink' : 'text-muted hover:text-ink'}`}>
              <span className="truncate">{p.nombre}</span>
            </NavLink>
          </>
        ) : (
          <button type="button" aria-expanded={abierto} onClick={() => setAbierto(!abierto)}
            className={`flex h-8 min-w-0 flex-1 items-center gap-1 rounded-md ${p.tipo === 'workspace' ? '' : 'text-muted hover:text-ink'}`}>
            <span className="flex size-6 shrink-0 items-center justify-center text-faint"><Chevron aria-hidden className="size-3.5" /></span>
            <span className={nombreCls}>{p.nombre}</span>
          </button>
        )}
        {acciones.length > 0 && (
          <button type="button" aria-label={`Acciones de ${p.nombre}`} aria-expanded={menu} aria-haspopup="menu" ref={botonMenu}
            className="mr-0.5 flex size-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-active hover:text-ink aria-expanded:opacity-100 lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100"
            onClick={(e) => {
              porTeclado.current = e.detail === 0
              setMenu(!menu)
            }}>
            <Ellipsis aria-hidden className="size-4" />
          </button>
        )}
        {menu && (
          <ul ref={lista} role="menu" aria-label={`Acciones de ${p.nombre}`} onKeyDown={teclaMenu} className="absolute top-full right-0 z-20 mt-1 w-44 rounded-lg border border-line bg-surface p-1 shadow-lg">
            {acciones.map((a) => (
              <li key={a.clave} role="none">
                <Boton type="button" role="menuitem" tabIndex={-1} cargando={ocupado === a.clave} textoCarga={`${a.texto}…`} onClick={a.ejecutar}
                  className={`flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] hover:bg-raised ${a.peligro ? 'text-danger' : 'text-ink'}`}>
                  <a.icono aria-hidden className="size-3.5" />{a.texto}
                </Boton>
              </li>
            ))}
          </ul>
        )}
      </div>
      {(error || editor) && (
        <div className="py-1 pr-1" style={{ paddingLeft: p.nivel * 12 + 28 }}>
          <Alerta texto={error} />
          {editor && (
            <FormNombre compacto
              label={editor === 'crear' ? `Nombre del nuevo ${HIJO[p.tipo]}` : `Nuevo nombre de ${p.nombre}`}
              inicial={editor === 'renombrar' ? p.nombre : ''}
              boton={editor === 'crear' ? 'Crear' : 'Guardar'} textoCarga="Guardando…"
              onCancelar={() => setEditor(null)}
              onEnviar={async (n) => {
                const r = editor === 'crear' ? await crear(n) : await editar(n)
                if (!r.ok) return errorDe(r, 'No se pudo guardar')
                await recargarArbol()
                setAbierto(true)
                setEditor(null)
                return null
              }} />
          )}
        </div>
      )}
      {abierto && p.tieneHijos && p.children}
    </li>
  )
}

function Paginas({ lista, coleccionGuid, padreGuid, nivel }: { lista: api.PaginaArbol[]; coleccionGuid: string; padreGuid: string | null; nivel: number }) {
  return (
    <ul>
      {lista.map((pg, i) => (
        <Fila key={pg.guid} tipo="pagina" guid={pg.guid} nombre={pg.titulo} indice={i} total={lista.length} nivel={nivel}
          coleccionGuid={coleccionGuid} padreGuid={padreGuid} tieneHijos={pg.paginas.length > 0}>
          <Paginas lista={pg.paginas} coleccionGuid={coleccionGuid} padreGuid={pg.guid} nivel={nivel + 1} />
        </Fila>
      ))}
    </ul>
  )
}

/** Árbol Workspace → Espacio → Colección → Páginas del menú lateral. */
export function MenuArbol({ alNavegar }: { alNavegar: () => void }) {
  const { usuario, puede } = useSesion()
  const { arbol, error } = useArbol()
  if (usuario?.perfil === 'super_admin' && !usuario.cliente) return null
  return (
    <nav aria-label="Contenido" onClick={(e) => (e.target as HTMLElement).closest('a') && alNavegar()}>
      <h2 className="px-2.5 pb-1 text-xs font-medium text-muted">Contenido</h2>
      {arbol === null ? (
        <p className="px-2.5 text-[13px] text-muted">{error ? 'No se pudo cargar el contenido' : 'Cargando…'}</p>
      ) : arbol.length === 0 ? (
        <div className="space-y-1 px-2.5 text-[13px] text-muted">
          <p>Aún no hay workspaces</p>
          {puede('workspacesGestionar') && <Link to="/workspaces" className="font-medium text-brand-text hover:underline">Crear workspace</Link>}
        </div>
      ) : (
        <ul>
          {arbol.map((w, i) => (
            <Fila key={w.guid} tipo="workspace" guid={w.guid} nombre={w.nombre} descripcion={w.descripcion} indice={i} total={arbol.length} nivel={0} tieneHijos={w.espacios.length > 0}>
              <ul>
                {w.espacios.map((e, j) => (
                  <Fila key={e.guid} tipo="espacio" guid={e.guid} nombre={e.nombre} descripcion={e.descripcion} indice={j} total={w.espacios.length} nivel={1} tieneHijos={e.colecciones.length > 0}>
                    <ul>
                      {e.colecciones.map((c, k) => (
                        <Fila key={c.guid} tipo="coleccion" guid={c.guid} nombre={c.nombre} descripcion={c.descripcion} indice={k} total={e.colecciones.length} nivel={2} tieneHijos={c.paginas.length > 0}>
                          <Paginas lista={c.paginas} coleccionGuid={c.guid} padreGuid={null} nivel={3} />
                        </Fila>
                      ))}
                    </ul>
                  </Fila>
                ))}
              </ul>
            </Fila>
          ))}
        </ul>
      )}
    </nav>
  )
}
