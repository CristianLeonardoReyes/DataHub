# PRD — DataHub v2

**Versión:** 2.0 · **Fecha:** 2026-10-08 · **Estado:** Aprobado
**Reemplaza:** PRD 1.0 (2026-09-21). Se conserva la idea del producto; alcance, stack y modelo de permisos se redefinen.

---

## 1. Producto

Plataforma web multiempresa donde cada cliente centraliza su conocimiento técnico y corporativo: arquitecturas, decisiones, procedimientos, APIs, onboarding y archivos. Inspirada en Notion, especializada en equipos de desarrollo de software.

**Problema:** el conocimiento vive disperso en chats, correos, carpetas y personas clave. Esto genera dependencia de individuos, duplicación, documentación desactualizada y onboarding lento.

**Visión:** ser el lugar donde una organización encuentra, crea y mantiene su conocimiento técnico.

### Principios

1. **Conocimiento, no tareas.** No reemplaza herramientas de tickets ni de gestión de proyectos.
2. **Multiempresa desde la base.** Ningún dato de un cliente es visible para otro.
3. **Seguro por defecto.** Nada es público; toda autorización se valida en el backend.
4. **Documentación estructurada.** Una página tiene metadata, estado, responsable y etiquetas, no solo texto.
5. **Preparado para IA, sin IA.** Contenido estructurado (Tiptap JSON), texto plano y Markdown listos para una futura integración RAG. Ninguna función de IA en el MVP.

---

## 2. Alcance del MVP

| # | Módulo | Para qué sirve |
|---|---|---|
| 1 | Acceso | Login con email y contraseña, alta por invitación y recuperación de contraseña. |
| 2 | Clientes | El Super admin crea y administra los clientes (organizaciones). |
| 3 | Usuarios y perfiles | Invitar usuarios, asignar perfil, asignar workspaces y desactivar. |
| 4 | Jerarquía | Workspace → Espacio → Colección → Página → Subpáginas, navegables desde un menú lateral. |
| 5 | Editor | Editor visual Tiptap con guardado automático. |
| 6 | Metadata y etiquetas | Estado, tipo, responsable, fecha de revisión y etiquetas de cada página. |
| 7 | Archivos | Adjuntos en Azure Blob privado con previsualización de imagen, PDF, video y audio. |
| 8 | Búsqueda | Buscador por título y contenido, limitado a lo que el usuario puede ver. |
| 9 | Markdown | Exportar cualquier página como `.md` con YAML Front Matter. |

### Fases posteriores

- **Fase 2:** plantillas técnicas (ADR, API, Runbook, Arquitectura, Onboarding), historial y restauración de versiones, comentarios, favoritos, feed de actividad, auditoría y mover páginas entre colecciones.
- **Fase 3:** relaciones entre páginas, importación de Markdown, login con Google y Microsoft, previsualización de Office, código y Markdown, bloques avanzados (Mermaid, callouts, embeds), perfil de solo lectura y catálogo de etiquetas.
- **Futuro:** búsqueda semántica, RAG y asistente de conocimiento.

### Fuera del alcance

IA de cualquier tipo, tickets, gestión de tareas, notificaciones, chat, reacciones, coedición en tiempo real, app móvil nativa, integraciones del producto con GitHub/GitLab o CI/CD, y portal público. Esto no excluye el pipeline propio del proyecto (7.6). La infraestructura y la ejecución de despliegues las gestiona manualmente el responsable del proyecto.

---

## 3. Perfiles y permisos

### 3.1. Perfiles

| Perfil | Pertenece a un cliente | Alcance |
|---|---|---|
| **Super admin** | No | Todo el sistema y todos los clientes. |
| **Admin** | Sí | Todo lo de su cliente. |
| **Coordinador** | Sí | Solo los workspaces que el Admin le asigna. |
| **Colaborador** | Sí | Solo los workspaces que el Admin le asigna. |

