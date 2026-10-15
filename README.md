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
├── api/               # solución .NET 10, se abre con Visual Studio 2026
├── db/                # Tablas/, Procedimientos/, Migraciones/, Semillas/
├── web/               # app React, se abre con VS Code
└── prototipo/         # referencia visual (mock), no se compila ni despliega
```

## Requisitos locales

- .NET SDK 10 y Visual Studio 2026 (backend).
- Node.js 22 y VS Code (frontend).
- Acceso a un MySQL 8.0.16 o superior, con base y tablas en `utf8mb4_0900_ai_ci`.
- Docker Desktop, solo para `dotnet test` (las pruebas crean un MySQL temporal).

## Guía de arranque

**1. Clonar y entrar a `develop`**

```bash
git clone https://github.com/CristianLeonardoReyes/DataHub.git
cd DataHub
git checkout develop
```

**2. Base de datos**

Si el equipo comparte la base, ya está creada y al día: solo ejecuta la semilla (punto 3) si
necesitas tu propio usuario. Para una base nueva:

1. Crear la base con la collation del proyecto:
   `CREATE DATABASE DataHub CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;`
2. Ejecutar en orden de nombre todos los scripts de `db/Migraciones/` (cliente que entienda
   `DELIMITER`: MySQL Workbench, HeidiSQL o la consola `mysql`).
3. Editar `@correo` en `db/Semillas/dev_super_admin.sql`, ejecutarlo y guardar el enlace que
   devuelve (activa el Super admin; vale 72 h).

**3. Secretos de la API** (fuera del repo; una sola vez por equipo)

La cadena de conexión a la base y la llave JWT **no están en el repositorio**: pídelas a tu
compañero de equipo por un canal privado (nunca por el repo, issues ni PR).

Con esos datos, crea el archivo `secrets.json` del proyecto Api:

- Visual Studio: clic derecho en `DataGlobal.DataHub.Api` → **Administrar secretos de usuario**.
  Se abre el `secrets.json` (vacío la primera vez).
- Sin Visual Studio, se crea en
  `%APPDATA%\Microsoft\UserSecrets\18391988-8eeb-4307-b866-8c1c9aeea7be\secrets.json`.

Contenido (reemplaza los valores por los que te pasó tu compañero):

```json
{
  "ConnectionStrings:DataHub": "<cadena de conexión que te pasó tu compañero>",
  "Jwt:Clave": "<llave JWT que te pasó tu compañero>"
}
```

Para comprobarlo: `dotnet user-secrets list --project api/DataGlobal.DataHub.Api` debe listar
las dos claves. Si Visual Studio se abre con otra cuenta de Windows (por ejemplo, como
administrador), crea el archivo desde ese menú para que quede en la cuenta que ejecuta la API.

**4. Ejecutar la API** — perfil `http` (entorno Development; sin él no carga los secretos y no
arranca)

- Visual Studio: abrir `api/DataGlobal.DataHub.sln`, proyecto de inicio
  `DataGlobal.DataHub.Api`, perfil `http`, F5.
- Terminal: `dotnet run --project api/DataGlobal.DataHub.Api --launch-profile http`

Comprobar `http://localhost:5080/health` → `Healthy`.

**5. Ejecutar la web**

```bash
cd web
npm ci
npm run dev
```

Abrir `http://localhost:5173`. Vite reenvía `/api` a la API. Abrir el enlace del paso 2 para
activar el Super admin e iniciar sesión.

En desarrollo los correos (invitación, recuperación) no se envían: se guardan como `.html` en
`correos-dev/`, en la raíz del repo.

**6. Pruebas**

```bash
dotnet test api/DataGlobal.DataHub.sln   # requiere Docker Desktop abierto
npm --prefix web test
```

Tras cambiar un endpoint o DTO, con la API corriendo: `npm --prefix web run tipos` y versionar
`web/src/api/esquema.d.ts`.

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
