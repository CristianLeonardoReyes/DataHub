import React from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { cuando, diasHasta, fechaCorta, fechaLarga, plural, vigencia } from '../lib/format';
import { HOY } from '../lib/mock';
import { useStore } from '../lib/store';
import type { Pagina } from '../lib/types';
import { Avatar, Button, EstadoPill, cx } from '../ui';
import { BarraVigencia, LeyendaVigencia, Lienzo, NuevaPagina, contar } from './comun';

/* ---------- Línea de revisiones: la firma de Inicio ---------- */

const RANGO = 60; // días hacia atrás y hacia adelante de hoy

function colorDe(p: Pagina): string {
  const v = vigencia(p).tipo;
  if (v === 'vencida') return 'var(--danger)';
  if (v === 'proxima') return 'var(--review-signal)';
  return 'var(--leaf)';
}

/**
 * Cada página con fecha de revisión es un punto sobre un eje de 120 días centrado en hoy.
 * A la izquierda lo vencido, a la derecha lo que viene. Lo que cae fuera se acumula en los bordes.
 */
function LineaRevisiones({ paginas }: { paginas: Pagina[] }) {
  const { usuario } = useStore();
  const conFecha = paginas.filter((p) => p.fechaRevision && p.estado !== 'archivado');
  const antes = conFecha.filter((p) => diasHasta(p.fechaRevision!) < -RANGO).length;
  const despues = conFecha.filter((p) => diasHasta(p.fechaRevision!) > RANGO).length;
  const visibles = conFecha
    .filter((p) => Math.abs(diasHasta(p.fechaRevision!)) <= RANGO)
    .sort((a, b) => a.fechaRevision!.localeCompare(b.fechaRevision!));

  // Puntos cercanos (menos de 3 días) se apilan hacia arriba en vez de taparse.
  const pilas = new Map<number, number>();
  const puntos = visibles.map((p) => {
    const d = diasHasta(p.fechaRevision!);
    const cubeta = Math.round(d / 3);
    const nivel = pilas.get(cubeta) ?? 0;
    pilas.set(cubeta, nivel + 1);
    return { p, d, nivel, x: ((d + RANGO) / (RANGO * 2)) * 100 };
  });
  const marcas = [-60, -30, 0, 30, 60];

  // En pantallas angostas el eje se desplaza: arranca centrado en hoy.
  const contenedor = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const c = contenedor.current;
    if (c) c.scrollLeft = (c.scrollWidth - c.clientWidth) / 2;
  }, []);

  return (
    <div ref={contenedor} className="overflow-x-auto pb-1">
      <div className="relative h-[124px] min-w-[560px]">
        {/* Zona vencida: un tinte apenas visible a la izquierda de hoy. */}
        <div className="absolute top-0 bottom-7 left-0 w-1/2 rounded-l-md bg-danger-bg/60" aria-hidden="true" />
        <div className="absolute right-0 bottom-7 left-0 h-px bg-control" aria-hidden="true" />
        <div className="absolute top-0 bottom-7 left-1/2 w-px bg-ink" aria-hidden="true" />
        <span className="absolute top-0 left-1/2 ml-2 text-[12px] font-semibold">Hoy, {fechaCorta(HOY)}</span>

        {marcas.map((m) => (
          <span
            key={m}
            className={cx(
              'num absolute bottom-0 text-[12px] whitespace-nowrap text-muted',
              m === 0 && 'hidden',
              Math.abs(m) !== RANGO && '-translate-x-1/2',
            )}
            // Los extremos se alinean hacia adentro para no salirse del eje.
            style={m === RANGO ? { right: 0 } : { left: `${((m + RANGO) / (RANGO * 2)) * 100}%` }}
            aria-hidden="true"
          >
            {m < 0 ? `hace ${-m} d` : `en ${m} d`}
          </span>
        ))}

        {puntos.map(({ p, d, nivel, x }) => {
          const resp = usuario(p.responsableId);
          const texto = d < 0 ? `vencida hace ${-d} días` : d === 0 ? 'vence hoy' : `vence en ${d} días`;
          return (
            <a
              key={p.id}
              href={`#/p/${p.id}`}
              aria-label={`${p.titulo}: ${texto}`}
              className="group absolute z-10 -translate-x-1/2"
              style={{ left: `${x}%`, bottom: 28 + 6 + nivel * 16 }}
            >
              <span
                className="block h-3 w-3 rounded-full ring-2 ring-surface transition-transform duration-150 group-hover:scale-150 group-focus:scale-150"
                style={{ background: colorDe(p) }}
              />
              <span
                role="tooltip"
                className={cx(
                  'pointer-events-none absolute bottom-5 z-20 hidden w-60 rounded-lg border border-line bg-surface px-3 py-2 text-left shadow-float group-hover:block group-focus:block',
                  x > 70 ? 'right-0' : x < 30 ? 'left-0' : 'left-1/2 -translate-x-1/2',
                )}
              >
                <span className="block text-[13px] leading-[18px] font-medium">{p.titulo}</span>
                <span className="mt-1 block text-[12px] text-muted">
                  {resp?.nombre} · {texto}
                </span>
              </span>
            </a>
          );
        })}

        {antes > 0 && (
          <span className="absolute top-6 left-1 text-[12px] font-medium text-danger">+{antes} más antiguas</span>
        )}
        {despues > 0 && (
          <span className="num absolute top-6 right-0 text-[12px] text-muted">
            {plural(despues, 'página', 'páginas')} después <ArrowRight size={12} className="inline" />
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- Inicio ---------- */

function Seccion({ titulo, extra, children, id }: { titulo: string; extra?: React.ReactNode; children: React.ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className="min-w-0">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id={id} className="text-[15px] font-semibold">
          {titulo}
        </h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

export function Inicio() {
  const { misPaginas, misWorkspaces, espacios, colecciones, rutaDe, usuario, yo, clienteActivo } = useStore();
  const [nueva, setNueva] = React.useState(false);

  const recientes = [...misPaginas].sort((a, b) => b.actualizada.localeCompare(a.actualizada)).slice(0, 5);
  const porRevisar = misPaginas
    .filter((p) => ['vencida', 'proxima'].includes(vigencia(p).tipo))
    .sort((a, b) => (a.fechaRevision ?? '').localeCompare(b.fechaRevision ?? ''));
  const vencidas = porRevisar.filter((p) => vigencia(p).tipo === 'vencida').length;
  const proximas = porRevisar.length - vencidas;
  const total = contar(misPaginas);
  const pct = total.total ? Math.round((total.aprobado / total.total) * 100) : 0;
  const hoyTexto = fechaLarga(HOY).replace(/ \d{4}$/, '');

  if (misWorkspaces.length === 0)
    return (
      <Lienzo ancho={720}>
        <h1 className="text-[24px] leading-8 font-semibold tracking-[-0.015em]">Inicio</h1>
        <p className="mt-3 text-[15px] text-muted">
          Aún no tienes workspaces asignados. Un Admin de {clienteActivo.nombre} debe asignarte a uno; cuando lo haga, aquí verás qué cambió y qué
          necesita revisión.
        </p>
      </Lienzo>
    );

  return (
    <Lienzo>
      {/* Título y acción principal. */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] leading-8 font-semibold tracking-[-0.015em]">Inicio</h1>
          <p className="text-[14px] text-muted">
            {hoyTexto} · {yo.perfil === 'super_admin' ? `operando en ${clienteActivo.nombre}` : clienteActivo.nombre}
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={15} />} onClick={() => setNueva(true)}>
          Nueva página
        </Button>
      </div>

      {/* La respuesta: ¿la documentación está al día? */}
      <section aria-labelledby="h-salud" className="rounded-xl border border-line bg-surface px-6 pt-6 pb-5">
        <div className="grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-[260px_1fr]">
          <div className="flex flex-col justify-between gap-4">
            <div>
              <h2 id="h-salud" className="text-[14px] text-muted">
                Documentación al día
              </h2>
              <p className="mt-1 flex items-baseline gap-1">
                <span className="num text-[40px] leading-[44px] font-semibold tracking-[-0.03em]">{pct}</span>
                <span className="text-[20px] font-semibold text-muted">%</span>
              </p>
              <p className="mt-1 text-[14px] leading-5 text-muted">
                {total.aprobado} de {plural(total.total, 'página', 'páginas')} aprobadas y vigentes en tus workspaces.
              </p>
            </div>
            <div className="flex flex-col gap-1.5 text-[14px]">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-danger" aria-hidden="true" />
                <span className="num font-semibold">{vencidas}</span> con revisión vencida
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--review-signal)]" aria-hidden="true" />
                <span className="num font-semibold">{proximas}</span> vencen en 3 semanas
              </span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="mb-2 text-[13px] text-muted">Línea de revisiones · toca o pasa el cursor sobre un punto para ver la página</p>
            <LineaRevisiones paginas={misPaginas} />
          </div>
        </div>
      </section>

      <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-10 xl:grid-cols-2">
        {/* Lo que pide acción va primero. */}
        <Seccion
          id="h-revisar"
          titulo="Por revisar"
          extra={<span className="num text-[13px] text-muted">{plural(porRevisar.length, 'página', 'páginas')}</span>}
        >
          {porRevisar.length === 0 ? (
            <p className="rounded-lg border border-dashed border-control px-4 py-3 text-[14px] text-muted">
              Nada por revisar en las próximas 3 semanas.
            </p>
          ) : (
            <ul className="divide-y divide-rule rounded-lg border border-line bg-surface">
              {porRevisar.slice(0, 5).map((p) => {
                const d = diasHasta(p.fechaRevision!);
                const resp = usuario(p.responsableId);
                return (
                  <li key={p.id}>
                    <a href={`#/p/${p.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-raised">
                      <span className="h-2 w-2 flex-none rounded-full" style={{ background: colorDe(p) }} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium">{p.titulo}</span>
                        <span className="block truncate text-[13px] text-muted">{resp?.nombre}</span>
                      </span>
                      <span className={cx('num flex-none text-right text-[13px]', d < 0 ? 'font-medium text-danger' : 'text-review-ink')}>
                        {d < 0 ? `hace ${-d} d` : `en ${d} d`}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </Seccion>

        <Seccion
          id="h-recientes"
          titulo="Actualizadas recientemente"
          extra={
            <a href="#/buscar" className="text-[13px] text-muted hover:text-ink">
              Ver todas
            </a>
          }
        >
          <ul className="divide-y divide-rule rounded-lg border border-line bg-surface">
            {recientes.map((p) => {
              const autor = usuario(p.actualizadaPor);
              const r = rutaDe(p);
              return (
                <li key={p.id}>
                  <a href={`#/p/${p.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-raised">
                    {autor && <Avatar nombre={autor.nombre} id={autor.id} size={24} />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium">{p.titulo}</span>
                      <span className="block truncate text-[13px] text-muted">
                        {r.espacio.nombre} · {autor?.id === yo.id ? 'tú' : autor?.nombre.split(' ')[0]}, {cuando(p.actualizada).toLowerCase()}
                      </span>
                    </span>
                    <EstadoPill estado={p.estado} />
                  </a>
                </li>
              );
            })}
          </ul>
        </Seccion>
      </div>

      {/* Vigencia por espacio, sin cajas: filas sobre el fondo. */}
      <section aria-labelledby="h-espacios" className="mt-12">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="h-espacios" className="text-[15px] font-semibold">
            Vigencia por espacio
          </h2>
          <LeyendaVigencia />
        </div>
        <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
          {misWorkspaces.map((w) => (
            <div key={w.id}>
              <a href={`#/w/${w.id}`} className="text-[13px] font-medium text-muted hover:text-ink">
                {w.nombre}
              </a>
              <ul className="mt-2 flex flex-col gap-2.5">
                {espacios
                  .filter((e) => e.workspaceId === w.id)
                  .map((e) => {
                    const ks = colecciones.filter((k) => k.espacioId === e.id).map((k) => k.id);
                    const c = contar(misPaginas.filter((p) => ks.includes(p.coleccionId)));
                    return (
                      <li key={e.id}>
                        <a href={`#/e/${e.id}`} className="group block">
                          <span className="mb-1.5 flex items-baseline justify-between gap-3 text-[14px]">
                            <span className="truncate group-hover:underline group-hover:underline-offset-2">{e.nombre}</span>
                            <span className="num flex-none text-[12px]">
                              {c.vencida > 0 ? (
                                <span className="font-medium text-danger">{plural(c.vencida, 'vencida', 'vencidas')}</span>
                              ) : (
                                <span className="text-muted">{plural(c.total, 'página', 'páginas')}</span>
                              )}
                            </span>
                          </span>
                          <BarraVigencia conteo={c} alto={6} />
                        </a>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <NuevaPagina abierto={nueva} cerrar={() => setNueva(false)} />
    </Lienzo>
  );
}
