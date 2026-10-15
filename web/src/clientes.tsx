import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import * as api from './api/clientes'
import { Alerta, btnCls, btnSmCls, Campo, linkCls } from './ui'

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
    if (r.ok) setLista((l) => l?.map((x) => (x.guid === c.guid ? r.datos : x)) ?? null)
    else setError(r.problema.detail ?? 'No se pudo cambiar el estado')
    setOcupado(null)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <Link to="/clientes/nuevo" className={`${btnCls} w-auto text-center`}>Nuevo cliente</Link>
      </div>
      {aviso && <p role="status" className="text-sm text-emerald-300">{aviso}</p>}
      <Alerta texto={error} />
      {lista === null ? (
        !error && <p className="text-zinc-400">Cargando…</p>
      ) : lista.length === 0 ? (
        <p className="text-zinc-400">Aún no hay clientes.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-zinc-400">
              <tr>
                <th scope="col" className="p-2">Nombre</th>
                <th scope="col" className="p-2">Slug</th>
                <th scope="col" className="p-2">Estado</th>
                <th scope="col" className="p-2">Creado</th>
                <th scope="col" className="p-2"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.guid} className="border-t border-zinc-800">
                  <td className="p-2">{c.nombre}</td>
                  <td className="p-2 text-zinc-400">{c.slug}</td>
                  <td className="p-2">
                    <span className={`rounded px-2 py-0.5 text-xs ${c.activo ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-700 text-zinc-300'}`}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-2">{fecha(c.fechaCreacion)}</td>
                  <td className="flex gap-2 p-2">
                    <Link to={`/clientes/${c.guid}`} aria-label={`Editar ${c.nombre}`} className={btnSmCls}>Editar</Link>
                    <button type="button" disabled={ocupado === c.guid} className={btnSmCls}
                      aria-label={`${c.activo ? 'Desactivar' : 'Activar'} ${c.nombre}`} onClick={() => cambiarEstado(c)}>
                      {c.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// Nuevo (sin :guid) y edición (con :guid).
export function ClienteForm() {
  const { guid } = useParams()
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

  if (cargando) return <p className="text-zinc-400">Cargando…</p>
  if (noExiste)
    return (
      <section className="space-y-2">
        <p role="alert" className="text-red-300">Cliente no encontrado</p>
        <Link to="/clientes" className={linkCls}>Volver a clientes</Link>
      </section>
    )

  return (
    <section className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">{guid ? 'Editar cliente' : 'Nuevo cliente'}</h1>
      <form onSubmit={enviar} noValidate className="space-y-4">
        <Campo id="nombre" label="Nombre" value={nombre} onChange={cambiarNombre} error={errores.nombre} />
        <Campo id="slug" label="Slug" value={slug} error={errores.slug}
          onChange={(v) => { setSlugTocado(true); setSlug(v) }} />
        {!guid && <Campo id="correoAdmin" label="Correo del Admin" type="email" value={correo} onChange={setCorreo} error={errores.correo} />}
        <Alerta texto={errores.general ?? null} />
        <div className="flex gap-2">
          <button type="submit" disabled={enviando} className={btnCls}>{guid ? 'Guardar' : 'Crear cliente'}</button>
          <Link to="/clientes" className={`${btnSmCls} flex items-center`}>Cancelar</Link>
        </div>
      </form>
    </section>
  )
}
