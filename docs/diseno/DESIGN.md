---
name: DataHub Minimal Precision
colors:
  surface: '#faf8ff'
  surface-dim: '#d3d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dbe2fd'
  on-surface: '#141b2f'
  on-surface-variant: '#454651'
  inverse-surface: '#293045'
  inverse-on-surface: '#eef0ff'
  outline: '#767683'
  outline-variant: '#c6c5d3'
  surface-tint: '#4957ad'
  primary: '#102178'
  on-primary: '#ffffff'
  primary-container: '#2b3a8f'
  on-primary-container: '#9caaff'
  inverse-primary: '#bbc3ff'
  secondary: '#426900'
  on-secondary: '#ffffff'
  secondary-container: '#b8f568'
  on-secondary-container: '#467000'
  tertiary: '#4d1f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#6f3000'
  on-tertiary-container: '#f49962'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dee0ff'
  primary-fixed-dim: '#bbc3ff'
  on-primary-fixed: '#000f5c'
  on-primary-fixed-variant: '#303e93'
  secondary-fixed: '#b8f568'
  secondary-fixed-dim: '#9dd84f'
  on-secondary-fixed: '#112000'
  on-secondary-fixed-variant: '#304f00'
  tertiary-fixed: '#ffdbc9'
  tertiary-fixed-dim: '#ffb68d'
  on-tertiary-fixed: '#331200'
  on-tertiary-fixed-variant: '#753403'
  background: '#faf8ff'
  on-background: '#141b2f'
  surface-variant: '#dbe2fd'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  code-md:
    fontFamily: Geist Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.01em
  code-sm:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-mono:
    fontFamily: Geist Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

Este sistema de diseño articula la experiencia de una plataforma SaaS B2B de gestión del conocimiento técnico para ingeniería de datos y arquitectura analítica. Su personalidad es rigurosa, eficiente y utilitaria, inspirada directamente en la claridad sistemática de herramientas como Linear y Notion. 

El estilo combina **Minimalismo Estructurado** con principios de **Densidad Equilibrada**:
- **Atmósfera:** Sobria, despejada y técnica. Elimina la ornamentación superflua para priorizar el escaneo de documentación, catálogos de metadatos, linajes de datos y esquemas SQL/API.
- **Tono Visual:** Preciso, controlado e hiperlegible. Emplea bordes sutiles de 1px como el principal delimitador espacial en lugar de sombras pesadas o fondos contrastantes.
- **Respuesta Emocional:** Sentido de control operativo, reducción de fatiga cognitiva durante sesiones prolongadas y certidumbre técnica inmediata.

## Colors

La paleta cromática se apoya en una estructura dual adaptada al contexto de trabajo intensivo en luz natural o entornos de desarrollo oscuros.

### Light Theme
- **Background Base:** `#F7F8FA` (lienzo general), `#FFFFFF` (lienzo de contenido principal y documentos).
- **Surface:** `#FFFFFF` para tarjetas, paneles flotantes, barras laterales e inspectores.
- **Border:** `#E3E6EE` (delimitadores de 1px en interfaces de datos y rejillas).
- **Text Primary:** `#161A2E` (máxima legibilidad para lectura prolongada de documentación).
- **Text Secondary:** `#5A6178` (metadatos, etiquetas de esquema, rutas de navegación y marcas temporales).
- **Brand Primary Blue:** `#2B3A8F` (acciones principales, estados activos y selección tipográfica).
- **Brand Accent Green:** `#8DC63F` (píldoras de estado sincronizado, validación de esquemas, insignias de estado saludable e indicadores técnicos).

### Dark Theme
- **Background Base:** `#0F1117` (fondo de aplicación), `#161922` (contenedores de lienzo).
- **Surface:** `#1C2030` (tarjetas elevadas, modales y cajones laterales).
- **Border:** `#2A3042` (bordes estructurales discretos de 1px).
- **Text Primary:** `#E6E8F0` (texto de código y lectura técnica de alto contraste controlado).
- **Text Secondary:** `#9AA1B8` (subtítulos, descripciones secundarias y estados inactivos).
- **Brand Primary Blue (Dark):** `#7F8FE0` (garantiza ratio accesible APCA/WCAG sobre `#0F1117` y `#1C2030`).
- **Brand Accent Green:** `#8DC63F` (acento vibrante pero calibrado para indicadores puntuales).

