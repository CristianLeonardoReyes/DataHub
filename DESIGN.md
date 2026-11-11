---
name: DataHub
description: Wiki técnica multiempresa de DataGlobal; conocimiento gobernado con estado, responsable y vigencia.
colors:
  ground: "#f4f5f9"
  surface: "#ffffff"
  raised: "#f8f9fc"
  active: "#e7e9f1"
  line: "#e2e5ec"
  rule: "#eef0f4"
  control: "#cdd2dc"
  ink: "#12141c"
  muted: "#555a6a"
  faint: "#676c7c"
  brand: "#2b3a8f"
  brand-hover: "#23307a"
  on-brand: "#ffffff"
  brand-soft: "#eceffb"
  brand-text: "#2b3a8f"
  leaf: "#8dc63f"
  review-signal: "#e5a03a"
  ok-bg: "#e9f5d9"
  ok-ink: "#2c4f08"
  review-bg: "#fff3dc"
  review-ink: "#7f4500"
  draft-bg: "#eef0f4"
  draft-ink: "#424757"
  archived-bg: "#f1f1f2"
  archived-ink: "#5c5c63"
  danger: "#b3261e"
  danger-bg: "#fdecea"
  danger-ink: "#8c1d18"
  code-bg: "#f3f4f8"
  selection: "#d6dcf6"
  dark-ground: "#0f1013"
  dark-surface: "#16171b"
  dark-raised: "#1c1e23"
  dark-active: "#262831"
  dark-line: "#2a2c34"
  dark-rule: "#212329"
  dark-control: "#3b3e48"
  dark-ink: "#eceef3"
  dark-muted: "#b3b7c3"
  dark-faint: "#959aa7"
  dark-brand: "#7f8fe0"
  dark-brand-hover: "#95a2e8"
  dark-on-brand: "#0f1013"
  dark-brand-soft: "#1f2440"
  dark-brand-text: "#9eabef"
  dark-ok-bg: "#1d2b10"
  dark-ok-ink: "#a8db69"
  dark-review-bg: "#2e2412"
  dark-review-ink: "#f0b860"
  dark-draft-bg: "#23252b"
  dark-draft-ink: "#c3c7d1"
  dark-archived-bg: "#222326"
  dark-archived-ink: "#a5a7ad"
  dark-danger: "#f08a82"
  dark-danger-bg: "#331b1a"
  dark-danger-ink: "#f6a39c"
  dark-code-bg: "#1c1e23"
  dark-selection: "#2f3768"
typography:
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "32px"
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "20px"
  doc-body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "27px"
  doc-h2:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "28px"
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
    fontFeature: "\"cv11\", \"ss01\""
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "20px"
  caption:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
  mono:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 400
    fontFeature: "\"tnum\""
rounded:
  xs: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "10": "40px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.brand-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  button-secondary-hover:
    backgroundColor: "{colors.raised}"
  button-ghost:
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  button-ghost-hover:
    backgroundColor: "{colors.active}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
    rounded: "{rounded.md}"
    height: "32px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
  pill-aprobado:
    backgroundColor: "{colors.ok-bg}"
    textColor: "{colors.ok-ink}"
    rounded: "{rounded.xs}"
    padding: "0 8px"
    height: "22px"
  pill-en-revision:
    backgroundColor: "{colors.review-bg}"
    textColor: "{colors.review-ink}"
    rounded: "{rounded.xs}"
    padding: "0 8px"
    height: "22px"
  pill-borrador:
    backgroundColor: "{colors.draft-bg}"
    textColor: "{colors.draft-ink}"
    rounded: "{rounded.xs}"
    padding: "0 8px"
    height: "22px"
  pill-archivado:
    backgroundColor: "{colors.archived-bg}"
    textColor: "{colors.archived-ink}"
    rounded: "{rounded.xs}"
    padding: "0 8px"
    height: "22px"
  nav-item-active:
    backgroundColor: "{colors.active}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "32px"
  dialog:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
  side-panel:
    backgroundColor: "{colors.surface}"
    width: "440px"
---

# Design System: DataHub

> Derivado del código del prototipo (`prototipo/src`: `index.css`, `ui.tsx`, `shell.tsx`, `screens/`). Es la **referencia visual que `web/` debe imitar**: se reproducen tokens, medidas y comportamiento, **no se copia código** de `prototipo/`. Los tokens del frontmatter son normativos; los `dark-*` son los valores de `[data-theme="dark"]` para el mismo rol.

## Overview

**Creative North Star: "El libro mayor acromático"**

