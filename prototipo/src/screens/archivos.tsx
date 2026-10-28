import React from 'react';
import { AlertTriangle, Download, Eye, File, FileImage, FileText, FileVideo, Info, Music, RotateCcw, Trash2, Upload, X } from 'lucide-react';
import { cuando, fechaLarga, tamano } from '../lib/format';
import { AHORA } from '../lib/mock';
import { puede, useStore } from '../lib/store';
import type { Adjunto, Pagina } from '../lib/types';
import { Button, Dialogo, IconButton, cx } from '../ui';

/*
  Módulo 7 (RF-ARC-01 a 06) en el prototipo. Mitiga los fallos típicos de una subida:
  archivos vacíos o carpetas, tamaño máximo, nombres largos o repetidos, lotes grandes,
  cortes de red (reintentar / cancelar), salir de la página a mitad de subida y vistas
  previas que no cargan. SVG nunca se previsualiza (riesgo de XSS).
*/

// PRD §12: el tamaño máximo sigue pendiente de decisión. Valor provisional y configurable.
export const LIMITE_BYTES = 25 * 1024 * 1024;
const MAX_POR_LOTE = 10;
const MAX_NOMBRE = 200;

const PREVIEW: Record<string, { tipo: Adjunto['tipo']; mime: RegExp }> = {
  png: { tipo: 'imagen', mime: /^image\/png$/ },
  jpg: { tipo: 'imagen', mime: /^image\/jpe?g$/ },
  jpeg: { tipo: 'imagen', mime: /^image\/jpe?g$/ },
  webp: { tipo: 'imagen', mime: /^image\/webp$/ },
  gif: { tipo: 'imagen', mime: /^image\/gif$/ },
  pdf: { tipo: 'pdf', mime: /^application\/pdf$/ },
  mp4: { tipo: 'video', mime: /^video\/mp4$/ },
  webm: { tipo: 'video', mime: /^(video|audio)\/webm$/ },
  mp3: { tipo: 'audio', mime: /^audio\/(mpeg|mp3)$/ },
  wav: { tipo: 'audio', mime: /^audio\/(x-)?wav$/ },
  ogg: { tipo: 'audio', mime: /^(audio|video)\/ogg$/ },
  m4a: { tipo: 'audio', mime: /^audio\/(mp4|x-m4a)$/ },
};

function extension(nombre: string): string {
  const i = nombre.lastIndexOf('.');
  return i > 0 ? nombre.slice(i + 1).toLowerCase() : '';
}

/**
 * Tipo de vista previa. Exige que extensión y tipo MIME coincidan: un .png que en realidad
 * es otra cosa (o un .svg renombrado) cae en "otro" y solo se ofrece para descargar.
 */
export function tipoDe(nombre: string, mime?: string): Adjunto['tipo'] {
  const regla = PREVIEW[extension(nombre)];
  if (!regla) return 'otro';
  if (mime !== undefined && mime !== '' && !regla.mime.test(mime)) return 'otro';
  return regla.tipo;
}

const TIPO_LABEL: Record<Adjunto['tipo'], string> = {
  imagen: 'Imagen',
  pdf: 'PDF',
  video: 'Video',
  audio: 'Audio',
  otro: 'Archivo',
};

function IconoArchivo({ tipo, size = 18 }: { tipo: Adjunto['tipo']; size?: number }) {
  const props = { size, className: 'flex-none text-faint' };
  if (tipo === 'imagen') return <FileImage {...props} />;
  if (tipo === 'pdf') return <FileText {...props} />;
  if (tipo === 'video') return <FileVideo {...props} />;
  if (tipo === 'audio') return <Music {...props} />;
  return <File {...props} />;
}

/** "diagrama.png" ya existe → "diagrama (2).png". */
function nombreLibre(nombre: string, ocupados: Set<string>): string {
  if (!ocupados.has(nombre.toLowerCase())) return nombre;
  const ext = extension(nombre);
  const base = ext ? nombre.slice(0, -(ext.length + 1)) : nombre;
  for (let n = 2; ; n++) {
    const cand = ext ? `${base} (${n}).${ext}` : `${base} (${n})`;
    if (!ocupados.has(cand.toLowerCase())) return cand;
  }
}

interface Rechazo {
  nombre: string;
  motivo: string;
}

interface Subida {
  id: string;
  archivo: File;
  nombre: string;
  progreso: number; // 0..1
  estado: 'subiendo' | 'error';
  error?: string;
}

