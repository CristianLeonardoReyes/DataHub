import React from 'react';
import { CornerDownRight, FolderPlus, Plus, Search } from 'lucide-react';
import { ESTADO_LABEL, PERFIL_LABEL, TIPO_LABEL, cuando, normalizar, plural } from '../lib/format';
import { ir, puede, useStore } from '../lib/store';
import type { EstadoPagina, Pagina, TipoPagina } from '../lib/types';
import { Avatar, Button, EstadoPill, Panel, PanelHeader, TipoEtiqueta, Vacio, VigenciaTexto, cx } from '../ui';
import { BarraVigencia, Encabezado, LeyendaVigencia, Lienzo, NuevaPagina, Seg, contar } from './comun';

/* ---------- Tabla de páginas (con subpáginas anidadas) ---------- */

export function TablaPaginas({ paginas, mostrarColeccion }: { paginas: Pagina[]; mostrarColeccion?: boolean }) {
  const { usuario, rutaDe } = useStore();
  const ids = new Set(paginas.map((p) => p.id));
  // Raíces del conjunto filtrado, seguidas de sus hijas visibles.
  const raices = paginas.filter((p) => !p.padreId || !ids.has(p.padreId));
  const filas: { p: Pagina; nivel: number }[] = [];
  const agregar = (p: Pagina, nivel: number) => {
    filas.push({ p, nivel });
    paginas.filter((h) => h.padreId === p.id).forEach((h) => agregar(h, nivel + 1));
  };
  raices.forEach((p) => agregar(p, 0));

  return (
    <>
      {/* Escritorio y tableta: tabla. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-collapse text-[14px]">
          <thead>
            <tr className="text-left text-[12px] text-muted">
              <th className="h-10 pr-3 pl-5 font-normal">Página</th>
              <th className="w-[130px] px-3 font-normal">Tipo</th>
              <th className="w-[124px] px-3 font-normal">Estado</th>
              <th className="w-[168px] px-3 font-normal">Responsable</th>
              <th className="w-[124px] px-3 font-normal">Revisión</th>
              <th className="w-[120px] pr-5 pl-3 text-right font-normal">Actualizada</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(({ p, nivel }) => {
              const resp = usuario(p.responsableId);
              return (
                <tr
                  key={p.id}
                  onClick={() => ir(`/p/${p.id}`)}
                  className="cursor-pointer border-t border-rule transition-colors hover:bg-raised"
                >
                  <td className="h-12 py-2 pr-3 pl-5">
                    <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: nivel * 20 }}>
                      {nivel > 0 && <CornerDownRight size={14} className="flex-none text-faint" aria-hidden="true" />}
                      <a
                        href={`#/p/${p.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="truncate font-medium hover:underline hover:underline-offset-2"
                      >
                        {p.titulo}
                      </a>
                    </div>
                    {mostrarColeccion && (
                      <div className="truncate text-[12px] text-muted">
                        {rutaDe(p).espacio.nombre} / {rutaDe(p).coleccion.nombre}
                      </div>
                    )}
                  </td>
                  <td className="px-3">
                    <TipoEtiqueta tipo={p.tipo} />
                  </td>
                  <td className="px-3">
                    <EstadoPill estado={p.estado} />
                  </td>
                  <td className="px-3">
                    {resp && (
                      <span className="flex min-w-0 items-center gap-2">
                        <Avatar nombre={resp.nombre} id={resp.id} size={20} />
                        <span className="truncate text-[13px]">{resp.nombre}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-3 text-[13px]">
                    <VigenciaTexto pagina={p} corto />
                  </td>
                  <td className="num pr-5 pl-3 text-right text-[13px] whitespace-nowrap text-muted">{cuando(p.actualizada)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Teléfono: filas de dos líneas. */}
      <ul className="md:hidden">
        {filas.map(({ p, nivel }) => (
          <li key={p.id} className="border-t border-rule">
            <a href={`#/p/${p.id}`} className="flex flex-col gap-1 px-4 py-3" style={{ paddingLeft: 16 + nivel * 16 }}>
              <span className="flex items-start justify-between gap-3">
                <span className="text-[14px] leading-5 font-medium">{p.titulo}</span>
                <EstadoPill estado={p.estado} />
              </span>
              <span className="flex flex-wrap gap-x-2 text-[13px] text-muted">
                <span>{TIPO_LABEL[p.tipo]}</span>·<span>{usuario(p.responsableId)?.nombre}</span>·<VigenciaTexto pagina={p} corto />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ---------- Workspace ---------- */

export function VistaWorkspace({ id }: { id: string }) {
  const { misWorkspaces, espacios, colecciones, misPaginas, usuarios, yo, clienteActivo, avisar } = useStore();
  const w = misWorkspaces.find((x) => x.id === id);
  if (!w) return <NoEncontrado />;
  const es = espacios.filter((e) => e.workspaceId === w.id);
  const conAcceso = usuarios.filter(
    (u) => u.clienteId === clienteActivo.id && u.estado !== 'inactivo' && (u.perfil === 'admin' || u.workspaces.includes(w.id)),
  );

  return (
    <Lienzo>
      <Encabezado
        migas={[{ label: 'Workspaces' }, { label: w.nombre }]}
        titulo={w.nombre}
        linea={w.descripcion}
        acciones={
          puede(yo, 'espacios.gestionar') && (
            <Button icon={<FolderPlus size={15} />} onClick={() => avisar('Prototipo: crear espacios llega con el módulo de Jerarquía')}>
              Nuevo espacio
            </Button>
          )
        }
      />
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-8">
          <PanelHeader titulo={`Espacios · ${es.length}`} extra={<span className="hidden lg:block"><LeyendaVigencia /></span>} />
          <ul>
            {es.map((e) => {
              const ks = colecciones.filter((k) => k.espacioId === e.id);
              const ps = misPaginas.filter((p) => ks.some((k) => k.id === p.coleccionId));
              const c = contar(ps);
              const ultima = [...ps].sort((a, b) => b.actualizada.localeCompare(a.actualizada))[0];
              return (
                <li key={e.id} className="border-b border-rule last:border-0">
                  <a href={`#/e/${e.id}`} className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-raised sm:grid-cols-[1fr_220px]">
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold">{e.nombre}</span>
                      <span className="mt-0.5 block text-[13px] text-muted">{e.descripcion}</span>
                      <span className="mt-2 block text-[12px] text-muted">
                        {ks.map((k) => k.nombre).join(' · ')}
                      </span>
                    </span>
                    <span className="flex flex-col justify-center gap-2">
                      <BarraVigencia conteo={c} />
                      <span className="flex justify-between text-[12px] text-muted">
                        <span className="num">{plural(c.total, 'página', 'páginas')}</span>
                        <span>{ultima ? cuando(ultima.actualizada) : '—'}</span>
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel className="xl:col-span-4">
          <PanelHeader
            titulo={`Personas con acceso · ${conAcceso.length}`}
            extra={
              puede(yo, 'usuarios.gestionar') && (
                <a href="#/admin/usuarios" className="text-[13px] text-muted hover:text-ink">
                  Gestionar
                </a>
              )
            }
          />
          <ul className="py-1.5">
            {conAcceso.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-5 py-2">
                <Avatar nombre={u.nombre} id={u.id} size={28} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px]">{u.nombre}</span>
                  <span className="block text-[12px] text-muted">
                    {PERFIL_LABEL[u.perfil]}
                    {u.estado === 'invitado' && ' · invitación pendiente'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </Lienzo>
  );
}

/* ---------- Espacio ---------- */

const ESTADOS: EstadoPagina[] = ['borrador', 'en_revision', 'aprobado', 'archivado'];

export function VistaEspacio({ id }: { id: string }) {
  const { espacios, misWorkspaces, colecciones, misPaginas, ruta, yo, avisar } = useStore();
  const e = espacios.find((x) => x.id === id);
  const w = misWorkspaces.find((x) => x.id === e?.workspaceId);
  const [nueva, setNueva] = React.useState(false);
  const [estado, setEstado] = React.useState<'' | EstadoPagina | 'vencida'>('');
  const [tipo, setTipo] = React.useState<'' | TipoPagina>('');
  const [texto, setTexto] = React.useState('');
  if (!e || !w) return <NoEncontrado />;

  const ks = colecciones.filter((k) => k.espacioId === e.id);
  const sel = ruta.query.get('c') ?? 'todas';
  const delEspacio = misPaginas.filter((p) => ks.some((k) => k.id === p.coleccionId));
  const enVista = sel === 'todas' ? delEspacio : delEspacio.filter((p) => p.coleccionId === sel);
  const filtradas = enVista.filter(
    (p) =>
      (!estado || (estado === 'vencida' ? p.fechaRevision && p.fechaRevision < '2026-10-26' && p.estado !== 'archivado' : p.estado === estado)) &&
      (!tipo || p.tipo === tipo) &&
      (!texto.trim() || normalizar(p.titulo).includes(normalizar(texto.trim()))),
  );
  const c = contar(delEspacio);
  const hayFiltro = estado || tipo || texto.trim();
  const selCls =
    'h-8 rounded-md border border-control bg-surface pr-7 pl-2.5 text-[13px] text-ink hover:border-faint focus:border-brand focus:outline-none';

  return (
    <Lienzo>
      <Encabezado
        migas={[{ label: w.nombre, href: `#/w/${w.id}` }, { label: e.nombre }]}
        titulo={e.nombre}
        linea={e.descripcion}
        acciones={
          <>
            {puede(yo, 'espacios.gestionar') && (
              <Button icon={<FolderPlus size={15} />} onClick={() => avisar('Prototipo: crear colecciones llega con el módulo de Jerarquía')}>
                Nueva colección
              </Button>
            )}
            <Button variant="primary" icon={<Plus size={15} />} onClick={() => setNueva(true)}>
              Nueva página
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="w-full max-w-[420px]">
          <BarraVigencia conteo={c} alto={10} />
        </div>
        <LeyendaVigencia conteo={c} />
      </div>

      <Panel>
        <div className="border-b border-line px-5">
          <Seg
            etiqueta="Colecciones"
            valor={sel}
            cambiar={(v) => ir(`/e/${e.id}${v === 'todas' ? '' : `?c=${v}`}`)}
            opciones={[
              { id: 'todas', label: 'Todas', n: delEspacio.length },
              ...ks.map((k) => ({ id: k.id, label: k.nombre, n: delEspacio.filter((p) => p.coleccionId === k.id).length })),
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b border-rule px-5 py-3">
          <label className="relative">
            <span className="sr-only">Filtrar por título</span>
            <Search size={14} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-faint" />
            <input
              value={texto}
              onChange={(ev) => setTexto(ev.target.value)}
              placeholder="Filtrar por título"
              className="h-8 w-[220px] rounded-md border border-control bg-surface pr-2.5 pl-8 text-[13px] hover:border-faint focus:border-brand focus:outline-none"
            />
          </label>
          <label>
            <span className="sr-only">Estado</span>
            <select value={estado} onChange={(ev) => setEstado(ev.target.value as typeof estado)} className={selCls}>
              <option value="">Todos los estados</option>
              {ESTADOS.map((s) => (
                <option key={s} value={s}>
                  {ESTADO_LABEL[s]}
                </option>
              ))}
              <option value="vencida">Revisión vencida</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Tipo</span>
            <select value={tipo} onChange={(ev) => setTipo(ev.target.value as typeof tipo)} className={selCls}>
              <option value="">Todos los tipos</option>
              {(Object.keys(TIPO_LABEL) as TipoPagina[]).map((t) => (
                <option key={t} value={t}>
                  {TIPO_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
          {hayFiltro && (
            <button
              onClick={() => {
                setEstado('');
                setTipo('');
                setTexto('');
              }}
              className="h-8 rounded-md px-2 text-[13px] text-muted hover:bg-active hover:text-ink"
            >
              Quitar filtros
            </button>
          )}
          <span className="num ml-auto text-[13px] text-muted">{plural(filtradas.length, 'página', 'páginas')}</span>
        </div>
        {filtradas.length === 0 ? (
          <Vacio
            accion={
              !hayFiltro && (
                <Button size="sm" icon={<Plus size={14} />} onClick={() => setNueva(true)}>
                  Nueva página
                </Button>
              )
            }
          >
            {hayFiltro ? 'Ninguna página coincide con los filtros.' : 'Esta colección aún no tiene páginas.'}
          </Vacio>
        ) : (
          <TablaPaginas paginas={filtradas} />
        )}
      </Panel>

      <NuevaPagina abierto={nueva} cerrar={() => setNueva(false)} coleccionId={sel !== 'todas' ? sel : ks[0]?.id} />
    </Lienzo>
  );
}

export function NoEncontrado() {
  return (
    <Lienzo ancho={720}>
      <div className={cx('mt-16 rounded-lg border border-line bg-surface p-8')}>
        <h1 className="text-[20px] font-semibold">No encontramos esta página</h1>
        <p className="mt-2 text-[15px] text-muted">
          Puede que no exista o que no tengas acceso a su workspace. Si crees que deberías verla, pide acceso al Admin de tu cliente.
        </p>
        <div className="mt-5">
          <Button onClick={() => ir('/inicio')}>Volver al inicio</Button>
        </div>
      </div>
    </Lienzo>
  );
}
