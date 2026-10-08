# Estado — DataHub
_Se sobrescribe por secciones, máx. ~60 líneas. Cada quien actualiza la sección del área que
tocó. La historia la guarda git._

## Común

- **Fase:** inicio del MVP. PRD v2 aprobado (`docs/PRD.md`).
- **Siguiente tarea:** paso 1 de PRD §11 — base del repositorio (solución .NET en capas +
  proyecto xUnit, proyecto `web/` con proxy de Vite, `BaseRepository`, tablas de cliente y
  usuario, `.gitignore`, `CODEOWNERS`).
- **Despliegue:** una sola Web App de Azure; proceso completo en PRD §7.6. Lo ejecuta el
  usuario manualmente.
- **Entorno local verificado:** .NET SDK 10.0.401, Node 22.15, Docker 29.1.

## Backend (api/ + db/)

- Sin código todavía.

## Frontend (web/)

- Sin código todavía. Referencia visual en `prototipo/`.

## Decisiones vigentes

- Todas en PRD §12 (stack, auth, permisos, despliegue, pruebas).

## Pendientes conocidos

- Usuarios de GitHub de los dos integrantes para `CODEOWNERS` (regla: aprueba el PR quien no
  lo escribió).
- PRD §12: pruebas del frontend (Vitest recomendado), duración del JWT, tamaño máximo de
  archivo, librerías del frontend.
