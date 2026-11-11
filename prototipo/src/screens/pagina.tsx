import React from 'react';
import {
  Bold,
  Code2,
  Copy,
  Download,
  FileText,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  MoreHorizontal,
  Plus,
  Quote,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { Bloques, aMarkdown, nombreArchivo } from '../lib/contenido';
import { ESTADO_LABEL, TIPO_LABEL, cuando, fechaLarga, normalizar, plural, vigencia } from '../lib/format';
import { HOY } from '../lib/mock';
import { ir, puede, useStore } from '../lib/store';
import type { EstadoPagina, Pagina, TipoPagina } from '../lib/types';
import { Avatar, Button, Dialogo, EstadoPill, IconButton, Kbd, Menu, MenuItem, VigenciaTexto, cx } from '../ui';
import { Migas, NuevaPagina, Seg } from './comun';
import { Archivos } from './archivos';
import { NoEncontrado } from './jerarquia';

type Guardado = 'guardado' | 'editando' | 'guardando' | 'error';

function Indicador({ estado, hora }: { estado: Guardado; hora: string }) {
  const map: Record<Guardado, { texto: string; color: string }> = {
    editando: { texto: 'Editando', color: 'var(--faint)' },
    guardando: { texto: 'Guardando…', color: 'var(--review-signal)' },
    guardado: { texto: `Guardado ${hora}`, color: 'var(--leaf)' },
    error: { texto: 'Error al guardar', color: 'var(--danger)' },
  };
  const m = map[estado];
  return (
    <span role="status" aria-live="polite" className="flex items-center gap-1.5 text-[13px] whitespace-nowrap text-muted">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} aria-hidden="true" />
      <span className={estado === 'error' ? 'font-medium text-danger' : undefined}>{m.texto}</span>
    </span>
  );
}

/* ---------- Editor ---------- */

const HERRAMIENTAS: { icono: React.ReactNode; label: string; cmd: [string, string?] }[] = [
  { icono: <Heading2 size={16} />, label: 'Título', cmd: ['formatBlock', 'h2'] },
  { icono: <Heading3 size={16} />, label: 'Subtítulo', cmd: ['formatBlock', 'h3'] },
  { icono: <Bold size={16} />, label: 'Negrita (Ctrl+B)', cmd: ['bold'] },
  { icono: <Italic size={16} />, label: 'Cursiva (Ctrl+I)', cmd: ['italic'] },
  { icono: <List size={16} />, label: 'Lista', cmd: ['insertUnorderedList'] },
  { icono: <ListOrdered size={16} />, label: 'Lista numerada', cmd: ['insertOrderedList'] },
  { icono: <Quote size={16} />, label: 'Cita', cmd: ['formatBlock', 'blockquote'] },
  { icono: <Code2 size={16} />, label: 'Bloque de código', cmd: ['formatBlock', 'pre'] },
];

// Memorizado por página: React no vuelve a tocar el DOM que el usuario edita.
const Documento = React.memo(
  function Documento({ pagina, alEditar }: { pagina: Pagina; alEditar: () => void }) {
    return (
      <div
        className="doc min-h-[240px]"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Contenido de la página"
        onInput={alEditar}
        data-vacio={pagina.contenido.length === 1 && pagina.contenido[0].t === 'p' && !pagina.contenido[0].html ? '' : undefined}
      >
        <Bloques bloques={pagina.contenido} />
      </div>
    );
  },
  (a, b) => a.pagina.id === b.pagina.id,
);

/* ---------- Propiedades (metadata y etiquetas, módulo 6) ---------- */

const selCls =
  'h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-[13px] text-ink transition-colors hover:border-control focus:border-brand focus:outline-none';

