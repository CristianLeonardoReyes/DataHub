import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import * as auth from './api/auth'
import * as apiClientes from './api/clientes'
import { alCambiarExpira, alNoAutorizado } from './api/http'
import { Building2, Home, LoaderCircle, LogIn, LogOut, Menu, Moon, Sun, TriangleAlert, Users, X } from 'lucide-react'
import { Alerta, Avatar, Boton, btnCls, btnSmCls, inputCls } from './ui'

export type Permiso =
  | 'clientesGestionar' | 'usuariosGestionar' | 'workspacesAsignarUsuarios' | 'workspacesGestionar'
  | 'espaciosColeccionesGestionar' | 'paginasEditar' | 'paginasEliminar' | 'metadataEditar'
  | 'paginasAprobar' | 'archivosGestionar' | 'archivosEliminar' | 'buscar' | 'exportarMarkdown'

type Ctx = { usuario: auth.UsuarioActual | null; cargando: boolean; sesionExpirada: boolean; sesionTerminada: () => void; puede: (p: Permiso) => boolean; recargar: () => Promise<void>; versionClientes: number; clientesCambiaron: () => Promise<void>; salir: () => Promise<void> }
const SesionCtx = createContext<Ctx | null>(null)

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<auth.UsuarioActual | null>(null)
  const [cargando, setCargando] = useState(true)
  const [sesionExpirada, setSesionExpirada] = useState(false)
  const [versionClientes, setVersion] = useState(0)

  const recargar = useCallback(async () => {
    const r = await auth.me()
    setUsuario(r.ok ? r.datos : null)
    if (r.ok) setSesionExpirada(false)
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
    setSesionExpirada(false)
    setUsuario(null)
  }, [])
  // Tras pulsar "Iniciar sesión" en el modal: suelta al usuario para que el login no lo devuelva.
  const sesionTerminada = useCallback(() => {
    setSesionExpirada(false)
    setUsuario(null)
  }, [])

  // Solo UX: decide el backend.
  const puede = useCallback((p: Permiso) => !!usuario?.permisos.includes(p), [usuario])

  useEffect(() => {
    void recargar()
  }, [recargar])

  // Un 401 en una llamada autenticada: la cookie ya no vale. Varios 401 seguidos dejan el mismo estado.
  useEffect(
    () => alNoAutorizado(() => {
      setSesionExpirada(true)
    }),
    [],
  )

  // Cada respuesta trae el vencimiento vigente; si la API renovó, se mueve el temporizador.
  useEffect(
    () => alCambiarExpira((exp) =>
      setUsuario((u) => (u && new Date(u.sesionExpira).getTime() !== new Date(exp).getTime() ? { ...u, sesionExpira: exp } : u))),
    [],
  )

  // Vencimiento de la sesión; se reprograma cuando la API la renueva.
  const expira = usuario?.sesionExpira
  useEffect(() => {
    if (!expira) return
    const ms = Math.min(Math.max(new Date(expira).getTime() - Date.now(), 0), 2 ** 31 - 1)
    const t = setTimeout(() => setSesionExpirada(true), ms)
    return () => clearTimeout(t)
  }, [expira])

  return <SesionCtx.Provider value={{ usuario, cargando, sesionExpirada, sesionTerminada, puede, recargar, versionClientes, clientesCambiaron, salir }}>{children}</SesionCtx.Provider>
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
  if (usuario) return <><ContenidoSesion>{children}</ContenidoSesion><ModalSesionExpirada /></>
  return <Navigate to="/login" replace state={{ from: location }} />
}

function ContenidoSesion({ children }: { children: ReactNode }) {
  const { sesionExpirada } = useSesion()
  return <div inert={sesionExpirada}>{children}</div>
}

