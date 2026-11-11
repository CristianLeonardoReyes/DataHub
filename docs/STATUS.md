# Estado — DataHub
_Se sobrescribe por secciones, máx. ~60 líneas. Cada quien actualiza la sección del área que
tocó. La historia la guarda git._

## Común

- **Hecho:** paso 1 (base) y paso 2 (Acceso, módulo 1) mergeados en `develop`.
- **Paso 3:** 3a (PR #4) y 3b (PR #5) mergeados. **3c terminado** en
  `feature/clientes-usuarios-paso-3c` (api 90/90, web 23/23, QA completo de pasos 1–3 OK).
  **PUNTO DE PRUEBA:** el usuario ejecuta `2026-10-15_04_cliente_operando.sql` y prueba todo de
  punta a punta; luego commit/PR del 3c y paso 4 (módulo 4, incluye RF-USR-03).
- **Decisiones 3a:** sin permiso → 403; recurso ajeno → 404; la web oculta botones, menús y rutas
  según `permisos`; crear cliente pide solo `correoAdmin`; `PUT` con `activo`; cliente inactivo
  corta login y sesiones de todos sus usuarios.
- **Arranque local y pruebas:** ver README "Guía de arranque". API con perfil `http` (si no, no
  carga user-secrets y no arranca) en `:5080`; Vite `:5173` con proxy. `dotnet test` requiere
  Docker. Solo local: sin `deploy.yml` (objetivo final PRD §7.6).

## Backend (api/ + db/)

- **BD del servidor** (`23.82.136.106:3306`, MySQL 8.0.36, base `DataHub`; 2026-11-11): las 7
  migraciones aplicadas. Cargada la semilla `db/Semillas/dev_datos_prueba.sql` (3 clientes
  `prueba-*`, 9 usuarios `@prueba.test`); reversión al final del script. `developer1` tiene
  privilegios globales: conviene limitarlo a `DataHub.*`.

- 5 capas; `BaseRepository` solo SP; ProblemDetails; `/health`; SPA con fallback (`/api/*` → 404).
- Convenciones: esquema español PascalCase; `Id` interno, `Guid` público (`System.Guid`);
  `FechaActualizacion = UTC_TIMESTAMP()` en cada UPDATE; SP re-ejecutables y con parámetros de
  texto `COLLATE utf8mb4_0900_ai_ci` (Testcontainers arranca con `unicode_ci` para detectarlo).
- **Acceso:** `/api/v1/auth` (login, logout, me, aceptar-invitacion, olvide/restablecer). JWT 60
  min en cookie `datahub_sesion`; cada petición valida usuario y cliente activos; bloqueo 5/15
  min; rate limit por IP; correo `Archivo` (`correos-dev/`, por defecto en Development) o `Ses`
  (`SesEmailSettings`, estándar de la empresa: us-east-2, `no-responder@dataglobal.co`, Bcc vacío;
  llaves solo en user-secrets/App Settings). SES implementado, **sin probar contra AWS**.
- **Permisos:** `MatrizPermisos` (Common/Enums/Permisos.cs, 13 acciones) +
  `Autorizacion.Can(usuario, accion, clienteIdRecurso)`; `/me` → `permisos` y `perfil` (enum).
- **Usuarios (3b):** `/api/v1/usuarios` GET, POST `{correo, perfil}`, POST
  `{guid}/reenviar-invitacion`, PUT `{perfil, activo}`; cliente = `UsuarioActual.ClienteId`
  (Super admin sin cliente → 400 hasta 3c). RF-USR-04 en `usu_editarPerfilEstado` con FOR UPDATE.
- **Cliente operando (3c):** `POST /auth/cliente-operando {clienteGuid|null}` solo Super admin,
  solo clientes activos; re-emite la cookie con la misma expiración. `OnTokenValidated`: Super
  admin con claim `clienteId` → `cli_consultarOperando`; inactivo/inexistente → sin cliente
  (no 401). Otros perfiles: cliente siempre de BD.
- **Clientes:** `/api/v1/clientes` GET, GET {guid}, POST (cliente + Admin invitado + token en un
  SP, luego correo), PUT `{nombre, slug, activo}`. 409 con extensión `campo`.
- **SP:** estándar `<prefijo>_<verbo><Calificador>` (CLAUDE.md). BD vigente (ejecutado por el
  usuario hasta `2026-10-15_03`): `db/Tablas/` (Cliente, Usuario, UsuarioToken) y
  `db/Procedimientos/` (16: `usu_*`, `uto_*`, `cli_*`). Semilla: `db/Semillas/dev_super_admin.sql`.
- user-secrets: `ConnectionStrings:DataHub`, `Jwt:Clave`. Paquetes: Dapper, MySqlConnector,
  OpenApi, JwtBearer, AWSSDK.SimpleEmailV2, MimeKit, Pkcs 10.0.13 (parche), xunit.v3,
  Mvc.Testing, Testcontainers.MySql.
- Deuda: `UseForwardedHeaders` antes de desplegar; carrera de slug duplicado da 500
  (improbable, `ponytail:` en el SP); sin aviso si falla el correo al crear cliente (se puede reenviar); invitar a
  cliente inactivo queda impedido por el 3c.

## Frontend (web/)

- React 19, Vite 8, TS 6, Tailwind 4, oxlint, react-router 7, lucide-react, Vitest + Testing
  Library (28 pruebas). Tipos: `npm run tipos` → `src/api/esquema.d.ts` (versionado).
- **Sistema de diseño único:** `docs/diseno/DESIGN.md`. Tokens claro/oscuro en `src/index.css`
  (`bg-ground`, `text-ink`, `bg-brand`…; oscuro por `prefers-color-scheme` o `[data-theme]`).
  Fuentes Inter y Geist Mono por Google Fonts. Foco visible global.
- **Acceso rediseñado** (`src/acceso-ui.tsx` + `src/pantallas.tsx`): login, activar cuenta,
  olvidé y restablecer con el diseño; login redirige si hay sesión, vuelve a la ruta pedida
  (`state.from`, solo internas) y avisa si la API no responde. Logo en `public/logo-datahub.svg`.
- **Rediseño completo de `web/`** (`feature/web-rediseno`, 2026-11-11): `ui.tsx` con tokens
  (botones, campos, avisos, `Encabezado`, `Insignia`, `Avatar`); `Layout` con barra lateral de
  248px, logo, "Operar en" y usuario abajo; `inicio.tsx` con resumen real de clientes/usuarios
  según permisos, "Lo que puede hacer tu perfil" y módulos que vienen; Clientes y Usuarios en
  paneles con insignias de estado y alcance del perfil al invitar. Sin cambios de lógica ni de
  contrato; 28/28 pruebas. `prototipo/` retirado (queda en git, PR #9).
- Lint: 2 warnings de estilo en `Sesion.tsx`.

## Decisiones vigentes

- PRD §12: JWT 1 h; `Id` + `Guid`; esquema y API en español; SP `usu_consultarX`; collation `utf8mb4_0900_ai_ci`;
  correo archivo/SES; JwtBearer; react-router, openapi-typescript, Vitest.

## Pendientes conocidos

- `CODEOWNERS` (usuario GitHub del 2.º integrante) y proteger `main`/`develop` (usuario).
- RF-USR-03 (asignar workspaces) se hace en el módulo 4 (decidido 2026-10-15).
- PRD §12 pendiente: tamaño máximo de archivo (módulo 7; el prototipo retirado usaba 25 MB provisional).
- Definir la carpeta de OneDrive de la empresa para los valores de entorno de local y pruebas.

## Variables por subir a OneDrive

- `SesEmailSettings:Aws_access_key` y `SesEmailSettings:Aws_secret_key` — user-secrets de `api/DataGlobal.DataHub.Api` — credenciales IAM de AWS SES (en Azure: `SesEmailSettings__Aws_access_key` / `__Aws_secret_key`). Carpeta de OneDrive por definir.
- Ya existentes en user-secrets: `ConnectionStrings:DataHub`, `Jwt:Clave`.
