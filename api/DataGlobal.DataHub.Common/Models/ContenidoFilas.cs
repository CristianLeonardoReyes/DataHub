namespace DataGlobal.DataHub.Common.Models;

/// <summary>Fila de pco_consultar: Resultado 0 fuera de alcance, 1 ok.</summary>
public class ContenidoFila
{
    public int Resultado { get; set; }
    public string? ContenidoJson { get; set; }
    public int VersionContenido { get; set; }
}

/// <summary>Fila de pco_editar: Resultado 0 fuera de alcance, 1 ok, 2 conflicto de versión.</summary>
public class ResultadoContenido
{
    public int Resultado { get; set; }
    public int VersionContenido { get; set; }
}
