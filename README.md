# DataHub

Plataforma web multiempresa de gestión del conocimiento para equipos de desarrollo de software.
Cada cliente centraliza su documentación técnica y corporativa: arquitecturas, decisiones (ADR),
procedimientos, APIs, onboarding y archivos. Inspirada en Notion, especializada en equipos de
software.

> **Estado:** inicio del MVP. El PRD v2 está aprobado y la base del proyecto aún no está construida.
> El estado al día está en [`docs/STATUS.md`](docs/STATUS.md).

## Documentación

| Documento | Para qué |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Requisitos del producto: alcance, permisos, modelo de datos, arquitectura y decisiones. Es la fuente de verdad. |
| [`docs/STATUS.md`](docs/STATUS.md) | Estado vigente, tarea en curso y pendientes, por área. |
| [`CLAUDE.md`](CLAUDE.md) | Instrucciones para trabajar con Claude Code (orquestador y subagentes). |

## Alcance del MVP

| # | Módulo | Para qué sirve |
|---|---|---|
| 1 | Acceso | Login con email y contraseña, alta por invitación y recuperación de contraseña. |
| 2 | Clientes | El Super admin crea y administra los clientes. |
| 3 | Usuarios y perfiles | Invitar usuarios, asignar perfil y workspaces, desactivar. |
| 4 | Jerarquía | Workspace → Espacio → Colección → Página → Subpáginas, con menú lateral. |
| 5 | Editor | Editor visual Tiptap con guardado automático. |
| 6 | Metadata y etiquetas | Estado, tipo, responsable, fecha de revisión y etiquetas libres. |
| 7 | Archivos | Adjuntos en Azure Blob privado con vista previa de imagen, PDF, video y audio. |
| 8 | Búsqueda | Por título y contenido, limitada a lo que el usuario puede ver. |
| 9 | Markdown | Exportar cualquier página como `.md` con YAML Front Matter. |

Fuera del MVP (fases 2 y 3): plantillas técnicas, versiones, comentarios, favoritos, feed,
auditoría, login con Google y Microsoft, y vista previa de Office. La IA queda para una fase
futura; el contenido ya queda preparado para integrarla.

## Perfiles

| Perfil | Alcance |
|---|---|
| **Super admin** | Todo el sistema. No pertenece a ningún cliente. |
| **Admin** | Todo lo de su cliente: usuarios, workspaces y contenido. |
| **Coordinador** | Estructura y contenido de los workspaces asignados; aprueba documentos. |
| **Colaborador** | Crea y edita contenido en los workspaces asignados. |

La matriz completa de permisos está en el PRD §3.2. La autorización y el aislamiento entre
clientes se aplican siempre en el backend.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Tiptap |
| Backend | .NET 10 Web API (C#), en capas Api / Services / Repository / Common |
| Datos | MySQL 8 con Dapper y procedimientos almacenados |
| Archivos | Azure Blob Storage (contenedor privado y SAS) |
| Correo | AWS SES v2 |
| Autenticación | JWT propio en cookie `HttpOnly`, `PasswordHasher` de ASP.NET Core |
| Pruebas | xUnit v3, Testcontainers (MySQL en Docker), NSubstitute |
| Contrato API | OpenAPI nativo de .NET y `openapi-typescript` |
| Despliegue | Una sola Azure Web App; la API sirve el build de React |

## Estructura del repositorio

```text
DataHub/
├── CLAUDE.md          # instrucciones del orquestador (Claude Code)
├── .claude/           # subagentes: backend, frontend, qa
├── docs/              # PRD.md y STATUS.md
├── api/               # solución .NET 10, se abre con Visual Studio 2026   (paso 1)
├── db/                # Tablas/, Procedimientos/, Migraciones/            (paso 1)
├── web/               # app React, se abre con VS Code                    (paso 1)
└── prototipo/         # referencia visual (mock), no se compila ni despliega
```

## Requisitos locales

- .NET SDK 10 y Visual Studio 2026 (backend).
- Node.js 22 y VS Code (frontend).
- Docker, para las pruebas de integración y para MySQL local.
- MySQL 8.0.16 o superior.

Las instrucciones para ejecutar el proyecto se agregan aquí cuando se complete el paso 1
(base del repositorio).

### Prototipo visual

```bash
cd prototipo
npm install
npm run dev
```

## Forma de trabajo

- **Ramas:** `feature/<descripcion>` sale de `develop` y vuelve a ella por PR. `develop` se
  integra a `main` solo para publicar. `main` y `develop` están protegidas.
- **Revisión:** cualquiera puede trabajar en cualquier carpeta, y el PR lo aprueba quien no
  lo escribió.
- **Contrato primero:** antes de un módulo, el backend define endpoints y DTOs. El frontend
  regenera los tipos OpenAPI y los versiona en el mismo PR.
- **Base de datos:** cada cambio va en `db/Migraciones/AAAA-MM-DD_<descripcion>.sql` con un
  bloque `-- REVERSIÓN`. El responsable revisa y ejecuta el SQL; nadie lo aplica
  automáticamente.
- **Cierre de tareas:** una tarea termina cuando funciona, tiene su prueba en verde y quedó
  registrada en `docs/STATUS.md`. Se sigue el orden de construcción del PRD §11.
- **Secretos:** nunca en el repositorio. En local se usan user-secrets y en Azure las App
  Settings.

## Despliegue

Front y API se publican juntos en una Azure Web App mediante GitHub Actions. El proceso
completo está en el PRD §7.6, y lo ejecuta manualmente el responsable del proyecto.
