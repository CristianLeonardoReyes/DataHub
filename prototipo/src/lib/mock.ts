// Datos de ejemplo. Nombres, clientes y fechas son ficticios y deben reemplazarse
// por datos reales cuando la interfaz se construya en web/.
import type { Bloque, Cliente, Coleccion, Espacio, Pagina, Usuario, Workspace } from './types';

export const HOY = '2026-10-26';
export const AHORA = '2026-10-26T10:15';

export const CLIENTES: Cliente[] = [
  { id: 'c-dg', nombre: 'DataGlobal', identificador: 'dataglobal', activo: true, fechaCreacion: '2026-10-08' },
  { id: 'c-coop', nombre: 'Cooperativa Cafetera del Sur', identificador: 'coopsur', activo: true, fechaCreacion: '2026-10-15' },
  { id: 'c-ruta', nombre: 'Transportes Ruta 45', identificador: 'ruta45', activo: true, fechaCreacion: '2026-10-19' },
  { id: 'c-demo', nombre: 'Clínica Los Andes (demo)', identificador: 'clinica-demo', activo: false, fechaCreacion: '2026-10-09' },
];

export const USUARIOS: Usuario[] = [
  { id: 'u-sa', clienteId: null, nombre: 'Diana Ortiz', correo: 'diana.ortiz@dataglobal.co', perfil: 'super_admin', estado: 'activo', ultimoAcceso: '2026-10-26T08:02', workspaces: [] },
  { id: 'u1', clienteId: 'c-dg', nombre: 'Laura Méndez', correo: 'laura.mendez@dataglobal.co', perfil: 'admin', estado: 'activo', ultimoAcceso: '2026-10-26T09:10', workspaces: [] },
  { id: 'u2', clienteId: 'c-dg', nombre: 'Andrés Rojas', correo: 'andres.rojas@dataglobal.co', perfil: 'coordinador', estado: 'activo', ultimoAcceso: '2026-10-26T08:47', workspaces: ['w-proy', 'w-ing'] },
  { id: 'u3', clienteId: 'c-dg', nombre: 'Camila Torres', correo: 'camila.torres@dataglobal.co', perfil: 'colaborador', estado: 'activo', ultimoAcceso: '2026-10-26T09:42', workspaces: ['w-proy'] },
  { id: 'u4', clienteId: 'c-dg', nombre: 'Julián Pardo', correo: 'julian.pardo@dataglobal.co', perfil: 'colaborador', estado: 'activo', ultimoAcceso: '2026-10-25T17:31', workspaces: ['w-proy', 'w-onb'] },
  { id: 'u5', clienteId: 'c-dg', nombre: 'Sofía Herrera', correo: 'sofia.herrera@dataglobal.co', perfil: 'coordinador', estado: 'activo', ultimoAcceso: '2026-10-24T15:05', workspaces: ['w-ing', 'w-onb'] },
  { id: 'u6', clienteId: 'c-dg', nombre: 'Mateo Gil', correo: 'mateo.gil@dataglobal.co', perfil: 'colaborador', estado: 'inactivo', ultimoAcceso: '2026-09-12T11:20', workspaces: ['w-proy'] },
  { id: 'u7', clienteId: 'c-dg', nombre: 'Valentina Ruiz', correo: 'valentina.ruiz@dataglobal.co', perfil: 'colaborador', estado: 'invitado', ultimoAcceso: null, workspaces: ['w-onb'] },
  { id: 'u8', clienteId: 'c-coop', nombre: 'Hernán Cifuentes', correo: 'hcifuentes@coopsur.com.co', perfil: 'admin', estado: 'activo', ultimoAcceso: '2026-10-23T14:40', workspaces: [] },
  { id: 'u9', clienteId: 'c-coop', nombre: 'Paula Ríos', correo: 'prios@coopsur.com.co', perfil: 'colaborador', estado: 'activo', ultimoAcceso: '2026-10-22T09:15', workspaces: ['w-coop'] },
  { id: 'u10', clienteId: 'c-ruta', nombre: 'Óscar Molina', correo: 'omolina@ruta45.co', perfil: 'admin', estado: 'invitado', ultimoAcceso: null, workspaces: [] },
  { id: 'u11', clienteId: 'c-demo', nombre: 'Lucía Prieto', correo: 'lprieto@clinicaandes.co', perfil: 'admin', estado: 'activo', ultimoAcceso: '2026-10-10T10:00', workspaces: [] },
];