### Reglas de Uso Semántico
- `#8DC63F` se reserva estrictamente para puntos focales de estado: insignias de ejecución exitosa, nodos activos de datos y estados "Health: Good". Nunca debe emplearse como fondo de bloques masivos ni para texto corrido.
- La jerarquía de contenedores debe depender prioritariamente de líneas de contorno `#E3E6EE` / `#2A3042` antes que de saltos de color de fondo.

## Typography

La arquitectura tipográfica se resuelve mediante la alternancia intencionada de dos motores:
1. **Inter:** Motor de interfaz para lectura documental y jerarquía administrativa. Destaca por aperturas claras, altura de x amplia y neutralidad corporativa.
2. **Geist Mono:** Motor técnico para sintaxis SQL, tipos de datos (`VARCHAR`, `TIMESTAMP`), parámetros de API, hashes de commit, métricas tabulares e insignias de versión.

### Reglas de Aplicación
- Los títulos emplean tracking negativo moderado para consolidar la apariencia compacta característica de suites para desarrolladores.
- Para párrafos dentro de bloques de documentación o especificaciones de catálogo, `body-md` es el estándar operativo.
- Toda referencia a nombres de columnas, claves foráneas, rutas de almacenamiento (S3/GCS) o fragmentos de código embebidos dentro de un texto en español debe renderizarse en `code-md` o `code-sm`.
- `label-mono` se aplica en mayúsculas sostenidas (`uppercase`) exclusivamente en pills técnicas, códigos de respuesta HTTP y badges de formato de archivo (ej. `PARQUET`, `JSON`, `DELTA`).

## Layout & Spacing

El diseño utiliza una retícula fluida estructurada en módulos anidados con un ritmo base de 4px y 8px.

### Estructura de Pantalla
- **Entorno Desktop (Workspace principal):** Panel lateral de navegación fijo o colapsable (ancho base: 240px a 280px), barra de herramientas superior compacta (44px a 48px de altura) y lienzo de datos central fluido con límites de lectura (`max-width: 1280px` en vistas analíticas y `max-width: 860px` en modo de redacción de especificaciones).
- **Inspector Lateral (Flyout):** Ancho predeterminado de 360px a 420px, anclado a la derecha, delimitado por un borde vertical continuo de 1px.

### Breakpoints y Adaptabilidad
- **Mobile (< 768px):** Retícula de 4 columnas, `margin: 1rem`, `gutter: 1rem`. La barra lateral colapsa en un drawer modal; las tablas de datos adoptan tarjetas apiladas o desplazamiento horizontal contenido con cabecera fija.
- **Tablet (768px - 1024px):** Retícula de 8 columnas, paneles secundarios se convierten en hojas flotantes inferiores (*bottom sheets*) o vistas completas.
- **Desktop (> 1024px):** Retícula de 12 columnas fluidas con `margin-desktop: 2rem` y `gutter-desktop: 1.5rem`. Distribución multipanel simultánea (árbol de carpetas + lienzo central + panel de metadatos).

## Elevation & Depth

La jerarquía visual se resuelve mediante **bordes de bajo contraste** combinados con **capas tonales de superficie** y sombras ambientales sumamente suaves:

1. **Plano 0 (Lienzo Base):**
   - Light: `#F7F8FA`
   - Dark: `#0F1117`
   - Sin elevación ni bordes propios.

2. **Plano 1 (Superficies de Trabajo y Tarjetas):**
   - Light: Fondo `#FFFFFF` contenido por un borde perimetral de `1px solid #E3E6EE`.
   - Dark: Fondo `#1C2030` con `1px solid #2A3042`.
   - Sombra sutil: `0 1px 2px 0 rgba(22, 26, 46, 0.04)` en modo claro; ausente o reemplazada por borde puro en modo oscuro.

3. **Plano 2 (Superficies Flotantes, Menús Desplegables, Popovers):**
   - Light: Fondo `#FFFFFF`, borde `1px solid #E3E6EE`, sombra difusa: `0 4px 16px -2px rgba(22, 26, 46, 0.08)`.
   - Dark: Fondo `#1C2030`, borde `1px solid #2A3042`, sombra: `0 4px 20px -2px rgba(0, 0, 0, 0.40)`.

4. **Plano 3 (Modales y Visores de Esquema en Capa Superior):**
   - Light: Sombra `0 12px 32px -4px rgba(22, 26, 46, 0.12)`, borde `1px solid #E3E6EE`.
   - Dark: Sombra `0 16px 40px -4px rgba(0, 0, 0, 0.60)`, borde `1px solid #2A3042`.
   - Backdrop de oscurecimiento suave con desenfoque técnico (`backdrop-filter: blur(4px)`).

