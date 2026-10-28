import { StoreProvider, useStore } from './lib/store';
import { Shell } from './shell';
import { Acceso } from './screens/acceso';
import { Clientes, Usuarios } from './screens/admin';
import { Buscar } from './screens/buscar';
import { Inicio } from './screens/inicio';
import { VistaEspacio, VistaWorkspace } from './screens/jerarquia';
import { VistaPagina } from './screens/pagina';

function Pantalla() {
  const { ruta, espacios, workspaces, paginas } = useStore();
  if (ruta.nombre === 'acceso') {
    document.title = 'Acceso · DataHub';
    return <Acceso id={ruta.id ?? 'login'} />;
  }

  let titulo = 'Inicio';
  let vista = <Inicio />;
  switch (ruta.nombre) {
    case 'workspace':
      titulo = workspaces.find((w) => w.id === ruta.id)?.nombre ?? 'Workspace';
      vista = <VistaWorkspace key={ruta.id} id={ruta.id!} />;
      break;
    case 'espacio':
      titulo = espacios.find((e) => e.id === ruta.id)?.nombre ?? 'Espacio';
      vista = <VistaEspacio key={ruta.id} id={ruta.id!} />;
      break;
    case 'pagina':
      titulo = paginas.find((p) => p.id === ruta.id)?.titulo ?? 'Página';
      vista = <VistaPagina key={ruta.id} id={ruta.id!} />;
      break;
    case 'buscar':
      titulo = 'Buscar';
      vista = <Buscar />;
      break;
    case 'clientes':
      titulo = 'Clientes';
      vista = <Clientes />;
      break;
    case 'usuarios':
      titulo = 'Usuarios';
      vista = <Usuarios />;
      break;
  }
  document.title = `${titulo} · DataHub`;
  return <Shell titulo={titulo}>{vista}</Shell>;
}

export default function App() {
  return (
    <StoreProvider>
      <Pantalla />
    </StoreProvider>
  );
}
