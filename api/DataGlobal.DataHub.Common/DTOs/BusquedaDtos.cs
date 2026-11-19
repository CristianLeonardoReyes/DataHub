namespace DataGlobal.DataHub.Common.DTOs;

/// <summary>Ruta: "Workspace / Espacio / Colección[ / Página padre]". Fragmento: texto plano alrededor del primer término.</summary>
public record ResultadoBusquedaDto(Guid Guid, string Titulo, string Ruta, string Fragmento, DateTime FechaActualizacion);
/// <summary>Resultados de 20 en 20 (PorPagina); Total son todas las coincidencias.</summary>
public record BusquedaDto(int Total, int Pagina, int PorPagina, IReadOnlyList<ResultadoBusquedaDto> Resultados);
