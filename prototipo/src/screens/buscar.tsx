import React from 'react';
import { Search } from 'lucide-react';
import { ESTADO_LABEL, TIPO_LABEL, cuando, normalizar, plural } from '../lib/format';
import { ir, useStore } from '../lib/store';
import type { Bloque, EstadoPagina, Pagina, TipoPagina } from '../lib/types';
import { EstadoPill, Panel, cx } from '../ui';
import { Lienzo } from './comun';

const POR_PAGINA = 20;

function textoPlano(bloques: Bloque[]): string {
  const limpiar = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  return bloques
    .map((b) => {
      switch (b.t) {
        case 'p':
          return limpiar(b.html);
        case 'h2':
        case 'h3':
        case 'quote':
          return b.texto;
        case 'ul':
        case 'ol':
          return b.items.map(limpiar).join(' ');
        case 'check':
          return b.items.map((x) => limpiar(x.texto)).join(' ');
        case 'code':
          return b.codigo;
        case 'table':
          return [...b.cabecera, ...b.filas.flat()].map(limpiar).join(' ');
      }
    })
    .join(' ');
}

/** Fragmento de ~180 caracteres alrededor de la primera coincidencia, con la coincidencia marcada. */
function fragmento(texto: string, q: string): React.ReactNode {
  const n = normalizar(texto);
  const i = q ? n.indexOf(q) : -1;
  if (i < 0) return texto.slice(0, 180) + (texto.length > 180 ? '…' : '');
  const ini = Math.max(0, i - 70);
  const fin = Math.min(texto.length, i + q.length + 110);
  return (
    <>
      {ini > 0 && '…'}
      {texto.slice(ini, i)}
      <mark className="hit">{texto.slice(i, i + q.length)}</mark>
      {texto.slice(i + q.length, fin)}
      {fin < texto.length && '…'}
    </>
  );
}

function Resaltar({ texto, q }: { texto: string; q: string }) {
  const i = q ? normalizar(texto).indexOf(q) : -1;
  if (i < 0) return <>{texto}</>;
  return (
    <>
      {texto.slice(0, i)}
      <mark className="hit">{texto.slice(i, i + q.length)}</mark>
      {texto.slice(i + q.length)}
    </>
  );
}

