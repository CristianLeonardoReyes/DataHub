using System.ComponentModel.DataAnnotations;
using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Common.Enums;
using DataGlobal.DataHub.Common.Models;
using DataGlobal.DataHub.Common.Settings;
using DataGlobal.DataHub.Repository.Interfaces;
using DataGlobal.DataHub.Services.Correo;
using DataGlobal.DataHub.Services.Seguridad;
using DataGlobal.DataHub.Services.Services.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DataGlobal.DataHub.Services.Services.Implementations;

public class UsuarioService(
    IUsuarioRepository usuarios,
    UsuarioActual actual,
    IEnviadorCorreo correo,
    IOptions<AppOpciones> app,
    ILogger<UsuarioService> log) : IUsuarioService
{
    private const int HorasInvitacion = 72;

    public async Task<IReadOnlyList<UsuarioDto>> ListarAsync() =>
        [.. (await usuarios.ListarAsync(ClienteId())).Select(Mapear)];

    public async Task<UsuarioDto> InvitarAsync(InvitarUsuarioRequest s)
    {
        var clienteId = ClienteId();
        var correoUsuario = (s.Correo ?? "").Trim();
        if (correoUsuario.Length > 254 || !new EmailAddressAttribute().IsValid(correoUsuario))
            throw new SolicitudInvalidaException("El correo no es válido.");
        var perfil = Perfil(s.Perfil);

        var token = TokenUtil.Generar();
        var r = await usuarios.InsertarInvitadoAsync(clienteId, correoUsuario, perfil, TokenUtil.Hash(token), HorasInvitacion);
        if (r.Resultado == 3) throw new ConflictoException("Ya existe un usuario con ese correo.", "correo");

        await EnviarInvitacionAsync(correoUsuario, token, r.Guid);
        return Mapear(r);
    }

    public async Task ReenviarInvitacionAsync(Guid guid)
    {
        var clienteId = ClienteId();
        var token = TokenUtil.Generar();
        var r = await usuarios.ReenviarInvitacionAsync(clienteId, guid, TokenUtil.Hash(token), HorasInvitacion);
        switch (r.Resultado)
        {
            case 0: throw new NoEncontradoException("El usuario no existe.");
            case 2: throw new ConflictoException("Solo se puede reenviar la invitación a un usuario invitado.");
        }
        await EnviarInvitacionAsync(r.Correo, token, guid);
    }

    public async Task<UsuarioDto> ActualizarAsync(Guid guid, ActualizarUsuarioRequest s)
    {
        var clienteId = ClienteId();
        var r = await usuarios.EditarPerfilEstadoAsync(clienteId, actual.Id, guid, Perfil(s.Perfil), s.Activo);
        switch (r.Resultado)
        {
            case 0: throw new NoEncontradoException("El usuario no existe.");
            case 2: throw new ConflictoException("Un usuario invitado no se puede desactivar.", "activo");
            case 3: throw new ConflictoException("No puedes desactivarte ni cambiar tu propio perfil.");
            case 4: throw new ConflictoException("El cliente debe conservar al menos un Admin activo.");
        }
        return Mapear(r);
    }

    /// <summary>Cliente sobre el que se opera: el del JWT. Super admin sin cliente seleccionado no puede gestionar usuarios.</summary>
    private long ClienteId()
    {
        if (!Autorizacion.Can(actual, Accion.UsuariosGestionar)) throw new AccesoDenegadoException();
        return actual.ClienteId ?? throw new SolicitudInvalidaException("Selecciona un cliente para gestionar sus usuarios.");
    }

    private static string Perfil(PerfilUsuario p) => p switch
    {
        PerfilUsuario.Admin => "admin",
        PerfilUsuario.Coordinador => "coordinador",
        PerfilUsuario.Colaborador => "colaborador",
        _ => throw new SolicitudInvalidaException("El perfil debe ser admin, coordinador o colaborador.")
    };

    private static UsuarioDto Mapear(UsuarioFila f) => new(f.Guid, f.Nombre, f.Correo,
        MatrizPermisos.ParsearPerfil(f.Perfil), Enum.Parse<EstadoUsuario>(f.Estado, true), f.FechaCreacion);

    private async Task EnviarInvitacionAsync(string destino, string token, Guid usuarioGuid)
    {
        var enlace = $"{app.Value.UrlBase.TrimEnd('/')}/aceptar-invitacion?token={token}";
        try
        {
            await correo.EnviarAsync(destino, PlantillasCorreo.AsuntoInvitacion, PlantillasCorreo.Invitacion(enlace));
        }
        catch (Exception ex)
        {
            // El usuario ya quedó creado (se puede reenviar); no se registra el enlace ni el token.
            log.LogError(ex, "No se pudo enviar la invitación del usuario {UsuarioGuid}", usuarioGuid);
        }
    }
}
