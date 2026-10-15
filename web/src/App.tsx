import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { Layout, Protegida, RequierePermiso, SesionProvider } from './Sesion'
import { ClienteForm, Clientes } from './clientes'
import { AceptarInvitacion, Inicio, Login, OlvideContrasena, RestablecerContrasena } from './pantallas'

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
