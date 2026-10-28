import React from 'react';
import {
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Home,
  LogOut,
  Menu as MenuIcon,
  Moon,
  Search,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { PERFIL_LABEL, TIPO_LABEL, normalizar } from './lib/format';
import { ir, useStore } from './lib/store';
import { Avatar, EstadoPill, Kbd, Logotipo, Menu, MenuItem, cx } from './ui';

/* ---------- Barra lateral ---------- */

function NavLink({
  href,
  activo,
  icono,
  children,
  extra,
  nivel = 0,
}: {
  href: string;
  activo: boolean;
  icono?: React.ReactNode;
  children: React.ReactNode;
  extra?: React.ReactNode;
  nivel?: number;
}) {
  return (
    <a
      href={href}
      aria-current={activo ? 'page' : undefined}
      className={cx(
        'group flex h-8 items-center gap-2.5 rounded-md pr-2 text-[14px] transition-colors',
        activo ? 'bg-active font-medium text-ink' : 'text-muted hover:bg-active/60 hover:text-ink',
      )}
      style={{ paddingLeft: 10 + nivel * 18 }}
    >
      {icono && <span className={cx('flex-none', activo ? 'text-ink' : 'text-faint group-hover:text-muted')}>{icono}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {extra}
    </a>
  );
}

function SelectorCliente() {
  const { yo, clientes, clienteActivo, operarEn } = useStore();
  if (yo.perfil !== 'super_admin') {
    return (
      <div className="px-2.5">
        <p className="truncate text-[13px] font-medium">{clienteActivo.nombre}</p>
      </div>
    );
  }
  return (
    <Menu
      ancho={232}
      boton={({ abierto, alternar }) => (
        <button
          onClick={alternar}
          aria-expanded={abierto}
          className="flex h-11 w-full items-center gap-2 rounded-md border border-line bg-surface px-2.5 text-left transition-colors hover:border-control"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] leading-4 text-muted">Operando en</span>
            <span className="block truncate text-[13px] font-medium leading-5">{clienteActivo.nombre}</span>
          </span>
          <ChevronDown size={14} className="flex-none text-faint" />
        </button>
      )}
    >
      {(cerrar) => (
        <>
          <p className="px-2.5 pt-1.5 pb-1 text-[12px] text-muted">Clientes activos</p>
          {clientes
            .filter((c) => c.activo)
            .map((c) => (
              <MenuItem
                key={c.id}
                activo={c.id === clienteActivo.id}
                onClick={() => {
                  operarEn(c.id);
                  cerrar();
                }}
              >
                <span className="min-w-0 flex-1 truncate">{c.nombre}</span>
                {c.id === clienteActivo.id && <Check size={14} className="text-brand-text" />}
              </MenuItem>
            ))}
        </>
      )}
    </Menu>
  );
}

function Arbol({ alNavegar }: { alNavegar?: () => void }) {
  const { misWorkspaces, espacios, ruta, paginas, colecciones } = useStore();
  // Espacio activo, también cuando se está dentro de una de sus páginas.
  let espacioActivo: string | undefined;
  if (ruta.nombre === 'espacio') espacioActivo = ruta.id;
  if (ruta.nombre === 'pagina') {
    const p = paginas.find((x) => x.id === ruta.id);
    espacioActivo = colecciones.find((k) => k.id === p?.coleccionId)?.espacioId;
  }
  const wsActivo =
    ruta.nombre === 'workspace' ? ruta.id : espacios.find((e) => e.id === espacioActivo)?.workspaceId;

  const [cerrados, setCerrados] = React.useState<Set<string>>(new Set());

  return (
    <div className="flex flex-col gap-0.5" onClick={alNavegar}>
      {misWorkspaces.map((w) => {
        const abierto = !cerrados.has(w.id);
        return (
          <div key={w.id}>
            <div className="flex items-center">
              <button
                aria-label={abierto ? `Contraer ${w.nombre}` : `Expandir ${w.nombre}`}
                aria-expanded={abierto}
                onClick={(e) => {
                  e.stopPropagation();
                  setCerrados((s) => {
                    const n = new Set(s);
                    if (n.has(w.id)) n.delete(w.id);
                    else n.add(w.id);
                    return n;
                  });
                }}
                className="flex h-8 w-6 flex-none items-center justify-center rounded text-faint hover:text-ink"
              >
                <ChevronRight size={14} className={cx('transition-transform duration-150', abierto && 'rotate-90')} />
              </button>
              <div className="min-w-0 flex-1">
                <NavLink href={`#/w/${w.id}`} activo={ruta.nombre === 'workspace' && wsActivo === w.id}>
                  <span className={cx(wsActivo === w.id && 'text-ink')}>{w.nombre}</span>
                </NavLink>
              </div>
            </div>
            {abierto && (
              <div className="ml-6 flex flex-col gap-0.5 pb-1">
                {espacios
                  .filter((e) => e.workspaceId === w.id)
                  .map((e) => (
                    <NavLink key={e.id} href={`#/e/${e.id}`} activo={espacioActivo === e.id}>
                      {e.nombre}
                    </NavLink>
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FilaUsuario() {
  const { yo, usuarios, verComo, tema, cambiarTema, clienteActivo } = useStore();
  const demo = ['u-sa', 'u1', 'u2', 'u3'].map((id) => usuarios.find((u) => u.id === id)!);
  return (
    <Menu
      ancho={264}
      boton={({ abierto, alternar }) => (
        <button
          onClick={alternar}
          aria-expanded={abierto}
          aria-label="Menú de la cuenta"
          className="flex h-12 w-full items-center gap-2.5 rounded-md px-2 text-left transition-colors hover:bg-active"
        >
          <Avatar nombre={yo.nombre} id={yo.id} size={28} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium leading-5">{yo.nombre}</span>
            <span className="block truncate text-[12px] leading-4 text-muted">{PERFIL_LABEL[yo.perfil]}</span>
          </span>
          <ChevronDown size={14} className="flex-none text-faint" />
        </button>
      )}
    >
      {(cerrar) => (
        <div className="flex flex-col">
          <div className="px-2.5 pt-1.5 pb-2">
            <p className="truncate text-[13px] font-medium">{yo.correo}</p>
            <p className="text-[12px] text-muted">
              {yo.perfil === 'super_admin' ? 'DataGlobal · sin cliente' : clienteActivo.nombre}
            </p>
          </div>
          <div className="my-1 border-t border-rule" />
          <p className="px-2.5 pt-1 pb-1 text-[12px] text-muted">Ver el prototipo como</p>
          {demo.map((u) => (
            <MenuItem
              key={u.id}
              activo={u.id === yo.id}
              onClick={() => {
                verComo(u.id);
                cerrar();
              }}
            >
              <span className="min-w-0 flex-1 truncate">{PERFIL_LABEL[u.perfil]}</span>
              <span className="truncate text-[12px] text-muted">{u.nombre.split(' ')[0]}</span>
              {u.id === yo.id && <Check size={14} className="text-brand-text" />}
            </MenuItem>
          ))}
          <div className="my-1 border-t border-rule" />
          <MenuItem onClick={cambiarTema}>
            {tema === 'claro' ? <Moon size={15} className="text-faint" /> : <Sun size={15} className="text-faint" />}
            {tema === 'claro' ? 'Tema oscuro' : 'Tema claro'}
          </MenuItem>
          <MenuItem
            onClick={() => {
              cerrar();
              ir('/acceso/login');
            }}
          >
            <LogOut size={15} className="text-faint" />
            Cerrar sesión
          </MenuItem>
        </div>
      )}
    </Menu>
  );
}

function ContenidoLateral({ abrirBusqueda, alNavegar }: { abrirBusqueda: () => void; alNavegar?: () => void }) {
  const { ruta, yo } = useStore();
  const admin = yo.perfil === 'super_admin' || yo.perfil === 'admin';
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 flex-none items-center px-4">
        <a href="#/inicio" onClick={alNavegar} aria-label="DataHub, ir al inicio">
          <Logotipo />
        </a>
      </div>
      <div className="flex-none px-2.5">
        <SelectorCliente />
      </div>
      <nav aria-label="Principal" className="mt-3 min-h-0 flex-1 overflow-y-auto px-2.5 pb-4">
        <button
          onClick={() => {
            alNavegar?.();
            abrirBusqueda();
          }}
          className="mb-0.5 flex h-8 w-full items-center gap-2.5 rounded-md pr-1.5 pl-2.5 text-[14px] text-muted transition-colors hover:bg-active/60 hover:text-ink"
        >
          <Search size={16} className="flex-none text-faint" />
          <span className="flex-1 text-left">Buscar</span>
          <Kbd>Ctrl K</Kbd>
        </button>
        <div onClick={alNavegar}>
          <NavLink href="#/inicio" activo={ruta.nombre === 'inicio'} icono={<Home size={16} />}>
            Inicio
          </NavLink>
        </div>

        <p className="mt-6 mb-1.5 px-2.5 text-[12px] text-muted">Workspaces</p>
        <Arbol alNavegar={alNavegar} />

        {admin && (
          <>
            <p className="mt-6 mb-1.5 px-2.5 text-[12px] text-muted">Administración</p>
            <div className="flex flex-col gap-0.5" onClick={alNavegar}>
              {yo.perfil === 'super_admin' && (
                <NavLink href="#/admin/clientes" activo={ruta.nombre === 'clientes'} icono={<Building2 size={16} />}>
                  Clientes
                </NavLink>
              )}
              <NavLink href="#/admin/usuarios" activo={ruta.nombre === 'usuarios'} icono={<Users size={16} />}>
                Usuarios
              </NavLink>
            </div>
          </>
        )}
      </nav>
      <div className="flex-none border-t border-line p-2.5">
        <FilaUsuario />
      </div>
    </div>
  );
}

/* ---------- Paleta de búsqueda (Ctrl+K) ---------- */

function Paleta({ cerrar }: { cerrar: () => void }) {
  const { misPaginas, rutaDe } = useStore();
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => inputRef.current?.focus(), []);

  const resultados = React.useMemo(() => {
    const n = normalizar(q.trim());
    const base = [...misPaginas].sort((a, b) => b.actualizada.localeCompare(a.actualizada));
    if (!n) return base.slice(0, 6);
    return base.filter((p) => normalizar(`${p.titulo} ${p.etiquetas.join(' ')} ${TIPO_LABEL[p.tipo]}`).includes(n)).slice(0, 8);
  }, [q, misPaginas]);

  const abrir = (id: string) => {
    cerrar();
    ir(`/p/${id}`);
  };
  const verTodo = () => {
    cerrar();
    ir(`/buscar?q=${encodeURIComponent(q.trim())}`);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, resultados.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (sel < resultados.length) abrir(resultados[sel].id);
      else verTodo();
    } else if (e.key === 'Escape') cerrar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-[10vh] anim-fade" onMouseDown={cerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar páginas"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-[640px] overflow-hidden rounded-xl border border-line bg-surface shadow-float anim-rise"
      >
        <div className="flex h-14 items-center gap-3 border-b border-rule px-4">
          <Search size={18} className="flex-none text-faint" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={onKey}
            placeholder="Busca por título, tipo o etiqueta: «publicar portal», «runbook», «iis»"
            aria-label="Buscar"
            role="combobox"
            aria-expanded="true"
            aria-controls="paleta-lista"
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] focus:outline-none focus-visible:outline-none"
          />
          <Kbd>Esc</Kbd>
        </div>
        <ul id="paleta-lista" role="listbox" className="max-h-[52vh] overflow-y-auto p-1.5">
          <li className="px-3 pt-2 pb-1.5 text-[12px] text-muted">{q.trim() ? 'Páginas' : 'Actualizadas recientemente'}</li>
          {resultados.map((p, i) => {
            const r = rutaDe(p);
            return (
              <li key={p.id} role="option" aria-selected={i === sel}>
                <button
                  onMouseEnter={() => setSel(i)}
                  onClick={() => abrir(p.id)}
                  className={cx('flex w-full items-center gap-3 rounded-md px-3 py-2 text-left', i === sel && 'bg-active')}
                >
                  <FileText size={16} className="flex-none text-faint" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium">{p.titulo}</span>
                    <span className="block truncate text-[12px] text-muted">
                      {r.workspace.nombre} / {r.espacio.nombre} / {r.coleccion.nombre}
                    </span>
                  </span>
                  <EstadoPill estado={p.estado} />
                </button>
              </li>
            );
          })}
          {q.trim() && resultados.length === 0 && (
            <li className="px-3 py-3 text-[14px] text-muted">Ningún título coincide con «{q.trim()}». Prueba buscar también en el contenido.</li>
          )}
          {q.trim() && (
            <li role="option" aria-selected={sel === resultados.length}>
              <button
                onMouseEnter={() => setSel(resultados.length)}
                onClick={verTodo}
                className={cx(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[14px]',
                  sel === resultados.length && 'bg-active',
                )}
              >
                <Search size={16} className="flex-none text-faint" />
                Buscar «{q.trim()}» en títulos y contenido
              </button>
            </li>
          )}
        </ul>
        <footer className="flex items-center gap-4 border-t border-rule px-4 py-2 text-[12px] text-muted">
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> moverse
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>Enter</Kbd> abrir
          </span>
          <span className="ml-auto">Solo muestra lo que puedes ver</span>
        </footer>
      </div>
    </div>
  );
}

/* ---------- Aviso efímero ---------- */

function Aviso() {
  const { toast } = useStore();
  const [visible, setVisible] = React.useState<typeof toast>(null);
  React.useEffect(() => {
    if (!toast) return;
    setVisible(toast);
    const t = setTimeout(() => setVisible(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);
  if (!visible) return null;
  return (
    <div
      role="status"
      key={visible.id}
      className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[13px] text-surface shadow-float anim-rise"
    >
      <Check size={15} className="text-leaf" />
      {visible.texto}
    </div>
  );
}

/* ---------- Armazón ---------- */

export function Shell({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const [paleta, setPaleta] = React.useState(false);
  const [hoja, setHoja] = React.useState(false);

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaleta(true);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <div className="min-h-screen bg-ground">
      <a
        href="#contenido"
        className="sr-only z-50 rounded bg-surface px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] border-r border-line bg-ground lg:block">
        <ContenidoLateral abrirBusqueda={() => setPaleta(true)} />
      </aside>

      {/* Teléfono y tableta: barra superior y hoja de navegación. */}
      <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-line bg-ground px-2 lg:hidden">
        <button
          aria-label="Abrir navegación"
          onClick={() => setHoja(true)}
          className="flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-active"
        >
          <MenuIcon size={20} />
        </button>
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{titulo}</span>
        <button
          aria-label="Buscar"
          onClick={() => setPaleta(true)}
          className="flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-active"
        >
          <Search size={19} />
        </button>
      </header>
      {hoja && (
        <div className="fixed inset-0 z-50 bg-ground anim-fade lg:hidden" role="dialog" aria-modal="true" aria-label="Navegación">
          <button
            aria-label="Cerrar navegación"
            onClick={() => setHoja(false)}
            className="absolute top-2 right-2 z-10 flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-active"
          >
            <X size={20} />
          </button>
          <ContenidoLateral abrirBusqueda={() => setPaleta(true)} alNavegar={() => setHoja(false)} />
        </div>
      )}

      <main id="contenido" className="lg:pl-[248px]">
        {children}
      </main>

      {paleta && <Paleta cerrar={() => setPaleta(false)} />}
      <Aviso />
    </div>
  );
}
