using System.Security.Claims;
using System.Text;
using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Common.Models;
using DataGlobal.DataHub.Common.Settings;
using DataGlobal.DataHub.Repository.Interfaces;
using DataGlobal.DataHub.Services.Correo;
using DataGlobal.DataHub.Services.Seguridad;
using DataGlobal.DataHub.Services.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace DataGlobal.DataHub.Services.Services.Implementations;

public class AuthService(
    IUsuarioRepository usuarios,
    IUsuarioTokenRepository tokens,
    IClienteRepository clientes,
    UsuarioActual actual,
    IEnviadorCorreo correo,
    IOptions<JwtOpciones> jwt,
    IOptions<AppOpciones> app,
    ILogger<AuthService> log) : IAuthService
{
    private const string TipoReset = "reset";
    private static readonly PasswordHasher<object> Hasher = new();
    // Hash de relleno: verificar contra algo aunque el correo no exista iguala el tiempo de respuesta.
    private static readonly string HashRelleno = Hasher.HashPassword(new object(), "relleno-no-usar");

    public async Task<Sesion?> LoginAsync(LoginRequest solicitud)
    {
        var u = await usuarios.ObtenerPorCorreoAsync(solicitud.Correo.Trim());
        if (u is null || u.Estado != "activo" || !u.ClienteActivo || u.ContrasenaHash is null)
        {
            Hasher.VerifyHashedPassword(new object(), HashRelleno, solicitud.Contrasena);
            return null;
        }
        if (u.Bloqueado) // RF-ACC-05: no se verifica la contraseña real; el relleno iguala el tiempo
        {
            Hasher.VerifyHashedPassword(new object(), HashRelleno, solicitud.Contrasena);
            return null;
        }

        if (Hasher.VerifyHashedPassword(new object(), u.ContrasenaHash, solicitud.Contrasena) == PasswordVerificationResult.Failed)
        {
            await usuarios.RegistrarIntentoFallidoAsync(u.Id);
            return null;
        }

        await usuarios.RegistrarLoginExitosoAsync(u.Id);
        return CrearSesion(u, solicitud.Recordarme);
    }

    public async Task<UsuarioAuth?> ObtenerActivoAsync(Guid guid)
    {
        var u = await usuarios.ObtenerPorGuidAsync(guid);
        return u is { Estado: "activo", ClienteActivo: true } ? u : null;
    }

    public async Task<ClienteOperando?> ObtenerClienteActivoAsync(Guid guid) =>
        await clientes.ObtenerOperandoAsync(guid) is { Activo: true } c ? c : null;

    public async Task<Sesion> CambiarClienteOperandoAsync(Guid? clienteGuid, DateTime expira, ClaimsPrincipal principal)
    {
        if (actual.Perfil != "super_admin") throw new AccesoDenegadoException();
        if (clienteGuid is { } g)
        {
            var c = await clientes.ObtenerOperandoAsync(g) ?? throw new NoEncontradoException("El cliente no existe.");
            if (!c.Activo) throw new SolicitudInvalidaException("No puedes operar dentro de un cliente inactivo.");
        }
        return CrearToken(actual.Guid, actual.Perfil, clienteGuid, expira, MaxDe(principal), RecDe(principal));
    }

    public async Task AceptarInvitacionAsync(AceptarInvitacionRequest s)
    {
        var nombre = s.Nombre.Trim();
        if (nombre.Length == 0) throw new SolicitudInvalidaException("El nombre es obligatorio.");
        if (ValidadorContrasena.Validar(s.Contrasena) is { } error) throw new SolicitudInvalidaException(error);

        var ok = await usuarios.AceptarInvitacionAsync(
            TokenUtil.Hash(s.Token), nombre, Hasher.HashPassword(new object(), s.Contrasena));
        if (!ok) throw TokenInvalido();
    }

    public async Task OlvideContrasenaAsync(string correoUsuario)
    {
        // RF-ACC-04: tiempo mínimo fijo para que la respuesta no revele si el correo existe.
        // ponytail: si SES tarda más de 1 s se vuelve a notar; pasar el envío a una cola si ocurre.
        var minimo = Task.Delay(TimeSpan.FromSeconds(1));
        await GenerarRestablecimientoAsync(correoUsuario);
        await minimo;
    }

    private async Task GenerarRestablecimientoAsync(string correoUsuario)
    {
        var u = await usuarios.ObtenerPorCorreoAsync(correoUsuario.Trim());
        if (u is not { Estado: "activo", ClienteActivo: true }) return;

        await tokens.InvalidarPendientesAsync(u.Id, TipoReset);
        var token = TokenUtil.Generar();
        await tokens.CrearAsync(u.Id, TipoReset, TokenUtil.Hash(token), 1);

        var enlace = $"{app.Value.UrlBase.TrimEnd('/')}/restablecer-contrasena?token={token}";
        try
        {
            await correo.EnviarAsync(u.Correo, PlantillasCorreo.AsuntoRestablecer, PlantillasCorreo.Restablecer(enlace));
        }
        catch (Exception ex)
        {
            // La respuesta es la misma exista o no el usuario: no se propaga el fallo.
            log.LogError(ex, "No se pudo enviar el correo de restablecimiento (usuario {UsuarioGuid})", u.Guid);
        }
    }

    public async Task RestablecerContrasenaAsync(RestablecerContrasenaRequest s)
    {
        if (ValidadorContrasena.Validar(s.Contrasena) is { } error) throw new SolicitudInvalidaException(error);

        var ok = await usuarios.RestablecerContrasenaAsync(
            TokenUtil.Hash(s.Token), Hasher.HashPassword(new object(), s.Contrasena));
        if (!ok) throw TokenInvalido();
    }

    private static SolicitudInvalidaException TokenInvalido() => new("El enlace no es válido o ya venció.");

    private Sesion CrearSesion(UsuarioAuth u, bool recordarme)
    {
        var ahora = DateTime.UtcNow;
        var max = recordarme ? ahora.AddDays(jwt.Value.DiasRecordarme) : ahora.AddHours(jwt.Value.HorasMaximas);
        return CrearToken(u.Guid, u.Perfil, u.ClienteGuid, Menor(ahora + Ventana(recordarme), max), max, recordarme);
    }

    public Sesion? RenovarSiCorresponde(ClaimsPrincipal principal)
    {
        // Un token sin max (anterior a la sesión deslizante) vence en su exp, sin renovarse.
        if (MaxDe(principal) is not { } max || !long.TryParse(principal.FindFirstValue("exp"), out var e)) return null;
        var rec = RecDe(principal);
        var exp = DateTimeOffset.FromUnixTimeSeconds(e).UtcDateTime;
        var ventana = Ventana(rec);
        if (exp >= max || exp - DateTime.UtcNow >= ventana / 2) return null;
        if (!Guid.TryParse(principal.FindFirstValue("usuarioId"), out var usuario)) return null;
        Guid? cliente = Guid.TryParse(principal.FindFirstValue("clienteId"), out var c) ? c : null;
        return CrearToken(usuario, principal.FindFirstValue("perfil") ?? "", cliente, Menor(DateTime.UtcNow + ventana, max), max, rec);
    }

    private TimeSpan Ventana(bool rec) => rec ? TimeSpan.FromDays(jwt.Value.DiasRecordarme) : TimeSpan.FromMinutes(jwt.Value.MinutosInactividad);
    private static DateTime Menor(DateTime a, DateTime b) => a < b ? a : b;
    private static bool RecDe(ClaimsPrincipal p) => p.FindFirstValue("rec") == "1";
    private static DateTime? MaxDe(ClaimsPrincipal p) =>
        long.TryParse(p.FindFirstValue("max"), out var m) ? DateTimeOffset.FromUnixTimeSeconds(m).UtcDateTime : null;

    private Sesion CrearToken(Guid usuarioGuid, string perfil, Guid? clienteGuid, DateTime expira, DateTime? max, bool rec)
    {
        var o = jwt.Value;
        var claims = new Dictionary<string, object>
        {
            ["usuarioId"] = usuarioGuid.ToString(),
            ["perfil"] = perfil,
            ["rec"] = rec ? "1" : "0"
        };
        if (clienteGuid is { } c) claims["clienteId"] = c.ToString();
        if (max is { } m) claims["max"] = new DateTimeOffset(DateTime.SpecifyKind(m, DateTimeKind.Utc)).ToUnixTimeSeconds();

        var token = new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = o.Emisor,
            Audience = o.Audiencia,
            Expires = expira,
            Claims = claims,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(o.Clave)), SecurityAlgorithms.HmacSha256)
        });
        return new Sesion(token, expira, rec);
    }
}
