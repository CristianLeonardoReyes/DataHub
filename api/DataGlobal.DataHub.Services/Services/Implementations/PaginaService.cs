using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Common.Enums;
using DataGlobal.DataHub.Common.Models;
using DataGlobal.DataHub.Common.Util;
using DataGlobal.DataHub.Repository.Interfaces;
using DataGlobal.DataHub.Services.Services.Interfaces;

namespace DataGlobal.DataHub.Services.Services.Implementations;

public class PaginaService(IPaginaRepository paginas, UsuarioActual actual) : IPaginaService
{
    public Task<IReadOnlyList<PaginaRecienteDto>> RecientesAsync() => paginas.RecientesAsync(Jerarquia.Alcance(actual));

    public async Task<PaginaDetalleDto> ObtenerAsync(Guid guid)
    {
        var f = await paginas.ObtenerAsync(Jerarquia.Alcance(actual), guid) ?? throw new NoEncontradoException("La página no existe.");
        var p = f.Pagina;
        List<RutaItemDto> ruta =
        [
            new("workspace", p.WorkspaceGuid, p.WorkspaceNombre),
            new("espacio", p.EspacioGuid, p.EspacioNombre),
            new("coleccion", p.ColeccionGuid, p.ColeccionNombre),
            .. f.Padres.Select(x => new RutaItemDto("pagina", x.Guid, x.Titulo))
        ];
        // El Colaborador solo elimina páginas propias y sin subpáginas (PRD 3.2).
        var puedeEliminar = Autorizacion.Can(actual, Accion.PaginasEliminar)
            && (SoloPropias() is false || (p.CreadoPorGuid == actual.Guid && f.Hijas.Count == 0));
        return new(p.Guid, p.Titulo, p.ColeccionGuid, p.PaginaPadreGuid, DateTime.SpecifyKind(p.FechaActualizacion, DateTimeKind.Utc),
            puedeEliminar, ruta, [.. f.Hijas.Select(h => new SubpaginaDto(h.Guid, h.Titulo))]);
    }

    public async Task<Guid> CrearAsync(CrearPaginaRequest s)
    {
        var a = Jerarquia.Alcance(actual, Accion.PaginasEditar);
        var titulo = Jerarquia.Texto(s.Titulo, "El título", 200);
        var r = await paginas.InsertarAsync(a, s.ColeccionGuid, s.PaginaPadreGuid, titulo, Slug.De(titulo));
        Jerarquia.ExigirExiste(r.Resultado, "La colección no existe.");
        if (r.Resultado == 2) throw new SolicitudInvalidaException("La página padre debe existir en la misma colección.");
        return r.Guid!.Value;
    }

    public async Task ActualizarAsync(Guid guid, ActualizarPaginaRequest s)
    {
        var a = Jerarquia.Alcance(actual, Accion.PaginasEditar);
        var titulo = Jerarquia.Texto(s.Titulo, "El título", 200);
        var r = await paginas.EditarAsync(a, guid, titulo, Slug.De(titulo), s.PaginaPadreGuid, s.Posicion);
        Jerarquia.ExigirExiste(r, "La página no existe.");
        if (r == 2) throw new SolicitudInvalidaException("La página padre debe estar en la misma colección y no puede ser la propia página ni una subpágina suya.");
    }

    public async Task EliminarAsync(Guid guid)
    {
        var a = Jerarquia.Alcance(actual, Accion.PaginasEliminar);
        var r = await paginas.EliminarAsync(a, guid, SoloPropias());
        Jerarquia.ExigirExiste(r, "La página no existe.");
        if (r == 3) throw new AccesoDenegadoException("Solo puedes eliminar tus propias páginas sin subpáginas.");
    }

    private bool SoloPropias() => MatrizPermisos.ParsearPerfil(actual.Perfil) == PerfilUsuario.Colaborador;
}
