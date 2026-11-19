# Estado — DataHub
_Se sobrescribe por secciones, máx. ~60 líneas. Cada quien actualiza la sección del área que
tocó. La historia la guarda git._

## Común

- **Hecho en `develop`:** pasos 1–6 (base, Acceso, Clientes/Usuarios, Jerarquía, Editor, Metadata), PR #15.
- **En curso:** `feat/DAT-185-archivos-de-paginas-…` (paso 7) — lista para commit/PR (2026-11-19).
  api 173/173, web 74/74. Siguiente: paso 8 (búsqueda FULLTEXT).
- **Reglas 3a:** sin permiso → 403; recurso ajeno → 404; la web oculta según `permisos`.
- **Local:** README "Guía de arranque". API perfil `http` en `:5080`; Vite `:5173` con proxy.
  `dotnet test` requiere Docker; si la API bloquea `bin/`, usar `-p:OutDir=…/Tests/bin/alt/`.

## Backend (api/ + db/)

- **BD del servidor** (MySQL 8.0.36, base `DataHub`): 12 migraciones aplicadas (hasta 2026-11-19_02) y semilla
  `dev_datos_prueba.sql`. `developer1` tiene privilegios globales: limitar a `DataHub.*`.
- 5 capas; solo SP (`<prefijo>_<verbo><Calificador>`, collation 0900); ProblemDetails; `/health`.
- **Acceso:** JWT en cookie `datahub_sesion`; usuario/cliente activos en cada petición; bloqueo 5/15 min;
  rate limit. Sesión deslizante (`max`/`rec`, 60 min / 8 h, recordarme 7 días); header `X-Sesion-Expira`.
- **Contraseña** 10+ con mayúscula, minúscula, número y símbolo. **Correo:** `Archivo` o `Ses`, plantilla
  única. **Permisos:** `MatrizPermisos` + `Autorizacion.Can`.
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
- **Deuda:** `UseForwardedHeaders` antes de desplegar; `Posicion` repetida en altas simultáneas; carrera
  de slug de cliente da 500; sin aviso si falla el correo al crear cliente.

## Frontend (web/)

- React 19, Vite 8, TS 6, Tailwind 4, react-router 7, lucide-react, Vitest (74 pruebas), oxlint (5
  warnings aceptados). Tipos: `npm run tipos` → `src/api/esquema.d.ts`.
- **Tema** claro por defecto (`datahub-tema`). **Sesión:** modal "Tu sesión expiró" (`X-Sesion-Expira` o 401).
- **Jerarquía:** árbol en el menú (`ArbolProvider`), `/workspaces`, `/paginas/:guid`, recientes. Deuda:
  foco del menú ⋯ con teclado (paso 10).
- **Editor** (Tiptap 3.32.2): autoguardado 1,5 s, un PUT a la vez, reintento 5 s, guarda al salir;
  409 bloquea y ofrece Recargar. Imagen = nodo propio `image` con `attachmentId`.
- **Metadata** (`metadata.tsx`): insignia de estado y panel "Detalles" con guardado explícito; etiquetas
  como chips con `<datalist>`; "Aprobado" deshabilitado sin `puedeAprobar`.
- **Archivos** (`archivos.tsx`): subida (botón y arrastrar), vista previa (imagen, PDF, video, audio;
  SVG nunca) y descarga.
- **Botones:** cursor de mano global; `Boton` con `cargando`/`textoCarga` en toda acción.

## Pendientes conocidos

- **Prueba real de archivos (bloqueada):** crear la cuenta de almacenamiento propia de DataHub (la
  cadena actual apunta a `datahub`, que no es de la empresa → 403), guardar su cadena en user-secrets
  y reiniciar la API; luego probar subir/ver/descargar/imagen en editor/eliminar. El usuario avisa.
- Paso 10: foco atrapado en el modal de vista previa; lista blanca de subtipos video/audio; reintento
  del PDF tras 10 min. CSP al desplegar: permitir el dominio del blob en img/frame/media-src.
- `CODEOWNERS` y proteger `main`/`develop` (usuario).
- Producción: `Jwt__Clave` propia al crear la Web App.
- Limpiar metadatos "generado por IA" (C2PA/Recraft) de `docs/diseno/logo/*.svg` — pendiente de decisión.
- Definir la carpeta de OneDrive de la empresa para los valores de entorno.

## Variables por subir a OneDrive

- `SesEmailSettings:Aws_access_key` / `Aws_secret_key` (user-secrets de la Api; en Azure `SesEmailSettings__…`).
- `ConnectionStrings:AzureBlobStorage` (cuenta propia de DataHub, por crear; Azure `ConnectionStrings__AzureBlobStorage`).
  Contenedor `adjuntos-dev` en local y `adjuntos` en producción; Azurite solo en las pruebas.
- Ya existentes: `ConnectionStrings:DataHub`, `Jwt:Clave`.
