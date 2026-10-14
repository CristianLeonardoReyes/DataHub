import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import * as auth from './api/auth'
import { useSesion } from './Sesion'

const inputCls =
  'w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 aria-[invalid=true]:border-red-400'
const btnCls =
  'w-full rounded bg-violet-500 px-3 py-2 font-medium text-white hover:bg-violet-400 focus-visible:ring-2 focus-visible:ring-violet-300 focus:outline-none disabled:opacity-50'
const linkCls = 'text-violet-300 underline hover:text-violet-200 focus-visible:ring-2 focus-visible:ring-violet-400 focus:outline-none'

function Tarjeta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 text-zinc-100">
      <div className="w-full max-w-sm space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
        <h1 className="text-xl font-semibold">Data Hub</h1>
        <h2 className="text-zinc-400">{titulo}</h2>
        {children}
      </div>
    </main>
  )
}

function Campo(p: { id: string; label: string; type?: string; value: string; onChange: (v: string) => void; invalido?: boolean; auto?: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={p.id} className="block text-sm text-zinc-300">{p.label}</label>
      <input id={p.id} type={p.type ?? 'text'} value={p.value} onChange={(e) => p.onChange(e.target.value)}
        required autoComplete={p.auto} aria-invalid={p.invalido || undefined} className={inputCls} />
    </div>
  )
}

const Alerta = ({ texto }: { texto: string | null }) =>
  texto ? <p role="alert" className="text-sm text-red-300">{texto}</p> : null

const MUCHOS = 'Demasiados intentos, espera un minuto'

export function Login() {
  const { recargar } = useSesion()
  const nav = useNavigate()
  const aviso = (useLocation().state as { aviso?: string } | null)?.aviso
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    const r = await auth.login({ correo, contrasena })
    if (r.ok) {
      await recargar()
      nav('/')
      return
    }
    setError(
      r.status === 429
        ? MUCHOS
        : r.status === 401
          ? (r.problema.detail ?? 'Correo o contraseña incorrectos.')
          : 'No se pudo iniciar sesión',
    )
    setEnviando(false)
  }

  return (
    <Tarjeta titulo="Inicia sesión">
      {aviso && <p role="status" className="text-sm text-emerald-300">{aviso}</p>}
      <form onSubmit={enviar} className="space-y-4">
        <Campo id="correo" label="Correo" type="email" auto="username" value={correo} onChange={setCorreo} invalido={!!error} />
        <Campo id="contrasena" label="Contraseña" type="password" auto="current-password" value={contrasena} onChange={setContrasena} invalido={!!error} />
        <Alerta texto={error} />
        <button type="submit" disabled={enviando} className={btnCls}>Entrar</button>
      </form>
      <Link to="/olvide-contrasena" className={linkCls}>¿Olvidaste tu contraseña?</Link>
    </Tarjeta>
  )
}

const ENLACE_INVALIDO = 'El enlace no es válido o ya venció'

// Formulario común de aceptar invitación (con nombre) y restablecer contraseña.
function FormContrasena({ titulo, conNombre, avisoOk, enviarApi }: {
  titulo: string
  conNombre: boolean
  avisoOk: string
  enviarApi: (token: string, nombre: string, contrasena: string) => Promise<auth.Resultado<void>>
}) {
  const token = useSearchParams()[0].get('token')
  const nav = useNavigate()
  const [nombre, setNombre] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (!token)
    return (
      <Tarjeta titulo={titulo}>
        <Alerta texto={ENLACE_INVALIDO} />
        <Link to="/login" className={linkCls}>Ir a iniciar sesión</Link>
      </Tarjeta>
    )

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (contrasena.length < 10) return setError('La contraseña debe tener al menos 10 caracteres')
    if (contrasena !== confirmar) return setError('Las contraseñas no coinciden')
    setEnviando(true)
    setError(null)
    const r = await enviarApi(token!, nombre, contrasena)
    if (r.ok) return nav('/login', { state: { aviso: avisoOk } })
    setError(r.status === 429 ? MUCHOS : r.status === 400 ? (r.problema.detail ?? ENLACE_INVALIDO) : 'No se pudo completar la acción')
    setEnviando(false)
  }

  return (
    <Tarjeta titulo={titulo}>
      <form onSubmit={enviar} className="space-y-4">
        {conNombre && <Campo id="nombre" label="Nombre" auto="name" value={nombre} onChange={setNombre} />}
        <Campo id="contrasena" label="Contraseña" type="password" auto="new-password" value={contrasena} onChange={setContrasena} invalido={!!error} />
        <Campo id="confirmar" label="Confirmar contraseña" type="password" auto="new-password" value={confirmar} onChange={setConfirmar} invalido={!!error} />
        <Alerta texto={error} />
        <button type="submit" disabled={enviando} className={btnCls}>Guardar</button>
      </form>
    </Tarjeta>
  )
}

export const AceptarInvitacion = () => (
  <FormContrasena titulo="Activa tu cuenta" conNombre avisoOk="Cuenta activada, inicia sesión"
    enviarApi={(token, nombre, contrasena) => auth.aceptarInvitacion({ token, nombre, contrasena })} />
)

export const RestablecerContrasena = () => (
  <FormContrasena titulo="Nueva contraseña" conNombre={false} avisoOk="Contraseña actualizada"
    enviarApi={(token, _n, contrasena) => auth.restablecerContrasena({ token, contrasena })} />
)

export function OlvideContrasena() {
  const [correo, setCorreo] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    const r = await auth.olvideContrasena({ correo })
    if (r.ok) setEnviado(true)
    else setError(r.status === 429 ? MUCHOS : 'No se pudo enviar la solicitud')
    setEnviando(false)
  }

  return (
    <Tarjeta titulo="Recupera tu contraseña">
      {enviado ? (
        <p role="status" className="text-sm text-emerald-300">Si el correo está registrado, te enviamos un enlace</p>
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          <Campo id="correo" label="Correo" type="email" auto="username" value={correo} onChange={setCorreo} />
          <Alerta texto={error} />
          <button type="submit" disabled={enviando} className={btnCls}>Enviar enlace</button>
        </form>
      )}
      <Link to="/login" className={linkCls}>Volver a iniciar sesión</Link>
    </Tarjeta>
  )
}

export function Inicio() {
  const { usuario, salir } = useSesion()
  const nav = useNavigate()
  if (!usuario) return null
  return (
    <Tarjeta titulo={`Hola, ${usuario.nombre}`}>
      <dl className="space-y-1 text-sm">
        <div><dt className="inline text-zinc-400">Correo: </dt><dd className="inline">{usuario.correo}</dd></div>
        <div><dt className="inline text-zinc-400">Perfil: </dt><dd className="inline">{usuario.perfil}</dd></div>
        <div><dt className="inline text-zinc-400">Cliente: </dt><dd className="inline">{usuario.cliente?.nombre ?? 'Super admin'}</dd></div>
      </dl>
      <button type="button" className={btnCls} onClick={async () => { await salir(); nav('/login') }}>Cerrar sesión</button>
    </Tarjeta>
  )
}
