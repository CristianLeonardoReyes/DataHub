using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Dapper;
using DataGlobal.DataHub.Services.Seguridad;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using MySqlConnector;

namespace DataGlobal.DataHub.Tests.Integration;

/// <summary>Módulo 3c: el Super admin opera dentro de un cliente (RF-CLI-03) y aislamiento entre clientes (PRD 9.1).</summary>
public class ClienteOperandoTests : IClassFixture<MySqlFixture>, IAsyncDisposable
{
    private const string Clave = "ClaveSegura123";
    private readonly MySqlFixture _db;
    private readonly ApiFactory _factory;
    private readonly HttpClient _http;

    public ClienteOperandoTests(MySqlFixture db)
    {
        _db = db;
        _factory = new ApiFactory(db.ConnectionString);
        _http = _factory.CreateClient(new() { BaseAddress = new Uri("https://localhost"), HandleCookies = false });
    }

    public ValueTask DisposeAsync()
    {
        _http.Dispose();
        _factory.Dispose();
        return ValueTask.CompletedTask;
    }

    private record Cli(Guid Guid, string Slug, string AdminCorreo, string AdminCookie);

    private static CancellationToken Ct => TestContext.Current.CancellationToken;
    private static string Correo() => $"{Guid.NewGuid():N}@test.co";

    private static string CookieDe(HttpResponseMessage r) =>
        r.Headers.GetValues("Set-Cookie").First(c => c.StartsWith("datahub_sesion=")).Split(';')[0];

    private async Task<string> LoginAsync(string correo)
    {
        var r = await _http.PostAsJsonAsync("/api/v1/auth/login", new { correo, contrasena = Clave }, Ct);
        Assert.Equal(HttpStatusCode.NoContent, r.StatusCode);
        return CookieDe(r);
    }

    private Task<HttpResponseMessage> EnviarAsync(HttpMethod m, string url, string? cookie, object? cuerpo = null)
    {
        var req = new HttpRequestMessage(m, url);
        if (cookie is not null) req.Headers.Add("Cookie", cookie);
        if (cuerpo is not null) req.Content = JsonContent.Create(cuerpo);
        return _http.SendAsync(req, Ct);
    }

    private async Task<string> AceptarInvitacionYLoginAsync(string correo)
    {
        string? token = null;
        foreach (var f in Directory.GetFiles(_factory.CarpetaCorreos, "*.html").OrderBy(Path.GetFileName, StringComparer.Ordinal))
        {
            var html = await File.ReadAllTextAsync(f, Ct);
            if (html.Contains($"<!-- Para: {correo} -->"))
                token = Regex.Match(html, "aceptar-invitacion\\?token=([0-9a-f]{64})").Groups[1].Value;
        }
        var r = await _http.PostAsJsonAsync("/api/v1/auth/aceptar-invitacion", new { token, nombre = "Persona", contrasena = Clave }, Ct);
        Assert.Equal(HttpStatusCode.NoContent, r.StatusCode);
        return await LoginAsync(correo);
    }

    private async Task<string> SuperAdminCookieAsync()
    {
        var correo = Correo();
        var token = TokenUtil.Generar();
        await using var cn = new MySqlConnection(_db.ConnectionString);
        var id = await cn.ExecuteScalarAsync<long>(
            "INSERT INTO Usuario (Correo, Nombre, Perfil) VALUES (@correo, 'Pendiente', 'super_admin'); SELECT LAST_INSERT_ID();", new { correo });
        await cn.ExecuteAsync(
            "INSERT INTO UsuarioToken (UsuarioId, Tipo, TokenHash, FechaExpiracion) VALUES (@id, 'invitacion', @hash, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 72 HOUR))",
            new { id, hash = TokenUtil.Hash(token) });
        var r = await _http.PostAsJsonAsync("/api/v1/auth/aceptar-invitacion", new { token, nombre = "Super", contrasena = Clave }, Ct);
        Assert.Equal(HttpStatusCode.NoContent, r.StatusCode);
        return await LoginAsync(correo);
    }

    private async Task<Cli> ClienteAsync(string sa)
    {
        var correo = Correo();
        var slug = "c-" + Guid.NewGuid().ToString("N")[..12];
        var r = await EnviarAsync(HttpMethod.Post, "/api/v1/clientes", sa, new { nombre = "Acme " + slug, slug, correoAdmin = correo });
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        var guid = (await r.Content.ReadFromJsonAsync<JsonElement>(Ct)).GetProperty("guid").GetGuid();
        return new Cli(guid, slug, correo, await AceptarInvitacionYLoginAsync(correo));
    }

