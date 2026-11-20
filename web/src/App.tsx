import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { Layout, Protegida, RequierePermiso, SesionProvider } from './Sesion'
import { ClienteForm, Clientes } from './clientes'
import { InvitarUsuario, Usuarios } from './usuarios'
import { Inicio } from './inicio'
import { ContenedorVista } from './contenedores'
import { PaginaVista } from './paginas'
import { Busqueda } from './busqueda'
import { Workspaces } from './workspaces'
import { AceptarInvitacion, Login, OlvideContrasena, RestablecerContrasena } from './pantallas'

export function Rutas() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/aceptar-invitacion" element={<AceptarInvitacion />} />
      <Route path="/olvide-contrasena" element={<OlvideContrasena />} />
      <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
      <Route element={<Protegida><Layout /></Protegida>}>
        <Route path="/" element={<Inicio />} />
        <Route path="/clientes" element={<RequierePermiso permiso="clientesGestionar"><Clientes /></RequierePermiso>} />
        <Route path="/clientes/nuevo" element={<RequierePermiso permiso="clientesGestionar"><ClienteForm /></RequierePermiso>} />
        <Route path="/clientes/:guid" element={<RequierePermiso permiso="clientesGestionar"><ClienteForm /></RequierePermiso>} />
        <Route path="/usuarios" element={<RequierePermiso permiso="usuariosGestionar"><Usuarios /></RequierePermiso>} />
        <Route path="/usuarios/nuevo" element={<RequierePermiso permiso="usuariosGestionar"><InvitarUsuario /></RequierePermiso>} />
        <Route path="/workspaces" element={<RequierePermiso permiso="workspacesGestionar"><Workspaces /></RequierePermiso>} />
        <Route path="/workspaces/:guid" element={<ContenedorVista tipo="workspace" />} />
        <Route path="/espacios/:guid" element={<ContenedorVista tipo="espacio" />} />
        <Route path="/colecciones/:guid" element={<ContenedorVista tipo="coleccion" />} />
        <Route path="/buscar" element={<RequierePermiso permiso="buscar"><Busqueda /></RequierePermiso>} />
        <Route path="/paginas/:guid" element={<PaginaVista />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SesionProvider>
        <Rutas />
      </SesionProvider>
    </BrowserRouter>
  )
}
