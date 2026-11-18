import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { TableKit } from '@tiptap/extension-table'
import {
  Bold, Code, Code2, Heading1, Heading2, Heading3, Italic, Link2, List, ListChecks, ListOrdered, Minus, Quote,
  Strikethrough, Table2, Trash2,
} from 'lucide-react'
import * as api from './api/contenido'
import { Alerta, Boton, btnSmCls, inputCls, panelCls } from './ui'

const ESQUEMAS = ['http:', 'https:', 'mailto:']
function enlacePermitido(url: string) {
  try {
    return ESQUEMAS.includes(new URL(url).protocol)
  } catch {
    return false
  }
}

const extensiones = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    underline: false,
    link: {
      openOnClick: false,
      isAllowedUri: (url) => enlacePermitido(url),
      HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
    },
  }),
  TaskList,
  TaskItem.configure({ nested: true }),
  TableKit,
]

type Estado = 'quieto' | 'editando' | 'guardando' | 'guardado' | 'error' | 'conflicto'
const TEXTO: Record<Estado, string> = {
  quieto: '', editando: 'Editando', guardando: 'Guardando…', guardado: 'Guardado', error: 'Error al guardar', conflicto: 'Error al guardar',
}
const DEBOUNCE_MS = 1500
const REINTENTO_MS = 5000
// Guardado en curso por página: al volver a abrirla se espera a que termine antes de leer,
// para no cargar la versión anterior y provocar un 409 falso contra uno mismo.
const enCurso = new Map<string, Promise<unknown>>()

function useAutoguardado(guid: string, version: number, editable: boolean, alConflicto: () => void) {
  const [estado, setEstado] = useState<Estado>('quieto')
  const [detalle, setDetalle] = useState<string | null>(null)
  const v = useRef(version)
  const ultimo = useRef<api.TiptapDoc | null>(null)
  const sucio = useRef(false)
  const guardando = useRef(false)
  const detenido = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const conflicto = useRef(alConflicto)
  useEffect(() => { conflicto.current = alConflicto })

  const guardar = useCallback(async function guardar(): Promise<void> {
    clearTimeout(timer.current)
    // Un solo guardado a la vez: si hay uno en curso, al terminar encadena el siguiente.
    if (guardando.current || detenido.current || !sucio.current || !ultimo.current) return
    guardando.current = true
    sucio.current = false
    setEstado('guardando')
    setDetalle(null)
    const peticion = api.contenido.guardar(guid, { contenido: ultimo.current, version: v.current })
    enCurso.set(guid, peticion)
    const r = await peticion
    if (enCurso.get(guid) === peticion) enCurso.delete(guid)
    guardando.current = false
    if (r.ok) {
      v.current = r.datos.version
      if (sucio.current) return void guardar()
      setEstado('guardado')
    } else if (r.status === 409) {
      detenido.current = true
      setEstado('conflicto')
      conflicto.current()
    } else {
      sucio.current = true
      setDetalle(r.status === 400 ? (r.problema.detail ?? null) : null)
      setEstado('error')
      // Red o servidor: reintenta solo (también tras salir de la página). Un 400 espera a una edición.
      // ponytail: reintento fijo cada 5 s, sin backoff; añadirlo si la API sufre caídas largas.
      if (r.status === 0 || r.status >= 500) timer.current = setTimeout(() => void guardar(), REINTENTO_MS)
    }
  }, [guid])

  const alEditar = useCallback((doc: api.TiptapDoc) => {
    if (!editable || detenido.current) return
    ultimo.current = doc
    sucio.current = true
    setEstado('editando')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => void guardar(), DEBOUNCE_MS)
  }, [editable, guardar])

  useEffect(() => {
    const aviso = (e: BeforeUnloadEvent) => {
      if (sucio.current || guardando.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', aviso)
    return () => {
      window.removeEventListener('beforeunload', aviso)
      void guardar()
    }
  }, [guardar])

  return { estado, detalle, alEditar, reintentar: guardar }
}

type Carga = { status: number; detalle?: string | null } | { contenido: api.TiptapDoc | null; version: number }

export function EditorContenido({ guid, editable }: { guid: string; editable: boolean }) {
  const [carga, setCarga] = useState<Carga | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    void (enCurso.get(guid) ?? Promise.resolve()).then(() => api.contenido.obtener(guid)).then((r) => {
      if (!vigente) return
      setCarga(r.ok ? r.datos : { status: r.status, detalle: r.problema.detail })
    })
    return () => {
      vigente = false
    }
  }, [guid, intento])

  if (!carga) return <p className="text-sm text-muted">Cargando contenido…</p>
  if ('status' in carga)
    return <Alerta texto={carga.status === 404 ? 'Página no encontrada o sin acceso' : (carga.detalle ?? 'No se pudo cargar el contenido')} />
  return (
    <EditorCargado key={`${guid}:${intento}`} guid={guid} inicial={carga.contenido} version={carga.version} editable={editable}
      recargar={() => { setCarga(null); setIntento((i) => i + 1) }} />
  )
}