    private Task<HttpResponseMessage> OperarAsync(string? cookie, Guid? cliente) =>
        EnviarAsync(HttpMethod.Post, "/api/v1/auth/cliente-operando", cookie, new { clienteGuid = cliente });

    /// <summary>Elige cliente y devuelve la cookie re-emitida.</summary>
    private async Task<string> ElegirAsync(string cookie, Guid? cliente)
    {
        var r = await OperarAsync(cookie, cliente);
        Assert.Equal(HttpStatusCode.NoContent, r.StatusCode);
        return CookieDe(r);
    }

    private async Task<List<string>> CorreosAsync(string cookie)
    {
        var r = await EnviarAsync(HttpMethod.Get, "/api/v1/usuarios", cookie);
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        return [.. (await r.Content.ReadFromJsonAsync<JsonElement>(Ct)).EnumerateArray().Select(u => u.GetProperty("correo").GetString()!)];
    }

    private async Task<JsonElement> MeAsync(string cookie)
    {
        var r = await EnviarAsync(HttpMethod.Get, "/api/v1/auth/me", cookie);
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        return await r.Content.ReadFromJsonAsync<JsonElement>(Ct);
    }

    private async Task<Guid> UsuarioGuidAsync(string cookie, string correo) =>
        (await (await EnviarAsync(HttpMethod.Get, "/api/v1/usuarios", cookie)).Content.ReadFromJsonAsync<JsonElement>(Ct))
        .EnumerateArray().Single(u => u.GetProperty("correo").GetString() == correo).GetProperty("guid").GetGuid();

    private static long Exp(string cookie)
    {
        var s = cookie.Split('=')[1].Split('.')[1].Replace('-', '+').Replace('_', '/');
        s = s.PadRight(s.Length + (4 - s.Length % 4) % 4, '=');
        return JsonDocument.Parse(Convert.FromBase64String(s)).RootElement.GetProperty("exp").GetInt64();
    }