## Shapes

El lenguaje de formas define dos niveles estrictos de curvatura geométrica para mantener una estética precisa e ingenieril:

- **Controles Interactivos (6px - 8px / `0.375rem - 0.5rem`):** Inputs de texto, botones primarios y secundarios, selectores, campos de búsqueda, checkboxes y chips funcionales.
- **Contenedores y Tarjetas (10px - 12px / `0.625rem - 0.75rem`):** Tarjetas de resumen métrico, paneles de vista previa, tablas enmarcadas, ventanas modales y bloques de código.
- **Píldoras Completas (`rounded-full`):** Exclusivas para indicadores de estado, tags circulares numéricos y badges técnicos compactos que llevan el color de acento `#8DC63F`.

## Components

### Botones
- **Primario:** Fondo `#2B3A8F` (Light) o `#7F8FE0` (Dark). Texto en alto contraste (`#FFFFFF` en Light, `#0F1117` en Dark), peso `Inter 500`, curvatura de 6px a 8px, altura compacta de 32px (estándar SaaS) o 36px (acciones de cabecera). Estado hover con incremento de opacidad/brillo al 90%.
- **Secundario / Outline:** Fondo transparente o `#FFFFFF`, borde de `1px solid #E3E6EE` (Dark: `#2A3042`), texto `#161A2E` (Dark: `#E6E8F0`). Hover con fondo `#F7F8FA` (Dark: `#161922`).
- **Terciario / Ghost:** Sin borde ni fondo en reposo. Hover a `#F7F8FA` (Dark: `#161922`). Utilizado en comandos de barra de herramientas estilo Notion.

### Chips, Badges & Status Pills
- **Badge de Estado Activo:** Fondo con opacidad tenue `#8DC63F` al 15%, texto y borde `#8DC63F` o verde oscuro legible, punto (*dot*) de 6px con pulso o color pleno.
- **Tag Técnico:** Fondo `#F7F8FA` (Dark: `#161922`), borde `1px solid #E3E6EE` (Dark: `#2A3042`), tipografía `Geist Mono` en `label-mono`, curvatura de 4px a 6px.

### Entradas de Texto (Input Fields & Search)
- Altura base de 34px o 36px. Fondo `#FFFFFF` (Dark: `#161922`).
- Borde de `1px solid #E3E6EE` (Dark: `#2A3042`), radio de 6px.
- Focus: Anillo exterior sutil (*focus ring*) de 2px en `#2B3A8F` (Light) o `#7F8FE0` (Dark) con desfase (*offset*) nulo.
- Iconos de búsqueda y atajos de teclado (`⌘K`) alineados a la derecha en tipografía mono.

### Checkboxes & Radio Buttons
- Cuadrados con esquinas de 4px para checkboxes; circulares para radios.
- Borde en reposo: `1px solid #E3E6EE` (Dark: `#2A3042`).
- Estado activo: Relleno `#2B3A8F` (Dark: `#7F8FE0`) con checkmark blanco de 1.5px de trazo.

### Tarjetas (Cards)
- Fondo `#FFFFFF` (Dark: `#1C2030`), borde perimetral de `1px solid #E3E6EE` (Dark: `#2A3042`), esquinas de 10px a 12px.
- Padding interno modular: `space-lg` (16px) a `space-xl` (24px).
- División interna entre cabecera de tarjeta y contenido mediante líneas divisorias horizontales de 1px del mismo tono de borde, sin cortes bruscos.

### Tablas de Datos y Metadatos (Data Tables)
- Cabecera fija en `label-sm` con fondo `#F7F8FA` (Dark: `#161922`) y texto secundario `#5A6178` (Dark: `#9AA1B8`).
- Altura de fila compacta (36px a 40px) para maximizar la cantidad de registros técnicos visibles.
- Separación entre filas por bordes inferiores de 1px. Hover de fila interactiva en `#F7F8FA` (Dark: `#1C2030` aligerado).

### Bloques de Código y Esquemas SQL
- Contenedor con fondo `#0F1117` tanto en modo claro como oscuro (o `#161922` para consistencia interna), radio de 10px, borde perimetral tenue de 1px.
- Tipografía obligatoria `Geist Mono` (`code-md`), botón superior derecho para copiar comando ("Copiar SQL") en estilo ghost mono.