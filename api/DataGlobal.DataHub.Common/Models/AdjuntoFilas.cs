namespace DataGlobal.DataHub.Common.Models;

public class AdjuntoFila
{
    public Guid Guid { get; set; }
    public string NombreOriginal { get; set; } = "";
    public string TipoMime { get; set; } = "";
    public long TamanoBytes { get; set; }
    public DateTime FechaCreacion { get; set; }
    public Guid SubidoPorGuid { get; set; }
    public string SubidoPorNombre { get; set; } = "";
}

/// <summary>Resultado 0 página fuera de alcance, 1 ok.</summary>
public record AdjuntosPaginaFilas(int Resultado, IReadOnlyList<AdjuntoFila> Adjuntos);

public class AdjuntoRutaFila
{
    public string RutaBlob { get; set; } = "";
    public string NombreOriginal { get; set; } = "";
    public string TipoMime { get; set; } = "";
    public Guid SubidoPorGuid { get; set; }
}