export const WORKSPACES: Workspace[] = [
  { id: 'w-proy', clienteId: 'c-dg', nombre: 'Proyectos', descripcion: 'Un espacio por proyecto: cómo se publica, cómo está construido y sus decisiones.' },
  { id: 'w-ing', clienteId: 'c-dg', nombre: 'Ingeniería', descripcion: 'Estándares, infraestructura y procedimientos transversales.' },
  { id: 'w-onb', clienteId: 'c-dg', nombre: 'Personas y onboarding', descripcion: 'Incorporación de nuevos integrantes y manuales de herramientas.' },
  { id: 'w-coop', clienteId: 'c-coop', nombre: 'Operaciones TI', descripcion: 'Sistemas internos de la cooperativa.' },
];

export const ESPACIOS: Espacio[] = [
  { id: 'e-portal', workspaceId: 'w-proy', nombre: 'Portal Clientes', descripcion: 'Aplicación web para clientes. Despliegue automatizado en Azure.' },
  { id: 'e-fact', workspaceId: 'w-proy', nombre: 'Facturación Legada', descripcion: 'Sistema en .NET Framework sobre IIS. Publicación manual.' },
  { id: 'e-recaudo', workspaceId: 'w-proy', nombre: 'App Recaudos', descripcion: 'Aplicación móvil de recaudo en campo.' },
  { id: 'e-datahub', workspaceId: 'w-proy', nombre: 'DataHub', descripcion: 'Esta plataforma: base de conocimiento técnico multiempresa.' },
  { id: 'e-est', workspaceId: 'w-ing', nombre: 'Estándares de desarrollo', descripcion: 'Cómo trabajamos: ramas, revisiones, base de datos.' },
  { id: 'e-infra', workspaceId: 'w-ing', nombre: 'Infraestructura', descripcion: 'Servidores, respaldos y atención de incidentes.' },
  { id: 'e-onb', workspaceId: 'w-onb', nombre: 'Incorporación', descripcion: 'La ruta de las primeras semanas y los manuales de acceso.' },
  { id: 'e-coop', workspaceId: 'w-coop', nombre: 'Sistemas internos', descripcion: 'ERP cooperativo y respaldos.' },
];

export const COLECCIONES: Coleccion[] = [
  { id: 'k-portal-pub', espacioId: 'e-portal', nombre: 'Publicación y operación' },
  { id: 'k-portal-arq', espacioId: 'e-portal', nombre: 'Arquitectura y decisiones' },
  { id: 'k-portal-api', espacioId: 'e-portal', nombre: 'APIs' },
  { id: 'k-fact-pub', espacioId: 'e-fact', nombre: 'Publicación y operación' },
  { id: 'k-fact-arq', espacioId: 'e-fact', nombre: 'Arquitectura y decisiones' },
  { id: 'k-rec-pub', espacioId: 'e-recaudo', nombre: 'Publicación y operación' },
  { id: 'k-rec-arq', espacioId: 'e-recaudo', nombre: 'Arquitectura y decisiones' },
  { id: 'k-dh-pub', espacioId: 'e-datahub', nombre: 'Publicación y operación' },
  { id: 'k-dh-arq', espacioId: 'e-datahub', nombre: 'Arquitectura y decisiones' },
  { id: 'k-est-guias', espacioId: 'e-est', nombre: 'Guías' },
  { id: 'k-est-adr', espacioId: 'e-est', nombre: 'Decisiones transversales' },
  { id: 'k-infra-run', espacioId: 'e-infra', nombre: 'Runbooks' },
  { id: 'k-infra-actas', espacioId: 'e-infra', nombre: 'Actas' },
  { id: 'k-onb-ruta', espacioId: 'e-onb', nombre: 'Ruta de incorporación' },
  { id: 'k-onb-man', espacioId: 'e-onb', nombre: 'Manuales' },
  { id: 'k-coop-man', espacioId: 'e-coop', nombre: 'Manuales' },
];

function basico(resumen: string, secciones: [string, string][]): Bloque[] {
  return [
    { t: 'p', html: resumen },
    ...secciones.flatMap(([titulo, texto]): Bloque[] => [
      { t: 'h2', texto: titulo },
      { t: 'p', html: texto },
    ]),
  ];
}

