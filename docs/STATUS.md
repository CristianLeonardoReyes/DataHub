# Estado — DataHub
_Se sobrescribe por secciones, máx. ~60 líneas. Cada quien actualiza la sección del área que
tocó. La historia la guarda git._

## Común

- **Hecho en `develop`:** pasos 1–10 del PRD §11 (MVP), PR #19. Criterios §9 con prueba de integración.
- **En curso:** `Vista-y-edición-de-workspaces,-espacios-y-colecciones` (mejora de UX tras QA) — lista
  para commit/PR (2026-11-19). api 244/244, web 91/91. Despliegue (PRD §7.6) tras probar todo en local.
- **Reglas 3a:** sin permiso → 403; recurso ajeno → 404; la web oculta según `permisos`.
- **Local:** README "Guía de arranque". API perfil `http` en `:5080`; Vite `:5173` con proxy.
  `dotnet test` requiere Docker; si la API bloquea `bin/`, usar `-p:OutDir=…/Tests/bin/alt/`.

## Backend (api/ + db/)

- **BD del servidor** (MySQL 8.0.36, base `DataHub`): 13 migraciones aplicadas (hasta 2026-11-19_03) y semilla
  `dev_datos_prueba.sql`. `developer1` tiene privilegios globales: limitar a `DataHub.*`.
- 5 capas; solo SP (`<prefijo>_<verbo><Calificador>`, collation 0900); ProblemDetails; `/health`.
- **Acceso:** JWT en cookie `datahub_sesion`, sesión deslizante 60 min / 8 h (recordarme 7 días),
  bloqueo 5/15 min, contraseña fuerte, correo `Archivo`/`Ses`. Permisos: `MatrizPermisos` + `Can`.
- **Jerarquía:** alcance en los SP (`p_ClienteId`/`p_UsuarioId`/`p_VeTodo`; fuera → 404); borrado lógico
  en cascada; PUT de página reemplaza `paginaPadreGuid`; pasar a Admin borra sus membresías.
- **Contenido:** `pco_editar` con `FOR UPDATE` → 409 si la versión no coincide; `TiptapContenido` valida
  (≤2 MB, links http/https/mailto, imagen solo `attachmentId`) y extrae `TextoPlano`.
- **Metadata:** `PUT /paginas/{guid}/metadata` reemplaza estado, tipo, responsable, fecha y etiquetas;
  pasar A aprobado sin `PaginasAprobar` → 403 (estado leído con `FOR UPDATE`). Etiquetas normalizadas,
  únicas por cliente (`_ai_ci`: "café" = "cafe"); `/etiquetas?q=` por prefijo; `/responsables`.
- **Archivos:** `IAlmacenArchivos` (Azure Blob, contenedor privado creado al primer uso). Ruta
  `{clienteGuid}/{workspaceGuid}/{paginaGuid}/{adjuntoGuid}`; SAS de lectura 10 min (SVG y no
  previsualizables como attachment); `LimiteSubida` corta en `Archivos:TamanoMaximoMb`+1 MB; rate
  limit "subida" 30/min; borrado lógico (el blob se conserva). Pruebas con Azurite 3.37.0.
- **Búsqueda:** `GET /buscar` → `pag_consultarBusqueda` (FULLTEXT BOOLEAN MODE, filtro de permisos en
  el SP, título x2). `ConsultaBusqueda.Preparar`: solo letras/dígitos, sin stopwords de InnoDB, ≤8
  términos `+t*`, mínimo 2 letras. Rate limit "busqueda" 60/min; páginas 1..500.
- **Markdown:** `GET /paginas/{guid}/markdown` → `MarkdownTiptap` determinístico (GFM, `<!-- -->` entre
  listas seguidas, imagen `attachment:{guid}`, links http/https/mailto) + Front Matter RF-MD-03 con
  strings citados; `owner` y `review_date` se omiten si no hay. Sin migración.
- **Seguridad (RNF-04):** cabeceras en `Program.cs` para toda respuesta: nosniff, `Referrer-Policy:
  no-referrer`, CSP (`script-src 'self'`, `style-src` con `'unsafe-inline'` por el editor, Google Fonts,
  origen del blob en img/media/frame-src, calculado al arrancar); HSTS fuera de Development;
  `UseForwardedHeaders` confiando en cualquier proxy (válido solo detrás del frontend de Azure).
  Video/audio inline solo mp4/webm/ogg y mpeg/mp4/ogg/wav/webm; el resto, attachment.
- **Deuda:** `Posicion` repetida en altas simultáneas; carrera
  de slug de cliente da 500; sin aviso si falla el correo al crear cliente.

## Frontend (web/)

- React 19, Vite 8, TS 6, Tailwind 4, react-router 7, lucide-react, Vitest (93 pruebas), oxlint (11
  warnings aceptados). Tipos: `npm run tipos` → `src/api/esquema.d.ts`.
- **Super admin sin cliente operando:** tras el login va a Inicio (no a la ruta anterior); página, búsqueda y
  contenedores muestran "Selecciona un cliente para operar" sin llamar a la API (evita el 400).
- **Tema** claro por defecto (`datahub-tema`, aplicado por `public/tema.js`: la CSP no admite scripts inline). **Sesión:** modal "Tu sesión expiró" (`X-Sesion-Expira` o 401).
- **Jerarquía:** árbol en el menú (nombre → vista, chevron → expandir), `/workspaces` (gestión),
  `/workspaces|espacios|colecciones/:guid` (`contenedores.tsx`: nombre y descripción editables, hijos;
  lee del árbol, sin endpoints nuevos; permisos UX en `jerarquia-nodos.ts`), `/paginas/:guid`, recientes. Menú ⋯ con teclado (roles menu/menuitem).
