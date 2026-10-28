import React from 'react';
import { Plus } from 'lucide-react';
import { cuando, diasHasta, fechaCorta, plural, vigencia } from '../lib/format';
import { useStore } from '../lib/store';
import { Avatar, Button, EstadoPill, Panel, PanelHeader, Vacio } from '../ui';
import { BarraVigencia, Encabezado, LeyendaVigencia, Lienzo, NuevaPagina, contar } from './comun';

export function Inicio() {
  const { misPaginas, misWorkspaces, espacios, colecciones, rutaDe, usuario, yo, clienteActivo } = useStore();
  const [nueva, setNueva] = React.useState(false);

  const recientes = [...misPaginas].sort((a, b) => b.actualizada.localeCompare(a.actualizada)).slice(0, 6);
  const vencidas = misPaginas
    .filter((p) => vigencia(p).tipo === 'vencida')
    .sort((a, b) => (a.fechaRevision ?? '').localeCompare(b.fechaRevision ?? ''));
  const proximas = misPaginas
    .filter((p) => vigencia(p).tipo === 'proxima')
    .sort((a, b) => (a.fechaRevision ?? '').localeCompare(b.fechaRevision ?? ''));
  const hoy = misPaginas.filter((p) => diasHasta(p.actualizada) === 0).length;

  const linea =
    vencidas.length > 0
      ? `${plural(vencidas.length, 'página tiene', 'páginas tienen')} la revisión vencida · ${plural(hoy, 'página actualizada', 'páginas actualizadas')} hoy`
      : `Toda la documentación de tu alcance está vigente · ${plural(hoy, 'página actualizada', 'páginas actualizadas')} hoy`;

  return (
    <Lienzo>
      <Encabezado
        titulo="Inicio"
        linea={
          <>
            <span className={vencidas.length ? 'font-medium text-ink' : undefined}>{linea}</span>
            <span className="hidden sm:inline">
              {' '}
              · {yo.perfil === 'super_admin' ? `operando en ${clienteActivo.nombre}` : clienteActivo.nombre}
            </span>
          </>
        }
        acciones={
          misWorkspaces.length > 0 && (
            <Button variant="primary" icon={<Plus size={15} />} onClick={() => setNueva(true)}>
              Nueva página
            </Button>
          )
        }
      />

      {misWorkspaces.length === 0 ? (
        <Panel>
          <PanelHeader titulo="Aún no tienes workspaces asignados" />
          <p className="px-5 py-4 text-[14px] text-muted">
            Un Admin de {clienteActivo.nombre} debe asignarte a un workspace. Cuando lo haga, verás aquí las páginas actualizadas
            recientemente y las que necesitan revisión.
          </p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
          {/* Lo que cambió: la pregunta diaria. */}
          <Panel className="xl:col-span-8" aria-labelledby="h-recientes">
            <PanelHeader
              id="h-recientes"
              titulo="Actualizadas recientemente"
              extra={
                <a href="#/buscar" className="text-[13px] text-muted hover:text-ink">
                  Ver todas
                </a>
              }
            />
            <ul>
              {recientes.map((p) => {
                const r = rutaDe(p);
                const autor = usuario(p.actualizadaPor);
                return (
                  <li key={p.id} className="border-b border-rule last:border-0">
                    <a
                      href={`#/p/${p.id}`}
                      className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3 transition-colors hover:bg-raised sm:grid-cols-[1fr_auto_168px]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-medium">{p.titulo}</span>
                        <span className="block truncate text-[13px] text-muted">
                          {r.espacio.nombre} / {r.coleccion.nombre}
                        </span>
                      </span>
                      <EstadoPill estado={p.estado} />
                      <span className="col-span-2 flex items-center gap-2 text-[13px] text-muted sm:col-span-1 sm:justify-end">
                        {autor && <Avatar nombre={autor.nombre} id={autor.id} size={20} />}
                        <span className="truncate">
                          {autor?.id === yo.id ? 'Tú' : autor?.nombre.split(' ')[0]} · {cuando(p.actualizada)}
                        </span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </Panel>

          {/* Lo que pide atención: revisión vencida y próxima. */}
          <Panel className="order-first xl:order-none xl:col-span-4" aria-labelledby="h-vencidas">
            <PanelHeader
              id="h-vencidas"
              titulo={
                <span className="flex items-center gap-2">
                  Revisión vencida
                  <span className="num rounded bg-danger-bg px-1.5 text-[12px] leading-5 font-medium text-danger-ink">{vencidas.length}</span>
                </span>
              }
            />
            {vencidas.length === 0 ? (
              <Vacio>Ninguna página tiene la revisión vencida.</Vacio>
            ) : (
              <ul>
                {vencidas.map((p) => {
                  const resp = usuario(p.responsableId);
                  const dias = -diasHasta(p.fechaRevision!);
                  return (
                    <li key={p.id} className="border-b border-rule last:border-0">
                      <a href={`#/p/${p.id}`} className="block px-5 py-3 transition-colors hover:bg-raised">
                        <span className="block text-[14px] leading-5 font-medium">{p.titulo}</span>
                        <span className="mt-1 flex items-center justify-between gap-3 text-[13px]">
                          <span className="truncate text-muted">{resp?.nombre}</span>
                          <span className="num flex-none font-medium text-danger">hace {dias} días</span>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
            {proximas.length > 0 && (
              <div className="border-t border-line px-5 pt-3 pb-4">
                <p className="mb-2 text-[12px] text-muted">Vencen en las próximas 3 semanas</p>
                <ul className="flex flex-col gap-2">
                  {proximas.map((p) => (
                    <li key={p.id}>
                      <a href={`#/p/${p.id}`} className="flex items-baseline justify-between gap-3 text-[13px] hover:underline hover:underline-offset-2">
                        <span className="truncate">{p.titulo}</span>
                        <span className="num flex-none text-review-ink">{fechaCorta(p.fechaRevision!)}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>

          {/* Vigencia por workspace y espacio. */}
          <Panel className="xl:col-span-12" aria-labelledby="h-vigencia">
            <PanelHeader id="h-vigencia" titulo="Vigencia de la documentación" extra={<span className="hidden md:block"><LeyendaVigencia /></span>} />
            <div className="divide-y divide-rule">
              {misWorkspaces.map((w) => {
                const es = espacios.filter((e) => e.workspaceId === w.id);
                const deW = misPaginas.filter((p) => es.some((e) => rutaDe(p).espacio.id === e.id));
                const cw = contar(deW);
                return (
                  <div key={w.id} className="px-5 py-4">
                    <div className="mb-3 flex items-baseline justify-between gap-4">
                      <a href={`#/w/${w.id}`} className="text-[14px] font-semibold hover:underline hover:underline-offset-2">
                        {w.nombre}
                      </a>
                      <span className="num text-[13px] text-muted">
                        {cw.total ? Math.round((cw.aprobado / cw.total) * 100) : 0} % aprobado y vigente · {plural(cw.total, 'página', 'páginas')}
                      </span>
                    </div>
                    <ul className="grid grid-cols-1 gap-x-8 gap-y-2.5 md:grid-cols-2">
                      {es.map((e) => {
                        const ks = colecciones.filter((k) => k.espacioId === e.id).map((k) => k.id);
                        const c = contar(misPaginas.filter((p) => ks.includes(p.coleccionId)));
                        return (
                          <li key={e.id}>
                            <a href={`#/e/${e.id}`} className="group grid grid-cols-[minmax(0,180px)_1fr_auto] items-center gap-3">
                              <span className="truncate text-[13px] text-muted group-hover:text-ink">{e.nombre}</span>
                              <BarraVigencia conteo={c} />
                              <span className="num w-14 text-right text-[13px]">
                                {c.vencida > 0 ? <span className="font-medium text-danger">{c.vencida} venc.</span> : <span className="text-muted">{c.total} pág.</span>}
                              </span>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-rule px-5 py-3 md:hidden">
              <LeyendaVigencia />
            </div>
          </Panel>
        </div>
      )}

      <NuevaPagina abierto={nueva} cerrar={() => setNueva(false)} />
    </Lienzo>
  );
}
