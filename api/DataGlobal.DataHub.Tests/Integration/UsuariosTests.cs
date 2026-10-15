using System.Data;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Dapper;
using DataGlobal.DataHub.Services.Seguridad;
using MySqlConnector;

namespace DataGlobal.DataHub.Tests.Integration;

public class UsuariosTests : IClassFixture<MySqlFixture>, IAsyncDisposable
{
    private const string Clave = "ClaveSegura123";
    private readonly MySqlFixture _db;
    private readonly ApiFactory _factory;
    private readonly HttpClient _http;

    public UsuariosTests(MySqlFixture db)
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

    private static CancellationToken Ct => TestContext.Current.CancellationToken;
    private static string Correo() => $"{Guid.NewGuid():N}@test.co";

    private async Task<string> LoginCookieAsync(string correo)
    {
        var r = await _http.PostAsJsonAsync("/api/v1/auth/login", new { correo, contrasena = Clave }, Ct);
        Assert.Equal(HttpStatusCode.NoContent, r.StatusCode);
        return r.Headers.GetValues("Set-Cookie").First(c => c.StartsWith("datahub_sesion=")).Split(';')[0];
    }

    private Task<HttpResponseMessage> EnviarAsync(HttpMethod m, string url, string? cookie, object? cuerpo = null)
    {
        var req = new HttpRequestMessage(m, url);
        if (cookie is not null) req.Headers.Add("Cookie", cookie);
        if (cuerpo is not null) req.Content = JsonContent.Create(cuerpo);
        return _http.SendAsync(req, Ct);
    }

    private Task<HttpResponseMessage> MeAsync(string cookie) => EnviarAsync(HttpMethod.Get, "/api/v1/auth/me", cookie);

    /// <summary>Tokens de los correos de invitación enviados a <paramref name="correo"/>, del más antiguo al más reciente.</summary>
    private async Task<List<string>> TokensAsync(string correo)
    {
        var tokens = new List<string>();
        foreach (var f in Directory.GetFiles(_factory.CarpetaCorreos, "*.html").OrderBy(Path.GetFileName, StringComparer.Ordinal))
        {
            var html = await File.ReadAllTextAsync(f, Ct);
            if (!html.Contains($"<!-- Para: {correo} -->")) continue;
            tokens.Add(Regex.Match(html, "aceptar-invitacion\\?token=([0-9a-f]{64})").Groups[1].Value);
        }
        return tokens;
    }

