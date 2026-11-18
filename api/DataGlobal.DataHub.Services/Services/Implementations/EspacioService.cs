using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Common.Enums;
using DataGlobal.DataHub.Common.Models;
using DataGlobal.DataHub.Common.Util;
using DataGlobal.DataHub.Repository.Interfaces;
using DataGlobal.DataHub.Services.Services.Interfaces;

namespace DataGlobal.DataHub.Services.Services.Implementations;

public class EspacioService(IEspacioRepository espacios, UsuarioActual actual) : IEspacioService
{
    public async Task<Guid> CrearAsync(CrearEspacioRequest s)
    {
        var a = Jerarquia.Alcance(actual, Accion.EspaciosColeccionesGestionar);
        var nombre = Jerarquia.Texto(s.Nombre, "El nombre", 150);
        var r = await espacios.InsertarAsync(a, s.WorkspaceGuid, nombre, Slug.De(nombre), Jerarquia.Descripcion(s.Descripcion));
        Jerarquia.ExigirExiste(r.Resultado, "El workspace no existe.");
        return r.Guid!.Value;
    }

    public async Task ActualizarAsync(Guid guid, ActualizarElementoRequest s)
    {
        var a = Jerarquia.Alcance(actual, Accion.EspaciosColeccionesGestionar);
        var nombre = Jerarquia.Texto(s.Nombre, "El nombre", 150);
        Jerarquia.ExigirExiste(await espacios.EditarAsync(a, guid, nombre, Slug.De(nombre), Jerarquia.Descripcion(s.Descripcion), s.Posicion),
            "El espacio no existe.");
    }

    public async Task EliminarAsync(Guid guid) =>
        Jerarquia.ExigirExiste(await espacios.EliminarAsync(Jerarquia.Alcance(actual, Accion.EspaciosColeccionesGestionar), guid),
            "El espacio no existe.");
}
