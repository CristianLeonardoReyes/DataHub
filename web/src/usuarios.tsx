import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import * as api from './api/usuarios'
import { useSesion } from './Sesion'
import { Alerta, btnCls, btnSmCls, Campo, inputCls } from './ui'

type Perfil = api.Usuario['perfil']

const PERFILES: Record<Perfil, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  coordinador: 'Coordinador',
  colaborador: 'Colaborador',
}
const ASIGNABLES: Perfil[] = ['admin', 'coordinador', 'colaborador']

const ESTADOS: Record<api.Usuario['estado'], { texto: string; cls: string }> = {
  invitado: { texto: 'Invitado', cls: 'bg-amber-500/20 text-amber-300' },
  activo: { texto: 'Activo', cls: 'bg-emerald-500/20 text-emerald-300' },
  inactivo: { texto: 'Inactivo', cls: 'bg-zinc-700 text-zinc-300' },
}

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-CO')

export function Usuarios() {
  const { usuario: yo } = useSesion()
  const avisoInicial = (useLocation().state as { aviso?: string } | null)?.aviso
  const [lista, setLista] = useState<api.Usuario[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(avisoInicial ?? null)
  const [ocupado, setOcupado] = useState<string | null>(null)

  useEffect(() => {
    void api.listar().then((r) => {
      if (r.ok) setLista(r.datos)
      // Super admin sin cliente: el backend responde 400 con un mensaje orientativo.
      else if (r.status === 400) setInfo(r.problema.detail ?? 'Selecciona un cliente para gestionar sus usuarios.')
      else setError('No se pudo cargar la lista de usuarios')
    })
  }, [])

  async function guardar(u: api.Usuario, perfil: Perfil, activo: boolean, mensaje: string) {
    setOcupado(u.guid)
    setError(null)
    setAviso(null)
    const r = await api.actualizar(u.guid, { perfil, activo })
    if (r.ok) setLista((l) => l?.map((x) => (x.guid === u.guid ? r.datos : x)) ?? null)
    else setError(r.problema.detail ?? mensaje)
    setOcupado(null)
  }

  async function cambiarEstado(u: api.Usuario) {
    const activar = u.estado === 'inactivo'
    const msg = activar ? `¿Activar a ${u.nombre}?` : `¿Desactivar a ${u.nombre}? Perderá el acceso.`
    if (!window.confirm(msg)) return
    await guardar(u, u.perfil, activar, 'No se pudo cambiar el estado')
  }

  async function reenviar(u: api.Usuario) {
    setOcupado(u.guid)
    setError(null)
    setAviso(null)
    const r = await api.reenviarInvitacion(u.guid)
    if (r.ok) setAviso('Invitación reenviada')
    else setError(r.problema.detail ?? 'No se pudo reenviar la invitación')
    setOcupado(null)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Usuarios</h1>
        {!info && <Link to="/usuarios/nuevo" className={`${btnCls} w-auto text-center`}>Invitar usuario</Link>}
      </div>
      {aviso && <p role="status" className="text-sm text-emerald-300">{aviso}</p>}
      {info && <p role="status" className="text-zinc-400">{info}</p>}
      <Alerta texto={error} />
      {lista === null ? (
        !error && !info && <p className="text-zinc-400">Cargando…</p>
      ) : lista.length === 0 ? (
        <p className="text-zinc-400">Aún no hay usuarios.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-zinc-400">
              <tr>
                <th scope="col" className="p-2">Nombre</th>
                <th scope="col" className="p-2">Correo</th>
                <th scope="col" className="p-2">Perfil</th>
                <th scope="col" className="p-2">Estado</th>
                <th scope="col" className="p-2">Creado</th>
                <th scope="col" className="p-2"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((u) => {
                const propio = u.guid === yo?.guid
                const e = ESTADOS[u.estado]
                const activo = u.estado !== 'inactivo'
                return (
                  <tr key={u.guid} className="border-t border-zinc-800">
                    <td className="p-2">{u.nombre}</td>
                    <td className="p-2 text-zinc-400">{u.correo}</td>
                    <td className="p-2">
                      {propio || !ASIGNABLES.includes(u.perfil) ? PERFILES[u.perfil] : (
                        <select aria-label={`Perfil de ${u.correo}`} value={u.perfil} disabled={ocupado === u.guid}
                          className={`${inputCls} w-auto py-1 text-sm`}
                          onChange={(ev) => void guardar(u, ev.target.value as Perfil, activo, 'No se pudo cambiar el perfil')}>
                          {ASIGNABLES.map((p) => <option key={p} value={p}>{PERFILES[p]}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="p-2"><span className={`rounded px-2 py-0.5 text-xs ${e.cls}`}>{e.texto}</span></td>
                    <td className="p-2">{fecha(u.fechaCreacion)}</td>
                    <td className="flex gap-2 p-2">
                      {!propio && u.estado === 'invitado' && (
                        <button type="button" disabled={ocupado === u.guid} className={btnSmCls}
                          aria-label={`Reenviar invitación a ${u.correo}`} onClick={() => void reenviar(u)}>
                          Reenviar invitación
                        </button>
                      )}
                      {!propio && u.estado !== 'invitado' && (
                        <button type="button" disabled={ocupado === u.guid} className={btnSmCls}
                          aria-label={`${activo ? 'Desactivar' : 'Activar'} ${u.nombre}`} onClick={() => void cambiarEstado(u)}>
                          {activo ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function InvitarUsuario() {
  const nav = useNavigate()
  const [correo, setCorreo] = useState('')
  const [perfil, setPerfil] = useState<Perfil>('colaborador')
  const [errores, setErrores] = useState<{ correo?: string; general?: string }>({})
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const c = correo.trim()
    if (!/^[^\s@]+@[^\s@]+$/.test(c) || c.length > 254) {
      setErrores({ correo: 'Ingresa un correo válido (máx. 254 caracteres)' })
      return
    }
    setErrores({})
    setEnviando(true)
    const r = await api.invitar({ correo: c, perfil })
    if (r.ok) {
      nav('/usuarios', { state: { aviso: `Invitación enviada a ${c}` } })
      return
    }
    const detalle = r.problema.detail ?? 'No se pudo enviar la invitación'
    setErrores((r.problema as { campo?: string }).campo === 'correo' ? { correo: detalle } : { general: detalle })
    setEnviando(false)
  }

  return (
    <section className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Invitar usuario</h1>
      <form onSubmit={enviar} noValidate className="space-y-4">
        <Campo id="correo" label="Correo" type="email" value={correo} onChange={setCorreo} error={errores.correo} />
        <div className="space-y-1">
          <label htmlFor="perfil" className="block text-sm text-zinc-300">Perfil</label>
          <select id="perfil" value={perfil} onChange={(e) => setPerfil(e.target.value as Perfil)} className={inputCls}>
            {ASIGNABLES.map((p) => <option key={p} value={p}>{PERFILES[p]}</option>)}
          </select>
        </div>
        <Alerta texto={errores.general ?? null} />
        <div className="flex gap-2">
          <button type="submit" disabled={enviando} className={btnCls}>Enviar invitación</button>
          <Link to="/usuarios" className={`${btnSmCls} flex items-center`}>Cancelar</Link>
        </div>
      </form>
    </section>
  )
}