    private Task<HttpResponseMessage> AceptarAsync(string token) =>
        _http.PostAsJsonAsync("/api/v1/auth/aceptar-invitacion", new { token, nombre = "Persona", contrasena = Clave }, Ct);

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
        Assert.Equal(HttpStatusCode.NoContent, (await AceptarAsync(token)).StatusCode);
        return await LoginCookieAsync(correo);
    }

    /// <summary>Crea un cliente con su Admin ya activo; devuelve correo y cookie del Admin.</summary>
    private async Task<(string Correo, string Cookie)> AdminAsync()
    {
        var sa = await SuperAdminCookieAsync();
        var correo = Correo();
        var r = await EnviarAsync(HttpMethod.Post, "/api/v1/clientes", sa,
            new { nombre = "Acme", slug = "c-" + Guid.NewGuid().ToString("N")[..12], correoAdmin = correo });
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await AceptarAsync((await TokensAsync(correo))[0])).StatusCode);
        return (correo, await LoginCookieAsync(correo));
    }

    private async Task<JsonElement> InvitarAsync(string cookie, string correo, string perfil)
    {
        var r = await EnviarAsync(HttpMethod.Post, "/api/v1/usuarios", cookie, new { correo, perfil });
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        var json = await r.Content.ReadFromJsonAsync<JsonElement>(Ct);
        Assert.EndsWith("/api/v1/usuarios/" + json.GetProperty("guid").GetGuid(), r.Headers.Location!.ToString());
        return json;
    }

    /// <summary>Invita, acepta y entra: devuelve guid y cookie del nuevo usuario.</summary>
    private async Task<(Guid Guid, string Correo, string Cookie)> UsuarioActivoAsync(string cookieAdmin, string perfil)
    {
        var correo = Correo();
        var json = await InvitarAsync(cookieAdmin, correo, perfil);
        Assert.Equal(HttpStatusCode.NoContent, (await AceptarAsync((await TokensAsync(correo))[0])).StatusCode);
        return (json.GetProperty("guid").GetGuid(), correo, await LoginCookieAsync(correo));
    }

    private async Task<JsonElement> ListarAsync(string cookie) =>
        await (await EnviarAsync(HttpMethod.Get, "/api/v1/usuarios", cookie)).Content.ReadFromJsonAsync<JsonElement>(Ct);

    private async Task<Guid> GuidDeAsync(string cookie, string correo) =>
        (await ListarAsync(cookie)).EnumerateArray().Single(u => u.GetProperty("correo").GetString() == correo).GetProperty("guid").GetGuid();

    private Task<HttpResponseMessage> PutAsync(string cookie, Guid guid, string perfil, bool activo) =>
        EnviarAsync(HttpMethod.Put, "/api/v1/usuarios/" + guid, cookie, new { perfil, activo });

    [Fact]
    public async Task Invitar_aceptar_y_aparece_activo()
    {
        var (_, admin) = await AdminAsync();
        var correo = Correo();
        var json = await InvitarAsync(admin, correo, "colaborador");
        Assert.Equal("invitado", json.GetProperty("estado").GetString());
        Assert.Equal("colaborador", json.GetProperty("perfil").GetString());
        Assert.Equal(correo, json.GetProperty("nombre").GetString());

        var fila = (await ListarAsync(admin)).EnumerateArray().Single(u => u.GetProperty("correo").GetString() == correo);
        Assert.Equal("invitado", fila.GetProperty("estado").GetString());

        Assert.Equal(HttpStatusCode.NoContent, (await AceptarAsync((await TokensAsync(correo)).Single())).StatusCode);
        var cookie = await LoginCookieAsync(correo);
        Assert.Equal(HttpStatusCode.OK, (await MeAsync(cookie)).StatusCode);
        fila = (await ListarAsync(admin)).EnumerateArray().Single(u => u.GetProperty("correo").GetString() == correo);
        Assert.Equal("activo", fila.GetProperty("estado").GetString());
        Assert.Equal("Persona", fila.GetProperty("nombre").GetString());
    }

    [Fact]
    public async Task Correo_existente_da_409_y_perfil_super_admin_o_correo_malo_da_400()
    {
        var (correoA, adminA) = await AdminAsync();
        var (_, adminB) = await AdminAsync();

        // Mismo cliente y de otro cliente.
        foreach (var cookie in new[] { adminA, adminB })
        {
            var r = await EnviarAsync(HttpMethod.Post, "/api/v1/usuarios", cookie, new { correo = correoA, perfil = "colaborador" });
            Assert.Equal(HttpStatusCode.Conflict, r.StatusCode);
            Assert.Contains("\"campo\":\"correo\"", await r.Content.ReadAsStringAsync(Ct));
        }

        Assert.Equal(HttpStatusCode.BadRequest,
            (await EnviarAsync(HttpMethod.Post, "/api/v1/usuarios", adminA, new { correo = Correo(), perfil = "super_admin" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest,
            (await EnviarAsync(HttpMethod.Post, "/api/v1/usuarios", adminA, new { correo = Correo(), perfil = "otro" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest,
            (await EnviarAsync(HttpMethod.Post, "/api/v1/usuarios", adminA, new { correo = "no-es-correo", perfil = "admin" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await PutAsync(adminA, await GuidDeAsync(adminA, correoA), "super_admin", true)).StatusCode);
    }

    [Fact]
    public async Task Reenviar_invalida_el_token_anterior_y_solo_aplica_a_invitados()
    {
        var (_, admin) = await AdminAsync();
        var correo = Correo();
        var guid = (await InvitarAsync(admin, correo, "coordinador")).GetProperty("guid").GetGuid();

        Assert.Equal(HttpStatusCode.NoContent, (await EnviarAsync(HttpMethod.Post, $"/api/v1/usuarios/{guid}/reenviar-invitacion", admin)).StatusCode);
        var tokens = await TokensAsync(correo);
        Assert.Equal(2, tokens.Count);

        Assert.Equal(HttpStatusCode.BadRequest, (await AceptarAsync(tokens[0])).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await AceptarAsync(tokens[1])).StatusCode);

        var r = await EnviarAsync(HttpMethod.Post, $"/api/v1/usuarios/{guid}/reenviar-invitacion", admin);
        Assert.Equal(HttpStatusCode.Conflict, r.StatusCode);
    }

    [Fact]
    public async Task Admin_no_se_desactiva_ni_cambia_su_perfil_y_con_dos_admin_se_puede_desactivar_uno()
    {
        var (correoA, adminA) = await AdminAsync();
        var guidA = await GuidDeAsync(adminA, correoA);
        Assert.Equal(HttpStatusCode.Conflict, (await PutAsync(adminA, guidA, "admin", false)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await PutAsync(adminA, guidA, "colaborador", true)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await PutAsync(adminA, guidA, "admin", true)).StatusCode); // sin cambios

        var (guidB, correoB, adminB) = await UsuarioActivoAsync(adminA, "admin");
        var r = await PutAsync(adminA, guidB, "admin", false);
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        Assert.Equal("inactivo", (await r.Content.ReadFromJsonAsync<JsonElement>(Ct)).GetProperty("estado").GetString());
        Assert.Equal(HttpStatusCode.Unauthorized, (await MeAsync(adminB)).StatusCode);

        // Reactivo a B, que desactiva a A (queda B como Admin activo).
        Assert.Equal(HttpStatusCode.OK, (await PutAsync(adminA, guidB, "admin", true)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await PutAsync(adminB, guidA, "admin", false)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await MeAsync(adminA)).StatusCode);
        Assert.Equal(correoB, (await ListarAsync(adminB)).EnumerateArray().Single(u => u.GetProperty("estado").GetString() == "activo").GetProperty("correo").GetString());
    }

    [Fact]
    public async Task El_ultimo_admin_activo_no_se_puede_desactivar_ni_degradar()
    {
        // Con la API el actor siempre es un Admin activo, así que la regla solo se alcanza con una carrera: se prueba el SP.
        var (correoA, adminA) = await AdminAsync();
        var guidA = await GuidDeAsync(adminA, correoA);
        await using var cn = new MySqlConnection(_db.ConnectionString);
        var clienteId = await cn.ExecuteScalarAsync<long>("SELECT ClienteId FROM Usuario WHERE Correo = @correoA", new { correoA });

        async Task<int> Llamar(string perfil, bool activo) => await cn.ExecuteScalarAsync<int>("usu_editarPerfilEstado",
            new { p_ClienteId = clienteId, p_ActorId = 0L, p_Guid = guidA, p_Perfil = perfil, p_Activo = activo }, commandType: CommandType.StoredProcedure);

        Assert.Equal(4, await Llamar("admin", false));
        Assert.Equal(4, await Llamar("colaborador", true));
        Assert.Equal("activo", await cn.ExecuteScalarAsync<string>("SELECT Estado FROM Usuario WHERE Correo = @correoA", new { correoA }));
        Assert.Equal(1, await Llamar("admin", true));
    }

    [Fact]
    public async Task Invitado_no_se_desactiva_y_activo_true_no_cambia_nada()
    {
        var (_, admin) = await AdminAsync();
        var guid = (await InvitarAsync(admin, Correo(), "colaborador")).GetProperty("guid").GetGuid();

        var r = await PutAsync(admin, guid, "coordinador", false);
        Assert.Equal(HttpStatusCode.Conflict, r.StatusCode);
        Assert.Contains("invitado", await r.Content.ReadAsStringAsync(Ct));

        var ok = await PutAsync(admin, guid, "coordinador", true);
        Assert.Equal(HttpStatusCode.OK, ok.StatusCode);
        var json = await ok.Content.ReadFromJsonAsync<JsonElement>(Ct);
        Assert.Equal("invitado", json.GetProperty("estado").GetString());
        Assert.Equal("coordinador", json.GetProperty("perfil").GetString());
    }

    [Fact]
    public async Task Desactivar_corta_la_sesion_y_reactivar_permite_volver_a_entrar()
    {
        var (_, admin) = await AdminAsync();
        var (guid, correo, cookie) = await UsuarioActivoAsync(admin, "colaborador");
        Assert.Equal(HttpStatusCode.OK, (await MeAsync(cookie)).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await PutAsync(admin, guid, "colaborador", false)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await MeAsync(cookie)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await _http.PostAsJsonAsync("/api/v1/auth/login", new { correo, contrasena = Clave }, Ct)).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await PutAsync(admin, guid, "colaborador", true)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await MeAsync(await LoginCookieAsync(correo))).StatusCode);
    }

    [Fact]
    public async Task Aislamiento_entre_clientes_da_404()
    {
        var (_, adminA) = await AdminAsync();
        var (correoB, adminB) = await AdminAsync();
        var invitadoB = Correo();
        var guidInvitadoB = (await InvitarAsync(adminB, invitadoB, "colaborador")).GetProperty("guid").GetGuid();
        var guidAdminB = await GuidDeAsync(adminB, correoB);

        var lista = (await ListarAsync(adminA)).EnumerateArray().Select(u => u.GetProperty("correo").GetString()).ToList();
        Assert.DoesNotContain(correoB, lista);
        Assert.DoesNotContain(invitadoB, lista);

        Assert.Equal(HttpStatusCode.NotFound, (await PutAsync(adminA, guidAdminB, "colaborador", false)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await PutAsync(adminA, guidInvitadoB, "admin", true)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound,
            (await EnviarAsync(HttpMethod.Post, $"/api/v1/usuarios/{guidInvitadoB}/reenviar-invitacion", adminA)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await PutAsync(adminA, Guid.NewGuid(), "admin", true)).StatusCode);

        // B sigue intacto.
        Assert.Contains(invitadoB, (await ListarAsync(adminB)).EnumerateArray().Select(u => u.GetProperty("correo").GetString()));
        Assert.Single(await TokensAsync(invitadoB));
    }

    [Fact]
    public async Task Sin_permiso_403_sin_sesion_401_y_super_admin_sin_cliente_400()
    {
        var (_, admin) = await AdminAsync();
        foreach (var perfil in new[] { "colaborador", "coordinador" })
        {
            var (_, _, cookie) = await UsuarioActivoAsync(admin, perfil);
            Assert.Equal(HttpStatusCode.Forbidden, (await EnviarAsync(HttpMethod.Get, "/api/v1/usuarios", cookie)).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden,
                (await EnviarAsync(HttpMethod.Post, "/api/v1/usuarios", cookie, new { correo = Correo(), perfil = "colaborador" })).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await PutAsync(cookie, Guid.NewGuid(), "admin", true)).StatusCode);
        }
        Assert.Equal(HttpStatusCode.Unauthorized, (await EnviarAsync(HttpMethod.Get, "/api/v1/usuarios", null)).StatusCode);

        var sa = await SuperAdminCookieAsync();
        var r = await EnviarAsync(HttpMethod.Get, "/api/v1/usuarios", sa);
        Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
        Assert.Contains("Selecciona un cliente", await r.Content.ReadAsStringAsync(Ct));
        Assert.Equal(HttpStatusCode.BadRequest,
            (await EnviarAsync(HttpMethod.Post, "/api/v1/usuarios", sa, new { correo = Correo(), perfil = "admin" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await PutAsync(sa, Guid.NewGuid(), "admin", true)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest,
            (await EnviarAsync(HttpMethod.Post, $"/api/v1/usuarios/{Guid.NewGuid()}/reenviar-invitacion", sa)).StatusCode);
    }
}