- **Editor** (Tiptap 3.32.2): autoguardado 1,5 s, un PUT a la vez, reintento 5 s, guarda al salir;
  409 bloquea y ofrece Recargar. Imagen = nodo propio `image` con `attachmentId`.
- **Metadata:** insignia y panel "Detalles" (guardado explícito, etiquetas con `<datalist>`).
- **Archivos** (`archivos.tsx`): subida (botón y arrastrar), vista previa (imagen, PDF, video, audio;
  SVG nunca) en `<dialog>` modal y descarga; la URL SAS se renueva 1 min antes de vencer.
- **Búsqueda:** campo en la cabecera (Ctrl+K fuera del editor, "/"), `/buscar` con resaltado `<mark>`
  sin innerHTML y paginación.
- **Markdown:** botón "Exportar a Markdown" (`pedirArchivo` en `http.ts`); 401 abre el modal de sesión.

## Salida a producción (2026-11-20)

1. **Blob real** — en espera: el usuario habilita la cuenta de almacenamiento propia (Azure). Luego
   user-secrets `ConnectionStrings:AzureBlobStorage` y probar subir/ver/descargar/imagen/eliminar.
2. **Prueba manual DoD (PRD §10)** — en espera (el punto 7 depende del 1); el resto se puede recorrer ya.
3. **CSP con la app completa** — cerrado (2026-11-20, API sirviendo el build en `:5080`): login, Inicio,
   editor y vista de colección sin violaciones (solo Browser Link/hot reload de VS, que no van a prod).
   Falta la vista previa de imagen/PDF del blob, junto con el punto 1.
4. **BD de producción** — en espera: va en el servidor de producción de la empresa (el actual es el de
   pruebas); el usuario no tiene acceso y la crea el encargado. Solo estructura (migraciones o volcado
   `--no-data --routines`), sin datos de prueba; MySQL ≥ 8.0.16, collation 0900, usuario solo sobre la
   base, acceso de red desde la Web App y respaldos. Código: sin cambios (solo `ConnectionStrings__DataHub`).
5. **Super admin** — script listo: `db/Semillas/super_admin.sql` (reemplaza `dev_super_admin.sql`;
   `@correo`, `@nombre`, `@urlBase`; invitación de 72 h, solo hash del token). Probado en la BD de pruebas
   (2026-11-20). En producción: lo ejecuta el encargado tras las migraciones, con `@urlBase` de la Web App.
6. **Pipeline** — listo `.github/workflows/deploy.yml`: PR a develop/main compila y prueba (web + api con
   Docker); push a main despliega. El despliegue se omite hasta definir en GitHub la variable
   `AZURE_WEBAPP_NAME` y el secreto `AZURE_WEBAPP_PUBLISH_PROFILE`. Web App recomendada: Linux, .NET 10.
7. **App Settings de la Web App** — en espera de la Web App (`App__UrlBase`, cadenas, `Jwt__Clave` nueva…).
8. **Correo SES** — listo (usuario).
9. **Logs (RNF-05)** — cerrado en DAT-200: JSON con scopes (TraceId, RequestId, RequestPath sin query)
   fuera de Development; `Microsoft.AspNetCore` en Warning ya venía en `appsettings.json` y ahora lo
   cubre `LogsTests` (token, búsqueda y contraseña no aparecen); `traceId` en los ProblemDetails.
   Verificado en modo Production: línea de error JSON con el mismo TraceId del 500 y sin detalle.
   Riesgo menor: el mensaje de una MySqlException o de SES podría llevar un correo. Ver README "Logs".
10. **Seguridad al publicar** — pruebas hechas en DAT-201 (`SeguridadProduccionTests`: `/openapi` 404, HSTS,
    cookie HttpOnly/Secure/SameSite=Strict). Falta: IP real del límite de login, tras desplegar.
11. **Gestión del repo** — cerrado: aprobación de PR interna; ruta de OneDrive en gestión.
12. **Mejoras (DAT-201)** — implementadas, migración `2026-11-20_mejoras_busqueda_posicion_cliente.sql`
    pendiente de ejecutar (usuario; antes, la consulta de nombres duplicados de su cabecera). Búsqueda:
    cada término en título o contenido (`p_T1..p_T8`); posición con `FOR UPDATE` del padre; nombre de
    cliente único (409 campo `nombre`); altas de clientes/invitados con `GET_LOCK` (timeout → 503);
    1062 → 409 sin texto de MySQL; logos sin C2PA. Aviso de correo fallido: sin decidir (opcional).
    Tras ejecutar: actualizar `db/Tablas/Cliente.sql` y los 9 SP en `db/Procedimientos`.
- Opcional: el bundle pesa 847 kB (aviso de Vite >500 kB); dividir el editor con `import()` si la carga
  supera RNF-06.

## Variables por subir a OneDrive

- `SesEmailSettings:Aws_access_key` / `Aws_secret_key` (user-secrets de la Api; en Azure `SesEmailSettings__…`).
- `ConnectionStrings:AzureBlobStorage` (cuenta propia de DataHub, por crear; Azure `ConnectionStrings__AzureBlobStorage`).
  Contenedor `adjuntos-dev` en local y `adjuntos` en producción; Azurite solo en las pruebas.
- Ya existentes: `ConnectionStrings:DataHub`, `Jwt:Clave`.
