import React from 'react';
import { X } from 'lucide-react';
import { ESTADO_LABEL, TIPO_LABEL, iniciales, vigencia } from './lib/format';
import type { EstadoPagina, Pagina, TipoPagina } from './lib/types';

export function cx(...c: (string | false | null | undefined)[]): string {
  return c.filter(Boolean).join(' ');
}

/* ---------- Marca ---------- */

// Trazos del logo oficial (docs/diseno/logo/datahub-icono.svg en develop), sin el fondo blanco.
// El "hueco" entre la órbita y el cuadro toma el color del fondo donde se pinta la marca.
const MARCA: { fill: string; d: string }[] = [
  { fill: '#8DC63F', d: 'M677.263 247.823C687.329 240.724 700.445 232.151 711.051 226.09C743.548 207.517 801.437 183.987 838.967 190.573C852.859 192.884 865.204 200.767 873.145 212.396C895.889 245.387 875.243 300.68 856.61 331.834C815.5 400.567 756.999 461.554 699.505 516.503C666.13 548.398 631.736 579.209 596.378 608.889C544.85 651.865 491.323 692.385 435.974 730.314C377.594 769.748 255.585 847.345 184.452 833.534C171.127 830.947 158.266 823.848 150.559 812.454C139.603 796.257 140.483 776.462 144.165 758.124C153.658 710.856 186.708 663.244 217.905 627.546C224.76 619.701 231.651 611.359 239.579 604.559C238.978 594.548 239.264 582.038 239.205 571.87L239.05 509.601L239.105 439.334C239.201 411.494 237.577 384.41 245.311 357.552C257.249 316.123 285.023 281.064 322.622 259.964C361.159 238.818 388.018 239.346 430.316 239.406L500.851 239.457L589.526 239.45C605.851 239.454 623.297 239.041 639.491 239.99C651.858 240.714 665.41 244.402 677.263 247.823Z' },
  { fill: '#2B3A8F', d: 'M677.263 247.823C687.329 240.724 700.445 232.151 711.051 226.09C743.548 207.517 801.437 183.987 838.967 190.573C852.859 192.884 865.204 200.767 873.145 212.396C895.889 245.387 875.243 300.68 856.61 331.834C815.5 400.567 756.999 461.554 699.505 516.503C666.13 548.398 631.736 579.209 596.378 608.889C544.85 651.865 491.323 692.385 435.974 730.314C377.594 769.748 255.585 847.345 184.452 833.534C171.127 830.947 158.266 823.848 150.559 812.454C139.603 796.257 140.483 776.462 144.165 758.124C153.658 710.856 186.708 663.244 217.905 627.546C224.76 619.701 231.651 611.359 239.579 604.559L239.377 606.495C240.297 616.947 238.916 632.026 239.737 643.378C242.124 676.351 254.115 714.995 276.905 739.208C303.059 728.986 338.974 706.567 362.884 691.168C412.025 659.221 459.41 624.652 504.834 587.609C573.061 533.031 637.537 473.923 697.827 410.686C718.228 389.286 751.613 353.864 766.467 328.266C748.289 293.108 728.906 274.745 694.87 255.347C693.964 255.307 679.34 248.734 677.263 247.823Z' },
  { fill: 'hueco', d: 'M694.87 255.347C723.619 238.822 777.459 214.478 809.954 233.915C825.778 243.38 824.173 268.917 819.339 283.677C811.798 309.64 797.016 333.054 781.142 354.688C743.357 407.268 696.997 454.831 650.073 499.269C588.421 557.543 523.325 612.062 455.138 662.532C405.404 699.107 264.699 798.215 205.908 781.617C196.822 779.089 189.131 773.02 184.56 764.772C161.767 722.942 212.48 638.577 239.377 606.495C240.297 616.947 238.916 632.026 239.737 643.378C242.124 676.351 254.115 714.995 276.905 739.208C303.059 728.986 338.974 706.567 362.884 691.168C412.025 659.221 459.41 624.652 504.834 587.609C573.061 533.031 637.537 473.923 697.827 410.686C718.228 389.286 751.613 353.864 766.467 328.266C748.289 293.108 728.906 274.745 694.87 255.347Z' },
  { fill: '#8DC63F', d: 'M784.742 470.843C785.953 473.632 785.355 627.485 784.133 640.261C780.437 677.273 763.857 711.81 737.288 737.841C717.852 757.1 693.047 772.346 666.492 779.275C643.376 785.308 624.072 784.472 600.552 784.463L549.02 784.455L409.103 784.424L408.34 783.795C409.276 781.819 430.55 769.453 434.119 767.127C463.902 747.618 493.022 727.117 521.433 705.659C591.099 652.729 657.655 595.826 720.77 535.233C734.034 522.458 747.121 509.5 760.029 496.364C767.314 488.824 777.167 477.7 784.742 470.843Z' },
];

