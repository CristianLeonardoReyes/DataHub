import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router'
import * as auth from './api/auth'
import * as apiClientes from './api/clientes'
import { Alerta, btnSmCls, inputCls } from './ui'

export type Permiso =
  | 'clientesGestionar' | 'usuariosGestionar' | 'workspacesAsignarUsuarios' | 'workspacesGestionar'
  | 'espaciosColeccionesGestionar' | 'paginasEditar' | 'paginasEliminar' | 'metadataEditar'
  | 'paginasAprobar' | 'archivosGestionar' | 'archivosEliminar' | 'buscar' | 'exportarMarkdown'

type Ctx = { usuario: auth.UsuarioActual | null; cargando: boolean; puede: (p: Permiso) => boolean; recargar: () => Promise<void>; versionClientes: number; clientesCambiaron: () => Promise<void>; salir: () => Promise<void> }
const SesionCtx = createContext<Ctx | null>(null)

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<auth.UsuarioActual | null>(null)
  const [cargando, setCargando] = useState(true)
  const [versionClientes, setVersion] = useState(0)

  const recargar = useCallback(async () => {
    const r = await auth.me()
    setUsuario(r.ok ? r.datos : null)
    setCargando(false)
  }, [])
  // Tras crear/editar/(des)activar un cliente: refresca el selector del Super admin y la sesión
  // (si desactivas el cliente en el que operas, el backend te deja sin cliente).
  const clientesCambiaron = useCallback(async () => {
    setVersion((v) => v + 1)
    await recargar()
  }, [recargar])
  const salir = useCallback(async () => {
    await auth.logout()
    setUsuario(null)
  }, [])

  // Solo UX: decide el backend.
  const puede = useCallback((p: Permiso) => !!usuario?.permisos.includes(p), [usuario])

  useEffect(() => {
    void recargar()
  }, [recargar])

  return <SesionCtx.Provider value={{ usuario, cargando, puede, recargar, versionClientes, clientesCambiaron, salir }}>{children}</SesionCtx.Provider>
}

export function useSesion() {
  const c = useContext(SesionCtx)
  if (!c) throw new Error('useSesion fuera de SesionProvider')
  return c
}

export function Protegida({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useSesion()
  if (cargando) return <p className="p-8 text-zinc-400">Cargando…</p>
  return usuario ? children : <Navigate to="/login" replace />
}

export function RequierePermiso({ permiso, children }: { permiso: Permiso; children: ReactNode }) {
  const { puede, usuario } = useSesion()
  // Usuarios: el Super admin solo opera dentro de un cliente.
  const ok = puede(permiso) && !(permiso === 'usuariosGestionar' && usuario?.perfil === 'super_admin' && !usuario.cliente)
  return ok ? children : <Navigate to="/" replace />
}

function SelectorCliente() {
  const { usuario, recargar, versionClientes } = useSesion()
  const nav = useNavigate()
  const [activos, setActivos] = useState<apiClientes.Cliente[]>([])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void apiClientes.listar().then((r) => {
      if (r.ok) setActivos(r.datos.filter((c) => c.activo).sort((a, b) => a.nombre.localeCompare(b.nombre)))
    })
  }, [versionClientes])

  async function elegir(guid: string) {
    setEnviando(true)
    setError(null)
    const r = await auth.clienteOperando(guid || null)
    if (r.ok) {
      await recargar()
      nav('/')
    } else setError(r.problema.detail ?? 'No se pudo cambiar de cliente') // el select es controlado: vuelve al valor anterior
    setEnviando(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="operar-en" className="text-zinc-300">Operar en:</label>
      <select id="operar-en" className={`${inputCls} w-auto py-1`} disabled={enviando}
        value={usuario?.cliente?.guid ?? ''} onChange={(e) => void elegir(e.target.value)}>
        <option value="">Ninguno (vista global)</option>
        {activos.map((c) => <option key={c.guid} value={c.guid}>{c.nombre}</option>)}
      </select>
      {usuario?.cliente && (
        <span className="rounded bg-violet-500/20 px-2 py-0.5 text-xs text-violet-200">Operando en {usuario.cliente.nombre}</span>
      )}
      <Alerta texto={error} />
    </div>
  )
}

const PERFILES: Record<auth.UsuarioActual['perfil'], string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  coordinador: 'Coordinador',
  colaborador: 'Colaborador',
}

const itemCls = ({ isActive }: { isActive: boolean }) =>
  `block rounded px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-violet-400 focus:outline-none ${
    isActive ? 'bg-violet-500/20 text-violet-200' : 'text-zinc-300 hover:bg-zinc-800'
  }`

export function Layout() {
  const { usuario, puede, salir } = useSesion()
  const nav = useNavigate()
  const [abierto, setAbierto] = useState(false)
  if (!usuario) return null
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 md:flex-row">
      <aside className="border-b border-zinc-800 bg-zinc-900/60 md:w-56 md:border-r md:border-b-0">
        <div className="flex items-center justify-between p-4">
          <span className="text-lg font-semibold">Data Hub</span>
          <button type="button" className={`${btnSmCls} md:hidden`} aria-expanded={abierto} aria-controls="menu"
            onClick={() => setAbierto(!abierto)}>Menú</button>
        </div>
        <nav id="menu" aria-label="Principal" className={`${abierto ? 'block' : 'hidden'} space-y-1 px-2 pb-4 md:block`}
          onClick={() => setAbierto(false)}>
          <NavLink to="/" end className={itemCls}>Inicio</NavLink>
          {puede('clientesGestionar') && <NavLink to="/clientes" className={itemCls}>Clientes</NavLink>}
          {puede('usuariosGestionar') && (usuario.perfil !== 'super_admin' || usuario.cliente) && <NavLink to="/usuarios" className={itemCls}>Usuarios</NavLink>}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-4 py-3 text-sm">
          <div>
            <span className="font-medium">{usuario.nombre}</span>
            <span className="text-zinc-400"> · {PERFILES[usuario.perfil]}{usuario.perfil !== 'super_admin' && usuario.cliente ? ` · ${usuario.cliente.nombre}` : ''}</span>
          </div>
          {usuario.perfil === 'super_admin' && <SelectorCliente />}
          <button type="button" className={btnSmCls} onClick={async () => { await salir(); nav('/login') }}>Cerrar sesión</button>
        </header>
        <main className="flex-1 p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  )
}