function Fila({ label, children, htmlFor }: { label: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="grid grid-cols-[104px_1fr] items-center gap-2 py-1">
      <label htmlFor={htmlFor} className="text-[13px] text-muted">
        {label}
      </label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Propiedades({ p, cambiar }: { p: Pagina; cambiar: (parche: Partial<Pagina>) => void }) {
  const { yo, usuarios, clienteActivo, misPaginas, usuario } = useStore();
  const puedeAprobar = puede(yo, 'paginas.aprobar');
  const [tag, setTag] = React.useState('');
  const sugerencias = [...new Set(misPaginas.flatMap((x) => x.etiquetas))].filter((t) => !p.etiquetas.includes(t)).sort();
  const personas = usuarios.filter((u) => u.clienteId === clienteActivo.id && u.estado === 'activo');

  const agregar = (valor: string) => {
    const n = normalizar(valor).trim().replace(/\s+/g, '-');
    if (n && !p.etiquetas.includes(n)) cambiar({ etiquetas: [...p.etiquetas, n] });
    setTag('');
  };

  return (
    <div className="flex flex-col">
      <Fila label="Estado" htmlFor="prop-estado">
        <select
          id="prop-estado"
          value={p.estado}
          onChange={(e) => cambiar({ estado: e.target.value as EstadoPagina })}
          className={selCls}
        >
          {(Object.keys(ESTADO_LABEL) as EstadoPagina[]).map((s) => (
            <option key={s} value={s} disabled={s === 'aprobado' && !puedeAprobar && p.estado !== 'aprobado'}>
              {ESTADO_LABEL[s]}
              {s === 'aprobado' && !puedeAprobar ? ' (Coordinador o superior)' : ''}
            </option>
          ))}
        </select>
      </Fila>
      <Fila label="Tipo" htmlFor="prop-tipo">
        <select id="prop-tipo" value={p.tipo} onChange={(e) => cambiar({ tipo: e.target.value as TipoPagina })} className={selCls}>
          {(Object.keys(TIPO_LABEL) as TipoPagina[]).map((t) => (
            <option key={t} value={t}>
              {TIPO_LABEL[t]}
            </option>
          ))}
        </select>
      </Fila>
      <Fila label="Responsable" htmlFor="prop-resp">
        <select id="prop-resp" value={p.responsableId} onChange={(e) => cambiar({ responsableId: e.target.value })} className={selCls}>
          {personas.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre}
            </option>
          ))}
        </select>
      </Fila>
      <Fila label="Revisión" htmlFor="prop-rev">
        <input
          id="prop-rev"
          type="date"
          value={p.fechaRevision ?? ''}
          onChange={(e) => cambiar({ fechaRevision: e.target.value || null })}
          className={cx(selCls, 'num font-mono')}
        />
      </Fila>
      <div className="grid grid-cols-[104px_1fr] gap-2 py-1">
        <span className="pt-1.5 text-[13px] text-muted">Etiquetas</span>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {p.etiquetas.map((t) => (
            <span key={t} className="inline-flex h-6 items-center gap-1 rounded border border-line bg-raised pr-1 pl-2 text-[12px]">
              {t}
              <button
                aria-label={`Quitar etiqueta ${t}`}
                onClick={() => cambiar({ etiquetas: p.etiquetas.filter((x) => x !== t) })}
                className="flex h-4 w-4 items-center justify-center rounded text-faint hover:bg-active hover:text-ink"
              >
                <X size={11} />
              </button>
            </span>
          ))}
          <input
            value={tag}
            list="sug-etiquetas"
            aria-label="Añadir etiqueta"
            placeholder="Añadir…"
            onChange={(e) => setTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                agregar(tag);
              }
            }}
            onBlur={() => tag && agregar(tag)}
            className="h-6 min-w-[88px] flex-1 basis-[88px] rounded bg-transparent px-1 text-[12px] focus:outline-none"
          />
          <datalist id="sug-etiquetas">
            {sugerencias.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="mt-3 border-t border-rule pt-3 text-[12px] leading-5 text-muted">
        <p>
          Creada por {usuario(p.creadaPor)?.nombre}
        </p>
        <p>
          Última edición: {usuario(p.actualizadaPor)?.nombre}, {cuando(p.actualizada).toLowerCase()}
        </p>
      </div>
    </div>
  );
}

/* ---------- Página ---------- */