export function Marca({ size = 24, hueco = 'var(--ground)' }: { size?: number; hueco?: string }) {
  return (
    <svg width={size} height={size} viewBox="132 176 772 680" aria-hidden="true" className="flex-none">
      {MARCA.map((p, i) => (
        <path key={i} fill={p.fill === 'hueco' ? hueco : p.fill} d={p.d} />
      ))}
    </svg>
  );
}

export function Logotipo({ hueco }: { hueco?: string }) {
  return (
    <span className="flex items-center gap-2">
      <Marca hueco={hueco} />
      <span className="text-[15px] font-semibold tracking-[-0.01em]">DataHub</span>
    </span>
  );
}

/* ---------- Botones ---------- */

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg'; icon?: React.ReactNode }
>(function Button({ variant = 'secondary', size = 'md', icon, className, children, ...rest }, ref) {
  return (
    <button
      ref={ref}
      {...rest}
      className={cx(
        'inline-flex flex-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-[background-color,border-color,color,transform] duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' && 'h-7 px-2.5 text-[13px]',
        size === 'md' && 'h-8 px-3 text-[13px]',
        size === 'lg' && 'h-10 px-4 text-[14px]',
        variant === 'primary' && 'bg-brand text-on-brand hover:bg-brand-hover',
        variant === 'secondary' && 'border border-control bg-surface text-ink hover:bg-raised',
        variant === 'ghost' && 'text-muted hover:bg-active hover:text-ink',
        variant === 'danger' && 'border border-control bg-surface text-danger hover:bg-danger-bg',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
});

export function IconButton({
  label,
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      {...rest}
      className={cx(
        'inline-flex h-8 w-8 flex-none items-center justify-center rounded-md text-muted transition-colors hover:bg-active hover:text-ink',
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ---------- Estado, tipo y vigencia ---------- */

const ESTADO_CLS: Record<EstadoPagina, string> = {
  aprobado: 'bg-ok-bg text-ok-ink',
  en_revision: 'bg-review-bg text-review-ink',
  borrador: 'bg-draft-bg text-draft-ink',
  archivado: 'bg-archived-bg text-archived-ink',
};

export function EstadoPill({ estado }: { estado: EstadoPagina }) {
  return (
    <span className={cx('inline-flex h-[22px] flex-none items-center gap-1.5 whitespace-nowrap rounded px-2 text-[12px] font-medium', ESTADO_CLS[estado])}>
      {estado === 'aprobado' && <span className="h-1.5 w-1.5 rounded-full bg-leaf" aria-hidden="true" />}
      {ESTADO_LABEL[estado]}
    </span>
  );
}

export function TipoEtiqueta({ tipo }: { tipo: TipoPagina }) {
  return <span className="whitespace-nowrap text-[13px] text-muted">{TIPO_LABEL[tipo]}</span>;
}

export function VigenciaTexto({ pagina, corto }: { pagina: Pagina; corto?: boolean }) {
  const v = vigencia(pagina);
  if (v.tipo === 'sin_fecha') return <span className="text-faint">—</span>;
  if (v.tipo === 'vencida')
    return (
      <span className="whitespace-nowrap font-medium text-danger">
        {corto ? `Vencida ${v.dias} d` : `Vencida hace ${v.dias} ${v.dias === 1 ? 'día' : 'días'}`}
      </span>
    );
  if (v.tipo === 'proxima')
    return <span className="whitespace-nowrap text-review-ink">{v.dias === 0 ? 'Vence hoy' : `Vence en ${v.dias} d`}</span>;
  return <span className="num whitespace-nowrap font-mono text-[13px] text-muted">{pagina.fechaRevision}</span>;
}

/* ---------- Personas ---------- */

// Tintes pálidos de identidad, separados al menos 60° de matiz. No son datos.
const TINTES = [
  ['#e6ecfb', '#24357f'],
  ['#e5f4ec', '#1d5b3a'],
  ['#fbe9e4', '#7e3220'],
  ['#efe8fa', '#4d2f80'],
  ['#fbf1dd', '#6d4a07'],
  ['#e3f2f5', '#165460'],
];

export function Avatar({ nombre, id, size = 24 }: { nombre: string; id: string; size?: number }) {
  const n = [...id].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTES.length;
  const [bg, fg] = TINTES[n];
  return (
    <span
      aria-hidden="true"
      className="inline-flex flex-none select-none items-center justify-center rounded-full font-semibold"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size <= 24 ? 10 : 12 }}
    >
      {iniciales(nombre)}
    </span>
  );
}

/* ---------- Contenedores ---------- */

export function Panel({ className, children, ...rest }: React.HTMLAttributes<HTMLElement> & { as?: 'section' | 'div' }) {
  return (
    <section {...rest} className={cx('rounded-lg border border-line bg-surface', className)}>
      {children}
    </section>
  );
}

export function PanelHeader({ titulo, extra, id }: { titulo: React.ReactNode; extra?: React.ReactNode; id?: string }) {
  return (
    <header className="flex min-h-[52px] items-center justify-between gap-3 border-b border-rule px-5 py-3">
      <h2 id={id} className="text-[14px] font-semibold">
        {titulo}
      </h2>
      {extra}
    </header>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 items-center rounded border border-line bg-surface px-1.5 font-mono text-[11px] text-muted">
      {children}
    </kbd>
  );
}

export function Vacio({ children, accion }: { children: React.ReactNode; accion?: React.ReactNode }) {
  return (
    <div className="m-4 flex min-h-[44px] flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-control px-4 py-3 text-[14px] text-muted">
      <span>{children}</span>
      {accion}
    </div>
  );
}

/* ---------- Formularios ---------- */

export function Campo({
  label,
  ayuda,
  error,
  children,
  htmlFor,
}: {
  label: string;
  ayuda?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-[14px] font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[13px] text-danger" role="alert">
          {error}
        </p>
      ) : ayuda ? (
        <p className="text-[13px] text-muted">{ayuda}</p>
      ) : null}
    </div>
  );
}

export const inputCls =
  'h-10 w-full rounded-md border border-control bg-surface px-3 text-[14px] text-ink transition-colors hover:border-faint focus:border-brand focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-brand/20';

/* ---------- Capas flotantes ---------- */

function useEscape(abierto: boolean, cerrar: () => void) {
  React.useEffect(() => {
    if (!abierto) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && cerrar();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [abierto, cerrar]);
}

export function Dialogo({
  abierto,
  cerrar,
  titulo,
  children,
  ancho = 480,
}: {
  abierto: boolean;
  cerrar: () => void;
  titulo: string;
  children: React.ReactNode;
  ancho?: number;
}) {
  useEscape(abierto, cerrar);
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 pt-[12vh] pb-8 anim-fade" onMouseDown={cerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full rounded-xl border border-line bg-surface shadow-float anim-rise"
        style={{ maxWidth: ancho }}
      >
        <header className="flex items-center justify-between border-b border-rule py-3 pr-3 pl-5">
          <h2 className="text-[15px] font-semibold">{titulo}</h2>
          <IconButton label="Cerrar" onClick={cerrar}>
            <X size={16} />
          </IconButton>
        </header>
        {children}
      </div>
    </div>
  );
}

export function Lateral({
  abierto,
  cerrar,
  titulo,
  children,
}: {
  abierto: boolean;
  cerrar: () => void;
  titulo: string;
  children: React.ReactNode;
}) {
  useEscape(abierto, cerrar);
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/25 anim-fade" onMouseDown={cerrar}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute top-0 right-0 flex h-full w-full max-w-[440px] flex-col border-l border-line bg-surface shadow-float anim-slide"
      >
        <header className="flex h-14 flex-none items-center justify-between border-b border-rule pr-3 pl-6">
          <h2 className="text-[15px] font-semibold">{titulo}</h2>
          <IconButton label="Cerrar" onClick={cerrar}>
            <X size={16} />
          </IconButton>
        </header>
        {children}
      </aside>
    </div>
  );
}

/** Menú desplegable simple anclado a un botón. */
export function Menu({
  boton,
  children,
  alinear = 'izquierda',
  ancho = 240,
}: {
  boton: (props: { abierto: boolean; alternar: () => void }) => React.ReactNode;
  children: (cerrar: () => void) => React.ReactNode;
  alinear?: 'izquierda' | 'derecha';
  ancho?: number;
}) {
  const [abierto, setAbierto] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setAbierto(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('mousedown', fuera);
    window.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fuera);
      window.removeEventListener('keydown', esc);
    };
  }, [abierto]);
  return (
    <div ref={ref} className="relative">
      {boton({ abierto, alternar: () => setAbierto((a) => !a) })}
      {abierto && (
        <div
          role="menu"
          className={cx(
            'absolute top-full z-40 mt-1 rounded-lg border border-line bg-surface p-1 shadow-float anim-rise',
            alinear === 'derecha' ? 'right-0' : 'left-0',
          )}
          style={{ width: ancho }}
        >
          {children(() => setAbierto(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  activo,
  peligro,
}: {
  children: React.ReactNode;
  onClick: () => void;
  activo?: boolean;
  peligro?: boolean;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={cx(
        'flex min-h-8 w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-active',
        activo && 'font-medium',
        peligro && 'text-danger',
      )}
    >
      {children}
    </button>
  );
}
