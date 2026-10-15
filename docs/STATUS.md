# Estado — DataHub
_Se sobrescribe por secciones, máx. ~60 líneas. Cada quien actualiza la sección del área que
tocó. La historia la guarda git._

## Común

- **Hecho:** paso 1 (base) y paso 2 (Acceso, módulo 1) mergeados en `develop`.
- **En curso:** paso 3 en bloques. **3a** (matriz `Can()`, `permisos` en `/me`, Clientes) en
  `feature/clientes-usuarios-paso-3a`: implementado, QA OK (api 75/75, web 10/10). Falta que el
  usuario ejecute las migraciones `2026-10-15_01` y `_02` y lo pruebe. Luego 3b (Usuarios) y 3c (selector de
  cliente + aislamiento).
- **Decisiones 3a:** sin permiso → 403; recurso ajeno → 404; la web oculta botones, menús y rutas
  según `permisos`; crear cliente pide solo `correoAdmin`; `PUT` con `activo`; cliente inactivo
  corta login y sesiones de todos sus usuarios.
- **Arranque local y pruebas:** ver README "Guía de arranque". API con perfil `http` (si no, no
  carga user-secrets y no arranca) en `:5080`; Vite `:5173` con proxy. `dotnet test` requiere
  Docker. Solo local: sin `deploy.yml` (objetivo final PRD §7.6).

## Backend (api/ + db/)

- 5 capas; `BaseRepository` solo SP; ProblemDetails; `/health`; SPA con fallback (`/api/*` → 404).
- Convenciones: esquema español PascalCase; `Id` interno, `Guid` público (`System.Guid`);
  `FechaActualizacion = UTC_TIMESTAMP()` en cada UPDATE; SP re-ejecutables y con parámetros de
  texto `COLLATE utf8mb4_0900_ai_ci` (Testcontainers arranca con `unicode_ci` para detectarlo).
- **Acceso:** `/api/v1/auth` (login, logout, me, aceptar-invitacion, olvide/restablecer). JWT 60
  min en cookie `datahub_sesion`; cada petición valida usuario y cliente activos; bloqueo 5/15
  min; rate limit por IP; correo `Archivo` (`correos-dev/`) o `Ses`.
- **Permisos:** `MatrizPermisos` (Common/Enums/Permisos.cs, 13 acciones) +
  `Autorizacion.Can(usuario, accion, clienteIdRecurso)`; `/me` → `permisos` y `perfil` (enum).
- **Clientes:** `/api/v1/clientes` GET, GET {guid}, POST (cliente + Admin invitado + token en un
  SP, luego correo), PUT `{nombre, slug, activo}`. 409 con extensión `campo`.
- **SP:** estándar `<prefijo>_<verbo><Calificador>` (CLAUDE.md). **Pendiente de ejecutar, en
  orden:** `2026-10-15_01_renombrar_sp_acceso.sql` (8 SP de acceso con nombre nuevo, borra los
  `sp_*`) y `2026-10-15_02_clientes.sql` (4 `cli_*` nuevos, 4 `usu_*` modificados). Después:
  `db/Procedimientos/` pasa a los nombres nuevos. Vigente hoy: `db/Tablas/` (Cliente, Usuario,
  UsuarioToken) y `db/Procedimientos/` con los 8 `sp_*`. Semilla: `db/Semillas/dev_super_admin.sql`.
- user-secrets: `ConnectionStrings:DataHub`, `Jwt:Clave`. Paquetes: Dapper, MySqlConnector,
  OpenApi, JwtBearer, AWSSDK.SimpleEmailV2, MimeKit, Pkcs 10.0.13 (parche), xunit.v3,
  Mvc.Testing, Testcontainers.MySql.
- Deuda: `UseForwardedHeaders` antes de desplegar; carrera de slug duplicado da 500
  (improbable, `ponytail:` en el SP); sin aviso si falla el correo al crear cliente (reenviar: 3b).

## Frontend (web/)

- React 19, Vite 8, TS 6, Tailwind 4, oxlint, react-router 7, Vitest + Testing Library (10
  pruebas). Tipos: `npm run tipos` → `src/api/esquema.d.ts` (versionado; `overrides` TS 5).
- Pantallas: login, aceptar invitación, olvidé/restablecer; `Layout` con menú según
  `puede(permiso)`; Inicio; `/clientes`, `/clientes/nuevo`, `/clientes/:guid` con
  `RequierePermiso` (sin permiso → `/`). Componentes comunes en `src/ui.tsx`.
- Lint: 2 warnings de estilo en `Sesion.tsx`.

## Decisiones vigentes

- PRD §12: JWT 1 h; `Id` + `Guid`; esquema y API en español; SP `usu_consultarX`; collation `utf8mb4_0900_ai_ci`;
  correo archivo/SES; JwtBearer; react-router, openapi-typescript, Vitest.

## Pendientes conocidos

- `CODEOWNERS` (usuario GitHub del 2.º integrante) y proteger `main`/`develop` (usuario).
- RF-USR-03 (asignar workspaces) se hace en el módulo 4 (decidido 2026-10-15).
- PRD §12 pendiente: tamaño máximo de archivo (módulo 7).
