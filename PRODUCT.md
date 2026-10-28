# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Equipos de desarrollo de software de los clientes de DataGlobal y el propio equipo de
DataGlobal. Cuatro perfiles fijos: **Super admin** (DataGlobal, sin cliente, puede "operar en"
cualquier cliente), **Admin** (todo su cliente), **Coordinador** y **Colaborador** (solo los
workspaces asignados). Su trabajo: encontrar en segundos cómo se hace algo (publicar un
proyecto, una decisión, una API, un manual) y mantener esa documentación viva, con
responsable y vigencia.

## Product Purpose

DataHub es una wiki técnica multiempresa: un único lugar por organización para crear,
encontrar y mantener su conocimiento técnico (arquitecturas, ADR, APIs, procedimientos,
runbooks, manuales, onboarding y archivos). Éxito: menos dependencia de personas clave,
onboarding más rápido, catálogo de procesos de publicación documentado y aprobado.

## Positioning

A diferencia de una wiki genérica, cada página es conocimiento gobernado: estado
(Borrador → En revisión → Aprobado → Archivado), tipo, responsable y fecha de revisión, para
detectar documentación vencida. Aislamiento total entre clientes y búsqueda que solo
devuelve lo que el usuario puede ver.

## Operating Context

Uso diario en escritorio durante el trabajo técnico, y en momentos de presión (publicar,
corregir un error en producción, cuando la persona que sabía no está). Caso de uso ancla:
workspace "Proyectos" → un espacio por proyecto → colección "Publicación y operación" → una
página Runbook/Procedimiento por proceso. Exportación a Markdown para llevar al repositorio.

## Capabilities and Constraints

- Jerarquía: Cliente → Workspace → Espacio → Colección → Página → Subpáginas.
- MVP (9 módulos): Acceso, Clientes, Usuarios y perfiles, Jerarquía, Editor (autosave con
  Editando / Guardando… / Guardado / Error al guardar; aviso de conflicto 409), Metadata y
  etiquetas, Archivos (previsualización imagen/PDF/video/audio), Búsqueda (20 por página),
  Markdown.
- Tipos de página: General, ADR, API, Runbook, Arquitectura, Onboarding, Guía,
  Procedimiento, Manual, Acta de reunión.
- Lo que un perfil no puede hacer no se le muestra (matriz en PRD §3.2).
- Fuera del MVP: IA, favoritos, comentarios, historial, plantillas, notificaciones,
  coedición, app móvil, integraciones CI/CD.
- Alta solo por invitación; bloqueo tras 5 intentos (15 min); sesión de 1 hora.
- Interfaz en español.

## Brand Commitments

- Marca DataGlobal: primario azul #2B3A8F (oscuro #7F8FE0); verde #8DC63F solo para estados.
- Inter (interfaz) y Geist Mono (datos técnicos); iconos Lucide.
- Estilo minimalista tipo Notion / Linear; temas claro y oscuro.
- Logo en `../Docs/diseno/logo/`. Mockups de referencia en `../Docs/diseno/stitch/`.

## Evidence on Hand

PRD (`docs/PRD.md`), documento de solución y modelo de datos (v1.0, oct 2026). No hay
clientes, métricas ni testimonios reales: el prototipo usa datos de ejemplo.

## Product Principles

1. Encontrar antes que crear: la búsqueda y la ruta (breadcrumb) siempre a mano.
2. Todo conocimiento tiene dueño y vigencia visibles.
3. Mostrar solo lo que el perfil puede hacer.
4. Nunca perder trabajo en silencio.

## Accessibility & Inclusion

Labels en formularios, foco visible, navegación por teclado (PRD / agente frontend).
