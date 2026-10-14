# Estado — DataHub
_Se sobrescribe por secciones, máx. ~60 líneas. Cada quien actualiza la sección del área que
tocó. La historia la guarda git._

## Común

- **Fase:** MVP. Paso 1 (base) mergeado en `develop` (PR #1). Falta `CODEOWNERS`.
- **Paso 2 — Acceso (módulo 1): CERRADO** en `feature/acceso-modulo-2` (pruebas 14/14 api,
  4/4 web; probado por el usuario contra su BD). Pendiente: commit y PR a `develop`.
- **Siguiente:** paso 3 — Clientes y Usuarios (módulos 2 y 3) y matriz `Can()`.
- **Verificación:** `dotnet test api/DataGlobal.DataHub.sln` desde la raíz (requiere Docker
  Desktop abierto; `global.json` raíz activa Microsoft.Testing.Platform). Web: `npm run build`
  y `npm run lint` en `web/`.
- **Local:** API con perfil `http` (Development; si no, no carga user-secrets y no arranca)
  `http://localhost:5080` (`/health`, `/openapi/v1.json` en dev); Vite
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
- Vigente (ejecutado por el usuario, 2026-10-14): `db/Tablas/` Cliente, Usuario, UsuarioToken;
  `db/Procedimientos/` 8 SP de acceso. Base y tablas en `utf8mb4_0900_ai_ci`.
- Convenciones: esquema en español, PascalCase singular (PRD §6); escribir los nombres con
  las mismas mayúsculas siempre. `Guid` CHAR(36) se lee como `System.Guid`; los DTOs exponen
  `Guid`, nunca `Id`. `FechaActualizacion` la asigna cada SP con `UTC_TIMESTAMP()`. FK de `Usuario`
  con `RESTRICT` (MySQL no admite CHECK con acción referencial).
- **Acceso (módulo 1):** `/api/v1/auth` login, logout, me, aceptar-invitacion,
  olvide-contrasena, restablecer-contrasena. JWT 60 min en cookie `datahub_sesion`; cada
  petición valida usuario activo (`OnTokenValidated`); 401 con ProblemDetails; bloqueo 5/15 min;
  rate limiting por IP; tiempo mínimo de 1 s en olvidé contraseña. Correo `Archivo`
  (`correos-dev/`) o `Ses`. Sin endpoint de invitar (módulo 3).
- user-secrets (Api): `ConnectionStrings:DataHub`, `Jwt:Clave` (≥32 bytes); AWS solo si `Ses`.
- SP con parámetros de texto declaran `COLLATE utf8mb4_0900_ai_ci`; Testcontainers arranca con
  `unicode_ci` de servidor para detectar mezclas. Semilla dev: `db/Semillas/dev_super_admin.sql` (imprime el enlace de invitación).
- Paquetes nuevos: JwtBearer 10.0.13, AWSSDK.SimpleEmailV2 4.0.106.3, MimeKit 4.18.1,
  System.Security.Cryptography.Pkcs 10.0.13 (parche de la transitiva de MimeKit).
- Pruebas: 14/14 (unitarias, esquema y 6 flujos de acceso en Testcontainers).
- Deuda: `UseForwardedHeaders` antes de desplegar (rate limit por IP real); `perfil` sale como
  `string` en OpenAPI (no como unión).

## Frontend (web/)

- React 19, Vite 8, TS 6, Tailwind 4 (`@tailwindcss/vite`), oxlint (linter de la plantilla).
- react-router 7, openapi-typescript (`npm run tipos`, `src/api/esquema.d.ts` versionado;
  `overrides` por peer de TS 5), Vitest + Testing Library (`npm test`, 4 pruebas).
- Pantallas: `/login`, `/aceptar-invitacion`, `/olvide-contrasena`, `/restablecer-contrasena`,
  `/` protegida (Inicio placeholder con datos de `/me` y cerrar sesión).
- Lint: 2 warnings en `Sesion.tsx` (estilo, no bloquean).

## Decisiones vigentes

- PRD §12. Añadidas: JWT 1 h; `Id` interno + `Guid` público; esquema en español PascalCase;
  API/SP en español; correo archivo local + SES; JwtBearer; react-router, openapi-typescript,
  Vitest + Testing Library.

## Pendientes conocidos

- Usuario de GitHub del 2.º integrante para `CODEOWNERS` (conocido: `CristianLeonardoReyes`).
- Proteger `main` (y `develop`) en GitHub (usuario).
- PRD §12 pendiente: tamaño máximo de archivo (módulo 7).
