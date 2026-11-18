using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Common.Enums;
using DataGlobal.DataHub.Common.Models;
using DataGlobal.DataHub.Common.Util;
using DataGlobal.DataHub.Repository.Interfaces;
using DataGlobal.DataHub.Services.Services.Interfaces;

namespace DataGlobal.DataHub.Services.Services.Implementations;

public class ColeccionService(IColeccionRepository colecciones, UsuarioActual actual) : IColeccionService
{
    public async Task<Guid> CrearAsync(CrearColeccionRequest s)
    {
        var a = Jerarquia.Alcance(actual, Accion.EspaciosColeccionesGestionar);
        var nombre = Jerarquia.Texto(s.Nombre, "El nombre", 150);
        var r = await colecciones.InsertarAsync(a, s.EspacioGuid, nombre, Slug.De(nombre), Jerarquia.Descripcion(s.Descripcion));
        Jerarquia.ExigirExiste(r.Resultado, "El espacio no existe.");
        return r.Guid!.Value;
    }

    public async Task ActualizarAsync(Guid guid, ActualizarElementoRequest s)
    {
        var a = Jerarquia.Alcance(actual, Accion.EspaciosColeccionesGestionar);
        var nombre = Jerarquia.Texto(s.Nombre, "El nombre", 150);
        Jerarquia.ExigirExiste(await colecciones.EditarAsync(a, guid, nombre, Slug.De(nombre), Jerarquia.Descripcion(s.Descripcion), s.Posicion),
            "La colección no existe.");
    }

    public async Task EliminarAsync(Guid guid) =>
        Jerarquia.ExigirExiste(await colecciones.EliminarAsync(Jerarquia.Alcance(actual, Accion.EspaciosColeccionesGestionar), guid),
            "La colección no existe.");
}
