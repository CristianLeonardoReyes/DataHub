using System.Text.Json.Serialization;

namespace DataGlobal.DataHub.Common.Enums;

/// <summary>Estados de Usuario (PRD 4.1): invitado → activo ⇄ inactivo. Mismo valor que Usuario.Estado.</summary>
[JsonConverter(typeof(JsonStringEnumConverter<EstadoUsuario>))]
public enum EstadoUsuario
{
    [JsonStringEnumMemberName("invitado")] Invitado,
    [JsonStringEnumMemberName("activo")] Activo,
    [JsonStringEnumMemberName("inactivo")] Inactivo
}
