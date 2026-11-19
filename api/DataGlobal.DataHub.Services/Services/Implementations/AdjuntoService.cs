using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Common.Enums;
using DataGlobal.DataHub.Common.Models;
using DataGlobal.DataHub.Common.Settings;
using DataGlobal.DataHub.Repository.Interfaces;
using DataGlobal.DataHub.Services.Almacen;
using DataGlobal.DataHub.Services.Services.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Net.Http.Headers;

namespace DataGlobal.DataHub.Services.Services.Implementations;

public class AdjuntoService(IAdjuntoRepository adjuntos, IPaginaRepository paginas, IAlmacenArchivos almacen, UsuarioActual actual,
    IOptions<ArchivosOpciones> opciones, ILogger<AdjuntoService> log) : IAdjuntoService
{
    private static readonly TimeSpan Vigencia = TimeSpan.FromMinutes(10); // RF-ARC-03
    private const string Octeto = "application/octet-stream";
    // RF-ARC-04. SVG queda fuera a propósito: un SVG inline puede ejecutar scripts.
    // Video y audio solo en contenedores que el navegador reproduce de forma nativa.
    private static readonly HashSet<string> Previsualizables =
    [
        "image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf",
        "video/mp4", "video/webm", "video/ogg", "audio/mpeg", "audio/mp4", "audio/ogg", "audio/wav", "audio/webm"
    ];

    public async Task<IReadOnlyList<AdjuntoDto>> ListarAsync(Guid paginaGuid)
    {
        var f = await adjuntos.ConsultarPorPaginaAsync(Jerarquia.Alcance(actual), paginaGuid);
        Jerarquia.ExigirExiste(f.Resultado, "La página no existe.");
        return [.. f.Adjuntos.Select(a => new AdjuntoDto(a.Guid, a.NombreOriginal, a.TipoMime, a.TamanoBytes,
            DateTime.SpecifyKind(a.FechaCreacion, DateTimeKind.Utc), new(a.SubidoPorGuid, a.SubidoPorNombre), PuedeEliminar(a.SubidoPorGuid)))];
    }

    public async Task<AdjuntoDto> SubirAsync(Guid paginaGuid, string nombre, string? tipoMime, long tamano, Stream contenido)
    {
        var a = Jerarquia.Alcance(actual, Accion.ArchivosGestionar);
        var maxMb = opciones.Value.TamanoMaximoMb;
        if (tamano <= 0) throw new SolicitudInvalidaException("El archivo está vacío.");
        if (tamano > maxMb * 1024L * 1024L) throw new SolicitudInvalidaException($"El archivo supera el máximo de {maxMb} MB");

        var pagina = await paginas.ObtenerAsync(a, paginaGuid) ?? throw new NoEncontradoException("La página no existe.");
        nombre = NombreSeguro(nombre);
        var tipo = TipoNormalizado(tipoMime);
        var guid = Guid.NewGuid();
        // RF-ARC-02, con los Guid públicos: nunca los Id internos.
        var ruta = $"{actual.ClienteGuid}/{pagina.Pagina.WorkspaceGuid}/{paginaGuid}/{guid}";

        await almacen.SubirAsync(ruta, contenido, tipo);
        try
        {
            if (await adjuntos.InsertarAsync(a, paginaGuid, guid, nombre, ruta, tipo, tamano) == 0)
                throw new NoEncontradoException("La página no existe.");
        }
        catch
        {
            try { await almacen.BorrarAsync(ruta); }
            catch (Exception ex) { log.LogWarning(ex, "No se pudo limpiar el blob huérfano del adjunto {Adjunto}", guid); }
            throw;
        }
        return new(guid, nombre, tipo, tamano, DateTime.UtcNow, new(actual.Guid, actual.Nombre), PuedeEliminar(actual.Guid));
    }

    public async Task<UrlAdjuntoDto> UrlAsync(Guid guid, bool descargar)
    {
        var f = await adjuntos.ConsultarPorGuidAsync(Jerarquia.Alcance(actual), guid) ?? throw new NoEncontradoException("El archivo no existe.");
        var tipo = f.TipoMime.ToLowerInvariant();
        var inline = !descargar && Previsualizables.Contains(tipo);
        var expira = DateTimeOffset.UtcNow + Vigencia;
        var url = almacen.UrlLectura(f.RutaBlob, expira, inline ? tipo : Octeto,
            inline ? "inline" : $"attachment; filename*=UTF-8''{Uri.EscapeDataString(f.NombreOriginal)}");
        return new(url, expira.UtcDateTime);
    }

    public async Task EliminarAsync(Guid guid)
    {
        var a = Jerarquia.Alcance(actual, Accion.ArchivosEliminar);
        var r = await adjuntos.EliminarAsync(a, guid, SoloPropios());
        Jerarquia.ExigirExiste(r, "El archivo no existe.");
        if (r == 3) throw new AccesoDenegadoException("Solo puedes eliminar tus propios archivos.");
    }

    // El Colaborador solo elimina los archivos que subió (PRD 3.2).
    private bool PuedeEliminar(Guid subidoPor) => Autorizacion.Can(actual, Accion.ArchivosEliminar) && (!SoloPropios() || subidoPor == actual.Guid);

    private bool SoloPropios() => MatrizPermisos.ParsearPerfil(actual.Perfil) == PerfilUsuario.Colaborador;

    private static string NombreSeguro(string? nombre)
    {
        var n = nombre ?? "";
        n = n[(n.LastIndexOfAny(['/', '\\']) + 1)..];
        n = string.Concat(n.Where(c => !char.IsControl(c))).Trim();
        if (n.Length > 255) n = n[..255];
        return n.Length == 0 ? "archivo" : n;
    }

    private static string TipoNormalizado(string? tipo) =>
        MediaTypeHeaderValue.TryParse(tipo, out var m) && m.MediaType.Value is { Length: > 0 and <= 150 } t ? t.ToLowerInvariant() : Octeto;
}