export function Buscar() {
  const { misPaginas, misWorkspaces, rutaDe, usuario, ruta } = useStore();
  const qUrl = ruta.query.get('q') ?? '';
  const [q, setQ] = React.useState(qUrl);
  const [tipo, setTipo] = React.useState<'' | TipoPagina>('');
  const [estado, setEstado] = React.useState<'' | EstadoPagina>('');
  const [ws, setWs] = React.useState('');
  const [pag, setPag] = React.useState(0);

  React.useEffect(() => setQ(qUrl), [qUrl]);
  React.useEffect(() => setPag(0), [q, tipo, estado, ws]);

  const nq = normalizar(q.trim());
  const resultados = React.useMemo(() => {
    const filas: { p: Pagina; texto: string; puntaje: number }[] = [];
    for (const p of misPaginas) {
      if (tipo && p.tipo !== tipo) continue;
      if (estado && p.estado !== estado) continue;
      if (ws && rutaDe(p).workspace.id !== ws) continue;
      const texto = textoPlano(p.contenido);
      const enTitulo = normalizar(p.titulo).includes(nq);
      const enContenido = normalizar(`${texto} ${p.etiquetas.join(' ')}`).includes(nq);
      if (nq && !enTitulo && !enContenido) continue;
      filas.push({ p, texto, puntaje: enTitulo ? 2 : 1 });
    }
    return filas.sort((a, b) => b.puntaje - a.puntaje || b.p.actualizada.localeCompare(a.p.actualizada));
  }, [misPaginas, nq, tipo, estado, ws, rutaDe]);

  const visibles = resultados.slice(pag * POR_PAGINA, (pag + 1) * POR_PAGINA);
  const selCls =
    'h-8 rounded-md border border-control bg-surface pr-7 pl-2.5 text-[13px] text-ink hover:border-faint focus:border-brand focus:outline-none';

  return (
    <Lienzo ancho={1080}>
      <h1 className="mb-4 text-[24px] leading-8 font-semibold tracking-[-0.015em]">Buscar</h1>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          ir(`/buscar?q=${encodeURIComponent(q.trim())}`);
        }}
        className="relative"
      >
        <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-faint" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="¿Cómo se publica…? Busca por título o contenido"
          aria-label="Buscar en títulos y contenido"
          className="h-12 w-full rounded-lg border border-control bg-surface pr-4 pl-11 text-[16px] hover:border-faint focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
        />
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label>
          <span className="sr-only">Workspace</span>
          <select value={ws} onChange={(e) => setWs(e.target.value)} className={selCls}>
            <option value="">Todos mis workspaces</option>
            {misWorkspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Tipo</span>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} className={selCls}>
            <option value="">Todos los tipos</option>
            {(Object.keys(TIPO_LABEL) as TipoPagina[]).map((t) => (
              <option key={t} value={t}>
                {TIPO_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Estado</span>
          <select value={estado} onChange={(e) => setEstado(e.target.value as typeof estado)} className={selCls}>
            <option value="">Todos los estados</option>
            {(Object.keys(ESTADO_LABEL) as EstadoPagina[]).map((s) => (
              <option key={s} value={s}>
                {ESTADO_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <span className="num ml-auto text-[13px] text-muted">
          {resultados.length === 0
            ? 'Sin resultados'
            : `${pag * POR_PAGINA + 1}–${Math.min((pag + 1) * POR_PAGINA, resultados.length)} de ${resultados.length}`}
        </span>
      </div>

      <Panel className="mt-5">
        {resultados.length === 0 ? (
          <div className="px-5 py-6 text-[14px]">
            <p className="font-medium">
              {q.trim() ? `Nada coincide con «${q.trim()}» en lo que puedes ver.` : 'Ninguna página coincide con los filtros.'}
            </p>
            <p className="mt-1 text-muted">
              Prueba con el nombre del proyecto o una etiqueta (por ejemplo <span className="font-mono text-[13px]">iis</span> o{' '}
              <span className="font-mono text-[13px]">azure</span>), o quita los filtros. Si la página está en un workspace al que no estás asignado, no
              aparecerá.
            </p>
          </div>
        ) : (
          <ul>
            {visibles.map(({ p, texto }) => {
              const r = rutaDe(p);
              const resp = usuario(p.responsableId);
              return (
                <li key={p.id} className="border-b border-rule last:border-0">
                  <a href={`#/p/${p.id}`} className="block px-5 py-4 transition-colors hover:bg-raised">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-[15px] font-semibold text-brand-text">
                        <Resaltar texto={p.titulo} q={nq} />
                      </span>
                      <EstadoPill estado={p.estado} />
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-muted">
                      {r.workspace.nombre} / {r.espacio.nombre} / {r.coleccion.nombre}
                    </span>
                    <span className="mt-2 block max-w-[820px] text-[14px] leading-[22px]">{fragmento(texto, nq)}</span>
                    <span className="mt-2 block text-[12px] text-muted">
                      {TIPO_LABEL[p.tipo]} · {resp?.nombre} · actualizada {cuando(p.actualizada).toLowerCase()}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {resultados.length > POR_PAGINA && (
        <div className="mt-4 flex justify-end gap-2">
          <button disabled={pag === 0} onClick={() => setPag(pag - 1)} className={cx(selCls, 'px-3 disabled:opacity-50')}>
            Anterior
          </button>
          <button
            disabled={(pag + 1) * POR_PAGINA >= resultados.length}
            onClick={() => setPag(pag + 1)}
            className={cx(selCls, 'px-3 disabled:opacity-50')}
          >
            Siguiente
          </button>
        </div>
      )}
      <p className="mt-4 text-[12px] text-muted">
        La búsqueda solo devuelve páginas de tus workspaces. {plural(misPaginas.length, 'página', 'páginas')} en tu alcance.
      </p>
    </Lienzo>
  );
}
