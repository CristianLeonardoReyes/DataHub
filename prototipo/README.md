# DataHub — prototipo visual

Referencia de interfaz con datos de ejemplo, sin backend. No es base de código de producción:
`web/` imita su estilo y sus pantallas, pero no importa ni copia este código.

```bash
npm install
npm run dev   # http://localhost:3000
```

## Pantallas (rutas por hash)

| Ruta | Pantalla | Módulo PRD |
|---|---|---|
| `#/acceso/login`, `activar`, `recuperar`, `nueva`, `bloqueo` | Acceso | 1 |
| `#/admin/clientes` | Clientes (Super admin) | 2 |
| `#/admin/usuarios` | Usuarios, perfiles y workspaces asignados | 3 |
| `#/inicio` | Inicio: recientes, revisión vencida, vigencia | 4 |
| `#/w/:id`, `#/e/:id?c=:coleccion` | Workspace y espacio con colecciones | 4 |
| `#/p/:id`, `?tab=archivos` | Página: editor con autosave, propiedades, subpáginas, archivos, exportar a Markdown | 5, 6, 7, 9 |
| `#/buscar?q=` | Búsqueda con filtros | 8 |

- **Ctrl+K** abre la paleta de búsqueda.
- **Menú de la cuenta** (abajo a la izquierda): "Ver el prototipo como" Super admin, Admin,
  Coordinador o Colaborador, para revisar lo que cada perfil ve; tema claro u oscuro.
- **Menú `…` de una página**: simula el conflicto 409 y el error al guardar.

## Datos de ejemplo

Todo está en `src/lib/mock.ts` (clientes, personas, workspaces, páginas y fechas son
ficticios; "hoy" es 2026-10-26). Reemplazar por datos reales al construir en `web/`.

## Sistema de diseño

Tokens en `src/index.css` (claro y oscuro). Ver `../DESIGN.md`.
