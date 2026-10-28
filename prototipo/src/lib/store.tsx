import React from 'react';
import { CLIENTES, COLECCIONES, ESPACIOS, PAGINAS, USUARIOS, WORKSPACES } from './mock';
import type { Cliente, Coleccion, Espacio, Pagina, Usuario, Workspace } from './types';

/* ---------- Ruteo por hash (#/inicio, #/e/e-portal?c=k-portal-pub, #/p/p-x?tab=archivos) ---------- */

export interface Ruta {
  nombre: string;
  id?: string;
  query: URLSearchParams;
}

function leerRuta(): Ruta {
  const hash = window.location.hash.replace(/^#/, '') || '/inicio';
  const [path, qs] = hash.split('?');
  const partes = path.split('/').filter(Boolean);
  const query = new URLSearchParams(qs ?? '');
  switch (partes[0]) {
    case 'w':
      return { nombre: 'workspace', id: partes[1], query };
    case 'e':
      return { nombre: 'espacio', id: partes[1], query };
    case 'p':
      return { nombre: 'pagina', id: partes[1], query };
    case 'buscar':
      return { nombre: 'buscar', query };
    case 'admin':
      return { nombre: partes[1] === 'usuarios' ? 'usuarios' : 'clientes', query };
    case 'acceso':
      return { nombre: 'acceso', id: partes[1] ?? 'login', query };
    default:
      return { nombre: 'inicio', query };
  }
}

export function ir(href: string) {
  window.location.hash = href.replace(/^#/, '');
}

/* ---------- Permisos (PRD §3.2). El frontend solo oculta; decide el backend. ---------- */

export type Accion =
  | 'clientes.gestionar'
  | 'usuarios.gestionar'
  | 'workspaces.gestionar'
  | 'espacios.gestionar'
  | 'paginas.aprobar'
  | 'paginas.eliminar'
  | 'archivos.eliminar';

export function puede(u: Usuario, accion: Accion, recurso?: { creadaPor?: string; subpaginas?: number; subidoPor?: string }): boolean {
  const p = u.perfil;
  switch (accion) {
    case 'clientes.gestionar':
      return p === 'super_admin';
    case 'usuarios.gestionar':
    case 'workspaces.gestionar':
      return p === 'super_admin' || p === 'admin';
    case 'espacios.gestionar':
    case 'paginas.aprobar':
      return p !== 'colaborador';
    case 'paginas.eliminar':
      return p !== 'colaborador' || (recurso?.creadaPor === u.id && (recurso?.subpaginas ?? 0) === 0);
    case 'archivos.eliminar':
      return p !== 'colaborador' || recurso?.subidoPor === u.id;
  }
}

/* ---------- Estado global del prototipo ---------- */

interface Toast {
  id: number;
  texto: string;
}

interface Store {
  ruta: Ruta;
  clientes: Cliente[];
  usuarios: Usuario[];
  workspaces: Workspace[];
  espacios: Espacio[];
  colecciones: Coleccion[];
  paginas: Pagina[];
  yo: Usuario;
  clienteActivo: Cliente;
  /** Workspaces del cliente activo que el usuario puede ver. */
  misWorkspaces: Workspace[];
  /** Páginas dentro del alcance del usuario (lo que el buscador puede devolver). */
  misPaginas: Pagina[];
  tema: 'claro' | 'oscuro';
  toast: Toast | null;
  verComo: (usuarioId: string) => void;
  operarEn: (clienteId: string) => void;
  cambiarTema: () => void;
  avisar: (texto: string) => void;
  setPaginas: React.Dispatch<React.SetStateAction<Pagina[]>>;
  setUsuarios: React.Dispatch<React.SetStateAction<Usuario[]>>;
  setClientes: React.Dispatch<React.SetStateAction<Cliente[]>>;
  usuario: (id: string) => Usuario | undefined;
  rutaDe: (p: Pagina) => { workspace: Workspace; espacio: Espacio; coleccion: Coleccion; padres: Pagina[] };
}

const Ctx = React.createContext<Store | null>(null);

export function useStore(): Store {
  const s = React.useContext(Ctx);
  if (!s) throw new Error('useStore fuera del proveedor');
  return s;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ruta, setRuta] = React.useState<Ruta>(leerRuta);
  const [clientes, setClientes] = React.useState(CLIENTES);
  const [usuarios, setUsuarios] = React.useState(USUARIOS);
  const [paginas, setPaginas] = React.useState(PAGINAS);
  const [yoId, setYoId] = React.useState('u-sa');
  const [clienteSA, setClienteSA] = React.useState('c-dg');
  const [toast, setToast] = React.useState<Toast | null>(null);
  const [tema, setTema] = React.useState<'claro' | 'oscuro'>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'oscuro' : 'claro',
  );

  React.useEffect(() => {
    const onHash = () => {
      setRuta(leerRuta());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  React.useEffect(() => {
    document.documentElement.dataset.theme = tema === 'oscuro' ? 'dark' : 'light';
    try {
      localStorage.setItem('dh-tema', tema);
    } catch {
      /* sin almacenamiento: el tema dura la sesión */
    }
  }, [tema]);

  const yo = usuarios.find((u) => u.id === yoId)!;
  const clienteActivo = clientes.find((c) => c.id === (yo.clienteId ?? clienteSA))!;

  const misWorkspaces = React.useMemo(
    () =>
      WORKSPACES.filter(
        (w) =>
          w.clienteId === clienteActivo.id &&
          (yo.perfil === 'super_admin' || yo.perfil === 'admin' || yo.workspaces.includes(w.id)),
      ),
    [clienteActivo.id, yo],
  );

  const misPaginas = React.useMemo(() => {
    const ws = new Set(misWorkspaces.map((w) => w.id));
    const es = new Set(ESPACIOS.filter((e) => ws.has(e.workspaceId)).map((e) => e.id));
    const ks = new Set(COLECCIONES.filter((k) => es.has(k.espacioId)).map((k) => k.id));
    return paginas.filter((p) => ks.has(p.coleccionId));
  }, [misWorkspaces, paginas]);

  const avisar = React.useCallback((texto: string) => setToast({ id: Date.now(), texto }), []);

  const value: Store = {
    ruta,
    clientes,
    usuarios,
    workspaces: WORKSPACES,
    espacios: ESPACIOS,
    colecciones: COLECCIONES,
    paginas,
    yo,
    clienteActivo,
    misWorkspaces,
    misPaginas,
    tema,
    toast,
    verComo: (id) => {
      setYoId(id);
      ir('/inicio');
    },
    operarEn: (id) => {
      setClienteSA(id);
      ir('/inicio');
    },
    cambiarTema: () => setTema((t) => (t === 'claro' ? 'oscuro' : 'claro')),
    avisar,
    setPaginas,
    setUsuarios,
    setClientes,
    usuario: (id) => usuarios.find((u) => u.id === id),
    rutaDe: (p) => {
      const coleccion = COLECCIONES.find((k) => k.id === p.coleccionId)!;
      const espacio = ESPACIOS.find((e) => e.id === coleccion.espacioId)!;
      const workspace = WORKSPACES.find((w) => w.id === espacio.workspaceId)!;
      const padres: Pagina[] = [];
      let actual = p.padreId ? paginas.find((x) => x.id === p.padreId) : undefined;
      while (actual) {
        padres.unshift(actual);
        actual = actual.padreId ? paginas.find((x) => x.id === actual!.padreId) : undefined;
      }
      return { workspace, espacio, coleccion, padres };
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