function EditorCargado({ guid, inicial, version, editable, recargar }:
  { guid: string; inicial: api.TiptapDoc | null; version: number; editable: boolean; recargar: () => void }) {
  const [conflicto, setConflicto] = useState(false)
  const { estado, detalle, alEditar, reintentar } = useAutoguardado(guid, version, editable, () => setConflicto(true))
  const editor = useEditor({
    extensions: extensiones,
    content: inicial ?? undefined,
    editable,
    editorProps: { attributes: { class: 'contenido', 'aria-label': 'Contenido de la página' } },
    onUpdate: ({ editor }) => alEditar(editor.getJSON()),
  })
  // En conflicto ya no se guarda: bloquear la escritura evita cambios que se perderían.
  useEffect(() => { if (conflicto) editor?.setEditable(false) }, [conflicto, editor])

  return (
    <div className="space-y-3">
      {conflicto && (
        <div className="space-y-2">
          <Alerta texto="Otra persona guardó cambios en esta página. Recarga para ver la última versión; tus cambios locales sin guardar se perderán." />
          <button type="button" className={btnSmCls} onClick={recargar}>Recargar</button>
        </div>
      )}
      <div className={`${panelCls} overflow-hidden`}>
        {editable && !conflicto && editor && <Barra editor={editor} />}
        <div className="p-4"><EditorContent editor={editor} /></div>
      </div>
      {editable && (
        <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted">
          <span role="status" aria-live="polite">{TEXTO[estado]}</span>
          {estado === 'error' && (
            <>
              {detalle && <span className="text-danger-ink">{detalle}</span>}
              <Boton type="button" className={btnSmCls} onClick={() => void reintentar()}>Reintentar</Boton>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Barra({ editor }: { editor: Editor }) {
  const [enlace, setEnlace] = useState<string | null>(null)
  const [errorEnlace, setErrorEnlace] = useState<string | null>(null)
  const a = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'), italic: e.isActive('italic'), strike: e.isActive('strike'), code: e.isActive('code'),
      h1: e.isActive('heading', { level: 1 }), h2: e.isActive('heading', { level: 2 }), h3: e.isActive('heading', { level: 3 }),
      bullet: e.isActive('bulletList'), ordered: e.isActive('orderedList'), task: e.isActive('taskList'),
      quote: e.isActive('blockquote'), codeBlock: e.isActive('codeBlock'), link: e.isActive('link'), tabla: e.isActive('table'),
    }),
  })
  const c = () => editor.chain().focus()

  function abrirEnlace() {
    setErrorEnlace(null)
    setEnlace(editor.getAttributes('link').href ?? '')
  }
  function aplicarEnlace() {
    const url = (enlace ?? '').trim()
    if (!url) c().extendMarkRange('link').unsetLink().run()
    else if (!enlacePermitido(url)) return setErrorEnlace('Solo se permiten enlaces http, https o mailto')
    else c().extendMarkRange('link').setLink({ href: url }).run()
    setEnlace(null)
  }

  const B = (nombre: string, icono: ReactNode, activo: boolean | null, accion: () => void) => (
    <button type="button" aria-label={nombre} title={nombre} aria-pressed={activo ?? undefined} onClick={accion}
      className="inline-flex size-8 items-center justify-center rounded-md text-ink hover:bg-raised aria-pressed:bg-brand-soft aria-pressed:text-brand-text">
      {icono}
    </button>
  )
  const i = 'size-4'
  const grupo = 'flex items-center gap-0.5 border-r border-rule pr-1.5 last:border-0'

  return (
    <div className="border-b border-line bg-raised/50 p-1.5">
      <div role="toolbar" aria-label="Formato" className="flex flex-wrap items-center gap-1.5">
        <div className={grupo}>
          {B('Título 1', <Heading1 aria-hidden className={i} />, a.h1, () => c().toggleHeading({ level: 1 }).run())}
          {B('Título 2', <Heading2 aria-hidden className={i} />, a.h2, () => c().toggleHeading({ level: 2 }).run())}
          {B('Título 3', <Heading3 aria-hidden className={i} />, a.h3, () => c().toggleHeading({ level: 3 }).run())}
        </div>
        <div className={grupo}>
          {B('Negrita', <Bold aria-hidden className={i} />, a.bold, () => c().toggleBold().run())}
          {B('Cursiva', <Italic aria-hidden className={i} />, a.italic, () => c().toggleItalic().run())}
          {B('Tachado', <Strikethrough aria-hidden className={i} />, a.strike, () => c().toggleStrike().run())}
          {B('Código en línea', <Code aria-hidden className={i} />, a.code, () => c().toggleCode().run())}
          {B('Enlace', <Link2 aria-hidden className={i} />, a.link, abrirEnlace)}
        </div>
        <div className={grupo}>
          {B('Lista con viñetas', <List aria-hidden className={i} />, a.bullet, () => c().toggleBulletList().run())}
          {B('Lista numerada', <ListOrdered aria-hidden className={i} />, a.ordered, () => c().toggleOrderedList().run())}
          {B('Lista de tareas', <ListChecks aria-hidden className={i} />, a.task, () => c().toggleTaskList().run())}
        </div>
        <div className={grupo}>
          {B('Cita', <Quote aria-hidden className={i} />, a.quote, () => c().toggleBlockquote().run())}
          {B('Bloque de código', <Code2 aria-hidden className={i} />, a.codeBlock, () => c().toggleCodeBlock().run())}
          {B('Separador', <Minus aria-hidden className={i} />, null, () => c().setHorizontalRule().run())}
          {B('Insertar tabla', <Table2 aria-hidden className={i} />, null, () => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}
        </div>
      </div>
      {a.tabla && (
        <div role="toolbar" aria-label="Tabla" className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <button type="button" className={btnSmCls} onClick={() => c().addRowAfter().run()}>Añadir fila</button>
          <button type="button" className={btnSmCls} onClick={() => c().deleteRow().run()}>Quitar fila</button>
          <button type="button" className={btnSmCls} onClick={() => c().addColumnAfter().run()}>Añadir columna</button>
          <button type="button" className={btnSmCls} onClick={() => c().deleteColumn().run()}>Quitar columna</button>
          <button type="button" className={`${btnSmCls} text-danger hover:bg-danger-bg`} onClick={() => c().deleteTable().run()}>
            <Trash2 aria-hidden className="size-3.5" />Eliminar tabla
          </button>
        </div>
      )}
      {enlace !== null && (
        <form className="mt-1.5 flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); aplicarEnlace() }}>
          <label htmlFor="enlace-url" className="text-[13px] font-medium">Dirección del enlace</label>
          <input id="enlace-url" autoFocus value={enlace} onChange={(e) => setEnlace(e.target.value)} placeholder="https://…"
            aria-invalid={errorEnlace ? true : undefined} className={`${inputCls} h-8 w-64 max-w-full`} />
          <button type="submit" className={btnSmCls}>Aplicar</button>
          <button type="button" className={btnSmCls} onClick={() => setEnlace(null)}>Cancelar</button>
          {errorEnlace && <span role="alert" className="text-[13px] text-danger-ink">{errorEnlace}</span>}
        </form>
      )}
    </div>
  )
}
