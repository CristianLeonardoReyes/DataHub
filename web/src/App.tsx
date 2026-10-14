import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { Protegida, SesionProvider } from './Sesion'
import { AceptarInvitacion, Inicio, Login, OlvideContrasena, RestablecerContrasena } from './pantallas'

export function Rutas() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/aceptar-invitacion" element={<AceptarInvitacion />} />
      <Route path="/olvide-contrasena" element={<OlvideContrasena />} />
      <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
      <Route path="/" element={<Protegida><Inicio /></Protegida>} />
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