DataHub se ve como un registro contable: suelo gris azulado, superficies blancas delimitadas por un borde de 1px, tinta casi negra y densidad de herramienta de trabajo (texto base 14/20). El color no decora; informa. El azul DataGlobal señala la acción principal, el elemento activo y los enlaces de nombre; el verde DataGlobal solo aparece en "Aprobado". Estado, responsable y vigencia son datos de primera clase en cada lista y página.

El tono es minimalista tipo Notion/Linear: sin degradados, sin tarjetas con iconos de KPI, sin sombras en reposo. La profundidad se logra con capas tonales (suelo → superficie → elevado → activo) y bordes, y la sombra queda reservada a lo que flota.

**Key Characteristics:**
- Suelo gris azulado compartido por barra lateral, barra superior y fondo de página; los paneles blancos son lo único que se levanta.
- Un único azul de marca por pantalla en el botón primario.
- Geist Mono para rutas, fechas ISO, conteos y atajos; cifras tabulares siempre.
- Radios pequeños y escalonados (8 / 6 / 4).
- Temas claro y oscuro con los mismos roles.

## Colors

Paleta acromática de tinta y grises azulados con un azul de marca escaso y una familia semántica para el ciclo de vida.

### Primary
- **Azul DataGlobal** (`brand`; oscuro `dark-brand`): botón primario, foco (`outline 2px`, offset 2px), casillas (`accent-color`), elemento de datos activo. Hover con `brand-hover`. Texto sobre él: `on-brand`.
- **Azul de enlace** (`brand-text`): enlaces dentro del contenido de página (subrayado 1px, offset 3px) y marcas de selección (check) en menús.
- **Azul tenue** (`brand-soft`): resaltado de coincidencias de búsqueda (`mark`). `selection` para la selección de texto.

### Secondary
- **Verde DataGlobal** (`leaf`): solo estado aprobado: punto de 6px en la pastilla "Aprobado", segmento "Aprobadas y vigentes" de la barra de vigencia, punto "Guardado" del autosave, check del aviso flotante. Igual en ambos temas.
- **Ámbar de revisión** (`review-signal`): señal sólida de "En revisión" (segmento de la barra de vigencia y punto "Guardando…"). Igual en ambos temas.

### Neutral
- **Suelo** (`ground`): fondo de página, barra lateral, barra superior móvil y barra fija de la página.
- **Superficie** (`surface`): paneles, diálogos, menús, campos, botón secundario.
- **Elevado** (`raised`): hover de filas y del botón secundario.
- **Activo** (`active`): elemento de navegación actual, hover de botones fantasma e ítems de menú, fila seleccionada en la paleta.
- **Borde** (`line`): contorno de paneles, diálogos, separación de barra lateral. **Regla** (`rule`): divisores internos (filas, cabeceras de panel). **Control** (`control`): borde de campos y botones, contorno discontinuo de vacíos, barra de desplazamiento, segmento "Borrador".
- **Tinta** (`ink`), **Atenuado** (`muted`, metadatos y etiquetas), **Tenue** (`faint`, iconos en reposo, placeholders, separadores de migas).

### Estados del ciclo de vida
- Pares fondo/tinta: `ok-*` (Aprobado), `review-*` (En revisión; también "Vence en N d"), `draft-*` (Borrador), `archived-*` (Archivado).
- `danger`, `danger-bg`, `danger-ink`: revisión vencida, errores de validación, conflicto 409, acciones destructivas.

### Named Rules
**La regla de la tinta única.** El azul de marca rellena solo un botón por pantalla. Todo lo demás es tinta, gris o semántica.

**La regla del verde ganado.** `leaf` significa "aprobado y vigente" (o "guardado"). Nunca decora, nunca marca una acción.

## Typography

**Interfaz:** Inter (con `ui-sans-serif, system-ui`), `font-feature-settings: "cv11", "ss01"`.
**Datos técnicos:** Geist Mono (con `ui-monospace, SFMono-Regular, Menlo`).

**Character:** Inter compacta a 14px para trabajo diario; Geist Mono identifica lo que es dato literal (fechas ISO, rutas, código, atajos `kbd`).

### Hierarchy
- **Headline** (600, 24/32, -0.015em): título `h1` de cada pantalla; debajo una línea de hallazgo a 15/24 en `muted`.
- **Doc H2** (600, 20/28, -0.01em) y **Doc H3** (600, 16/24): encabezados dentro del contenido de página.
- **Doc body** (400, 16/27, máx. 720px ≈ 70ch): lector y editor; bloques separados 14px.
- **Title** (600, 14/20): título de panel; 15px en cabecera de diálogo, panel lateral y barra móvil.
- **Body** (400, 14/20): interfaz por defecto, filas, campos.
- **Label** (500, 13px): botones, migas, metadatos de fila.
- **Caption** (400, 12/16, `muted`): encabezados de tabla, grupos de la barra lateral ("Workspaces", "Administración"), leyendas. En minúscula de oración, sin mayúsculas ni tracking.
- **Mono** (13px; 13.5px `code` en línea; 11px en `kbd`): fechas ISO, rutas, código.

