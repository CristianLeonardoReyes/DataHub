import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import * as api from './api/usuarios'
import { useSesion } from './Sesion'
import { Power, Send, UserPlus, Users } from 'lucide-react'
import { Alerta, Avatar, AvisoInfo, AvisoOk, Boton, btnCls, btnSmCls, Campo, Encabezado, Insignia, inputCls, panelCls } from './ui'

type Perfil = api.Usuario['perfil']

const PERFILES: Record<Perfil, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  coordinador: 'Coordinador',
  colaborador: 'Colaborador',
}
const ASIGNABLES: Perfil[] = ['admin', 'coordinador', 'colaborador']

const ESTADOS: Record<api.Usuario['estado'], { texto: string; tono: 'ok' | 'pendiente' | 'off' }> = {
  invitado: { texto: 'Invitado', tono: 'pendiente' },
  activo: { texto: 'Activo', tono: 'ok' },
  inactivo: { texto: 'Inactivo', tono: 'off' },
}

// Lo que habilita cada perfil (PRD §3.2); se muestra al invitar para elegir con criterio.
const ALCANCE: Record<Perfil, string> = {
  super_admin: 'Toda la plataforma.',
  admin: 'Administra todo el cliente: usuarios, workspaces y contenido.',
  coordinador: 'Gestiona espacios y colecciones de sus workspaces y aprueba páginas.',
  colaborador: 'Crea y edita páginas en sus workspaces; no aprueba.',
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

  const pendientes = lista?.filter((u) => u.estado === 'invitado').length ?? 0
  return (
    <section>
      <Encabezado
        titulo="Usuarios"
        linea={lista
          ? `${yo?.cliente ? `${yo.cliente.nombre} · ` : ''}${lista.length} ${lista.length === 1 ? 'persona' : 'personas'}${pendientes ? ` · ${pendientes} ${pendientes === 1 ? 'invitación pendiente' : 'invitaciones pendientes'}` : ''}`
          : 'Personas con acceso a este cliente'}
        acciones={!info && (
          <Link to="/usuarios/nuevo" className={`${btnCls} w-auto`}>
            <UserPlus aria-hidden className="size-4" />
            Invitar usuario
          </Link>
        )}
      />
      <div className="space-y-4">
        <AvisoOk texto={aviso} />
        <AvisoInfo texto={info} />
        <Alerta texto={error} />
        {lista === null ? (
          !error && !info && <p className="text-sm text-muted">Cargando…</p>
        ) : lista.length === 0 ? (
          <div className={`${panelCls} flex flex-col items-center gap-3 px-6 py-12 text-center`}>
            <Users aria-hidden className="size-6 text-faint" />
            <p className="text-sm text-muted">Aún no hay usuarios.</p>
          </div>
        ) : (
          <div className={`${panelCls} overflow-x-auto`}>
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th scope="col" className="w-12 pl-4"><span className="sr-only">Avatar</span></th>
                  <th scope="col" className="h-10 px-3 font-normal">Nombre</th>
                  <th scope="col" className="px-3 font-normal">Correo</th>
                  <th scope="col" className="px-3 font-normal">Perfil</th>
                  <th scope="col" className="px-3 font-normal">Estado</th>
                  <th scope="col" className="px-3 text-right font-normal">Creado</th>
                  <th scope="col" className="px-4"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((u) => {
                  const propio = u.guid === yo?.guid
                  const e = ESTADOS[u.estado]
                  const activo = u.estado !== 'inactivo'
                  return (
                    <tr key={u.guid} className={`border-t border-rule transition-colors hover:bg-raised ${u.estado === 'inactivo' ? 'text-muted' : ''}`}>
                      <td className="h-14 pl-4"><Avatar nombre={u.nombre} semilla={u.guid} /></td>
                      <td className="px-3 font-medium">{u.nombre}</td>
                      <td className="px-3 text-[13px] text-muted">{u.correo}</td>
                      <td className="px-3">
                        {propio || !ASIGNABLES.includes(u.perfil) ? (
                          <span className="text-[13px]">{PERFILES[u.perfil]}</span>
                        ) : (
                          <select aria-label={`Perfil de ${u.correo}`} value={u.perfil} disabled={ocupado === u.guid}
                            className={`${inputCls} h-8 w-auto pr-8 text-[13px]`}
                            onChange={(ev) => void guardar(u, ev.target.value as Perfil, activo, 'No se pudo cambiar el perfil')}>
                            {ASIGNABLES.map((p) => <option key={p} value={p}>{PERFILES[p]}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="px-3"><Insignia tono={e.tono}>{e.texto}</Insignia></td>
                      <td className="px-3 text-right text-[13px] whitespace-nowrap text-muted tabular-nums">{fecha(u.fechaCreacion)}</td>
                      <td className="px-4">
                        <div className="flex justify-end gap-2">
                          {!propio && u.estado === 'invitado' && (
                            <Boton type="button" cargando={ocupado === u.guid} textoCarga="Reenviando…" className={btnSmCls}
                              aria-label={`Reenviar invitación a ${u.correo}`} onClick={() => void reenviar(u)}>
                              <Send aria-hidden className="size-3.5" />Reenviar invitación
                            </Boton>
                          )}
                          {!propio && u.estado !== 'invitado' && (
                            <Boton type="button" cargando={ocupado === u.guid} textoCarga={activo ? 'Desactivando…' : 'Activando…'}
                              className={`${btnSmCls} ${activo ? 'text-danger hover:bg-danger-bg' : ''}`}
                              aria-label={`${activo ? 'Desactivar' : 'Activar'} ${u.nombre}`} onClick={() => void cambiarEstado(u)}>
                              <Power aria-hidden className="size-3.5" />{activo ? 'Desactivar' : 'Activar'}
                            </Boton>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
    <section className="max-w-[560px]">
      <Encabezado titulo="Invitar usuario" linea="Le llegará un correo con un enlace de un solo uso para activar su cuenta (vence en 72 horas)." />
      <form onSubmit={enviar} noValidate className={`${panelCls} space-y-5 p-6`}>
        <Campo id="correo" label="Correo" type="email" value={correo} onChange={setCorreo} error={errores.correo} />
        <div className="space-y-2">
          <label htmlFor="perfil" className="block text-sm font-medium">Perfil</label>
          <select id="perfil" value={perfil} onChange={(e) => setPerfil(e.target.value as Perfil)} className={inputCls}>
            {ASIGNABLES.map((p) => <option key={p} value={p}>{PERFILES[p]}</option>)}
          </select>
          <p className="text-[13px] text-muted">{ALCANCE[perfil]}</p>
        </div>
        <Alerta texto={errores.general ?? null} />
        <div className="flex gap-2 border-t border-rule pt-5">
          <Boton type="submit" cargando={enviando} textoCarga="Enviando…" className={`${btnCls} w-auto`}>Enviar invitación</Boton>
          <Link to="/usuarios" className={`${btnSmCls} h-10 px-4`}>Cancelar</Link>
        </div>
      </form>
    </section>
  )
}