- Un usuario pertenece a **un solo cliente** y tiene **un solo perfil**. El Super admin no pertenece a ninguno.
- La asignación a workspaces solo determina qué ve el Coordinador o el Colaborador. El perfil determina qué puede hacer.
- Lo que se crea dentro de un workspace hereda su alcance. En el MVP no hay excepciones por espacio, colección o página.

### 3.2. Matriz de permisos

| Módulo / acción | Super admin | Admin | Coordinador | Colaborador |
|---|:-:|:-:|:-:|:-:|
| Clientes: crear, editar y desactivar | ✅ | — | — | — |
| Usuarios: invitar, asignar perfil y desactivar | ✅ | ✅ su cliente | — | — |
| Asignar usuarios a workspaces | ✅ | ✅ | — | — |
| Workspaces: crear, editar y eliminar | ✅ | ✅ | — | — |
| Espacios y colecciones: crear, editar y eliminar | ✅ | ✅ | ✅ asignados | — |
| Páginas: ver, crear y editar | ✅ | ✅ | ✅ | ✅ |
| Páginas: eliminar | ✅ | ✅ | ✅ | Propias y sin subpáginas |
| Metadata y etiquetas: editar | ✅ | ✅ | ✅ | ✅ |
| Cambiar estado a **Aprobado** | ✅ | ✅ | ✅ | — |
| Archivos: subir, ver y descargar | ✅ | ✅ | ✅ | ✅ |
| Archivos: eliminar | ✅ | ✅ | ✅ | Solo los propios |
| Búsqueda | Todo | Su cliente | Sus workspaces | Sus workspaces |
| Exportar a Markdown | ✅ | ✅ | ✅ | ✅ |

### 3.3. Implementación

- **Perfiles fijos.** La matriz vive en código (`DataGlobal.DataHub.Common`) como un mapa perfil → acciones. No hay tablas de perfiles editables en el MVP.
- **Una sola verificación** en la capa de servicios: `Can(usuario, acción, recurso)`. Comprueba el perfil y luego el alcance (cliente y workspace asignado).
- El frontend oculta lo que el usuario no puede hacer, pero **la decisión siempre la toma el backend**.

---

## 4. Requisitos funcionales

### 4.1. Acceso (módulo 1)

- **RF-ACC-01.** No existe registro libre. Todo usuario entra por invitación.
- **RF-ACC-02.** La invitación envía un correo con un enlace de un solo uso, válido por 72 h. Al abrirlo, el usuario define su nombre y contraseña y queda **Activo**.
- **RF-ACC-03.** Login con email y contraseña. Emite un JWT con `usuarioId`, `clienteId` (Guid; vacío para el Super admin) y `perfil` dentro de una cookie `HttpOnly`; el frontend nunca lo lee. Los datos del usuario los obtiene de `GET /api/v1/auth/me`. El logout borra la cookie.
- **RF-ACC-04.** Recuperación de contraseña: enlace de un solo uso, válido por 1 h. La respuesta es la misma exista o no el correo, para no revelar qué cuentas existen.
- **RF-ACC-05.** Tras 5 intentos fallidos, la cuenta se bloquea 15 minutos.
- **RF-ACC-06.** Un usuario Invitado o Inactivo no puede iniciar sesión. Cada petición valida que el usuario siga Activo, de modo que desactivar a alguien corta su acceso de inmediato.
- **RF-ACC-07.** Contraseña de al menos 10 caracteres.

**Estados del usuario:** `invitado` → `activo` ⇄ `inactivo`.

### 4.2. Clientes (módulo 2)

- **RF-CLI-01.** El Super admin crea un cliente (nombre y slug) e invita a su primer Admin en el mismo paso.
- **RF-CLI-02.** El Super admin puede editar y desactivar clientes. Los usuarios de un cliente inactivo no pueden iniciar sesión.
- **RF-CLI-03.** El Super admin elige un cliente en la interfaz para operar dentro de él con permisos totales.

### 4.3. Usuarios y perfiles (módulo 3)