### Named Rules
**La regla de la cifra tabular.** Todo conteo, fecha o número en columna usa `font-variant-numeric: tabular-nums`; las fechas ISO además van en Geist Mono.

## Layout

- **Shell de escritorio (≥1024px):** barra lateral fija de 248px sobre el mismo `ground`, separada por un borde `line` a la derecha. Contiene: logotipo (alto 56px), selector de cliente (Super admin, 44px, en superficie con borde), "Buscar" con `Ctrl K`, árbol de workspaces (ítems de 32px, sangría 18px por nivel), grupo de administración, y la tarjeta de usuario al pie (48px, borde superior).
- **Móvil (<1024px):** barra superior pegajosa de 48px en `ground` con botones de 44×44 (menú, buscar) y el título a 15/600; la navegación abre a pantalla completa sobre `ground`.
- **Lienzo:** ancho máx. 1320px, centrado; padding horizontal 16 / 24 / 40px (base / sm / lg); superior 24px (36px en lg), inferior 64px.
- **Encabezado de pantalla:** migas (13px) → `h1` → línea de hallazgo; acciones a la derecha; 28px hasta el contenido.
- **Rejilla de Inicio:** 12 columnas en xl, separación 16px: principal 8, lateral 4, ancho completo debajo.
- **Página:** barra fija (ruta, autosave, acciones) bajo la barra móvil o arriba en escritorio; columna de contenido de 720px.
- **Ritmo:** base 4px; las paddings más usadas son 12, 16, 20 y 24px. Filas de lista 12px vertical × 20px horizontal.

## Elevation & Depth

Plano por defecto, con capas tonales y bordes de 1px. La sombra solo existe en capas flotantes.

### Shadow Vocabulary
- **Flotante** (`--shadow-float`; claro `0 12px 32px rgb(18 20 28 / .14), 0 2px 6px rgb(18 20 28 / .06)`, oscuro `0 16px 40px rgb(0 0 0 / .5), 0 2px 6px rgb(0 0 0 / .3)`): diálogos, panel lateral, paleta de búsqueda, menús y aviso flotante.
- **Velo:** negro al 30% detrás de diálogos y paleta; 25% detrás del panel lateral.

### Named Rules
**La regla del suelo plano.** Paneles, filas y campos nunca llevan sombra; si algo tiene sombra, flota sobre la página y se cierra con Escape.

## Shapes

Esquinas pequeñas y jerarquizadas por tamaño de objeto: 12px diálogos y paleta; 8px paneles, menús, bloques de código y avisos; 6px botones, campos, ítems de navegación y de menú; 4px pastillas de estado, `kbd`, código en línea y anillo de foco; completo (999px) para la barra de vigencia, puntos de estado y avatares. Bordes de 1px siempre; discontinuos solo para estados vacíos.

## Components

### Buttons
Sobrios y compactos; el primario es el único con relleno de color.
- **Tamaños:** sm 28px (px 10, 13px), md 32px (px 12, 13px), lg 40px (px 16, 14px). Peso 500, icono Lucide 14–16px con separación 6px.
- **Primario:** `brand` / `on-brand`, hover `brand-hover`. Uno por pantalla.
- **Secundario (por defecto):** superficie con borde `control`, hover `raised`.
- **Fantasma:** texto `muted`, hover `active` + `ink`.
- **Peligro:** como el secundario con texto `danger`, hover `danger-bg`.
- **Icono:** 32×32, `muted`, hover `active`; siempre con `aria-label` y `title`.
- **Estados:** transición 150ms; al presionar baja 1px; deshabilitado al 60% de opacidad.

### Pastillas de estado
- 22px de alto, padding 0 8px, radio 4px, 12px/500. Borrador (`draft-*`), En revisión (`review-*`), Aprobado (`ok-*` con punto `leaf` de 6px), Archivado (`archived-*`).
- La misma forma sirve para estados de administración (Activo / Pendiente / Inactivo).
- Tipo de página: solo texto 13px `muted`, sin pastilla.

### Barra de vigencia (componente insignia)
- Barra de 8px, totalmente redondeada, segmentos proporcionales separados 2px en este orden: Aprobadas y vigentes (`leaf`), En revisión (`review-signal`), Borrador (`control`), Revisión vencida (`danger`).
- `role="img"` con descripción completa de conteos; sin páginas, contorno discontinuo `control`.
- Leyenda: puntos de 8px + etiqueta 12px `muted` + conteo en `ink`.
- Texto de vigencia: fecha ISO en mono `muted`; "Vence en N d" en `review-ink`; "Vencida hace N días" en `danger` 500; sin fecha "—" `faint`.

