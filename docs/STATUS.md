# Estado — DataHub
_Se sobrescribe por secciones, máx. ~60 líneas. Cada quien actualiza la sección del área que
tocó. La historia la guarda git._

## Común

- **Hecho en `develop`:** pasos 1–3 (base, Acceso, Clientes/Usuarios/cliente operando) y rediseño de `web/`.
- **En curso:** `feat/DAT-161-cierre-del-acceso-y-la-sesion-correo` cerrada (2026-11-11): SES,
  sesión deslizante, modal de sesión vencida, tema, contraseña segura, correos con marca. api
  101/101, web 38/38. Siguiente: commit/PR y paso 4 (módulo 4, incluye RF-USR-03).
- **Reglas 3a:** sin permiso → 403; recurso ajeno → 404; la web oculta según `permisos`.
- **Local:** README "Guía de arranque". API perfil `http` en `:5080`; Vite `:5173` con proxy.
  `dotnet test` requiere Docker; si la API bloquea `bin/`, usar `-p:OutDir=…/Tests/bin/alt/`.

## Backend (api/ + db/)

- **BD del servidor** (MySQL 8.0.36, base `DataHub`): 7 migraciones aplicadas y semilla
  `dev_datos_prueba.sql`. `developer1` tiene privilegios globales: limitar a `DataHub.*`.
- 5 capas; solo SP (`<prefijo>_<verbo><Calificador>`, collation 0900); ProblemDetails; `/health`.
- **Acceso:** JWT en cookie `datahub_sesion`, usuario y cliente activos validados en cada petición,
  bloqueo 5/15 min, rate limit. **Sesión deslizante:** claims firmados `max`/`rec`; renueva al pasar
  media ventana (no en logout ni cliente-operando); 60 min inactividad, máx. 8 h; `recordarme` 7
  días fijos con cookie persistente; `Jwt:MinutosInactividad`/`HorasMaximas`/`DiasRecordarme`.
  `/me` y el header `X-Sesion-Expira` dan el vencimiento vigente.
- **Contraseña** (RF-ACC-07): `ValidadorContrasena` — 10+ con mayúscula, minúscula, número y símbolo.
- **Correo:** `Archivo` (`correos-dev/`) o `Ses` (`SesEmailSettings`, probado contra AWS). Plantilla
  única en `PlantillasCorreo` (logo PNG inline `cid:logo-datahub`; data URI en modo Archivo), sin
  mencionar vencimientos. Falta ver el nuevo diseño en Gmail/Outlook con un envío real.
- **Permisos:** `MatrizPermisos` + `Autorizacion.Can`. Usuarios, Clientes y cliente operando (3a–3c).
- **Deuda:** `UseForwardedHeaders` antes de desplegar; carrera de slug duplicado da 500
  (`ponytail:` en el SP); sin aviso si falla el correo al crear cliente.

## Frontend (web/)

- React 19, Vite 8, TS 6, Tailwind 4, react-router 7, lucide-react, Vitest (38 pruebas), oxlint (2
  warnings preexistentes en `Sesion.tsx`). Tipos: `npm run tipos` → `src/api/esquema.d.ts`.
- **Diseño único:** `docs/diseno/DESIGN.md`; tokens claro/oscuro en `index.css`.
- **Tema:** botón sol/luna en la cabecera; preferencia en `localStorage` `datahub-tema`, aplicada en
  `index.html` antes de pintar; por defecto claro.
- **Sesión:** casilla "Recordarme en este equipo"; `http.ts` reprograma el modal con
  `X-Sesion-Expira`; al vencer o ante un 401, modal "Tu sesión expiró" → login → misma pantalla.
- **Contraseña:** lista de requisitos en vivo (vertical) que se marca y se oculta al cumplir.
- **Botones:** cursor de mano global; `Boton` con `cargando`/`textoCarga` en formularios, acciones
  por fila y Cerrar sesión. "Invitar usuario" solo en el módulo Usuarios.

## Decisiones vigentes

- PRD §12: sesión deslizante 60 min / máx. 8 h, "Recordarme" 7 días; plantilla única de correo;
  `Id` + `Guid`; esquema y API en español; collation 0900; JwtBearer; react-router, openapi-typescript, Vitest.

## Pendientes conocidos

- `CODEOWNERS` y proteger `main`/`develop` (usuario). RF-USR-03 en el módulo 4.
- PRD §12: tamaño máximo de archivo (módulo 7).
- Producción: `Jwt__Clave` propia al crear la Web App.
- Limpiar metadatos "generado por IA" (C2PA/Recraft) de `docs/diseno/logo/*.svg` — pendiente de decisión.
- Definir la carpeta de OneDrive de la empresa para los valores de entorno.

## Variables por subir a OneDrive

- `SesEmailSettings:Aws_access_key` / `Aws_secret_key` (user-secrets de la Api; en Azure `SesEmailSettings__…`).
- Ya existentes: `ConnectionStrings:DataHub`, `Jwt:Clave`.
