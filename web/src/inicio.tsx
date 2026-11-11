import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Building2, Check, Lock, Users } from 'lucide-react'
import * as apiClientes from './api/clientes'
import * as apiUsuarios from './api/usuarios'
import { useSesion, type Permiso } from './Sesion'
import { Encabezado, panelCls } from './ui'

const PERFIL: Record<string, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  coordinador: 'Coordinador',
  colaborador: 'Colaborador',
}

// Permisos de /me en palabras, agrupados por el módulo del PRD que los habilita.
const PERMISOS: { permiso: Permiso; texto: string; disponible: boolean }[] = [
  { permiso: 'clientesGestionar', texto: 'Crear, editar y desactivar clientes', disponible: true },
  { permiso: 'usuariosGestionar', texto: 'Invitar usuarios, cambiar su perfil y desactivarlos', disponible: true },
  { permiso: 'workspacesGestionar', texto: 'Crear y editar workspaces', disponible: false },
  { permiso: 'workspacesAsignarUsuarios', texto: 'Asignar personas a workspaces', disponible: false },
  { permiso: 'espaciosColeccionesGestionar', texto: 'Crear espacios y colecciones', disponible: false },
  { permiso: 'paginasEditar', texto: 'Crear y editar páginas', disponible: false },
  { permiso: 'paginasAprobar', texto: 'Aprobar páginas', disponible: false },
  { permiso: 'paginasEliminar', texto: 'Eliminar páginas', disponible: false },
  { permiso: 'archivosGestionar', texto: 'Subir y ver archivos', disponible: false },
  { permiso: 'buscar', texto: 'Buscar en la documentación', disponible: false },
  { permiso: 'exportarMarkdown', texto: 'Exportar páginas a Markdown', disponible: false },
]

const PROXIMOS = [
  'Workspaces, espacios y colecciones',
  'Editor de páginas con guardado automático',
  'Estado, responsable, revisión y etiquetas',
  'Archivos adjuntos con vista previa',
  'Búsqueda',
  'Exportación a Markdown',
]

function Cifra({ valor, etiqueta, tono }: { valor: number | null; etiqueta: string; tono?: 'ok' | 'pendiente' | 'off' }) {
  const punto = tono === 'ok' ? 'bg-leaf' : tono === 'pendiente' ? 'bg-review-signal' : tono === 'off' ? 'bg-control' : ''
  return (
    <div className="min-w-0">
      <p className="text-[32px]/10 font-semibold tracking-[-0.02em] tabular-nums">{valor ?? '—'}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
        {punto && <span aria-hidden className={`size-1.5 rounded-full ${punto}`} />}
        {etiqueta}
      </p>
    </div>
  )
}

function Resumen({ icono, titulo, enlace, children, pie }: { icono: ReactNode; titulo: string; enlace: { to: string; texto: string }; children: ReactNode; pie?: ReactNode }) {
  return (
    <section className={`${panelCls} flex flex-col p-5`} aria-label={titulo}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <span className="text-faint">{icono}</span>
          {titulo}
        </h2>
        <Link to={enlace.to} className="flex items-center gap-1 text-[13px] text-muted hover:text-ink">
          {enlace.texto}
          <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-4">{children}</div>
      {pie && <div className="mt-5 border-t border-rule pt-4">{pie}</div>}
    </section>
  )
}

export function Inicio() {
  const { usuario, puede } = useSesion()
  const [clientes, setClientes] = useState<apiClientes.Cliente[] | null>(null)
  const [usuarios, setUsuarios] = useState<apiUsuarios.Usuario[] | null>(null)

  const verClientes = puede('clientesGestionar')
  const verUsuarios = puede('usuariosGestionar') && (usuario?.perfil !== 'super_admin' || !!usuario?.cliente)

  useEffect(() => {
    if (verClientes) void apiClientes.listar().then((r) => r.ok && setClientes(r.datos))
  }, [verClientes])
  useEffect(() => {
    if (verUsuarios) void apiUsuarios.listar().then((r) => r.ok && setUsuarios(r.datos))
  }, [verUsuarios, usuario?.cliente?.guid])

  if (!usuario) return null
  const contexto = usuario.perfil === 'super_admin'
    ? usuario.cliente ? `operando en ${usuario.cliente.nombre}` : 'vista global de DataGlobal'
    : usuario.cliente?.nombre
  const contar = <T,>(l: T[] | null, f: (x: T) => boolean) => (l ? l.filter(f).length : null)

  return (
    <>
      <Encabezado
        titulo={`Hola, ${usuario.nombre}`}
        linea={<>{PERFIL[usuario.perfil]}{contexto ? ` · ${contexto}` : ''}</>}
      />
      <p className="-mt-3 mb-8 text-sm text-muted">Bienvenido a Data Hub.</p>

      {(verClientes || verUsuarios) && (
        <div className="mb-10 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {verClientes && (
            <Resumen icono={<Building2 aria-hidden className="size-4" />} titulo="Clientes" enlace={{ to: '/clientes', texto: 'Ver clientes' }}>
              <Cifra valor={clientes ? clientes.length : null} etiqueta="en total" />
              <Cifra valor={contar(clientes, (c) => c.activo)} etiqueta="activos" tono="ok" />
              <Cifra valor={contar(clientes, (c) => !c.activo)} etiqueta="inactivos" tono="off" />
            </Resumen>
          )}
          {verUsuarios && (
            <Resumen icono={<Users aria-hidden className="size-4" />} titulo={`Usuarios${usuario.cliente ? ` de ${usuario.cliente.nombre}` : ''}`}
              enlace={{ to: '/usuarios', texto: 'Ver usuarios' }}
              pie={contar(usuarios, (u) => u.estado === 'invitado') ? (
                <p className="text-[13px] text-muted">
                  Hay invitaciones sin aceptar. Desde Usuarios puedes reenviarlas si el enlace venció (dura 72 horas).
                </p>
              ) : undefined}>
              <Cifra valor={contar(usuarios, (u) => u.estado === 'activo')} etiqueta="activos" tono="ok" />
              <Cifra valor={contar(usuarios, (u) => u.estado === 'invitado')} etiqueta="invitaciones pendientes" tono="pendiente" />
              <Cifra valor={contar(usuarios, (u) => u.estado === 'inactivo')} etiqueta="inactivos" tono="off" />
            </Resumen>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-2">
        <section aria-labelledby="h-acceso">
          <h2 id="h-acceso" className="mb-3 text-[15px] font-semibold">Lo que puede hacer tu perfil</h2>
          <ul className={`${panelCls} divide-y divide-rule`}>
            {PERMISOS.filter((p) => puede(p.permiso)).map((p) => (
              <li key={p.permiso} className="flex items-center gap-3 px-4 py-3 text-sm">
                {p.disponible
                  ? <Check aria-hidden className="size-4 shrink-0 text-ok-ink" />
                  : <Lock aria-hidden className="size-4 shrink-0 text-faint" />}
                <span className="min-w-0 flex-1">{p.texto}</span>
                {!p.disponible && <span className="text-xs whitespace-nowrap text-faint">Próximamente</span>}
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="h-viene">
          <h2 id="h-viene" className="mb-3 text-[15px] font-semibold">Lo que viene en DataHub</h2>
          <ol className={`${panelCls} divide-y divide-rule`}>
            {PROXIMOS.map((t, i) => (
              <li key={t} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="w-5 text-right text-xs text-faint tabular-nums">{i + 4}</span>
                <span className="min-w-0 flex-1 text-muted">{t}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-faint">Módulos del PRD, en el orden en que se construyen.</p>
        </section>
      </div>
    </>
  )
}
