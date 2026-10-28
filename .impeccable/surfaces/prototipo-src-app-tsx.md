---
version: 1
slug: "prototipo-src-app-tsx"
primary_target: "prototipo/src/App.tsx"
related_targets: []
---

# Prototipo DataHub — todas las pantallas del MVP

Scope: prototipo/ (referencia visual con datos de ejemplo). Mode: Operate (Read en el lector de página).
Audiencia: equipos técnicos de clientes de DataGlobal; 4 perfiles. Job: encontrar cómo se hace algo y mantenerlo vigente.
Constraints: sistema de diseño DataGlobal fijado por el usuario (azul #2B3A8F / #7F8FE0, verde #8DC63F solo estados, Inter + Geist Mono, claro y oscuro, Lucide). Español. Solo funciones del MVP.

## Direction contract
THESIS: Conocimiento gobernado: cada página muestra estado, dueño y vigencia como datos de primera clase; rechaza el inicio-plantilla de saludo + KPIs con iconos + tarjetas.
OWN-WORLD: Libro mayor acromático sobre suelo gris-azulado (#f4f5f9) tomado del azul DataGlobal; superficies blancas con borde 1px; tinta casi negra; azul de marca solo en la acción principal, el elemento activo de datos y enlaces de nombre; verde DataGlobal solo en "Aprobado". Geist Mono para rutas, fechas ISO y conteos. Radios 8/6/4.
STORY: El usuario ve qué cambió y qué está vencido en su alcance, entra por la jerarquía o la búsqueda (Ctrl+K), lee y edita con autosave, y exporta a Markdown.
FIRST VIEWPORT: Barra lateral 248px en el mismo suelo (marca, selector de cliente/workspace, Buscar Ctrl+K, árbol). Lienzo: título "Inicio" 24/600, línea de hallazgo ("3 páginas con revisión vencida"), a la izquierda (8 col) "Actualizadas recientemente", a la derecha (4 col) "Revisión vencida" con acción; debajo, workspaces con barra de salud del conocimiento.
FORM: Open plane + achromatic ledger (taste-skill app sheet, seed 76094478), position 1. seed: none (unavailable)
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
Signature: barra de vigencia por espacio (Aprobado / En revisión / Borrador / Vencida) y la exportación Markdown con YAML en vivo.
