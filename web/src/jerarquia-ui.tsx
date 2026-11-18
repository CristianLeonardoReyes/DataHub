import { useId, useState, type FormEvent } from 'react'
import type { Resultado } from './api/http'
import { Alerta, Boton, btnSmCls, inputCls } from './ui'

/** Mensaje de la API para un resultado fallido (null si fue bien), para las acciones de formularios. */
export const errorDe = (r: Resultado<unknown>, defecto: string) => (r.ok ? null : (r.problema.detail ?? defecto))

/** Formulario de un solo campo de texto. `onEnviar` devuelve el mensaje de error, o null si salió bien. */
export function FormNombre(p: {
  label: string
  inicial?: string
  boton: string
  textoCarga: string
  onEnviar: (valor: string) => Promise<string | null>
  onCancelar?: () => void
  compacto?: boolean
}) {
  const id = useId()
  const [valor, setValor] = useState(p.inicial ?? '')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const v = valor.trim()
    if (!v) {
      setError('Escribe un nombre')
      return
    }
    setEnviando(true)
    setError(null)
    setError(await p.onEnviar(v))
    setEnviando(false)
  }

  return (
    <form onSubmit={enviar} noValidate className={p.compacto ? 'space-y-1.5 py-1' : 'space-y-2'}>
      <label htmlFor={id} className={p.compacto ? 'sr-only' : 'block text-sm font-medium'}>{p.label}</label>
      <input id={id} value={valor} onChange={(e) => setValor(e.target.value)} autoFocus={p.compacto}
        aria-invalid={!!error || undefined} className={`${inputCls} ${p.compacto ? 'h-8 text-[13px]' : ''}`} />
      <Alerta texto={error} />
      <div className="flex gap-1.5">
        <Boton type="submit" cargando={enviando} textoCarga={p.textoCarga} className={btnSmCls}>{p.boton}</Boton>
        {p.onCancelar && <button type="button" className={btnSmCls} onClick={p.onCancelar}>Cancelar</button>}
      </div>
    </form>
  )
}