function validar(f: File): string | null {
  // Una carpeta arrastrada llega como "archivo" sin tipo y con tamaño 0 (o el del directorio).
  if (f.size === 0) return 'Está vacío o es una carpeta. Sube los archivos de la carpeta uno por uno.';
  if (f.size > LIMITE_BYTES) return `Pesa ${tamano(f.size)}; el máximo es ${tamano(LIMITE_BYTES)}.`;
  if (f.name.length > MAX_NOMBRE) return `El nombre tiene más de ${MAX_NOMBRE} caracteres.`;
  return null;
}

/* ---------- Ficha y vista previa (RF-ARC-04, RF-ARC-05) ---------- */

function Ficha({ a, aviso }: { a: Adjunto; aviso?: string }) {
  const { usuario } = useStore();
  const ext = extension(a.nombre);
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line bg-raised p-5 sm:flex-row sm:items-start">
      <span className="flex h-12 w-12 flex-none items-center justify-center rounded-lg border border-line bg-surface">
        <IconoArchivo tipo={a.tipo} size={22} />
      </span>
      <div className="min-w-0 flex-1">
        {aviso && (
          <p className="mb-3 flex items-start gap-2 text-[13px] text-muted">
            <Info size={15} className="mt-0.5 flex-none" />
            {aviso}
          </p>
        )}
        <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-1.5 text-[13px]">
          <dt className="text-muted">Nombre</dt>
          <dd className="font-mono break-all">{a.nombre}</dd>
          <dt className="text-muted">Tipo</dt>
          <dd>{ext ? `${TIPO_LABEL[a.tipo]} (.${ext})` : TIPO_LABEL[a.tipo]}</dd>
          <dt className="text-muted">Tamaño</dt>
          <dd className="num">{tamano(a.bytes)}</dd>
          <dt className="text-muted">Subido</dt>
          <dd>
            {fechaLarga(a.fecha)}, {a.fecha.slice(11, 16)}
          </dd>
          <dt className="text-muted">Por</dt>
          <dd>{usuario(a.subidoPor)?.nombre ?? '—'}</dd>
        </dl>
      </div>
    </div>
  );
}

function VistaPrevia({ a }: { a: Adjunto }) {
  const [fallo, setFallo] = React.useState(false);

  if (a.tipo === 'otro') {
    const svg = extension(a.nombre) === 'svg';
    return (
      <Ficha
        a={a}
        aviso={
          svg
            ? 'Los SVG no se previsualizan por seguridad: pueden contener código. Descárgalo para abrirlo.'
            : 'Este tipo de archivo no tiene vista previa. Descárgalo para abrirlo.'
        }
      />
    );
  }
  if (fallo) return <Ficha a={a} aviso="No se pudo mostrar la vista previa: el archivo puede estar dañado o el enlace venció. Descárgalo o vuelve a abrirlo." />;

  // Archivos de ejemplo sin binario: se explica qué haría la app real.
  if (!a.url)
    return (
      <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 rounded-lg border border-line bg-raised px-6 text-center">
        <IconoArchivo tipo={a.tipo} size={22} />
        <p className="max-w-[380px] text-[14px] text-muted">
          Archivo de ejemplo sin contenido. En la aplicación, la API valida tu permiso y entrega un enlace de lectura de 10 minutos para
          mostrarlo aquí. Sube un archivo propio para ver la vista previa real.
        </p>
      </div>
    );

  if (a.tipo === 'imagen')
    return (
      <div className="flex max-h-[62vh] items-center justify-center overflow-auto rounded-lg border border-line bg-raised">
        <img src={a.url} alt={a.nombre} onError={() => setFallo(true)} className="max-h-[62vh] max-w-full object-contain" />
      </div>
    );
  if (a.tipo === 'pdf')
    return <iframe src={a.url} title={a.nombre} className="h-[62vh] w-full rounded-lg border border-line bg-raised" onError={() => setFallo(true)} />;
  if (a.tipo === 'video')
    return <video src={a.url} controls preload="metadata" onError={() => setFallo(true)} className="max-h-[62vh] w-full rounded-lg bg-black" />;
  return (
    <div className="rounded-lg border border-line bg-raised p-5">
      <audio src={a.url} controls preload="metadata" onError={() => setFallo(true)} className="w-full" />
    </div>
  );
}

/* ---------- Sección de archivos ---------- */

