import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import * as auth from './api/auth'
import { useSesion } from './Sesion'
import { Alerta, btnCls, Campo, linkCls, Tarjeta } from './ui'

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
  const { usuario } = useSesion()
  if (!usuario) return null
  return (
    <section className="space-y-2">
      <h1 className="text-xl font-semibold">Hola, {usuario.nombre}</h1>
      <p className="text-sm text-zinc-400">Bienvenido a Data Hub.</p>
    </section>
  )
}
