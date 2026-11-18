using System.Text.Json;
using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Common.Enums;
using DataGlobal.DataHub.Common.Models;
using DataGlobal.DataHub.Common.Util;
using DataGlobal.DataHub.Repository.Interfaces;
using DataGlobal.DataHub.Services.Services.Interfaces;

namespace DataGlobal.DataHub.Services.Services.Implementations;

public class WorkspaceService(IWorkspaceRepository workspaces, UsuarioActual actual) : IWorkspaceService
{
    public async Task<IReadOnlyList<WorkspaceArbolDto>> ArbolAsync()
    {
        var f = await workspaces.ArbolAsync(Jerarquia.Alcance(actual));
        var espacios = f.Espacios.ToLookup(e => e.WorkspaceGuid);
        var colecciones = f.Colecciones.ToLookup(c => c.EspacioGuid);
        var paginas = f.Paginas.ToLookup(p => (p.ColeccionGuid, p.PaginaPadreGuid));

        IReadOnlyList<PaginaArbolDto> Paginas(Guid coleccion, Guid? padre) =>
            [.. paginas[(coleccion, padre)].Select(p => new PaginaArbolDto(p.Guid, p.Titulo, Paginas(coleccion, p.Guid)))];

        return [.. f.Workspaces.Select(w => new WorkspaceArbolDto(w.Guid, w.Nombre, w.Descripcion,
            [.. espacios[w.Guid].Select(e => new EspacioArbolDto(e.Guid, e.Nombre, e.Descripcion,
                [.. colecciones[e.Guid].Select(c => new ColeccionArbolDto(c.Guid, c.Nombre, c.Descripcion, Paginas(c.Guid, null)))]))]))];
    }

    public async Task<Guid> CrearAsync(CrearWorkspaceRequest s)
    {
        var a = Jerarquia.Alcance(actual, Accion.WorkspacesGestionar);
        var nombre = Jerarquia.Texto(s.Nombre, "El nombre", 150);
        var r = await workspaces.InsertarAsync(a, nombre, Slug.De(nombre), Jerarquia.Descripcion(s.Descripcion));
        return r.Guid!.Value;
    }

    public async Task ActualizarAsync(Guid guid, ActualizarElementoRequest s)
    {
        var a = Jerarquia.Alcance(actual, Accion.WorkspacesGestionar);
        var nombre = Jerarquia.Texto(s.Nombre, "El nombre", 150);
        Jerarquia.ExigirExiste(await workspaces.EditarAsync(a, guid, nombre, Slug.De(nombre), Jerarquia.Descripcion(s.Descripcion), s.Posicion),
            "El workspace no existe.");
    }

    public async Task EliminarAsync(Guid guid) =>
        Jerarquia.ExigirExiste(await workspaces.EliminarAsync(Jerarquia.Alcance(actual, Accion.WorkspacesGestionar), guid),
            "El workspace no existe.");

    public async Task<IReadOnlyList<MiembroDto>> MiembrosAsync(Guid guid)
    {
        var a = Jerarquia.Alcance(actual, Accion.WorkspacesAsignarUsuarios);
        var f = await workspaces.MiembrosAsync(a.ClienteId, guid);
        if (!f.Existe) throw new NoEncontradoException("El workspace no existe.");
        return [.. f.Miembros.Select(m => new MiembroDto(m.Guid, m.Nombre, m.Correo, MatrizPermisos.ParsearPerfil(m.Perfil), m.Asignado))];
    }

    public async Task AsignarMiembrosAsync(Guid guid, AsignarMiembrosRequest s)
    {
        var a = Jerarquia.Alcance(actual, Accion.WorkspacesAsignarUsuarios);
        switch (await workspaces.AsignarMiembrosAsync(a.ClienteId, guid, JsonSerializer.Serialize(s.Usuarios.Distinct())))
        {
            case 0: throw new NoEncontradoException("El workspace no existe.");
            case 2: throw new SolicitudInvalidaException("Solo se pueden asignar coordinadores y colaboradores del cliente.");
        }
    }
}