export function Archivos({
  p,
  cambiar,
  simularFallo,
  alConsumirFallo,
}: {
  p: Pagina;
  cambiar: (parche: Partial<Pagina>) => void;
  simularFallo: boolean;
  alConsumirFallo: () => void;
}) {
  const { yo, usuario, avisar } = useStore();
  const [vista, setVista] = React.useState<Adjunto | null>(null);
  const [borrar, setBorrar] = React.useState<Adjunto | null>(null);
  const [arrastrando, setArrastrando] = React.useState(false);
  const [subidas, setSubidas] = React.useState<Subida[]>([]);
  const [rechazos, setRechazos] = React.useState<Rechazo[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const timers = React.useRef(new Map<string, number>());
  // La página cambia mientras sube; los callbacks leen siempre la última versión.
  const pRef = React.useRef(p);
  pRef.current = p;
  const falloRef = React.useRef(simularFallo);
  falloRef.current = simularFallo;

  // Salir a mitad de subida pierde los archivos: se pide confirmación al navegador.
  React.useEffect(() => {
    if (!subidas.some((s) => s.estado === 'subiendo')) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [subidas]);

  React.useEffect(() => () => timers.current.forEach((t) => window.clearInterval(t)), []);

  // Cada subida completa se registra una sola vez (los actualizadores de estado pueden repetirse).
  const hechos = React.useRef(new Set<string>());
  React.useEffect(() => {
    const listas = subidas.filter((s) => s.estado === 'subiendo' && s.progreso >= 1 && !hechos.current.has(s.id));
    if (!listas.length) return;
    listas.forEach((s) => hechos.current.add(s.id));
    terminar(listas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subidas]);

  /** Registra juntas las subidas que terminaron: varias pueden acabar en el mismo instante. */
  const terminar = (lote: Subida[]) => {
    const ocupados = new Set(pRef.current.adjuntos.map((a) => a.nombre.toLowerCase()));
    const renombrados: string[] = [];
    const nuevos: Adjunto[] = lote.map((s) => {
      const nombre = nombreLibre(s.nombre, ocupados);
      ocupados.add(nombre.toLowerCase());
      if (nombre !== s.nombre) renombrados.push(`${s.nombre} → ${nombre}`);
      return {
        id: s.id,
        nombre,
        tipo: tipoDe(nombre, s.archivo.type),
        bytes: s.archivo.size,
        subidoPor: yo.id,
        fecha: AHORA,
        url: URL.createObjectURL(s.archivo),
      };
    });
    const adjuntos = [...nuevos, ...pRef.current.adjuntos];
    pRef.current = { ...pRef.current, adjuntos };
    cambiar({ adjuntos });
    const ids = new Set(lote.map((s) => s.id));
    setSubidas((ss) => ss.filter((x) => !ids.has(x.id)));
    avisar(
      renombrados.length
        ? `Ya existía un archivo con ese nombre: ${renombrados.join(', ')}`
        : nuevos.length === 1
          ? `${nuevos[0].nombre} subido`
          : `${nuevos.length} archivos subidos`,
    );
  };

  const arrancar = (s: Subida, fallara: boolean) => {
    // Simulación de progreso: ~1,5 s por archivo más un poco por tamaño.
    const pasos = 12 + Math.min(30, Math.round(s.archivo.size / (2 * 1024 * 1024)));
    const t = window.setInterval(() => {
      setSubidas((ss) =>
        ss.map((x) => {
          if (x.id !== s.id || x.estado !== 'subiendo') return x;
          const progreso = Math.min(1, x.progreso + 1 / pasos);
          if (fallara && progreso >= 0.6) {
            window.clearInterval(timers.current.get(s.id));
            timers.current.delete(s.id);
            return { ...x, progreso, estado: 'error', error: 'Se perdió la conexión durante la subida.' };
          }
          if (progreso >= 1) {
            window.clearInterval(timers.current.get(s.id));
            timers.current.delete(s.id);
          }
          return { ...x, progreso };
        }),
      );
    }, 120);
    timers.current.set(s.id, t);
  };

  const subir = (lista: FileList | File[] | null) => {
    const files = lista ? [...lista] : [];
    if (!files.length) return;
    const fallara = falloRef.current;
    if (fallara) alConsumirFallo();

    const nuevosRechazos: Rechazo[] = [];
    const aceptados: File[] = [];
    files.forEach((f, i) => {
      if (i >= MAX_POR_LOTE) return nuevosRechazos.push({ nombre: f.name, motivo: `Sube máximo ${MAX_POR_LOTE} archivos a la vez.` });
      const motivo = validar(f);
      if (motivo) nuevosRechazos.push({ nombre: f.name, motivo });
      else aceptados.push(f);
    });
    setRechazos(nuevosRechazos);

    const nuevas: Subida[] = aceptados.map((f, i) => ({
      id: `a-${Date.now()}-${i}`,
      archivo: f,
      nombre: f.name,
      progreso: 0,
      estado: 'subiendo',
    }));
    setSubidas((ss) => [...nuevas, ...ss]);
    nuevas.forEach((s) => arrancar(s, fallara));
    if (inputRef.current) inputRef.current.value = ''; // permite volver a elegir el mismo archivo
  };

  const cancelar = (s: Subida) => {
    window.clearInterval(timers.current.get(s.id));
    timers.current.delete(s.id);
    setSubidas((ss) => ss.filter((x) => x.id !== s.id));
  };

  const reintentar = (s: Subida) => {
    const nueva = { ...s, progreso: 0, estado: 'subiendo' as const, error: undefined };
    setSubidas((ss) => ss.map((x) => (x.id === s.id ? nueva : x)));
    arrancar(nueva, false);
  };

  const descargar = (a: Adjunto) => {
    if (!a.url) return avisar('Enlace de descarga válido por 10 minutos');
    const link = document.createElement('a');
    link.href = a.url;
    link.download = a.nombre;
    link.click();
  };

  const eliminar = (a: Adjunto) => {
    const adjuntos = pRef.current.adjuntos.filter((x) => x.id !== a.id);
    pRef.current = { ...pRef.current, adjuntos };
    cambiar({ adjuntos });
    if (a.url) URL.revokeObjectURL(a.url);
    setBorrar(null);
    avisar(`${a.nombre} eliminado`);
  };

  const enCurso = subidas.filter((s) => s.estado === 'subiendo').length;

  return (
    <div className="flex flex-col gap-4">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          subir(e.dataTransfer.files);
        }}
        className={cx(
          'flex cursor-pointer flex-wrap items-center gap-3 rounded-lg border border-dashed px-4 py-4 text-[14px] transition-colors focus-within:border-brand',
          arrastrando ? 'border-brand bg-brand-soft' : 'border-control hover:border-faint hover:bg-raised',
        )}
      >
        <Upload size={18} className="flex-none text-faint" />
        <span className="min-w-0 flex-1">
          <span className="font-medium">{arrastrando ? 'Suelta para subir' : 'Arrastra archivos aquí'}</span>{' '}
          {!arrastrando && <span className="text-muted">o haz clic para elegirlos</span>}
          <span className="block text-[12px] text-muted">
            Hasta {MAX_POR_LOTE} archivos de {tamano(LIMITE_BYTES)} cada uno. Vista previa de imágenes, PDF, video y audio.
          </span>
        </span>
        <input ref={inputRef} type="file" multiple className="sr-only" onChange={(e) => subir(e.target.files)} aria-label="Elegir archivos para subir" />
      </label>

      {rechazos.length > 0 && (
        <div role="alert" className="rounded-lg border border-danger/30 bg-danger-bg px-4 py-3 text-[13px] text-danger-ink">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 flex-none" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {rechazos.length === 1 ? 'Un archivo no se subió' : `${rechazos.length} archivos no se subieron`}
              </p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {rechazos.map((r, i) => (
                  <li key={i} className="min-w-0">
                    <span className="font-mono break-all">{r.nombre}</span>: {r.motivo}
                  </li>
                ))}
              </ul>
            </div>
            <IconButton label="Cerrar aviso" onClick={() => setRechazos([])} className="-my-1 -mr-2 h-7 w-7 text-danger-ink hover:bg-transparent">
              <X size={15} />
            </IconButton>
          </div>
        </div>
      )}

      {subidas.length > 0 && (
        <ul aria-label="Subidas en curso" className="rounded-lg border border-line bg-surface">
          {subidas.map((s) => (
            <li key={s.id} className="flex items-center gap-3 border-b border-rule px-4 py-3 last:border-0">
              <IconoArchivo tipo={tipoDe(s.nombre, s.archivo.type)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-[13px]">{s.nombre}</span>
                {s.estado === 'error' ? (
                  <span className="block text-[12px] font-medium text-danger">{s.error} No se guardó nada.</span>
                ) : (
                  <span className="mt-1.5 flex items-center gap-2">
                    <span
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-active"
                      role="progressbar"
                      aria-label={`Subiendo ${s.nombre}`}
                      aria-valuenow={Math.round(s.progreso * 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <span className="block h-full rounded-full bg-brand transition-[width] duration-100" style={{ width: `${s.progreso * 100}%` }} />
                    </span>
                    <span className="num w-10 text-right text-[12px] text-muted">{Math.round(s.progreso * 100)} %</span>
                  </span>
                )}
              </span>
              <span className="num hidden w-20 text-right text-[13px] text-muted sm:block">{tamano(s.archivo.size)}</span>
              {s.estado === 'error' ? (
                <span className="flex flex-none items-center gap-1">
                  <Button size="sm" icon={<RotateCcw size={13} />} onClick={() => reintentar(s)}>
                    Reintentar
                  </Button>
                  <IconButton label={`Quitar ${s.nombre}`} onClick={() => cancelar(s)}>
                    <X size={16} />
                  </IconButton>
                </span>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => cancelar(s)}>
                  Cancelar
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {enCurso > 0 && <p className="-mt-2 text-[12px] text-muted">No cierres ni recargues la página hasta que terminen las subidas.</p>}

      {p.adjuntos.length === 0 && subidas.length === 0 ? (
        <p className="text-[14px] text-muted">Esta página no tiene archivos adjuntos.</p>
      ) : (
        p.adjuntos.length > 0 && (
          <ul aria-label="Archivos adjuntos" className="rounded-lg border border-line bg-surface">
            {p.adjuntos.map((a) => {
              const autor = usuario(a.subidoPor);
              const conVista = a.tipo !== 'otro';
              return (
                <li key={a.id} className="flex items-center gap-3 border-b border-rule px-4 py-3 last:border-0">
                  <IconoArchivo tipo={a.tipo} />
                  <span className="min-w-0 flex-1">
                    <button onClick={() => setVista(a)} className="block max-w-full truncate text-left font-mono text-[13px] hover:underline hover:underline-offset-2">
                      {a.nombre}
                    </button>
                    <span className="block text-[12px] text-muted">
                      {autor?.nombre} · {cuando(a.fecha)}
                    </span>
                  </span>
                  <span className="num hidden w-20 text-right text-[13px] text-muted sm:block">{tamano(a.bytes)}</span>
                  <span className="flex flex-none items-center">
                    <IconButton label={conVista ? `Vista previa de ${a.nombre}` : `Detalles de ${a.nombre}`} onClick={() => setVista(a)}>
                      {conVista ? <Eye size={16} /> : <Info size={16} />}
                    </IconButton>
                    <IconButton label={`Descargar ${a.nombre}`} onClick={() => descargar(a)}>
                      <Download size={16} />
                    </IconButton>
                    {puede(yo, 'archivos.eliminar', { subidoPor: a.subidoPor }) && (
                      <IconButton label={`Eliminar ${a.nombre}`} onClick={() => setBorrar(a)}>
                        <Trash2 size={16} />
                      </IconButton>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )
      )}

      <Dialogo abierto={!!vista} cerrar={() => setVista(null)} titulo={vista?.nombre ?? ''} ancho={820}>
        {vista && (
          <div className="p-5">
            <VistaPrevia key={vista.id} a={vista} />
            <div className="mt-4 flex items-center justify-between gap-3 text-[13px] text-muted">
              <span className="num">
                {tamano(vista.bytes)} · subido {cuando(vista.fecha).toLowerCase()}
              </span>
              <Button size="sm" icon={<Download size={14} />} onClick={() => descargar(vista)}>
                Descargar
              </Button>
            </div>
          </div>
        )}
      </Dialogo>

      <Dialogo abierto={!!borrar} cerrar={() => setBorrar(null)} titulo="Eliminar archivo">
        {borrar && (
          <div className="p-5 text-[14px]">
            <p>
              Se quitará <span className="font-mono text-[13px]">{borrar.nombre}</span> de esta página. Dejará de aparecer para todos.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setBorrar(null)}>Cancelar</Button>
              <Button variant="danger" icon={<Trash2 size={14} />} onClick={() => eliminar(borrar)}>
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Dialogo>
    </div>
  );
}