const PUBLICAR_PORTAL: Bloque[] = [
  {
    t: 'p',
    html: 'Proceso para publicar <strong>Portal Clientes</strong> en producción. La publicación es automatizada: un merge a <code>main</code> dispara el flujo de GitHub Actions que compila, prueba y despliega en el slot <code>staging</code> antes de intercambiarlo con producción.',
  },
  { t: 'h2', texto: 'Ambiente' },
  {
    t: 'table',
    cabecera: ['Ambiente', 'Recurso', 'URL'],
    filas: [
      ['Producción', '<code>app-portal-prod</code>', '<code>portal.dataglobal.co</code>'],
      ['Staging (slot)', '<code>app-portal-prod/staging</code>', '<code>portal-staging.dataglobal.co</code>'],
      ['Pruebas', '<code>app-portal-qa</code>', '<code>portal-qa.dataglobal.co</code>'],
    ],
  },
  { t: 'h2', texto: 'Requisitos previos' },
  {
    t: 'check',
    items: [
      { texto: 'El PR a main está aprobado por quien no lo escribió.', hecho: true },
      { texto: 'Los scripts de base de datos de la versión ya se ejecutaron en producción.', hecho: true },
      { texto: 'Se avisó en el canal del proyecto la ventana de publicación.', hecho: false },
    ],
  },
  { t: 'h2', texto: 'Pasos' },
  {
    t: 'ol',
    items: [
      'Integrar el PR de <code>develop</code> a <code>main</code>.',
      'Seguir el flujo <code>publicar-portal</code> en GitHub Actions hasta que termine el paso <em>Desplegar en staging</em>.',
      'Validar el slot de staging con la lista de verificación de abajo.',
      'Aprobar el paso <em>Intercambiar slots</em>. El intercambio tarda unos 40 segundos y no corta sesiones.',
    ],
  },
  {
    t: 'code',
    lenguaje: 'bash',
    codigo:
      '# Verificación rápida desde la terminal\ncurl -fsS https://portal.dataglobal.co/health\n# Respuesta esperada\n{"estado":"ok","version":"2.14.0"}',
  },
  { t: 'h2', texto: 'Verificación posterior' },
  {
    t: 'ul',
    items: [
      '<code>GET /health</code> responde 200 con la versión publicada.',
      'Inicio de sesión con el usuario de pruebas de producción.',
      'Consulta de un estado de cuenta y descarga del PDF.',
    ],
  },
  { t: 'h2', texto: 'Reversión' },
  {
    t: 'p',
    html: 'Si la verificación falla, intercambiar de nuevo los slots desde el portal de Azure. El detalle está en la subpágina <a href="#/p/p-portal-rollback">Reversión de una publicación fallida</a>.',
  },
  { t: 'quote', texto: 'Nunca revertir con un nuevo merge a main: el intercambio de slots es inmediato y conserva la versión anterior intacta.' },
  { t: 'h2', texto: 'Contactos' },
  {
    t: 'table',
    cabecera: ['Rol', 'Persona', 'Cuándo'],
    filas: [
      ['Responsable del proceso', 'Andrés Rojas', 'Dudas y aprobación del intercambio'],
      ['Respaldo', 'Camila Torres', 'Si el responsable no está'],
    ],
  },
];

const PUBLICAR_FACTURACION: Bloque[] = [
  {
    t: 'p',
    html: 'Facturación Legada se publica <strong>a mano</strong> en el servidor <code>SRV-FACT-01</code> (IIS 10). No hay integración continua: cada paso se hace por escritorio remoto y deja la aplicación fuera de línea unos 5 minutos.',
  },
  { t: 'h2', texto: 'Requisitos previos' },
  {
    t: 'check',
    items: [
      { texto: 'Ventana acordada con el área de facturación (fuera del cierre de mes).', hecho: false },
      { texto: 'Paquete compilado en modo Release y copiado a \\\\SRV-FACT-01\\publicaciones.', hecho: false },
      { texto: 'Respaldo de la carpeta del sitio y de web.config.', hecho: false },
    ],
  },
  { t: 'h2', texto: 'Pasos' },
  {
    t: 'ol',
    items: [
      'Detener el grupo de aplicaciones <code>FacturacionPool</code>.',
      'Ejecutar el script de publicación como administrador.',
      'Iniciar el grupo de aplicaciones y abrir la página de inicio para precargar.',
    ],
  },
  {
    t: 'code',
    lenguaje: 'powershell',
    codigo:
      'Stop-WebAppPool -Name "FacturacionPool"\n.\\publicar-iis.ps1 -Origen "D:\\publicaciones\\2026-06-12" -Sitio "Facturacion"\nStart-WebAppPool -Name "FacturacionPool"',
  },
  { t: 'h2', texto: 'Reversión' },
  { t: 'p', html: 'Restaurar la carpeta respaldada y reiniciar el grupo de aplicaciones. El script deja el respaldo en <code>D:\\respaldos\\facturacion\\&lt;fecha&gt;</code>.' },
];

