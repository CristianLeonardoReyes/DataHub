import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router'
import * as auth from './api/auth'
import { btnSmCls } from './ui'

export type Permiso =
  | 'clientesGestionar' | 'usuariosGestionar' | 'workspacesAsignarUsuarios' | 'workspacesGestionar'
  | 'espaciosColeccionesGestionar' | 'paginasEditar' | 'paginasEliminar' | 'metadataEditar'
  | 'paginasAprobar' | 'archivosGestionar' | 'archivosEliminar' | 'buscar' | 'exportarMarkdown'

type Ctx = { usuario: auth.UsuarioActual | null; cargando: boolean; puede: (p: Permiso) => boolean; recargar: () => Promise<void>; salir: () => Promise<void> }
const SesionCtx = createContext<Ctx | null>(null)

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<auth.UsuarioActual | null>(null)
  const [cargando, setCargando] = useState(true)

  const recargar = useCallback(async () => {
    const r = await auth.me()
    setUsuario(r.ok ? r.datos : null)
    setCargando(false)
  }, [])
  const salir = useCallback(async () => {
    await auth.logout()
    setUsuario(null)
  }, [])

  // Solo UX: decide el backend.
  const puede = useCallback((p: Permiso) => !!usuario?.permisos.includes(p), [usuario])

  useEffect(() => {
    void recargar()
  }, [recargar])

  return <SesionCtx.Provider value={{ usuario, cargando, puede, recargar, salir }}>{children}</SesionCtx.Provider>
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
  const { puede } = useSesion()
  return puede(permiso) ? children : <Navigate to="/" replace />
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
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-4 py-3 text-sm">
          <div>
            <span className="font-medium">{usuario.nombre}</span>
            <span className="text-zinc-400"> · {PERFILES[usuario.perfil]}{usuario.cliente ? ` · ${usuario.cliente.nombre}` : ''}</span>
          </div>
          <button type="button" className={btnSmCls} onClick={async () => { await salir(); nav('/login') }}>Cerrar sesión</button>
        </header>
        <main className="flex-1 p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  )
}