### Paneles
- Superficie, borde `line`, radio 8px, sin sombra.
- Cabecera de mín. 52px, padding 12 × 20px, título 14/600, divisor `rule`; acción secundaria a la derecha.
- Filas: padding 12 × 20px, divisor `rule`, hover `raised`. Contadores de vencidas: `danger-bg` / `danger-ink`, 12px.
- **Vacío:** caja discontinua `control`, radio 8px, 14px `muted`, acción opcional a la derecha.

### Tablas
- Ancho completo dentro de un panel, desplazamiento horizontal con ancho mínimo (≈820–860px).
- Cabecera 40px, 12px/400 `muted`; filas de 56px con borde superior `rule`; padding 12px y 20px en los extremos.
- Números y fechas alineados a la derecha con cifras tabulares; fechas en mono 13px `muted`. Usuarios inactivos en `muted`.

### Inputs / Fields
- Etiqueta 14/500 arriba, separación 8px; ayuda 13px `muted` o error 13px `danger` (`role="alert"`) debajo.
- Campo 40px, radio 6px, borde `control`, superficie; hover borde `faint`; foco borde `brand` + anillo de 2px `brand` al 20%.
- Placeholder en `faint`.

### Navigation
- Ítems de 32px, radio 6px, 14px. Reposo `muted` con icono `faint`; hover `active` al 60% + `ink`; actual `active` + `ink` 500 con `aria-current="page"`.
- Migas 13px `muted` con chevron 13px `faint`; enlaces con subrayado en hover.
- Búsqueda: paleta `Ctrl K` de 640px, radio 12px, campo 56px a 15px, grupos 12px `muted`, pie con atajos `kbd` y "Solo muestra lo que puedes ver".

### Diálogos y panel lateral
- **Diálogo:** ancho por defecto 480px, radio 12px, borde `line`, sombra flotante, a 12vh del borde superior; cabecera 15/600 con botón cerrar, divisor `rule`. Entrada `rise` 180ms (`cubic-bezier(.16,1,.3,1)`), velo `fade` 140ms.
- **Panel lateral:** a la derecha, ancho máx. 440px, alto completo, borde izquierdo `line`; cabecera de 56px. Entrada `slide` 220ms.
- Ambos se cierran con Escape o clic en el velo; `aria-modal`.
- **Menú:** 240px por defecto, radio 8px, padding 4px, ítems de 32px a 13px; peligro en `danger`.
- **Aviso flotante:** abajo al centro, fondo `ink`, texto `surface`, 13px, check `leaf`.

### Indicador de autosave
- En la barra fija de la página: punto de 6px + texto 13px `muted`, `role="status"` `aria-live="polite"`.
- Editando (`faint`) → Guardando… (`review-signal`) → Guardado HH:MM (`leaf`) → Error al guardar (`danger`, texto `danger` 500).
- Error: aviso en superficie con borde `line` y botón "Reintentar". Conflicto 409: aviso `danger-bg` / `danger-ink` con borde `danger` al 30%.

### Estados
- Foco visible global: contorno 2px `brand`, offset 2px.
- `prefers-reduced-motion`: sin animaciones ni transiciones.
- Lo que el perfil no puede hacer no se muestra.

## Do's and Don'ts

### Do:
- **Do** usar un solo botón primario `brand` por pantalla; el resto en secundario o fantasma.
- **Do** montar la jerarquía con capas tonales (`ground` → `surface` → `raised` → `active`) y bordes de 1px.
- **Do** mostrar estado, responsable y vigencia en cada lista de páginas con las pastillas y el texto de vigencia aquí descritos.
- **Do** usar Geist Mono y cifras tabulares para fechas ISO, rutas, conteos y atajos.
- **Do** definir cada color como variable con valor claro y oscuro; en `web/`, tokenizar también `review-signal`.
- **Do** imitar en `web/` estos tokens y medidas, escribiendo su propio código.

### Don't:
- **Don't** usar `leaf` fuera del estado aprobado / guardado.
- **Don't** poner sombra en paneles, filas o campos; solo en capas flotantes.
- **Don't** construir inicios con saludo, tarjetas de KPI con iconos ni degradados.
- **Don't** usar etiquetas en mayúsculas con tracking sobre los títulos; los grupos van en 12px de oración.
- **Don't** superar 8px de radio en contenedores en página (12px solo para diálogos y paleta).
- **Don't** importar ni copiar código de `prototipo/` en `web/`.
