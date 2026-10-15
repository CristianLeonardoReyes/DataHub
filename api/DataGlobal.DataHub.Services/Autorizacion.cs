using DataGlobal.DataHub.Common.Enums;
using DataGlobal.DataHub.Common.Models;

namespace DataGlobal.DataHub.Services;

public static class Autorizacion
{
    /// <summary>
    /// Can(usuario, acción, recurso): 1) el perfil tiene la acción en la matriz (PRD 3.2);
    /// 2) alcance de cliente: si el recurso pertenece a un cliente, debe ser el del usuario (Super admin: cualquiera).
    /// Falta, y se completa en cada módulo: Coordinador "asignados", Colaborador "propias y sin subpáginas" /
    /// "solo los propios" y alcance por workspace asignado.
    /// </summary>
    public static bool Can(UsuarioActual usuario, Accion accion, long? clienteIdRecurso = null)
    {
        var perfil = MatrizPermisos.ParsearPerfil(usuario.Perfil);
        if (!MatrizPermisos.De(perfil).Contains(accion)) return false;
        return clienteIdRecurso is null || perfil == PerfilUsuario.SuperAdmin || clienteIdRecurso == usuario.ClienteId;
    }
}