- **RF-USR-01.** El Admin invita usuarios de su cliente con un perfil (Admin, Coordinador o Colaborador). Puede reenviar la invitación.
- **RF-USR-02.** El Admin cambia perfiles, desactiva y reactiva usuarios.
- **RF-USR-03.** El Admin asigna y quita workspaces a Coordinadores y Colaboradores.
- **RF-USR-04.** Un cliente no puede quedarse sin Admin activo, y un Admin no puede desactivarse a sí mismo.
- **RF-USR-05.** El email es único en todo el sistema.

### 4.4. Jerarquía (módulo 4)

- **RF-JER-01.** CRUD de workspaces, espacios y colecciones según la matriz. Cada uno tiene nombre, descripción opcional y orden.
- **RF-JER-02.** Las páginas viven en una colección. Una página puede tener subpáginas en varios niveles mediante `PaginaPadreId`.
- **RF-JER-03.** El menú lateral muestra el árbol que el usuario puede ver, expandible y contraíble.
- **RF-JER-04.** Al iniciar sesión se muestra **Inicio**, con las páginas actualizadas recientemente dentro del alcance del usuario.
- **RF-JER-05.** Eliminar es un borrado lógico (`FechaEliminacion`) y arrastra a todo lo que cuelga del elemento. Lo eliminado no aparece en navegación ni en búsqueda. En el MVP no hay papelera en la interfaz.
- **RF-JER-06.** Cada página muestra su ruta: Workspace / Espacio / Colección / páginas padre.

### 4.5. Editor (módulo 5)

- **RF-EDI-01.** Editor Tiptap con párrafos, H1–H3, negrita, cursiva, tachado, listas, listas numeradas, checklists, citas, código inline, bloques de código, tablas, separadores, links e imágenes.
- **RF-EDI-02.** Guardado automático 1,5 s después de la última edición, con indicador *Editando / Guardando… / Guardado / Error al guardar*. Nunca bloquea la escritura.
- **RF-EDI-03.** **Control de concurrencia.** Cada guardado envía la versión de contenido que el usuario tiene. Si otro usuario guardó antes, el backend responde `409` y la interfaz avisa que debe recargar. Nunca se sobrescribe en silencio.
- **RF-EDI-04.** Las imágenes del editor son adjuntos de la página. El JSON guarda el `attachmentId`, nunca una URL, porque las URL de acceso expiran.
- **RF-EDI-05.** El backend extrae el texto plano del JSON en cada guardado para la búsqueda. No confía en texto plano enviado por el cliente.
- **RF-EDI-06.** Los links solo admiten `http`, `https` y `mailto`. El contenido se renderiza con Tiptap; nunca se inyecta HTML crudo.

### 4.6. Metadata y etiquetas (módulo 6)

- **RF-MET-01.** Cada página tiene:
  - **Estado:** Borrador, En revisión, Aprobado o Archivado.
  - **Tipo:** General, ADR, API, Runbook, Arquitectura, Onboarding, Guía, Procedimiento, Manual o Acta de reunión.
  - **Responsable:** un usuario del cliente.
  - **Fecha de revisión:** opcional.
- **RF-MET-02.** Solo Coordinador o superior puede pasar una página a **Aprobado**.
- **RF-MET-03.** **Etiquetas libres por cliente.** Se crean al escribirlas, se normalizan (minúsculas, sin espacios sobrantes) y el campo sugiere las existentes del cliente.
- **RF-MET-04.** La fecha de revisión solo se muestra; no genera avisos.

### 4.7. Archivos (módulo 7)

- **RF-ARC-01.** Subir archivos a una página. La subida pasa por la API, que valida permisos y tamaño máximo (configurable).
- **RF-ARC-02.** Los binarios van a un contenedor **privado** de Azure Blob en la ruta `{organizationId}/{workspaceId}/{pageId}/{attachmentId}`. MySQL solo guarda la metadata.
- **RF-ARC-03.** Para ver o descargar, la API valida el permiso y entrega una URL SAS de solo lectura con expiración de 10 minutos.
- **RF-ARC-04.** Previsualización dentro de la app:
  - imágenes PNG, JPG, JPEG, WEBP y GIF;
  - PDF con el visor del navegador;
  - video y audio con los reproductores nativos de HTML5.

  SVG no se previsualiza en el MVP por riesgo de XSS.
