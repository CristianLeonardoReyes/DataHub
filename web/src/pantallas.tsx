import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'
import { Lock, Mail, User } from 'lucide-react'
import * as auth from './api/auth'
import { useSesion } from './Sesion'
import { Aviso, BotonAcceso, CampoAcceso, InsigniaInvitacion, linkAccesoCls, PantallaAcceso } from './acceso-ui'

const MUCHOS = 'Demasiados intentos, espera un minuto'
const SIN_CONEXION = 'No pudimos conectar con el servidor. Intenta de nuevo en unos minutos.'

type Origen = { pathname?: string; search?: string }

// Solo rutas internas: evita redirecciones abiertas.
function destinoInterno(from?: Origen) {
  const ruta = from?.pathname
  return ruta && ruta.startsWith('/') && !ruta.startsWith('//') ? ruta + (from?.search ?? '') : '/'
}

export function Login() {
  const { usuario, cargando, recargar } = useSesion()
  const state = useLocation().state as { aviso?: string; from?: Origen } | null
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (cargando) return <main className="min-h-screen bg-ground" />
  if (usuario) return <Navigate to={destinoInterno(state?.from)} replace />

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    const r = await auth.login({ correo, contrasena })
    if (r.ok) {
      await recargar() // con la sesión cargada, el redirect de arriba lleva al destino
      return
    }
    setError(
      r.status === 429
        ? MUCHOS
        : r.status === 401
          ? (r.problema.detail ?? 'Correo o contraseña incorrectos.')
          : r.status === 0 || r.status >= 500
            ? SIN_CONEXION
            : 'No se pudo iniciar sesión',
    )
    setEnviando(false)
  }

  return (
    <PantallaAcceso titulo="Inicia sesión" subtitulo="Plataforma de documentación técnica">
      {state?.aviso && <Aviso tipo="ok">{state.aviso}</Aviso>}
      <form onSubmit={enviar} className="space-y-4">
        <CampoAcceso id="correo" label="Correo corporativo" type="email" auto="username" icono={Mail} value={correo} onChange={setCorreo} invalido={!!error} />
        <CampoAcceso id="contrasena" label="Contraseña" type="password" auto="current-password" icono={Lock} value={contrasena} onChange={setContrasena} invalido={!!error}
          accion={<Link to="/olvide-contrasena" className={linkAccesoCls}>¿Olvidaste tu contraseña?</Link>} />
        {error && <Aviso tipo="error">{error}</Aviso>}
        <BotonAcceso cargando={enviando} textoCarga="Entrando…">Entrar</BotonAcceso>
      </form>
      <InsigniaInvitacion />
    </PantallaAcceso>
  )
}

const ENLACE_INVALIDO = 'El enlace no es válido o ya venció'

// Formulario común de aceptar invitación (con nombre) y restablecer contraseña.
function FormContrasena({ titulo, subtitulo, conNombre, textoBoton, textoCarga, avisoOk, enviarApi }: {
  titulo: string
  subtitulo: string
  conNombre: boolean
  textoBoton: string
  textoCarga: string
  avisoOk: string
  enviarApi: (token: string, nombre: string, contrasena: string) => Promise<auth.Resultado<void>>
}) {
  const token = useSearchParams()[0].get('token')
  const nav = useNavigate()
  const [nombre, setNombre] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [errorClave, setErrorClave] = useState<string | null>(null)
  const [errorConfirmar, setErrorConfirmar] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (!token)
    return (
      <PantallaAcceso titulo={titulo} subtitulo={subtitulo}>
        <Aviso tipo="error">{ENLACE_INVALIDO}</Aviso>
        <Link to="/login" className={linkAccesoCls}>Ir a iniciar sesión</Link>
      </PantallaAcceso>
    )

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErrorClave(null)
    setErrorConfirmar(null)
    setError(null)
    if (contrasena.length < 10) return setErrorClave('La contraseña debe tener al menos 10 caracteres')
    if (contrasena !== confirmar) return setErrorConfirmar('Las contraseñas no coinciden')
    setEnviando(true)
    const r = await enviarApi(token!, nombre, contrasena)
    if (r.ok) return nav('/login', { state: { aviso: avisoOk } })
    setError(r.status === 429 ? MUCHOS : r.status === 400 ? (r.problema.detail ?? ENLACE_INVALIDO) : 'No se pudo completar la acción')
    setEnviando(false)
  }

  return (
    <PantallaAcceso titulo={titulo} subtitulo={subtitulo}>
      <form onSubmit={enviar} className="space-y-4">
        {conNombre && <CampoAcceso id="nombre" label="Nombre" auto="name" icono={User} value={nombre} onChange={setNombre} />}
        <CampoAcceso id="contrasena" label="Contraseña" type="password" auto="new-password" icono={Lock} value={contrasena} onChange={setContrasena}
          ayuda="Mínimo 10 caracteres" error={errorClave} />
        <CampoAcceso id="confirmar" label="Confirmar contraseña" type="password" auto="new-password" icono={Lock} value={confirmar} onChange={setConfirmar}
          error={errorConfirmar} />
        {error && <Aviso tipo="error">{error}</Aviso>}
        <BotonAcceso cargando={enviando} textoCarga={textoCarga}>{textoBoton}</BotonAcceso>
      </form>
      <InsigniaInvitacion />
    </PantallaAcceso>
  )
}

export const AceptarInvitacion = () => (
  <FormContrasena titulo="Activa tu cuenta" subtitulo="Define tu nombre y una contraseña para comenzar" conNombre
    textoBoton="Activar cuenta" textoCarga="Activando…" avisoOk="Cuenta activada, inicia sesión"
    enviarApi={(token, nombre, contrasena) => auth.aceptarInvitacion({ token, nombre, contrasena })} />
)

export const RestablecerContrasena = () => (
  <FormContrasena titulo="Nueva contraseña" subtitulo="Elige una contraseña segura para tu cuenta" conNombre={false}
    textoBoton="Guardar contraseña" textoCarga="Guardando…" avisoOk="Contraseña actualizada"
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
    <PantallaAcceso titulo="Recupera tu contraseña" subtitulo="Te enviaremos un enlace para crear una nueva">
      {enviado ? (
        <Aviso tipo="ok">Si el correo está registrado, te enviamos un enlace</Aviso>
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          <CampoAcceso id="correo" label="Correo corporativo" type="email" auto="username" icono={Mail} value={correo} onChange={setCorreo} />
          {error && <Aviso tipo="error">{error}</Aviso>}
          <BotonAcceso cargando={enviando} textoCarga="Enviando…">Enviar enlace</BotonAcceso>
        </form>
      )}
      <Link to="/login" className={`${linkAccesoCls} block text-center`}>Volver a iniciar sesión</Link>
    </PantallaAcceso>
  )
}