export function VistaPagina({ id }: { id: string }) {
  const { misPaginas, paginas, setPaginas, rutaDe, usuario, yo, ruta, avisar } = useStore();
  const p = misPaginas.find((x) => x.id === id);
  const [guardado, setGuardado] = React.useState<Guardado>('guardado');
  const [hora, setHora] = React.useState('09:42');
  const [conflicto, setConflicto] = React.useState(false);
  const [exportar, setExportar] = React.useState(false);
  const [borrar, setBorrar] = React.useState(false);
  const [subpagina, setSubpagina] = React.useState(false);
  const temporizador = React.useRef<number | undefined>(undefined);
  const fallar = React.useRef(false);
  const [falloSubida, setFalloSubida] = React.useState(false);

  React.useEffect(() => {
    setGuardado('guardado');
    setConflicto(false);
    setHora(p ? p.actualizada.slice(11, 16) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const guardar = React.useCallback(() => {
    window.clearTimeout(temporizador.current);
    setGuardado('editando');
    // Autosave 1,5 s después de la última edición.
    temporizador.current = window.setTimeout(() => {
      setGuardado('guardando');
      window.setTimeout(() => {
        if (fallar.current) {
          fallar.current = false;
          setGuardado('error');
          return;
        }
        setGuardado('guardado');
        setHora(new Date().toTimeString().slice(0, 5));
      }, 700);
    }, 1500);
  }, []);

  if (!p) return <NoEncontrado />;

  const r = rutaDe(p);
  const hijas = paginas.filter((x) => x.padreId === p.id);
  const resp = usuario(p.responsableId);
  const v = vigencia(p);
  const tab = ruta.query.get('tab') === 'archivos' ? 'archivos' : 'contenido';
  const rutaTexto = [r.workspace.nombre, r.espacio.nombre, r.coleccion.nombre, ...r.padres.map((x) => x.titulo)].join(' / ');
  const markdown = exportar ? aMarkdown(p, rutaTexto, resp) : '';

  const cambiar = (parche: Partial<Pagina>) => {
    setPaginas((ps) => ps.map((x) => (x.id === p.id ? { ...x, ...parche, actualizada: `${HOY}T${new Date().toTimeString().slice(0, 5)}`, actualizadaPor: yo.id } : x)));
    guardar();
  };

  const comando = (cmd: [string, string?]) => {
    // execCommand basta para el prototipo; el editor real es Tiptap.
    document.execCommand(cmd[0], false, cmd[1]);
    guardar();
  };

  return (
    <>
      {/* Barra de la página: ruta, guardado y acciones. */}
      <div className="sticky top-12 z-20 border-b border-line bg-ground lg:top-0">
        <div className="mx-auto flex min-h-12 max-w-[1320px] flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 sm:px-6 lg:px-10">
          <div className="min-w-0 flex-1 [&>nav]:mb-0">
            <Migas
              items={[
                { label: r.workspace.nombre, href: `#/w/${r.workspace.id}` },
                { label: r.espacio.nombre, href: `#/e/${r.espacio.id}` },
                { label: r.coleccion.nombre, href: `#/e/${r.espacio.id}?c=${r.coleccion.id}` },
                ...r.padres.map((x) => ({ label: x.titulo, href: `#/p/${x.id}` })),
              ]}
            />
          </div>
          <Indicador estado={guardado} hora={hora} />
          <div className="flex items-center gap-1">
            <Button size="sm" icon={<Download size={14} />} onClick={() => setExportar(true)}>
              <span>
                <span className="hidden sm:inline">Exportar a </span>Markdown
              </span>
            </Button>
            <Menu
              alinear="derecha"
              ancho={248}
              boton={({ alternar, abierto }) => (
                <IconButton label="Más acciones" aria-expanded={abierto} onClick={alternar}>
                  <MoreHorizontal size={17} />
                </IconButton>
              )}
            >
              {(cerrar) => (
                <>
                  <MenuItem
                    onClick={() => {
                      cerrar();
                      setSubpagina(true);
                    }}
                  >
                    <Plus size={15} className="text-faint" /> Nueva subpágina
                  </MenuItem>
                  {puede(yo, 'paginas.eliminar', { creadaPor: p.creadaPor, subpaginas: hijas.length }) && (
                    <MenuItem
                      peligro
                      onClick={() => {
                        cerrar();
                        setBorrar(true);
                      }}
                    >
                      <Trash2 size={15} /> Eliminar página
                    </MenuItem>
                  )}
                  <div className="my-1 border-t border-rule" />
                  <p className="px-2.5 pt-1 pb-1 text-[12px] text-muted">Simular en el prototipo</p>
                  <MenuItem
                    onClick={() => {
                      cerrar();
                      setConflicto(true);
                    }}
                  >
                    Conflicto: otra persona guardó (409)
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      cerrar();
                      fallar.current = true;
                      guardar();
                    }}
                  >
                    Error al guardar
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      cerrar();
                      setFalloSubida(true);
                      ir(`/p/${p.id}?tab=archivos`);
                      avisar('La próxima subida fallará a mitad de camino');
                    }}
                  >
                    Corte de red al subir archivos
                  </MenuItem>
                </>
              )}
            </Menu>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1320px] px-4 pt-6 pb-20 sm:px-6 lg:px-10 lg:pt-8">
        <div className="grid grid-cols-1 gap-x-12 gap-y-8 xl:grid-cols-[minmax(0,1fr)_300px]">
          <article className="min-w-0">
            {conflicto && (
              <div role="alert" className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-danger/30 bg-danger-bg px-4 py-3 text-[14px] text-danger-ink">
                <span className="min-w-0 flex-1">
                  <strong className="font-semibold">Camila Torres guardó cambios en esta página hace un momento.</strong> Recarga para ver la última versión.
                  No se sobrescribió nada.
                </span>
                <Button
                  size="sm"
                  icon={<RefreshCw size={14} />}
                  onClick={() => {
                    setConflicto(false);
                    avisar('Página recargada con la última versión');
                  }}
                >
                  Recargar
                </Button>
              </div>
            )}
            {guardado === 'error' && (
              <div role="alert" className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-[14px]">
                <span className="min-w-0 flex-1">No pudimos guardar tus últimos cambios. Siguen en esta pantalla; vuelve a intentarlo.</span>
                <Button size="sm" onClick={guardar}>
                  Reintentar
                </Button>
              </div>
            )}

            <div className="max-w-[720px]">
              <label htmlFor="titulo-pagina" className="sr-only">
                Título
              </label>
              <textarea
                id="titulo-pagina"
                key={p.id}
                rows={1}
                defaultValue={p.titulo}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = 'auto';
                  t.style.height = `${t.scrollHeight}px`;
                }}
                onBlur={(e) => e.target.value.trim() && e.target.value !== p.titulo && cambiar({ titulo: e.target.value.trim() })}
                ref={(t) => {
                  if (t) {
                    t.style.height = 'auto';
                    t.style.height = `${t.scrollHeight}px`;
                  }
                }}
                className="block w-full resize-none overflow-hidden bg-transparent text-[30px] leading-[38px] font-semibold tracking-[-0.02em] focus:outline-none focus-visible:outline-none"
              />
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-muted">
                <EstadoPill estado={p.estado} />
                <span>{TIPO_LABEL[p.tipo]}</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1.5">
                  {resp && <Avatar nombre={resp.nombre} id={resp.id} size={20} />}
                  {resp?.nombre}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Revisión: <VigenciaTexto pagina={p} />
                </span>
              </div>

              {v.tipo === 'vencida' && (
                <div className="mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-[14px]">
                  <span className="min-w-0 flex-1">
                    La revisión venció el {fechaLarga(p.fechaRevision!)}. Confirma que el contenido sigue vigente y define la próxima fecha.
                  </span>
                  <Button
                    size="sm"
                    onClick={() => {
                      cambiar({ fechaRevision: '2027-04-26' });
                      avisar('Revisión registrada; próxima el 26 abr 2027');
                    }}
                  >
                    Marcar como revisada
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-6 max-w-[720px] border-b border-line">
              <Seg
                etiqueta="Secciones de la página"
                valor={tab}
                cambiar={(t) => ir(`/p/${p.id}${t === 'archivos' ? '?tab=archivos' : ''}`)}
                opciones={[
                  { id: 'contenido', label: 'Contenido' },
                  { id: 'archivos', label: 'Archivos', n: p.adjuntos.length },
                ]}
              />
            </div>

            {tab === 'contenido' ? (
              <>
                <div
                  role="toolbar"
                  aria-label="Formato"
                  className="sticky top-[97px] z-10 -mx-1 mt-3 mb-4 flex max-w-[730px] flex-wrap items-center gap-0.5 bg-ground py-1 lg:top-[49px]"
                >
                  {HERRAMIENTAS.map((h) => (
                    <IconButton key={h.label} label={h.label} onMouseDown={(e) => e.preventDefault()} onClick={() => comando(h.cmd)}>
                      {h.icono}
                    </IconButton>
                  ))}
                  <span className="ml-auto hidden items-center gap-1.5 text-[12px] text-muted sm:flex">
                    Guardado automático <Kbd>1,5 s</Kbd>
                  </span>
                </div>
                <Documento pagina={p} alEditar={guardar} />

                <section className="mt-12 max-w-[720px]" aria-labelledby="h-sub">
                  <div className="mb-2 flex items-center justify-between">
                    <h2 id="h-sub" className="text-[14px] font-semibold">
                      Subpáginas <span className="num font-normal text-muted">{hijas.length}</span>
                    </h2>
                    <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => setSubpagina(true)}>
                      Nueva subpágina
                    </Button>
                  </div>
                  {hijas.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-control px-4 py-3 text-[14px] text-muted">
                      Sin subpáginas. Úsalas para dividir un proceso largo, por ejemplo la reversión o los contactos.
                    </p>
                  ) : (
                    <ul className="rounded-lg border border-line bg-surface">
                      {hijas.map((h) => (
                        <li key={h.id} className="border-b border-rule last:border-0">
                          <a href={`#/p/${h.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-raised">
                            <FileText size={16} className="flex-none text-faint" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[14px] font-medium">{h.titulo}</span>
                              <span className="block truncate text-[13px] text-muted">{h.resumen}</span>
                            </span>
                            <EstadoPill estado={h.estado} />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            ) : (
              <div className="mt-5 max-w-[720px]">
                <Archivos p={p} cambiar={cambiar} simularFallo={falloSubida} alConsumirFallo={() => setFalloSubida(false)} />
              </div>
            )}
          </article>

          <aside aria-label="Propiedades de la página" className="xl:sticky xl:top-[72px] xl:self-start">
            <div className="rounded-lg border border-line bg-surface px-4 py-3">
              <h2 className="mb-1 text-[14px] font-semibold">Propiedades</h2>
              <Propiedades p={p} cambiar={cambiar} />
            </div>
            {p.adjuntos.length > 0 && tab === 'contenido' && (
              <a
                href={`#/p/${p.id}?tab=archivos`}
                className="mt-3 flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-3 text-[13px] hover:bg-raised"
              >
                <span className="font-medium">{plural(p.adjuntos.length, 'archivo adjunto', 'archivos adjuntos')}</span>
                <span className="text-muted">Ver</span>
              </a>
            )}
          </aside>
        </div>
      </div>

      {/* Exportar a Markdown (módulo 9). */}
      <Dialogo abierto={exportar} cerrar={() => setExportar(false)} titulo="Exportar a Markdown" ancho={760}>
        <div className="p-5">
          <p className="mb-3 text-[14px] text-muted">
            <span className="font-mono text-[13px] text-ink">{nombreArchivo(p.titulo)}</span> · encabezado YAML con estado, tipo, ruta, responsable,
            etiquetas y fechas.
          </p>
          <pre className="max-h-[52vh] overflow-auto rounded-lg border border-line bg-code px-4 py-3 font-mono text-[12.5px] leading-5 whitespace-pre-wrap">
            {markdown}
          </pre>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              icon={<Copy size={14} />}
              onClick={() => {
                navigator.clipboard?.writeText(markdown);
                avisar('Markdown copiado');
              }}
            >
              Copiar
            </Button>
            <Button
              variant="primary"
              icon={<Download size={14} />}
              onClick={() => {
                const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown' }));
                const a = document.createElement('a');
                a.href = url;
                a.download = nombreArchivo(p.titulo);
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Descargar .md
            </Button>
          </div>
        </div>
      </Dialogo>

      <Dialogo abierto={borrar} cerrar={() => setBorrar(false)} titulo="Eliminar página">
        <div className="p-5 text-[14px]">
          <p>
            Se eliminará <strong>{p.titulo}</strong>
            {hijas.length > 0 ? ` y sus ${plural(hijas.length, 'subpágina', 'subpáginas')}` : ''}. Dejará de aparecer en la navegación y en la
            búsqueda.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button onClick={() => setBorrar(false)}>Cancelar</Button>
            <Button
              variant="danger"
              icon={<Trash2 size={14} />}
              onClick={() => {
                const quitar = new Set([p.id, ...hijas.map((h) => h.id)]);
                setPaginas((ps) => ps.filter((x) => !quitar.has(x.id)));
                avisar('Página eliminada');
                ir(`/e/${r.espacio.id}`);
              }}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Dialogo>

      <NuevaPagina abierto={subpagina} cerrar={() => setSubpagina(false)} coleccionId={p.coleccionId} padreId={p.id} />
    </>
  );
}