    [Fact]
    public async Task Super_admin_elige_cliente_y_ve_solo_sus_usuarios_y_la_expiracion_no_cambia()
    {
        var sa = await SuperAdminCookieAsync();
        var a = await ClienteAsync(sa);
        var b = await ClienteAsync(sa);

        Assert.Equal(HttpStatusCode.BadRequest, (await EnviarAsync(HttpMethod.Get, "/api/v1/usuarios", sa)).StatusCode);

        var r = await OperarAsync(sa, a.Guid);
        Assert.Equal(HttpStatusCode.NoContent, r.StatusCode);
        var set = r.Headers.GetValues("Set-Cookie").First(c => c.StartsWith("datahub_sesion="));
        Assert.Contains("httponly", set, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("secure", set, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("samesite=strict", set, StringComparison.OrdinalIgnoreCase);
        var enA = CookieDe(r);
        Assert.Equal(Exp(sa), Exp(enA));
        Assert.Equal(a.Guid, (await MeAsync(enA)).GetProperty("cliente").GetProperty("guid").GetGuid());
        Assert.Equal([a.AdminCorreo], await CorreosAsync(enA));

        var enB = await ElegirAsync(enA, b.Guid);
        Assert.Equal(Exp(sa), Exp(enB));
        Assert.Equal([b.AdminCorreo], await CorreosAsync(enB));

        var global = await ElegirAsync(enB, null);
        Assert.Equal(HttpStatusCode.BadRequest, (await EnviarAsync(HttpMethod.Get, "/api/v1/usuarios", global)).StatusCode);
        Assert.Equal(JsonValueKind.Null, (await MeAsync(global)).GetProperty("cliente").ValueKind);
    }

    [Fact]
    public async Task Operando_en_A_no_toca_usuarios_de_B_e_invita_en_A()
    {
        var sa = await SuperAdminCookieAsync();
        var a = await ClienteAsync(sa);
        var b = await ClienteAsync(sa);
        var enB = await ElegirAsync(sa, b.Guid);
        var guidDeB = await UsuarioGuidAsync(enB, b.AdminCorreo);
        var enA = await ElegirAsync(sa, a.Guid);

        Assert.Equal(HttpStatusCode.NotFound,
            (await EnviarAsync(HttpMethod.Put, "/api/v1/usuarios/" + guidDeB, enA, new { perfil = "colaborador", activo = true })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound,
            (await EnviarAsync(HttpMethod.Post, $"/api/v1/usuarios/{guidDeB}/reenviar-invitacion", enA)).StatusCode);

        var nuevo = Correo();
        var inv = await EnviarAsync(HttpMethod.Post, "/api/v1/usuarios", enA, new { correo = nuevo, perfil = "colaborador" });
        Assert.Equal(HttpStatusCode.Created, inv.StatusCode);
        Assert.Contains(nuevo, await CorreosAsync(enA));
        Assert.DoesNotContain(nuevo, await CorreosAsync(enB));
    }

    [Fact]
    public async Task Solo_super_admin_cambia_de_cliente_y_el_cliente_debe_existir_y_estar_activo()
    {
        var sa = await SuperAdminCookieAsync();
        var a = await ClienteAsync(sa);

        Assert.Equal(HttpStatusCode.Forbidden, (await OperarAsync(a.AdminCookie, a.Guid)).StatusCode);
        var colab = Correo();
        Assert.Equal(HttpStatusCode.Created,
            (await EnviarAsync(HttpMethod.Post, "/api/v1/usuarios", a.AdminCookie, new { correo = colab, perfil = "colaborador" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await OperarAsync(await AceptarInvitacionYLoginAsync(colab), a.Guid)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await OperarAsync(null, a.Guid)).StatusCode);

        Assert.Equal(HttpStatusCode.NotFound, (await OperarAsync(sa, Guid.NewGuid())).StatusCode);

        await EnviarAsync(HttpMethod.Put, "/api/v1/clientes/" + a.Guid, sa, new { nombre = "Acme", slug = a.Slug, activo = false });
        var r = await OperarAsync(sa, a.Guid);
        Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
        Assert.Contains("No puedes operar dentro de un cliente inactivo.", await r.Content.ReadAsStringAsync(Ct));
    }

    [Fact]
    public async Task Cliente_desactivado_mientras_se_opera_deja_al_super_admin_sin_cliente_pero_con_sesion()
    {
        var sa = await SuperAdminCookieAsync();
        var a = await ClienteAsync(sa);
        var enA = await ElegirAsync(sa, a.Guid);
        Assert.Equal(HttpStatusCode.OK, (await EnviarAsync(HttpMethod.Get, "/api/v1/usuarios", enA)).StatusCode);

        Assert.Equal(HttpStatusCode.OK,
            (await EnviarAsync(HttpMethod.Put, "/api/v1/clientes/" + a.Guid, enA, new { nombre = "Acme", slug = a.Slug, activo = false })).StatusCode);

        Assert.Equal(HttpStatusCode.BadRequest, (await EnviarAsync(HttpMethod.Get, "/api/v1/usuarios", enA)).StatusCode);
        Assert.Equal(JsonValueKind.Null, (await MeAsync(enA)).GetProperty("cliente").ValueKind);
    }

    [Fact]
    public async Task Super_admin_no_puede_dejar_al_cliente_sin_admin_activo()
    {
        var sa = await SuperAdminCookieAsync();
        var a = await ClienteAsync(sa);
        var enA = await ElegirAsync(sa, a.Guid);
        var admin = await UsuarioGuidAsync(enA, a.AdminCorreo);

        foreach (var cuerpo in new object[] { new { perfil = "admin", activo = false }, new { perfil = "colaborador", activo = true } })
        {
            var r = await EnviarAsync(HttpMethod.Put, "/api/v1/usuarios/" + admin, enA, cuerpo);
            Assert.Equal(HttpStatusCode.Conflict, r.StatusCode);
            Assert.Contains("El cliente debe conservar al menos un Admin activo.", await r.Content.ReadAsStringAsync(Ct));
        }
    }

    [Fact]
    public async Task Admin_con_jwt_manipulado_sigue_en_su_cliente()
    {
        var sa = await SuperAdminCookieAsync();
        var a = await ClienteAsync(sa);
        var b = await ClienteAsync(sa);
        var adminGuid = (await MeAsync(a.AdminCookie)).GetProperty("guid").GetGuid();

        // Token firmado con la clave de pruebas: perfil y clienteId falsos; el servidor debe ignorarlos y leer la BD.
        var token = new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = "datahub-test",
            Audience = "datahub-test",
            Expires = DateTime.UtcNow.AddMinutes(10),
            Claims = new Dictionary<string, object>
            {
                ["usuarioId"] = adminGuid.ToString(),
                ["perfil"] = "super_admin",
                ["clienteId"] = b.Guid.ToString()
            },
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(new string('k', 48))), SecurityAlgorithms.HmacSha256)
        });
        var cookie = "datahub_sesion=" + token;

        Assert.Equal([a.AdminCorreo], await CorreosAsync(cookie));
        var me = await MeAsync(cookie);
        Assert.Equal(a.Guid, me.GetProperty("cliente").GetProperty("guid").GetGuid());
        Assert.Equal("admin", me.GetProperty("perfil").GetString());
        Assert.Equal(HttpStatusCode.Forbidden, (await OperarAsync(cookie, b.Guid)).StatusCode);
    }
}
