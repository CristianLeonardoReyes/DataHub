import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import * as auth from './api/auth'
import * as apiClientes from './api/clientes'
import { Building2, Home, LoaderCircle, LogOut, Menu, Users, X } from 'lucide-react'
import { Alerta, Avatar, btnSmCls, inputCls } from './ui'

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
  const location = useLocation()
  if (cargando)
    return (
      <p className="flex min-h-screen items-center justify-center gap-2 bg-ground font-sans text-sm text-muted">
        <LoaderCircle aria-hidden className="size-4 animate-spin" />
        Cargando…
      </p>
    )
  return usuario ? children : <Navigate to="/login" replace state={{ from: location }} />
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
    <div className="space-y-2">
      <label htmlFor="operar-en" className="block text-xs text-muted">Operar en:</label>
      <div className="relative">
        <Building2 aria-hidden className="pointer-events-none absolute top-3 left-3 size-4 text-faint" />
        <select id="operar-en" className={`${inputCls} pl-9`} disabled={enviando}
          value={usuario?.cliente?.guid ?? ''} onChange={(e) => void elegir(e.target.value)}>
          <option value="">Ninguno (vista global)</option>
          {activos.map((c) => <option key={c.guid} value={c.guid}>{c.nombre}</option>)}
        </select>
      </div>
      {usuario?.cliente && (
        <p className="flex items-center gap-1.5 text-xs text-ok-ink">
          <span aria-hidden className="size-1.5 rounded-full bg-leaf" />
          Operando en {usuario.cliente.nombre}
        </p>
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
  `flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors ${
    isActive ? 'bg-active font-medium text-ink' : 'text-muted hover:bg-active/60 hover:text-ink'
  }`

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <img src="/logo-datahub.svg" alt="" className="logo-claro size-7" />
      <img src="/logo-datahub-oscuro.svg" alt="" className="logo-oscuro size-7" />
      <span className="text-[15px] font-semibold tracking-[-0.01em]">DataHub</span>
    </span>
  )
}

export function Layout() {
  const { usuario, puede, salir } = useSesion()
  const nav = useNavigate()
  const [abierto, setAbierto] = useState(false)
  if (!usuario) return null
  const verUsuarios = puede('usuariosGestionar') && (usuario.perfil !== 'super_admin' || !!usuario.cliente)
  const contexto = usuario.perfil === 'super_admin' ? 'DataGlobal · sin cliente' : usuario.cliente?.nombre
  return (
    <div className="min-h-screen bg-ground font-sans text-ink lg:flex">
      <aside className="border-b border-line bg-ground lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[248px] lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex h-14 items-center justify-between px-4">
          <Logo />
          <button type="button" className={`${btnSmCls} lg:hidden`} aria-expanded={abierto} aria-controls="menu"
            onClick={() => setAbierto(!abierto)}>
            {abierto ? <X aria-hidden className="size-4" /> : <Menu aria-hidden className="size-4" />}
            Menú
          </button>
        </div>
        <div id="menu" className={`${abierto ? 'flex' : 'hidden'} flex-col gap-5 px-3 pb-4 lg:flex lg:min-h-0 lg:flex-1`}>
          {usuario.perfil === 'super_admin' && <SelectorCliente />}
          <nav aria-label="Principal" className="flex flex-col gap-0.5" onClick={() => setAbierto(false)}>
            <NavLink to="/" end className={itemCls}><Home aria-hidden className="size-4" />Inicio</NavLink>
            {puede('clientesGestionar') && <NavLink to="/clientes" className={itemCls}><Building2 aria-hidden className="size-4" />Clientes</NavLink>}
            {verUsuarios && <NavLink to="/usuarios" className={itemCls}><Users aria-hidden className="size-4" />Usuarios</NavLink>}
          </nav>
          <div className="mt-auto border-t border-line pt-3">
            <div className="flex items-center gap-2.5 px-1 pb-3">
              <Avatar nombre={usuario.nombre} semilla={usuario.guid} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{usuario.nombre}</p>
                <p className="truncate text-xs text-muted">{PERFILES[usuario.perfil]}{contexto ? ` · ${contexto}` : ''}</p>
              </div>
            </div>
            <button type="button" className={`${btnSmCls} w-full`} onClick={async () => { await salir(); nav('/login') }}>
              <LogOut aria-hidden className="size-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 lg:pl-[248px]">
        <div className="mx-auto w-full max-w-[1200px] px-4 pt-6 pb-16 sm:px-6 lg:px-10 lg:pt-9"><Outlet /></div>
      </main>
    </div>
  )
}
