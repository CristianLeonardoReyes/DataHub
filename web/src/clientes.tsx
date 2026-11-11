import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import * as api from './api/clientes'
import { useSesion } from './Sesion'
import { Building2, Pencil, Plus, Power } from 'lucide-react'
import { Alerta, AvisoOk, btnCls, btnSmCls, Campo, Encabezado, Insignia, linkCls, panelCls } from './ui'

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

const sugerirSlug = (nombre: string) =>
  nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-CO')

export function Clientes() {
  const { clientesCambiaron } = useSesion()
  const aviso = (useLocation().state as { aviso?: string } | null)?.aviso
  const [lista, setLista] = useState<api.Cliente[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)

  useEffect(() => {
    void api.listar().then((r) => (r.ok ? setLista(r.datos) : setError('No se pudo cargar la lista de clientes')))
  }, [])

  async function cambiarEstado(c: api.Cliente) {
    const msg = c.activo
      ? `¿Desactivar a ${c.nombre}? Sus usuarios perderán el acceso.`
      : `¿Activar a ${c.nombre}?`
    if (!window.confirm(msg)) return
    setOcupado(c.guid)
    setError(null)
    const r = await api.actualizar(c.guid, { nombre: c.nombre, slug: c.slug, activo: !c.activo })
    if (r.ok) {
      setLista((l) => l?.map((x) => (x.guid === c.guid ? r.datos : x)) ?? null)
      await clientesCambiaron()
    }
    else setError(r.problema.detail ?? 'No se pudo cambiar el estado')
    setOcupado(null)
  }

  const activos = lista?.filter((c) => c.activo).length ?? 0
  return (
    <section>
      <Encabezado
        titulo="Clientes"
        linea={lista ? `${lista.length} ${lista.length === 1 ? 'cliente' : 'clientes'} · ${activos} ${activos === 1 ? 'activo' : 'activos'}. Desactivar un cliente deja sin acceso a sus usuarios.` : 'Empresas que usan DataHub'}
        acciones={
          <Link to="/clientes/nuevo" className={`${btnCls} w-auto`}>
            <Plus aria-hidden className="size-4" />
            Nuevo cliente
          </Link>
        }
      />
      <div className="space-y-4">
        <AvisoOk texto={aviso ?? null} />
        <Alerta texto={error} />
        {lista === null ? (
          !error && <p className="text-sm text-muted">Cargando…</p>
        ) : lista.length === 0 ? (
          <div className={`${panelCls} flex flex-col items-center gap-3 px-6 py-12 text-center`}>
            <Building2 aria-hidden className="size-6 text-faint" />
            <p className="text-sm text-muted">Aún no hay clientes.</p>
            <Link to="/clientes/nuevo" className={btnSmCls}>Crear el primero</Link>
          </div>
        ) : (
          <div className={`${panelCls} overflow-x-auto`}>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th scope="col" className="h-10 px-4 font-normal">Nombre</th>
                  <th scope="col" className="px-4 font-normal">Slug</th>
                  <th scope="col" className="px-4 font-normal">Estado</th>
                  <th scope="col" className="px-4 text-right font-normal">Creado</th>
                  <th scope="col" className="px-4"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.guid} className="border-t border-rule transition-colors hover:bg-raised">
                    <td className="h-14 px-4 font-medium">{c.nombre}</td>
                    <td className="px-4 font-mono text-[13px] text-muted">{c.slug}</td>
                    <td className="px-4"><Insignia tono={c.activo ? 'ok' : 'off'}>{c.activo ? 'Activo' : 'Inactivo'}</Insignia></td>
                    <td className="px-4 text-right text-[13px] whitespace-nowrap text-muted tabular-nums">{fecha(c.fechaCreacion)}</td>
                    <td className="px-4">
                      <div className="flex justify-end gap-2">
                        <Link to={`/clientes/${c.guid}`} aria-label={`Editar ${c.nombre}`} className={btnSmCls}>
                          <Pencil aria-hidden className="size-3.5" />Editar
                        </Link>
                        <button type="button" disabled={ocupado === c.guid}
                          className={`${btnSmCls} ${c.activo ? 'text-danger hover:bg-danger-bg' : ''}`}
                          aria-label={`${c.activo ? 'Desactivar' : 'Activar'} ${c.nombre}`} onClick={() => cambiarEstado(c)}>
                          <Power aria-hidden className="size-3.5" />{c.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

// Nuevo (sin :guid) y edición (con :guid).
export function ClienteForm() {
  const { guid } = useParams()
  const { clientesCambiaron } = useSesion()
  const nav = useNavigate()
  const [nombre, setNombre] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTocado, setSlugTocado] = useState(!!guid)
  const [correo, setCorreo] = useState('')
  const [activo, setActivo] = useState(true)
  const [cargando, setCargando] = useState(!!guid)
  const [noExiste, setNoExiste] = useState(false)
  const [errores, setErrores] = useState<{ nombre?: string; slug?: string; correo?: string; general?: string }>({})
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!guid) return
    void api.obtener(guid).then((r) => {
      if (r.ok) {
        setNombre(r.datos.nombre)
        setSlug(r.datos.slug)
        setActivo(r.datos.activo)
      } else if (r.status === 404) setNoExiste(true)
      else setErrores({ general: 'No se pudo cargar el cliente' })
      setCargando(false)
    })
  }, [guid])

  function cambiarNombre(v: string) {
    setNombre(v)
    if (!slugTocado) setSlug(sugerirSlug(v))
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const n = nombre.trim()
    const s = slug.trim()
    const c = correo.trim()
    const err: typeof errores = {}
    if (n.length < 1 || n.length > 150) err.nombre = 'El nombre debe tener entre 1 y 150 caracteres'
    if (s.length < 3 || s.length > 100 || !SLUG.test(s))
      err.slug = 'El slug debe tener 3 a 100 caracteres: minúsculas, números y guiones'
    if (!guid && (!/^[^\s@]+@[^\s@]+$/.test(c) || c.length > 254)) err.correo = 'Ingresa un correo válido (máx. 254 caracteres)'
    setErrores(err)
    if (Object.keys(err).length) return
    setEnviando(true)
    const r = guid
      ? await api.actualizar(guid, { nombre: n, slug: s, activo })
      : await api.crear({ nombre: n, slug: s, correoAdmin: c })
    if (r.ok) {
      await clientesCambiaron()
      nav('/clientes', { state: { aviso: guid ? 'Cliente actualizado' : 'Cliente creado. Se envió la invitación al Admin' } })
      return
    }
    const detalle = r.problema.detail ?? 'No se pudo guardar el cliente'
    if (r.status === 404) setNoExiste(true)
    else if (r.status === 409) {
      // El backend indica el campo en conflicto en la extensión `campo` del ProblemDetails.
      setErrores((r.problema as { campo?: string }).campo === 'correoAdmin' ? { correo: detalle } : { slug: detalle })
    } else setErrores({ general: detalle })
    setEnviando(false)
  }

  if (cargando) return <p className="text-sm text-muted">Cargando…</p>
  if (noExiste)
    return (
      <section className="space-y-3">
        <p role="alert" className="text-danger">Cliente no encontrado</p>
        <Link to="/clientes" className={linkCls}>Volver a clientes</Link>
      </section>
    )

  return (
    <section className="max-w-[560px]">
      <Encabezado
        titulo={guid ? 'Editar cliente' : 'Nuevo cliente'}
        linea={guid ? 'Cambia el nombre o el identificador. El estado se cambia desde la lista.' : 'Se crea el cliente y se envía la invitación a su primer Admin (vence en 72 horas).'}
      />
      <form onSubmit={enviar} noValidate className={`${panelCls} space-y-5 p-6`}>
        <Campo id="nombre" label="Nombre" value={nombre} onChange={cambiarNombre} error={errores.nombre} />
        <Campo id="slug" label="Slug" value={slug} error={errores.slug} mono
          ayuda="Identificador corto: minúsculas, números y guiones."
          onChange={(v) => { setSlugTocado(true); setSlug(v) }} />
        {!guid && <Campo id="correoAdmin" label="Correo del Admin" type="email" value={correo} onChange={setCorreo} error={errores.correo}
          ayuda="Le llegará el enlace para activar su cuenta." />}
        <Alerta texto={errores.general ?? null} />
        <div className="flex gap-2 border-t border-rule pt-5">
          <button type="submit" disabled={enviando} className={`${btnCls} w-auto`}>{guid ? 'Guardar' : 'Crear cliente'}</button>
          <Link to="/clientes" className={`${btnSmCls} h-10 px-4`}>Cancelar</Link>
        </div>
      </form>
    </section>
  )
}
