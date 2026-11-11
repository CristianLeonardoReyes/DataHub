-- SOLO DESARROLLO / PRUEBAS (no es migración). Nunca ejecutar en producción.
-- Datos de prueba para revisar Acceso, Clientes y Usuarios (módulos 1 a 3).
-- Todo queda marcado: clientes con slug "prueba-*" y correos "@prueba.test".
-- Es re-ejecutable: no duplica filas que ya existan.
--
-- Contraseña de TODOS los usuarios activos de prueba: Prueba2026!
-- (hash generado y verificado con el PasswordHasher de ASP.NET Core que usa la API)

SET @hash = 'AQAAAAIAAYagAAAAEOamxfl0C1T1Zv2AsDmKME4K8kuBxaexo/tf0xSvfcyrOY/wbtOxtLDxyRdmE0GDzg==';

-- Clientes
INSERT INTO Cliente (Nombre, Slug, Activo)
SELECT 'Cooperativa Cafetera del Sur (prueba)', 'prueba-coopsur', 1
WHERE NOT EXISTS (SELECT 1 FROM Cliente WHERE Slug = 'prueba-coopsur');

INSERT INTO Cliente (Nombre, Slug, Activo)
SELECT 'Transportes Ruta 45 (prueba)', 'prueba-ruta45', 1
WHERE NOT EXISTS (SELECT 1 FROM Cliente WHERE Slug = 'prueba-ruta45');

INSERT INTO Cliente (Nombre, Slug, Activo)
SELECT 'Clínica Los Andes (prueba, inactivo)', 'prueba-clinica', 0
WHERE NOT EXISTS (SELECT 1 FROM Cliente WHERE Slug = 'prueba-clinica');

SET @coopsur = (SELECT Id FROM Cliente WHERE Slug = 'prueba-coopsur');
SET @ruta45  = (SELECT Id FROM Cliente WHERE Slug = 'prueba-ruta45');
SET @clinica = (SELECT Id FROM Cliente WHERE Slug = 'prueba-clinica');

-- Usuarios: (cliente, correo, nombre, perfil, estado, con contraseña)
INSERT INTO Usuario (ClienteId, Correo, Nombre, ContrasenaHash, Perfil, Estado)
SELECT d.ClienteId, d.Correo, d.Nombre, IF(d.Estado = 'invitado', NULL, @hash), d.Perfil, d.Estado
FROM (
  SELECT NULL     AS ClienteId, 'superadmin@prueba.test'              AS Correo, 'Super admin de prueba' AS Nombre, 'super_admin' AS Perfil, 'activo'   AS Estado
  UNION ALL SELECT @coopsur, 'admin.coopsur@prueba.test',       'Hernán Cifuentes', 'admin',       'activo'
  UNION ALL SELECT @coopsur, 'coordinador.coopsur@prueba.test', 'Sofía Herrera',    'coordinador', 'activo'
  UNION ALL SELECT @coopsur, 'colaborador.coopsur@prueba.test', 'Paula Ríos',       'colaborador', 'activo'
  UNION ALL SELECT @coopsur, 'inactivo.coopsur@prueba.test',    'Mateo Gil',        'colaborador', 'inactivo'
  UNION ALL SELECT @coopsur, 'invitado.coopsur@prueba.test',    'Pendiente',        'colaborador', 'invitado'
  UNION ALL SELECT @ruta45,  'admin.ruta45@prueba.test',        'Óscar Molina',     'admin',       'activo'
  UNION ALL SELECT @ruta45,  'colaborador.ruta45@prueba.test',  'Camila Torres',    'colaborador', 'activo'
  UNION ALL SELECT @clinica, 'admin.clinica@prueba.test',       'Lucía Prieto',     'admin',       'activo'
) AS d
WHERE NOT EXISTS (SELECT 1 FROM Usuario u WHERE u.Correo = d.Correo);

-- Resumen de lo que quedó
SELECT c.Nombre AS Cliente, IF(c.Activo, 'activo', 'inactivo') AS EstadoCliente, u.Correo, u.Perfil, u.Estado
FROM Usuario u
LEFT JOIN Cliente c ON c.Id = u.ClienteId
WHERE u.Correo LIKE '%@prueba.test'
ORDER BY c.Nombre, FIELD(u.Perfil, 'super_admin', 'admin', 'coordinador', 'colaborador');

-- REVERSIÓN (borra solo los datos de prueba):
-- DELETE t FROM UsuarioToken t JOIN Usuario u ON u.Id = t.UsuarioId WHERE u.Correo LIKE '%@prueba.test';
-- DELETE FROM Usuario WHERE Correo LIKE '%@prueba.test';
-- DELETE FROM Cliente WHERE Slug LIKE 'prueba-%' AND NOT EXISTS (SELECT 1 FROM Usuario u WHERE u.ClienteId = Cliente.Id);
