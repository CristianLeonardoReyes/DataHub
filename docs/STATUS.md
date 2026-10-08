# Estado — DataHub
_Se sobrescribe por secciones, máx. ~60 líneas. Cada quien actualiza la sección del área que
tocó. La historia la guarda git._

## Común

- **Fase:** MVP. Paso 1 de PRD §11 (base) **terminado** en `feature/base-repositorio-modulo-1`,
  pendiente de commit y PR a `develop`. Falta solo `CODEOWNERS` (usuario del 2.º integrante).
- **Siguiente tarea:** paso 2 — Acceso (módulo 1), rama `feature/acceso` tras el merge.
- **Verificación:** `dotnet test api/DataGlobal.DataHub.sln` desde la raíz (requiere Docker
  Desktop abierto; `global.json` raíz activa Microsoft.Testing.Platform). Web: `npm run build`
  y `npm run lint` en `web/`.
- **Local:** API `http://localhost:5080` (`/health`, `/openapi/v1.json` en dev); Vite
  `:5173` con proxy `/api` y `/health` → 5080.
- **Despliegue:** solo local por ahora; sin `deploy.yml`. Objetivo final PRD §7.6.
- **Entorno:** .NET SDK 10.0.401, Node 22.15, Docker 29.1. Sin `gh` CLI.
- **GitHub (2026-10-08):** `main` y `develop` sin protección; la configura el usuario.

## Backend (api/ + db/)

- Solución en 5 capas (Api, Services, Repository, Common, Tests). `Program.cs`: OpenAPI (dev),
  ProblemDetails, `/health`, SPA desde `wwwroot` con fallback; `/api/*` inexistente → 404.
- `DapperContext` (cadena `ConnectionStrings:DataHub` en user-secrets) y `BaseRepository`
  (solo `CommandType.StoredProcedure`).
- Paquetes: Dapper 2.1.89, MySqlConnector 2.6.2, Microsoft.AspNetCore.OpenApi 10.0.12,
  xunit.v3 4.0.1, Mvc.Testing 10.0.12, Testcontainers.MySql 4.16.0 (mysql:8.0).
- Migración `db/Migraciones/2026-10-08_tablas_organizacion_usuario.sql` (organization, user):
  validada en Testcontainers, **pendiente de que el usuario la ejecute**. `db/Tablas/` se
  actualiza cuando lo confirme.
- Convenciones: `guid` CHAR(36) se lee como `System.Guid` (MySqlConnector); los DTOs exponen
  `Guid`, nunca `id`. `updated_at` lo asigna cada SP con `UTC_TIMESTAMP()`. FK de `user`
  con `RESTRICT` (MySQL no admite CHECK con acción referencial).
- Pruebas: 5/5 — `/health` y 4 de esquema (CHECK super_admin, email único, guid).

## Frontend (web/)

- React 19, Vite 8, TS 6, Tailwind 4 (`@tailwindcss/vite`), oxlint (linter de la plantilla).
- `App.tsx` mínimo que consulta `/health`. Sin router ni librerías de peticiones.

## Decisiones vigentes

- PRD §12. Añadidas: JWT de 1 hora; `id` BIGINT interno + `guid` público.

## Pendientes conocidos

- Usuario de GitHub del 2.º integrante para `CODEOWNERS` (conocido: `CristianLeonardoReyes`).
- Proteger `main` (y `develop`) en GitHub (usuario).
- PRD §12 pendientes: Vitest, tamaño máximo de archivo, librerías del frontend. Preguntar al
  llegar a la tarea que las necesite.