export const PAGINAS: Pagina[] = [
  {
    id: 'p-portal-publicar', coleccionId: 'k-portal-pub', padreId: null,
    titulo: 'Publicar Portal Clientes en producción', tipo: 'runbook', estado: 'aprobado',
    responsableId: 'u2', fechaRevision: '2027-01-15', actualizada: '2026-10-26T09:42', actualizadaPor: 'u3', creadaPor: 'u2',
    etiquetas: ['automatizado', 'azure', 'github-actions'],
    resumen: 'Merge a main, validación en el slot de staging e intercambio de slots en Azure.',
    contenido: PUBLICAR_PORTAL,
    adjuntos: [
      { id: 'a1', nombre: 'diagrama-despliegue.png', tipo: 'imagen', bytes: 412_380, subidoPor: 'u2', fecha: '2026-10-14T15:20' },
      { id: 'a2', nombre: 'checklist-publicacion.pdf', tipo: 'pdf', bytes: 188_004, subidoPor: 'u3', fecha: '2026-10-22T10:05' },
      { id: 'a3', nombre: 'publicar-portal.yml', tipo: 'otro', bytes: 3_276, subidoPor: 'u2', fecha: '2026-10-14T15:18' },
      { id: 'a7', nombre: 'logo-portal.svg', tipo: 'otro', bytes: 8_904, subidoPor: 'u3', fecha: '2026-10-22T10:07' },
    ],
  },
  {
    id: 'p-portal-rollback', coleccionId: 'k-portal-pub', padreId: 'p-portal-publicar',
    titulo: 'Reversión de una publicación fallida', tipo: 'runbook', estado: 'aprobado',
    responsableId: 'u2', fechaRevision: '2027-01-15', actualizada: '2026-10-22T11:30', actualizadaPor: 'u2', creadaPor: 'u2',
    etiquetas: ['azure', 'rollback'],
    resumen: 'Intercambiar de nuevo los slots de staging y producción y confirmar la versión anterior.',
    contenido: basico('Intercambiar de nuevo los slots de staging y producción y confirmar la versión anterior.', [
      ['Cuándo aplicarla', 'Cuando la verificación posterior falla o aparecen errores 5xx sostenidos después del intercambio.'],
      ['Pasos', 'En el portal de Azure, abrir app-portal-prod, Slots de implementación, Intercambiar. Confirmar con GET /health que la versión es la anterior.'],
    ]),
    adjuntos: [],
  },
  {
    id: 'p-portal-ambientes', coleccionId: 'k-portal-pub', padreId: null,
    titulo: 'Ambientes y URLs del Portal Clientes', tipo: 'general', estado: 'aprobado',
    responsableId: 'u3', fechaRevision: '2026-12-01', actualizada: '2026-10-20T16:12', actualizadaPor: 'u3', creadaPor: 'u3',
    etiquetas: ['azure'],
    resumen: 'Producción, staging y pruebas: recursos, URLs y quién administra cada uno.',
    contenido: basico('Producción, staging y pruebas: recursos, URLs y quién administra cada uno.', [
      ['Producción', 'app-portal-prod en el grupo de recursos rg-portal. Solo el responsable del proceso aprueba el intercambio de slots.'],
      ['Pruebas', 'app-portal-qa se publica automáticamente con cada merge a develop.'],
    ]),
    adjuntos: [],
  },
  {
    id: 'p-portal-arq', coleccionId: 'k-portal-arq', padreId: null,
    titulo: 'Arquitectura del Portal Clientes', tipo: 'arquitectura', estado: 'aprobado',
    responsableId: 'u2', fechaRevision: '2027-02-01', actualizada: '2026-10-14T15:22', actualizadaPor: 'u2', creadaPor: 'u2',
    etiquetas: ['azure', 'react', 'dotnet'],
    resumen: 'React servido por una API .NET en una sola Web App, con MySQL y almacenamiento privado.',
    contenido: basico('React servido por una API .NET en una sola Web App, con MySQL y almacenamiento privado.', [
      ['Componentes', 'Frontend React, API .NET en capas, MySQL 8 con procedimientos almacenados y Azure Blob privado.'],
      ['Seguridad', 'Sesión en cookie HttpOnly; frontend y API en el mismo dominio, sin CORS.'],
    ]),
    adjuntos: [],
  },
  {
    id: 'p-portal-adr7', coleccionId: 'k-portal-arq', padreId: null,
    titulo: 'ADR-007: Sesión en cookie HttpOnly', tipo: 'adr', estado: 'aprobado',
    responsableId: 'u2', fechaRevision: null, actualizada: '2026-10-09T10:00', actualizadaPor: 'u2', creadaPor: 'u2',
    etiquetas: ['seguridad'],
    resumen: 'El token de sesión viaja en una cookie HttpOnly y el código de la página nunca lo lee.',
    contenido: basico('El token de sesión viaja en una cookie HttpOnly y el código de la página nunca lo lee.', [
      ['Contexto', 'Guardar el token en localStorage lo expone a cualquier script inyectado.'],
      ['Decisión', 'Cookie HttpOnly, Secure y SameSite=Strict; frontend y API en el mismo dominio.'],
      ['Consecuencias', 'No hay CORS. Las pruebas de extremo a extremo deben correr contra el mismo dominio.'],
    ]),
    adjuntos: [],
  },
  {
    id: 'p-portal-api', coleccionId: 'k-portal-api', padreId: null,
    titulo: 'API de consultas de cliente v1', tipo: 'api', estado: 'en_revision',
    responsableId: 'u3', fechaRevision: '2026-11-10', actualizada: '2026-10-24T16:05', actualizadaPor: 'u3', creadaPor: 'u3',
    etiquetas: ['api', 'rest'],
    resumen: 'Endpoints de estado de cuenta, facturas y certificados, con sus códigos de respuesta.',
    contenido: basico('Endpoints de estado de cuenta, facturas y certificados, con sus códigos de respuesta.', [
      ['Autenticación', 'Cookie de sesión. Un recurso de otro cliente responde 404.'],
      ['Endpoints', 'GET /api/v1/cuentas/{guid}/estado, GET /api/v1/facturas?desde=&hasta=, GET /api/v1/certificados/{guid}.'],
    ]),
    adjuntos: [],
  },
  {
    id: 'p-fact-publicar', coleccionId: 'k-fact-pub', padreId: null,
    titulo: 'Publicar Facturación Legada en IIS', tipo: 'procedimiento', estado: 'aprobado',
    responsableId: 'u4', fechaRevision: '2026-09-30', actualizada: '2026-06-12T18:40', actualizadaPor: 'u4', creadaPor: 'u6',
    etiquetas: ['iis', 'legado', 'manual'],
    resumen: 'Publicación manual por escritorio remoto en SRV-FACT-01; deja el sistema fuera de línea unos 5 minutos.',
    contenido: PUBLICAR_FACTURACION,
    adjuntos: [
      { id: 'a4', nombre: 'publicar-iis.ps1', tipo: 'otro', bytes: 6_912, subidoPor: 'u6', fecha: '2026-06-12T18:35' },
      { id: 'a5', nombre: 'captura-sitios-iis.png', tipo: 'imagen', bytes: 254_118, subidoPor: 'u6', fecha: '2026-06-12T18:36' },
      { id: 'a6', nombre: 'grabacion-publicacion-junio.mp4', tipo: 'video', bytes: 48_312_420, subidoPor: 'u4', fecha: '2026-06-12T18:39' },
    ],
  },
  {
    id: 'p-fact-certs', coleccionId: 'k-fact-pub', padreId: null,
    titulo: 'Renovar el certificado TLS del servidor de facturación', tipo: 'runbook', estado: 'en_revision',
    responsableId: 'u4', fechaRevision: '2026-10-15', actualizada: '2026-10-03T09:14', actualizadaPor: 'u4', creadaPor: 'u4',
    etiquetas: ['iis', 'manual', 'certificados'],
    resumen: 'Importar el certificado, enlazarlo al sitio en IIS y verificar la cadena antes del vencimiento.',
    contenido: basico('Importar el certificado, enlazarlo al sitio en IIS y verificar la cadena antes del vencimiento.', [
      ['Cuándo', 'El certificado actual vence el 2026-11-20. Renovar con dos semanas de margen.'],
      ['Pasos', 'Importar el .pfx en el almacén del equipo, editar el enlace https del sitio Facturacion y reiniciar el sitio.'],
    ]),
    adjuntos: [],
  },
  {
    id: 'p-fact-arq', coleccionId: 'k-fact-arq', padreId: null,
    titulo: 'Mapa de componentes de Facturación Legada', tipo: 'arquitectura', estado: 'borrador',
    responsableId: 'u2', fechaRevision: null, actualizada: '2026-09-18T12:00', actualizadaPor: 'u2', creadaPor: 'u2',
    etiquetas: ['legado'],
    resumen: 'Qué piezas tiene el sistema, dónde corren y qué depende de qué.',
    contenido: basico('Qué piezas tiene el sistema, dónde corren y qué depende de qué.', [
      ['Componentes', 'Sitio ASP.NET MVC 5, servicio de Windows de facturación electrónica y SQL Server 2016.'],
    ]),
    adjuntos: [],
  },
  {
    id: 'p-rec-publicar', coleccionId: 'k-rec-pub', padreId: null,
    titulo: 'Publicar App Recaudos en las tiendas', tipo: 'procedimiento', estado: 'borrador',
    responsableId: 'u3', fechaRevision: null, actualizada: '2026-10-25T18:20', actualizadaPor: 'u3', creadaPor: 'u3',
    etiquetas: ['android', 'ios', 'manual'],
    resumen: 'Firmar, subir y promover la versión en Google Play y App Store Connect.',
    contenido: basico('Firmar, subir y promover la versión en Google Play y App Store Connect.', [
      ['Android', 'Generar el AAB firmado, subirlo a la pista interna y promoverlo a producción al 20 %.'],
      ['iOS', 'Archivar en Xcode, subir con Transporter y enviar a revisión.'],
    ]),
    adjuntos: [],
  },
  {
    id: 'p-rec-adr', coleccionId: 'k-rec-arq', padreId: null,
    titulo: 'ADR-012: Sincronización sin conexión', tipo: 'adr', estado: 'en_revision',
    responsableId: 'u2', fechaRevision: '2026-11-05', actualizada: '2026-10-23T14:48', actualizadaPor: 'u2', creadaPor: 'u2',
    etiquetas: ['movil', 'offline'],
    resumen: 'Los recaudos se guardan en el dispositivo y se envían en lote cuando hay señal.',
    contenido: basico('Los recaudos se guardan en el dispositivo y se envían en lote cuando hay señal.', [
      ['Contexto', 'Los recaudadores trabajan en zonas rurales sin cobertura durante horas.'],
      ['Decisión', 'Cola local cifrada con reintentos y número de recibo generado en el dispositivo.'],
    ]),
    adjuntos: [],
  },
  {
    id: 'p-dh-publicar', coleccionId: 'k-dh-pub', padreId: null,
    titulo: 'Publicar DataHub en Azure Web App', tipo: 'runbook', estado: 'borrador',
    responsableId: 'u2', fechaRevision: '2026-12-15', actualizada: '2026-10-21T17:02', actualizadaPor: 'u2', creadaPor: 'u2',
    etiquetas: ['azure', 'dotnet', 'automatizado'],
    resumen: 'Scripts de base de datos primero, luego el flujo de GitHub Actions y la verificación de /health.',
    contenido: basico('Scripts de base de datos primero, luego el flujo de GitHub Actions y la verificación de /health.', [
      ['Pendiente', 'La Web App y el pipeline aún no existen; hoy solo hay ambiente local.'],
    ]),
    adjuntos: [],
  },
  {
    id: 'p-dh-adr1', coleccionId: 'k-dh-arq', padreId: null,
    titulo: 'ADR-001: Dapper y procedimientos almacenados', tipo: 'adr', estado: 'aprobado',
    responsableId: 'u2', fechaRevision: null, actualizada: '2026-10-08T10:30', actualizadaPor: 'u2', creadaPor: 'u2',
    etiquetas: ['dotnet', 'mysql'],
    resumen: 'El acceso a datos se hace solo con procedimientos almacenados, por estándar de la empresa.',
    contenido: basico('El acceso a datos se hace solo con procedimientos almacenados, por estándar de la empresa.', [
      ['Decisión', 'Dapper con CommandType.StoredProcedure. Cada procedimiento de datos de cliente recibe p_ClienteId.'],
    ]),
    adjuntos: [],
  },
  {
    id: 'p-est-git', coleccionId: 'k-est-guias', padreId: null,
    titulo: 'Flujo de ramas y pull requests', tipo: 'guia', estado: 'aprobado',
    responsableId: 'u5', fechaRevision: '2026-10-10', actualizada: '2026-04-02T09:00', actualizadaPor: 'u5', creadaPor: 'u5',
    etiquetas: ['git'],
    resumen: 'feature/* sale de develop y vuelve por PR; develop pasa a main solo para publicar.',
    contenido: basico('feature/* sale de develop y vuelve por PR; develop pasa a main solo para publicar.', [
      ['Revisión', 'Todo PR lo aprueba quien no lo escribió.'],
    ]),
    adjuntos: [],
  },
  {
    id: 'p-est-sql', coleccionId: 'k-est-guias', padreId: null,
    titulo: 'Convenciones de base de datos', tipo: 'guia', estado: 'aprobado',
    responsableId: 'u5', fechaRevision: '2027-04-01', actualizada: '2026-10-13T11:45', actualizadaPor: 'u5', creadaPor: 'u5',
    etiquetas: ['mysql'],
    resumen: 'Tablas en español, PascalCase singular; Id interno y Guid público; migraciones con reversión.',
    contenido: basico('Tablas en español, PascalCase singular; Id interno y Guid público; migraciones con reversión.', [
      ['Migraciones', 'Cada cambio va en db/Migraciones/AAAA-MM-DD_descripcion.sql con su bloque de reversión.'],
    ]),
    adjuntos: [],
  },
  {
    id: 'p-est-adr', coleccionId: 'k-est-adr', padreId: null,
    titulo: 'ADR-003: Esquema y API en español', tipo: 'adr', estado: 'aprobado',
    responsableId: 'u5', fechaRevision: null, actualizada: '2026-10-13T11:50', actualizadaPor: 'u5', creadaPor: 'u5',
    etiquetas: ['mysql', 'api'],
    resumen: 'Tablas, columnas, procedimientos y endpoints se nombran en español.',
    contenido: basico('Tablas, columnas, procedimientos y endpoints se nombran en español.', [['Motivo', 'Estándar de la empresa.']]),
    adjuntos: [],
  },
  {
    id: 'p-infra-backup', coleccionId: 'k-infra-run', padreId: null,
    titulo: 'Restaurar una base MySQL desde respaldo', tipo: 'runbook', estado: 'aprobado',
    responsableId: 'u5', fechaRevision: '2026-11-30', actualizada: '2026-08-28T15:10', actualizadaPor: 'u5', creadaPor: 'u5',
    etiquetas: ['mysql', 'respaldos'],
    resumen: 'Ubicar el respaldo, restaurarlo en un servidor aparte y validar antes de reemplazar.',
    contenido: basico('Ubicar el respaldo, restaurarlo en un servidor aparte y validar antes de reemplazar.', [
      ['Pasos', 'Descargar el respaldo del contenedor privado, restaurar con mysql en el servidor de pruebas y comparar conteos.'],
    ]),
    adjuntos: [],
  },
  {
    id: 'p-infra-incidente', coleccionId: 'k-infra-run', padreId: null,
    titulo: 'Atención de incidentes en producción', tipo: 'procedimiento', estado: 'en_revision',
    responsableId: 'u5', fechaRevision: '2026-11-02', actualizada: '2026-10-24T11:30', actualizadaPor: 'u5', creadaPor: 'u5',
    etiquetas: ['incidentes'],
    resumen: 'Quién atiende, cómo se comunica el impacto y cuándo se revierte una publicación.',
    contenido: basico('Quién atiende, cómo se comunica el impacto y cuándo se revierte una publicación.', [
      ['Primeros 15 minutos', 'Confirmar el impacto, avisar al responsable del proyecto y decidir si se revierte.'],
    ]),
    adjuntos: [],
  },
  {
    id: 'p-infra-acta', coleccionId: 'k-infra-actas', padreId: null,
    titulo: 'Acta: revisión de ambientes del 19 de octubre', tipo: 'acta', estado: 'archivado',
    responsableId: 'u5', fechaRevision: null, actualizada: '2026-10-19T17:00', actualizadaPor: 'u5', creadaPor: 'u5',
    etiquetas: ['ambientes'],
    resumen: 'Inventario de ambientes por proyecto y responsables acordados.',
    contenido: basico('Inventario de ambientes por proyecto y responsables acordados.', [
      ['Acuerdos', 'Cada proyecto documenta su proceso de publicación antes del 30 de noviembre.'],
    ]),
    adjuntos: [],
  },
  {
    id: 'p-onb-semana', coleccionId: 'k-onb-ruta', padreId: null,
    titulo: 'Tu primera semana en DataGlobal', tipo: 'onboarding', estado: 'aprobado',
    responsableId: 'u5', fechaRevision: '2026-12-31', actualizada: '2026-10-01T08:30', actualizadaPor: 'u5', creadaPor: 'u5',
    etiquetas: ['onboarding'],
    resumen: 'Qué leer, con quién reunirte y qué deberías poder publicar al final de la semana.',
    contenido: basico('Qué leer, con quién reunirte y qué deberías poder publicar al final de la semana.', [
      ['Día 1', 'Accesos, equipo y lectura del flujo de ramas.'],
      ['Días 2 a 5', 'Un cambio pequeño en un proyecto, revisado y publicado en pruebas.'],
    ]),
    adjuntos: [],
  },
  {
    id: 'p-onb-accesos', coleccionId: 'k-onb-ruta', padreId: null,
    titulo: 'Solicitar accesos y herramientas', tipo: 'onboarding', estado: 'en_revision',
    responsableId: 'u4', fechaRevision: '2026-11-15', actualizada: '2026-10-25T10:12', actualizadaPor: 'u4', creadaPor: 'u4',
    etiquetas: ['onboarding', 'accesos'],
    resumen: 'GitHub, Azure, VPN y correo: a quién pedir cada acceso y cuánto tarda.',
    contenido: basico('GitHub, Azure, VPN y correo: a quién pedir cada acceso y cuánto tarda.', [
      ['GitHub', 'Lo concede el Admin del cliente en la organización de la empresa.'],
    ]),
    adjuntos: [],
  },
  {
    id: 'p-onb-vpn', coleccionId: 'k-onb-man', padreId: null,
    titulo: 'Manual de conexión a la VPN', tipo: 'manual', estado: 'aprobado',
    responsableId: 'u4', fechaRevision: '2026-08-31', actualizada: '2026-02-20T14:00', actualizadaPor: 'u4', creadaPor: 'u4',
    etiquetas: ['vpn', 'accesos'],
    resumen: 'Instalar el cliente WireGuard, importar el perfil y probar la conexión a los servidores internos.',
    contenido: basico('Instalar el cliente WireGuard, importar el perfil y probar la conexión a los servidores internos.', [
      ['Instalación', 'Descargar WireGuard del sitio oficial e importar el archivo de perfil que entrega Infraestructura.'],
    ]),
    adjuntos: [],
  },
  {
    id: 'p-coop-erp', coleccionId: 'k-coop-man', padreId: null,
    titulo: 'Manual de usuario del ERP cooperativo', tipo: 'manual', estado: 'aprobado',
    responsableId: 'u9', fechaRevision: '2027-03-01', actualizada: '2026-10-22T09:40', actualizadaPor: 'u9', creadaPor: 'u9',
    etiquetas: ['erp'],
    resumen: 'Módulos de asociados, aportes y créditos, con las tareas más frecuentes.',
    contenido: basico('Módulos de asociados, aportes y créditos, con las tareas más frecuentes.', [['Asociados', 'Alta, actualización y retiro.']]),
    adjuntos: [],
  },
];