- **RF-ARC-05.** Si no hay vista previa, se muestra una ficha (nombre, tipo, tamaño, fecha, quién lo subió) con botón de descarga.
- **RF-ARC-06.** Eliminar un archivo es un borrado lógico. El blob no se borra físicamente hasta definir una política de retención.

### 4.8. Búsqueda (módulo 8)

- **RF-BUS-01.** Búsqueda por título y contenido con índice FULLTEXT de MySQL sobre `Pagina.Titulo` y `PaginaContenido.TextoPlano`.
- **RF-BUS-02.** El filtro de permisos va **dentro de la consulta**: cliente, workspaces del usuario y exclusión de lo eliminado. Un resultado restringido nunca sale de la base de datos.
- **RF-BUS-03.** Cada resultado muestra título, ruta, fragmento y fecha de actualización. Se pagina de 20 en 20.

### 4.9. Markdown (módulo 9)

- **RF-MD-01.** `GET /api/v1/pages/{id}/markdown` devuelve `text/markdown`. El botón **Exportar → Markdown** descarga `{slug}.md`.
- **RF-MD-02.** El serializador está en C#, recorre el JSON de Tiptap y es **determinístico**: mismo contenido, mismo resultado. Cada nodo de RF-EDI-01 tiene su representación; un nodo desconocido se exporta como su texto.
- **RF-MD-03.** El archivo empieza con este Front Matter:

```yaml
---
title: Arquitectura API
status: aprobado
type: arquitectura
workspace: Ingeniería
space: Arquitectura
collection: Backend
owner: juan@cliente.com
tags: [backend, api]
review_date: 2026-12-01
updated_at: 2026-10-06T15:30:00Z
---
```

---

## 5. Reglas de negocio

- **RN-01.** Todo dato funcional pertenece a un cliente (`ClienteId`), salvo el usuario Super admin.
- **RN-02.** El `ClienteId` sale **siempre del JWT** (claim `clienteId`), nunca del body ni de la URL.
  - Única excepción: el Super admin indica el cliente sobre el que opera, y la API solo lo acepta si el perfil es Super admin.
- **RN-03.** Cada procedimiento almacenado de datos de un cliente recibe `p_ClienteId` y filtra por él.
- **RN-04.** Tiptap JSON en MySQL es la fuente de verdad. Markdown es solo una representación.
- **RN-05.** Los binarios viven en Azure Blob. MySQL guarda metadata y referencias.
- **RN-06.** Las contraseñas se guardan con hash (`PasswordHasher` de ASP.NET Core). Nunca se cifran de forma reversible ni se registran en logs.
- **RN-07.** Los tokens de invitación y recuperación se guardan como hash SHA-256, son de un solo uso y expiran.

---

## 6. Modelo de datos (MySQL 8.0.16+)

