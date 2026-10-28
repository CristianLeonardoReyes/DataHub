import React from 'react';
import { ChevronRight } from 'lucide-react';
import { TIPO_LABEL, vigencia } from '../lib/format';
import { ir, useStore } from '../lib/store';
import type { Pagina, TipoPagina } from '../lib/types';
import { Button, Campo, Dialogo, cx, inputCls } from '../ui';

/** Lienzo de las pantallas de trabajo: fluido, un solo margen. */
export function Lienzo({ children, ancho }: { children: React.ReactNode; ancho?: number }) {
  return (
    <div className="mx-auto w-full px-4 pt-6 pb-16 sm:px-6 lg:px-10 lg:pt-9" style={{ maxWidth: ancho ?? 1320 }}>
      {children}
    </div>
  );
}

export function Migas({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Ruta" className="mb-2 flex min-w-0 flex-wrap items-center gap-1 text-[13px] text-muted">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight size={13} className="flex-none text-faint" aria-hidden="true" />}
          {it.href ? (
            <a href={it.href} className="truncate rounded px-0.5 hover:text-ink hover:underline hover:underline-offset-2">
              {it.label}
            </a>
          ) : (
            <span className="truncate px-0.5">{it.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export function Encabezado({
  titulo,
  linea,
  acciones,
  migas,
}: {
  titulo: React.ReactNode;
  linea?: React.ReactNode;
  acciones?: React.ReactNode;
  migas?: { label: string; href?: string }[];
}) {
  return (
    <div className="mb-7">
      {migas && <Migas items={migas} />}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-[24px] leading-8 font-semibold tracking-[-0.015em]">{titulo}</h1>
          {linea && <p className="mt-1 text-[15px] leading-6 text-muted">{linea}</p>}
        </div>
        {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
      </div>
    </div>
  );
}

/* ---------- Barra de vigencia: la firma de DataHub ---------- */

export interface Conteo {
  aprobado: number;
  en_revision: number;
  borrador: number;
  vencida: number;
  total: number;
}

/** Cada página cae en una sola categoría; vencida gana sobre su estado. Archivadas fuera. */
export function contar(paginas: Pagina[]): Conteo {
  const c: Conteo = { aprobado: 0, en_revision: 0, borrador: 0, vencida: 0, total: 0 };
  for (const p of paginas) {
    if (p.estado === 'archivado') continue;
    c.total++;
    if (vigencia(p).tipo === 'vencida') c.vencida++;
    else c[p.estado]++;
  }
  console.assert(c.aprobado + c.en_revision + c.borrador + c.vencida === c.total, 'conteo de vigencia');
  return c;
}

export const SEGMENTOS = [
  { clave: 'aprobado', label: 'Aprobadas y vigentes', color: 'var(--leaf)' },
  { clave: 'en_revision', label: 'En revisión', color: 'var(--review-signal)' },
  { clave: 'borrador', label: 'Borrador', color: 'var(--control)' },
  { clave: 'vencida', label: 'Revisión vencida', color: 'var(--danger)' },
] as const;

export function BarraVigencia({ conteo, alto = 8 }: { conteo: Conteo; alto?: number }) {
  if (conteo.total === 0)
    return <div className="w-full rounded-full border border-dashed border-control" style={{ height: alto }} aria-label="Sin páginas" />;
  const desc = SEGMENTOS.map((s) => `${conteo[s.clave]} ${s.label.toLowerCase()}`).join(', ');
  return (
    <div className="flex w-full gap-[2px] overflow-hidden rounded-full" style={{ height: alto }} role="img" aria-label={desc}>
      {SEGMENTOS.map((s) =>
        conteo[s.clave] > 0 ? (
          <span key={s.clave} title={`${s.label}: ${conteo[s.clave]}`} style={{ flex: conteo[s.clave], background: s.color }} />
        ) : null,
      )}
    </div>
  );
}

export function LeyendaVigencia({ conteo }: { conteo?: Conteo }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
      {SEGMENTOS.map((s) => (
        <li key={s.clave} className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden="true" />
          {s.label}
          {conteo && <span className="num text-ink">{conteo[s.clave]}</span>}
        </li>
      ))}
    </ul>
  );
}

/* ---------- Nueva página ---------- */

const TIPOS = Object.keys(TIPO_LABEL) as TipoPagina[];

export function NuevaPagina({
  abierto,
  cerrar,
  coleccionId,
  padreId,
}: {
  abierto: boolean;
  cerrar: () => void;
  coleccionId?: string;
  padreId?: string;
}) {
  const { misWorkspaces, espacios, colecciones, setPaginas, yo, avisar } = useStore();
  const opciones = React.useMemo(() => {
    const ws = new Set(misWorkspaces.map((w) => w.id));
    return colecciones
      .map((k) => {
        const e = espacios.find((x) => x.id === k.espacioId)!;
        return { k, e, w: misWorkspaces.find((w) => w.id === e.workspaceId) };
      })
      .filter((o) => o.w && ws.has(o.w.id));
  }, [misWorkspaces, espacios, colecciones]);

  const [titulo, setTitulo] = React.useState('');
  const [col, setCol] = React.useState(coleccionId ?? opciones[0]?.k.id ?? '');
  const [tipo, setTipo] = React.useState<TipoPagina>('runbook');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (abierto) {
      setTitulo('');
      setError(null);
      setCol(coleccionId ?? opciones[0]?.k.id ?? '');
    }
  }, [abierto, coleccionId, opciones]);

  const crear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setError('Escribe un título para la página.');
      return;
    }
    const id = `p-nueva-${Date.now()}`;
    setPaginas((ps) => [
      {
        id,
        coleccionId: col,
        padreId: padreId ?? null,
        titulo: titulo.trim(),
        tipo,
        estado: 'borrador',
        responsableId: yo.id,
        fechaRevision: null,
        actualizada: '2026-10-26T10:15',
        actualizadaPor: yo.id,
        creadaPor: yo.id,
        etiquetas: [],
        resumen: '',
        contenido: [{ t: 'p', html: '' }],
        adjuntos: [],
      },
      ...ps,
    ]);
    cerrar();
    avisar('Página creada como borrador');
    ir(`/p/${id}`);
  };

  return (
    <Dialogo abierto={abierto} cerrar={cerrar} titulo={padreId ? 'Nueva subpágina' : 'Nueva página'}>
      <form onSubmit={crear} className="flex flex-col gap-4 p-5">
        <Campo label="Título" htmlFor="np-titulo" error={error}>
          <input
            id="np-titulo"
            autoFocus
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej.: Publicar App Recaudos en producción"
            className={inputCls}
          />
        </Campo>
        {!padreId && (
          <Campo label="Colección" htmlFor="np-col">
            <select id="np-col" value={col} onChange={(e) => setCol(e.target.value)} className={inputCls}>
              {opciones.map(({ k, e }) => (
                <option key={k.id} value={k.id}>
                  {e.nombre} / {k.nombre}
                </option>
              ))}
            </select>
          </Campo>
        )}
        <Campo label="Tipo" htmlFor="np-tipo" ayuda="Se crea como borrador; puedes cambiar tipo y estado después.">
          <select id="np-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoPagina)} className={inputCls}>
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {TIPO_LABEL[t]}
              </option>
            ))}
          </select>
        </Campo>
        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" onClick={cerrar}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Crear página
          </Button>
        </div>
      </form>
    </Dialogo>
  );
}

export function Seg({
  opciones,
  valor,
  cambiar,
  etiqueta,
}: {
  opciones: { id: string; label: string; n?: number }[];
  valor: string;
  cambiar: (id: string) => void;
  etiqueta: string;
}) {
  return (
    <div role="tablist" aria-label={etiqueta} className="-mb-px flex gap-5 overflow-x-auto">
      {opciones.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={valor === o.id}
          onClick={() => cambiar(o.id)}
          className={cx(
            'flex h-10 flex-none items-center gap-1.5 border-b-2 text-[14px] transition-colors',
            valor === o.id ? 'border-ink font-medium text-ink' : 'border-transparent text-muted hover:text-ink',
          )}
        >
          {o.label}
          {o.n !== undefined && <span className="num text-[12px] text-faint">{o.n}</span>}
        </button>
      ))}
    </div>
  );
}
