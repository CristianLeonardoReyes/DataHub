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

public class ClienteService(
    IClienteRepository clientes,
    UsuarioActual actual,
    IEnviadorCorreo correo,
    IOptions<AppOpciones> app,
    ILogger<ClienteService> log) : IClienteService
{
    private const int HorasInvitacion = 72;

    public Task<IReadOnlyList<ClienteDto>> ListarAsync()
    {
        Exigir();
        return clientes.ListarAsync();
    }

    public async Task<ClienteDto> ObtenerAsync(Guid guid)
    {
        Exigir();
        return await clientes.ObtenerPorGuidAsync(guid) ?? throw new NoEncontradoException("El cliente no existe.");
    }

    public async Task<ClienteDto> CrearAsync(CrearClienteRequest s)
    {
        Exigir();
        var nombre = Nombre(s.Nombre);
        var correoAdmin = s.CorreoAdmin.Trim();
        if (correoAdmin.Length > 254 || !new EmailAddressAttribute().IsValid(correoAdmin))
            throw new SolicitudInvalidaException("El correo del administrador no es válido.");

        var token = TokenUtil.Generar();
        var r = await clientes.CrearConAdminAsync(nombre, s.Slug, correoAdmin, TokenUtil.Hash(token), HorasInvitacion);
        switch (r.Resultado)
        {
            case 2: throw new ConflictoException("Ya existe un cliente con ese slug.", "slug");
            case 3: throw new ConflictoException("Ya existe un usuario con ese correo.", "correoAdmin");
        }

        var enlace = $"{app.Value.UrlBase.TrimEnd('/')}/aceptar-invitacion?token={token}";
        try
        {
            await correo.EnviarAsync(correoAdmin, PlantillasCorreo.AsuntoInvitacion, PlantillasCorreo.Invitacion(enlace));
        }
        catch (Exception ex)
        {
            // El cliente ya quedó creado; no se registra el enlace ni el token.
            log.LogError(ex, "No se pudo enviar la invitación del cliente {ClienteGuid}", r.ClienteGuid);
        }
        return (await clientes.ObtenerPorGuidAsync(r.ClienteGuid!.Value))!;
    }

    public async Task<ClienteDto> ActualizarAsync(Guid guid, ActualizarClienteRequest s)
    {
        Exigir();
        switch (await clientes.ActualizarAsync(guid, Nombre(s.Nombre), s.Slug, s.Activo))
        {
            case 0: throw new NoEncontradoException("El cliente no existe.");
            case 2: throw new ConflictoException("Ya existe un cliente con ese slug.", "slug");
        }
        return (await clientes.ObtenerPorGuidAsync(guid))!;
    }

    private void Exigir()
    {
        if (!Autorizacion.Can(actual, Accion.ClientesGestionar)) throw new AccesoDenegadoException();
    }

    private static string Nombre(string valor)
    {
        var nombre = valor.Trim();
        if (nombre.Length is 0 or > 150) throw new SolicitudInvalidaException("El nombre debe tener entre 1 y 150 caracteres.");
        return nombre;
    }
}