| Tabla | Campos principales |
|---|---|
| `Cliente` | Id, Guid, Nombre, Slug (único), Activo, FechaCreacion, FechaActualizacion |
| `Usuario` | Id, Guid, ClienteId (NULL solo para super_admin), Correo (único), Nombre, ContrasenaHash (NULL mientras está invitado), Perfil (`super_admin`, `admin`, `coordinador`, `colaborador`), Estado (`invitado`, `activo`, `inactivo`), IntentosFallidos, BloqueadoHasta, FechaCreacion, FechaActualizacion |
| `UsuarioToken` | Id, UsuarioId, Tipo (`invitacion`, `reset`), TokenHash, FechaExpiracion, FechaUso, FechaCreacion |
| `Workspace` | Id, Guid, ClienteId, Nombre, Slug, Descripcion, Posicion, CreadoPor, FechaCreacion, FechaActualizacion, FechaEliminacion |
| `WorkspaceMiembro` | WorkspaceId, UsuarioId, FechaCreacion (PK compuesta) |
| `Espacio` | Id, Guid, ClienteId, WorkspaceId, Nombre, Slug, Descripcion, Posicion, CreadoPor, FechaCreacion, FechaActualizacion, FechaEliminacion |
| `Coleccion` | Id, Guid, ClienteId, EspacioId, Nombre, Slug, Descripcion, Posicion, CreadoPor, FechaCreacion, FechaActualizacion, FechaEliminacion |
| `Pagina` | Id, Guid, ClienteId, WorkspaceId, ColeccionId, PaginaPadreId, Titulo, Slug, TipoDocumento, Estado, ResponsableId, FechaRevision, Posicion, CreadoPor, ActualizadoPor, FechaCreacion, FechaActualizacion, FechaEliminacion |
| `PaginaContenido` | PaginaId (PK), ContenidoJson (JSON), TextoPlano (MEDIUMTEXT), VersionContenido, FechaActualizacion |
| `Etiqueta` | Id, Guid, ClienteId, Nombre (único por cliente) |
| `PaginaEtiqueta` | PaginaId, EtiquetaId (PK compuesta) |
| `Adjunto` | Id, Guid, ClienteId, PaginaId, NombreOriginal, RutaBlob, TipoMime, TamanoBytes, SubidoPor, FechaCreacion, FechaEliminacion |

- Nombres de tablas y columnas en español y PascalCase singular (estándar de la empresa). Los valores de los enums se mantienen.
- `Id` (BIGINT) es interno para PK y FK; `Guid` es el único identificador que expone la API.
- Todas las tablas de contenido llevan `ClienteId`, para filtrar por cliente directamente sin recorrer la jerarquía.
- `Pagina` lleva además `WorkspaceId`, para filtrar permisos en navegación y búsqueda con un solo `IN`.
- Restricciones:
  - `CHECK` que obliga a que `Perfil = 'super_admin'` coincida con `ClienteId IS NULL`;
  - índices FULLTEXT en `Pagina.Titulo` y `PaginaContenido.TextoPlano`;
  - índices por `(ClienteId, FechaEliminacion)` en las tablas de contenido.

---

## 7. Arquitectura técnica

### 7.1. Stack