function ModalSesionExpirada() {
  const { sesionExpirada, sesionTerminada } = useSesion()
  const location = useLocation()
  const nav = useNavigate()
  const boton = useRef<HTMLButtonElement>(null)

  const ir = useCallback(() => {
    nav('/login', { replace: true, state: { from: { pathname: location.pathname, search: location.search } } })
    sesionTerminada()
  }, [nav, location.pathname, location.search, sesionTerminada])

  useEffect(() => {
    if (!sesionExpirada) return
    boton.current?.focus()
    // El botón es lo único enfocable: Tab no puede sacar el foco del diálogo.
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') ir()
      else if (e.key === 'Tab') {
        e.preventDefault()
        boton.current?.focus()
      }
    }
    document.addEventListener('keydown', tecla)
    return () => document.removeEventListener('keydown', tecla)
  }, [sesionExpirada, ir])

  if (!sesionExpirada) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-[12vh] [animation:fade_140ms_ease-out]">
      <div role="dialog" aria-modal="true" aria-labelledby="sesion-exp-t" aria-describedby="sesion-exp-d"
        className="w-full max-w-[480px] rounded-xl border border-line bg-surface font-sans text-ink shadow-2xl [animation:rise_180ms_cubic-bezier(.16,1,.3,1)]">
        <div className="flex items-center justify-center gap-2 border-b border-rule px-5 py-4">
          <img src="/logo-datahub.svg" alt="" className="logo-claro size-6" />
          <img src="/logo-datahub-oscuro.svg" alt="" className="logo-oscuro size-6" />
          <span className="text-[15px] font-semibold tracking-[-0.01em]">DataHub</span>
        </div>
        <div className="flex flex-col items-center gap-3 px-5 pt-6 pb-5 text-center">
          <span aria-hidden className="flex size-11 items-center justify-center rounded-full bg-review-bg text-review-ink">
            <TriangleAlert className="size-5" />
          </span>
          <h2 id="sesion-exp-t" className="text-[17px] font-semibold">Tu sesión expiró</h2>
          <p id="sesion-exp-d" className="text-sm text-muted">
            Por seguridad, cerramos tu sesión. Inicia sesión de nuevo para continuar.
          </p>
        </div>
        <div className="px-5 pb-5">
          <button ref={boton} type="button" className={btnCls} onClick={ir}>
            <LogIn aria-hidden className="size-4" />
            Iniciar sesión
          </button>
        </div>
      </div>
    </div>
  )
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
        <select id="operar-en" className={`${inputCls} pl-9`} disabled={enviando} aria-busy={enviando}
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

/** Alterna claro/oscuro y recuerda la preferencia en este navegador (index.html la aplica antes de pintar). */
function BotonTema() {
  const [oscuro, setOscuro] = useState(() => document.documentElement.dataset.theme === 'dark') // por defecto claro
  const cambiar = () => {
    const tema = oscuro ? 'light' : 'dark'
    document.documentElement.dataset.theme = tema
    try { localStorage.setItem('datahub-tema', tema) } catch { /* sin almacenamiento: dura hasta recargar */ }
    setOscuro(!oscuro)
  }
  return (
    <button type="button" className={`${btnSmCls} px-2`} onClick={cambiar}
      aria-label={oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'} title={oscuro ? 'Tema claro' : 'Tema oscuro'}>
      {oscuro ? <Sun aria-hidden className="size-4" /> : <Moon aria-hidden className="size-4" />}
    </button>
  )
}

export function Layout() {
  const { usuario, puede, salir } = useSesion()
  const nav = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const [saliendo, setSaliendo] = useState(false)
  if (!usuario) return null
  const verUsuarios = puede('usuariosGestionar') && (usuario.perfil !== 'super_admin' || !!usuario.cliente)
  const contexto = usuario.perfil === 'super_admin' ? 'DataGlobal · sin cliente' : usuario.cliente?.nombre
  return (
    <div className="min-h-screen bg-ground font-sans text-ink lg:flex">
      <aside className="border-b border-line bg-ground lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[248px] lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex h-14 items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-2">
            <BotonTema />
            <button type="button" className={`${btnSmCls} lg:hidden`} aria-expanded={abierto} aria-controls="menu"
              onClick={() => setAbierto(!abierto)}>
              {abierto ? <X aria-hidden className="size-4" /> : <Menu aria-hidden className="size-4" />}
              Menú
            </button>
          </div>
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
            <Boton type="button" className={`${btnSmCls} w-full`} cargando={saliendo} textoCarga="Cerrando…"
              onClick={async () => { setSaliendo(true); await salir(); nav('/login') }}>
              <LogOut aria-hidden className="size-4" />
              Cerrar sesión
            </Boton>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 lg:pl-[248px]">
        <div className="mx-auto w-full max-w-[1200px] px-4 pt-6 pb-16 sm:px-6 lg:px-10 lg:pt-9"><Outlet /></div>
      </main>
    </div>
  )
}
