# Estado — DataHub
_Se sobrescribe por secciones, máx. ~60 líneas. Cada quien actualiza la sección del área que
tocó. La historia la guarda git._

## Común

- **Hecho en `develop`:** pasos 1–5 (base, Acceso, Clientes/Usuarios, Jerarquía, Editor), PR #14.
- **En curso:** `feat/DAT-184-metadata-y-etiquetas-…` (paso 6) — lista para commit/PR (2026-11-19).
  api 160/160, web 64/64. Siguiente: paso 7 (archivos; definir tamaño máximo).
- **Reglas 3a:** sin permiso → 403; recurso ajeno → 404; la web oculta según `permisos`.
- **Local:** README "Guía de arranque". API perfil `http` en `:5080`; Vite `:5173` con proxy.
  `dotnet test` requiere Docker; si la API bloquea `bin/`, usar `-p:OutDir=…/Tests/bin/alt/`.

## Backend (api/ + db/)

- **BD del servidor** (MySQL 8.0.36, base `DataHub`): 11 migraciones aplicadas (hasta 2026-11-19_01) y semilla
  `dev_datos_prueba.sql`. `developer1` tiene privilegios globales: limitar a `DataHub.*`.
- 5 capas; solo SP (`<prefijo>_<verbo><Calificador>`, collation 0900); ProblemDetails; `/health`.
- **Acceso:** JWT en cookie `datahub_sesion`; usuario/cliente activos en cada petición; bloqueo 5/15 min;
  rate limit. Sesión deslizante (`max`/`rec`, 60 min / 8 h, recordarme 7 días); header `X-Sesion-Expira`.
- **Contraseña** (RF-ACC-07): `ValidadorContrasena` — 10+ con mayúscula, minúscula, número y símbolo.
- **Correo:** `Archivo` (`correos-dev/`) o `Ses`; plantilla única `PlantillasCorreo`. Falta verla en Gmail/Outlook.
- **Permisos:** `MatrizPermisos` + `Autorizacion.Can`. Usuarios, Clientes y cliente operando (3a–3c).
- **Jerarquía:** alcance en los SP (`p_ClienteId`/`p_UsuarioId`/`p_VeTodo`; fuera → 404); borrado lógico
  en cascada; PUT de página reemplaza `paginaPadreGuid`; pasar a Admin borra sus membresías.
- **Contenido:** `GET/PUT /paginas/{guid}/contenido` `{contenido, version}`; `pco_editar` serializa con
  `FOR UPDATE` → 409 si la versión no coincide. `TiptapContenido`: valida (doc, ≤2 MB, links
  http/https/mailto, imagen solo `attachmentId`) y extrae `TextoPlano`. Actualiza `FechaActualizacion`.
- **Metadata:** `PUT /paginas/{guid}/metadata` reemplaza estado, tipo, responsable, fecha y etiquetas;
  pasar A aprobado sin `PaginasAprobar` → 403 (estado leído con `FOR UPDATE`). Etiquetas normalizadas,
  únicas por cliente (`_ai_ci`: "café" = "cafe"); `/etiquetas?q=` por prefijo; `/responsables`.
- **Deuda:** `UseForwardedHeaders` antes de desplegar; altas simultáneas pueden repetir `Posicion` (se corrige al reordenar); carrera de slug duplicado da 500
  (`ponytail:` en el SP); sin aviso si falla el correo al crear cliente.

## Frontend (web/)

- React 19, Vite 8, TS 6, Tailwind 4, react-router 7, lucide-react, Vitest (64 pruebas), oxlint (5
  warnings aceptados). Tipos: `npm run tipos` → `src/api/esquema.d.ts`.
- **Tema:** sol/luna en la cabecera; `localStorage` `datahub-tema`, aplicado en `index.html`; por defecto claro.
- **Sesión:** "Recordarme"; `http.ts` reprograma el modal "Tu sesión expiró" con `X-Sesion-Expira` o 401.
- **Jerarquía:** árbol en el menú (`ArbolProvider`), `/workspaces`, `/paginas/:guid`, recientes. Deuda:
  foco del menú ⋯ con teclado (paso 10).
- **Editor** (`editor.tsx`, Tiptap 3.32.2): barra completa salvo imagen (módulo 7); autoguardado 1,5 s,
  un PUT a la vez, reintento cada 5 s ante red/500, guarda al salir y espera ese guardado al volver;
  409 bloquea la edición y ofrece Recargar. Sin `paginasEditar`: solo lectura.
- **Metadata** (`metadata.tsx`): insignia de estado y panel "Detalles" con guardado explícito; etiquetas
  como chips con `<datalist>`; "Aprobado" deshabilitado sin `puedeAprobar`.
- **Botones:** cursor de mano global; `Boton` con `cargando`/`textoCarga` en toda acción.

## Decisiones vigentes

- PRD §12 (sesión deslizante, plantilla única de correo, `Id`+`Guid`, todo en español, collation 0900).

## Pendientes conocidos

- `CODEOWNERS` y proteger `main`/`develop` (usuario).
- PRD §12: tamaño máximo de archivo (módulo 7).
- Producción: `Jwt__Clave` propia al crear la Web App.
- Limpiar metadatos "generado por IA" (C2PA/Recraft) de `docs/diseno/logo/*.svg` — pendiente de decisión.
- Definir la carpeta de OneDrive de la empresa para los valores de entorno.

## Variables por subir a OneDrive

- `SesEmailSettings:Aws_access_key` / `Aws_secret_key` (user-secrets de la Api; en Azure `SesEmailSettings__…`).
- Ya existentes: `ConnectionStrings:DataHub`, `Jwt:Clave`.
