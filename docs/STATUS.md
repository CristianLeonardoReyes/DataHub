# Estado — DataHub
_Se sobrescribe por secciones, máx. ~60 líneas. Cada quien actualiza la sección del área que
tocó. La historia la guarda git._

## Común

- **Fase:** inicio del MVP. PRD v2 aprobado (`docs/PRD.md`).
- **Siguiente tarea:** paso 1 de PRD §11 — base del repositorio (solución .NET en capas +
  proyecto xUnit, proyecto `web/` con proxy de Vite, `BaseRepository`, tablas de cliente y
  usuario, `CODEOWNERS`). `.gitignore` raíz ya creado.
- **Despliegue:** por ahora solo local; sin `deploy.yml` ni Web App hasta nuevo aviso. El
  objetivo final sigue siendo PRD §7.6.
- **Entorno local verificado:** .NET SDK 10.0.401, Node 22.15, Docker 29.1. Sin `gh` CLI.
- **GitHub (2026-10-08):** `main` y `develop` **sin protección ni rulesets**. PRD §12 exige
  `main` protegida: lo configura el usuario en GitHub.

## Backend (api/ + db/)

- Sin código todavía.

## Frontend (web/)

- Sin código todavía. Referencia visual en `prototipo/`.

## Decisiones vigentes

- Todas en PRD §12. Añadida: sesión JWT de 1 hora.

## Pendientes conocidos

- Usuario de GitHub del segundo integrante para `CODEOWNERS` (el usuario avisa).
  Conocido: `CristianLeonardoReyes`.
- Proteger `main` en GitHub (usuario).
- PRD §12 pendientes: pruebas del frontend (Vitest recomendado), tamaño máximo de archivo,
  librerías del frontend. Preguntar al llegar a la tarea que las necesite.
