namespace DataGlobal.DataHub.Common.DTOs;

public record PersonaDto(Guid Guid, string Nombre);

/// <summary>Archivo adjunto de una página. PuedeEliminar ya considera el perfil (el Colaborador solo elimina los propios).</summary>
public record AdjuntoDto(Guid Guid, string Nombre, string TipoMime, long TamanoBytes, DateTime FechaCreacion, PersonaDto SubidoPor, bool PuedeEliminar);

/// <summary>Enlace de lectura temporal (SAS de 10 minutos). Expira en UTC.</summary>
public record UrlAdjuntoDto(string Url, DateTime Expira);
