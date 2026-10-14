import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router'
import * as auth from './api/auth'

type Ctx = { usuario: auth.UsuarioActual | null; cargando: boolean; recargar: () => Promise<void>; salir: () => Promise<void> }
const SesionCtx = createContext<Ctx | null>(null)

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<auth.UsuarioActual | null>(null)
  const [cargando, setCargando] = useState(true)

  const recargar = useCallback(async () => {
    const r = await auth.me()
    setUsuario(r.ok ? r.datos : null)
    setCargando(false)
  }, [])
  const salir = useCallback(async () => {
    await auth.logout()
    setUsuario(null)
  }, [])

  useEffect(() => {
    void recargar()
  }, [recargar])

  return <SesionCtx.Provider value={{ usuario, cargando, recargar, salir }}>{children}</SesionCtx.Provider>
}

export function useSesion() {
  const c = useContext(SesionCtx)
  if (!c) throw new Error('useSesion fuera de SesionProvider')
  return c
}

export function Protegida({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useSesion()
  if (cargando) return <p className="p-8 text-zinc-400">Cargando…</p>
  return usuario ? children : <Navigate to="/login" replace />
}