| Capa | Tecnología |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS y Tiptap |
| Backend | .NET 10 Web API (C#) |
| Acceso a datos | Dapper con procedimientos almacenados, sobre MySQL |
| Base de datos | MySQL 8 |
| Archivos | Azure Blob Storage (contenedor privado y SAS) |
| Correo | AWS SES v2 y MimeKit |
| Autenticación | JWT propio, `PasswordHasher` de ASP.NET Core y tokens en `UsuarioToken` |

El backend sigue el patrón de los proyectos de DataGlobal (referencia: Suplaier).

### 7.2. Repositorio único

```text
datahub/
├── CLAUDE.md                 # instrucciones del orquestador
├── .github/
│   ├── CODEOWNERS            # revisión cruzada: aprueba quien no escribió el PR
│   └── workflows/deploy.yml  # build web + api → una sola Web App (7.6)
├── docs/
│   ├── PRD.md                # este documento
│   └── STATUS.md             # estado vigente, una sección por área (7.5)
├── api/                      # se abre con Visual Studio
│   ├── DataGlobal.DataHub.sln
│   ├── DataGlobal.DataHub.Api/          # controladores, auth, middleware
│   ├── DataGlobal.DataHub.Services/     # reglas de negocio y permisos
│   ├── DataGlobal.DataHub.Repository/   # BaseRepository + Dapper + SP
│   ├── DataGlobal.DataHub.Common/       # DTOs, enums, matriz de permisos
│   └── DataGlobal.DataHub.Tests/        # xUnit v3: unitarias + integración
├── db/
│   ├── Tablas/  Procedimientos/        # SQL vigente
│   └── Migraciones/AAAA-MM-DD_<desc>.sql  # con bloque -- REVERSIÓN
├── web/                      # se abre con VS Code
└── prototipo/                # referencia visual, no se compila ni se despliega
```

- El SQL lo revisa y ejecuta el responsable del proyecto. Los agentes solo escriben scripts.
- El prototipo visual (`prototipo/`, sin Gemini) es la referencia de interfaz y no se usa como base de código.

### 7.3. API

Prefijo `/api/v1`. Grupos:

- `/auth`: login, logout, me, aceptar invitación, olvidé contraseña, restablecer.
- `/organizations`: solo Super admin.
- `/users`
- `/workspaces`, `/workspaces/{id}/members`
- `/spaces`, `/collections`
- `/pages`, `/pages/{id}/content`, `/pages/{id}/markdown`, `/pages/{id}/attachments`
- `/attachments/{id}/url`
- `/tags`
- `/search`

Los errores tienen un formato uniforme y sin detalles internos. Un recurso de otro cliente devuelve `404`, no `403`, para no confirmar que existe.

### 7.4. Pruebas

Las pruebas viven en el proyecto `DataGlobal.DataHub.Tests` (xUnit v3) y se ejecutan con `dotnet test`.

- **Unitarias, sin base de datos.** Cubren la lógica de servicios:
  - la matriz `Can()`, probando cada perfil contra cada acción;
  - el serializador Markdown y su determinismo;
  - la extracción de texto plano;
  - la normalización de etiquetas;
  - la expiración y el uso único de los tokens.

  Las dependencias se simulan con fakes escritos a mano o con NSubstitute.
- **Integración.** `WebApplicationFactory` levanta la API en memoria y Testcontainers crea un MySQL temporal en Docker al que se le aplican los scripts de `db/`. Verifican los criterios de la sección 9 (aislamiento entre clientes, alcance por workspace, usuario desactivado y concurrencia).
- **Cuándo empiezan.** Las unitarias desde la primera tarea; las de integración desde el módulo 3.
- Una tarea no se cierra con pruebas en rojo.

### 7.5. Trabajo en pareja

El equipo son dos personas: una a cargo de `api/` y `db/`, otra de `web/`.

- **Repositorio en GitHub.** Ramas: `feature/*` sale de `develop` y vuelve por PR; `develop` se integra a `main` solo para publicar. `main` y `develop` están protegidas. Cualquiera puede trabajar en cualquier carpeta; el PR lo aprueba quien no lo escribió.
- **Contrato primero.** Antes de implementar un módulo, el backend publica sus endpoints y DTOs. El frontend avanza con datos simulados mientras tanto.
- **OpenAPI.** La API publica su especificación con el soporte nativo de .NET 10 (`/openapi/v1.json`, solo en desarrollo). El frontend genera sus tipos con `openapi-typescript` (dependencia solo de desarrollo) a partir de la API local, y **los tipos generados se suben al repositorio** en el mismo PR que cambia el contrato. Un cambio de DTO rompe la compilación del frontend en lugar de fallar en producción.
- **`docs/STATUS.md` con secciones Backend, Frontend y Común.** Cada persona sobrescribe solo la suya, para que no haya conflictos en cada merge.
- **Claude.** Cada persona abre su sesión en la raíz del repositorio y delega a su agente (backend o frontend).

### 7.6. Despliegue: una sola Web App de Azure

Front y API se publican en **un único Azure App Service**. La API de .NET sirve el build de React desde `wwwroot`. Al estar en el mismo dominio no hay CORS y la sesión viaja en una cookie `HttpOnly` + `Secure` + `SameSite=Strict`.

- **Enrutamiento.**
  - Todo lo que empieza por `/api/*` llega a los controladores.
  - El resto lo atiende `MapFallbackToFile("index.html")`, de modo que las rutas de React funcionan al recargar la página.
- **Desarrollo local.** El servidor de Vite reenvía `/api` a la API local (`server.proxy`), así el comportamiento es el mismo que en producción.
- **Pipeline** (`.github/workflows/deploy.yml`, manual o al hacer merge a `main`):
  1. `web/`: `npm ci` → `npm run build` (usa los tipos OpenAPI ya versionados).
  2. Copiar `web/dist/` a `api/DataGlobal.DataHub.Api/wwwroot/`.
  3. `dotnet test`. Si falla, no se publica.
  4. `dotnet publish -c Release`.
  5. Publicar en la Web App con `azure/webapps-deploy`.
- **Antes de cada publicación**, el responsable ejecuta en MySQL los scripts nuevos de `db/Migraciones/`.
- **Configuración.** Las cadenas de conexión, Blob, SES y la clave JWT van en las App Settings de Azure, nunca en el repositorio. El pipeline usa un publish profile o una identidad federada, guardados como secretos de GitHub.
- **Verificación.** Después de publicar, `GET /health` debe responder OK.
- Crear la Web App, configurarla y ejecutar el pipeline lo hace manualmente el responsable del proyecto. Este apartado documenta el proceso.

---

## 8. Requisitos no funcionales

| Id | Requisito |
|---|---|
| RNF-01 | HTTPS en producción. CORS desactivado, porque front y API comparten dominio (7.6). |
| RNF-02 | Aislamiento total entre clientes (RN-02, RN-03). |
| RNF-03 | Rate limiting nativo de .NET en login, olvidé contraseña, aceptar invitación, búsqueda y subida de archivos. |
| RNF-04 | Cabeceras de seguridad (CSP, `X-Content-Type-Options`, `Referrer-Policy`, HSTS). |
| RNF-05 | Logs estructurados con request id. Sin contraseñas, tokens ni contenido de páginas. Endpoint `/health`. |
| RNF-06 | Rendimiento: carga de página < 2 s, búsqueda < 1,5 s, autosave sin bloquear. |
| RNF-07 | Responsive, con prioridad a escritorio. WCAG 2.1 AA como referencia. |

---

## 9. Criterios de aceptación críticos

1. Un usuario del cliente A no puede ver, buscar ni descargar nada del cliente B, ni siquiera con un id válido en la URL.
2. Un Coordinador o Colaborador no ve workspaces no asignados en la navegación, la búsqueda, Inicio ni por URL directa.
3. Un usuario desactivado pierde el acceso en su siguiente petición, aunque su JWT no haya expirado.
4. Un enlace de invitación o recuperación usado o vencido no funciona.
5. Dos usuarios editando la misma página: el segundo guardado recibe `409` y no se pierde contenido.
6. Un Colaborador no puede aprobar una página ni eliminar páginas ajenas.
7. Una URL SAS deja de funcionar al expirar, y el contenedor no es accesible sin SAS.
8. La exportación Markdown de una página con todos los bloques del editor produce Front Matter válido y el mismo resultado en dos exportaciones seguidas.

---

## 10. Definition of Done del MVP

1. El Super admin crea un cliente e invita a su Admin.
2. El Admin invita usuarios, asigna perfiles y workspaces, y desactiva usuarios.
3. Funcionan la invitación, el login, el bloqueo por intentos y la recuperación de contraseña.
4. Se crean y navegan workspaces, espacios, colecciones, páginas y subpáginas según permisos.
5. El editor guarda automáticamente con control de concurrencia.
6. Las páginas tienen metadata y etiquetas.
7. Se suben, previsualizan y descargan archivos desde Azure Blob privado.
8. La búsqueda devuelve solo resultados permitidos.
9. Cualquier página se exporta a Markdown con Front Matter.
10. Los criterios de la sección 9 están verificados con pruebas.
11. Cada tarea cerrada quedó reflejada en `docs/STATUS.md`.

---

## 11. Orden de construcción

Una tarea se cierra (funciona, tiene prueba y está registrada en STATUS) antes de iniciar la siguiente.

1. Base: repositorio en GitHub con `CODEOWNERS`, `docs/STATUS.md` por secciones (la sección Común incluye un enlace al proceso de despliegue de 7.6), solución .NET en capas con su proyecto de pruebas xUnit, proyecto web con proxy de Vite, `BaseRepository` y tablas de cliente y usuario.
2. Acceso: login, JWT, invitación, recuperación y correo SES (módulo 1).
3. Clientes y usuarios (módulos 2 y 3) y la matriz de permisos.
4. Jerarquía y navegación (módulo 4).
5. Editor y autosave (módulo 5).
6. Metadata y etiquetas (módulo 6).
7. Archivos (módulo 7).
8. Búsqueda (módulo 8).
9. Markdown (módulo 9).
10. Cierre: verificación de la sección 9 y de los RNF.

---

## 12. Decisiones

### Tomadas

| Decisión | Motivo |
|---|---|
| .NET 10 en lugar de Node.js | Estándar de la empresa y mantenimiento por el equipo. |
| JWT propio y `PasswordHasher` en lugar de Better Auth | Better Auth es solo para Node. Se sigue el patrón de la empresa. |
| Dapper y procedimientos almacenados | Patrón de la empresa. El SQL lo ejecuta el responsable. |
| Alta solo por invitación; sin dominios permitidos | Más simple y controlado. Nadie entra sin ser dado de alta. |
| 4 perfiles fijos; alcance por workspace | Cubre el MVP sin la complejidad de herencia con excepciones. |
| Etiquetas libres normalizadas con sugerencias | Rápido de usar, sin pantalla de catálogo. |
| AWS SES para correo y Azure Blob para archivos | Infraestructura existente de la empresa. |
| Instrucciones en `CLAUDE.md` y `docs/STATUS.md`, sin wiki | Menor consumo de tokens. Agentes generados con `/agent-setup`. |
| xUnit v3, Testcontainers (MySQL en Docker) y NSubstitute para pruebas del backend | Estándar en .NET. El aislamiento entre clientes vive en los SP y se prueba contra MySQL real. |
| Repositorio único en GitHub (`api/`, `web/`, `db/`) con `CODEOWNERS` y `main` protegida | Dos personas (backend+BD y frontend) con revisión cruzada por PR; contratos en un solo PR y un solo `CLAUDE.md` y `STATUS.md`. |
| OpenAPI nativo de .NET y `openapi-typescript` | Contrato verificable entre las dos personas. |
| Una sola Web App de Azure; la API sirve el SPA | Mismo dominio: sin CORS, cookie segura, un solo recurso. |
| JWT en cookie `HttpOnly` + `Secure` + `SameSite=Strict` | No queda expuesto a XSS. Es posible porque front y API comparten dominio. |
| Sesión (JWT) de 1 hora | Decidido por el responsable (2026-10-08). |
| Cada tabla con `Id` BIGINT (PK y FKs, interno) y `Guid` CHAR(36) único (lo único que expone la API) | Joins compactos y URLs no adivinables. Decidido por el responsable (2026-10-08). |
| Esquema de BD en español, PascalCase singular (`Cliente`, `Usuario`, `ClienteId`, `FechaCreacion`) | Estándar de la empresa. Decidido por el responsable (2026-10-13). |
| Rutas, DTOs, claims y procedimientos en español (`/auth/aceptar-invitacion`, `{ correo, contrasena }`, `sp_Usuario_ObtenerPorCorreo`) | Coherencia con el esquema. Decidido por el responsable (2026-10-14). |
| Correo: en desarrollo se guarda como archivo local; SES (AWSSDK.SimpleEmailV2 + MimeKit) se activa por configuración | Probar en local sin credenciales de AWS. Decidido por el responsable (2026-10-14). |
| Backend: `Microsoft.AspNetCore.Authentication.JwtBearer`, leyendo el JWT desde la cookie | Validación estándar del token. Decidido por el responsable (2026-10-14). |
| Frontend: react-router, openapi-typescript (dev), Vitest + Testing Library (dev) | Navegación, tipos del contrato y pruebas de pantallas. Decidido por el responsable (2026-10-14). |

### Pendientes (se resuelven en la tarea que las necesita)

1. **Tamaño máximo de archivo.**
2. **Otras librerías del frontend.** Cada una se justifica en su tarea.
