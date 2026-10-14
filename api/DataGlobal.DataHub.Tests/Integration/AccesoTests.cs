using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Dapper;
using DataGlobal.DataHub.Services.Seguridad;
using MySqlConnector;

namespace DataGlobal.DataHub.Tests.Integration;

public class AccesoTests : IClassFixture<MySqlFixture>, IAsyncDisposable
{
    private const string Clave = "ClaveSegura123";
    private readonly MySqlFixture _db;
    private readonly ApiFactory _factory;
    private readonly HttpClient _http;

    public AccesoTests(MySqlFixture db)
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

    /// <summary>Inserta un super_admin invitado con un token de invitación; devuelve el token en claro.</summary>
    private async Task<string> SembrarInvitadoAsync(string correo, int horas = 72)
    {
        var token = TokenUtil.Generar();
        await using var cn = new MySqlConnection(_db.ConnectionString);
        var id = await cn.ExecuteScalarAsync<long>(
            "INSERT INTO Usuario (Correo, Nombre, Perfil) VALUES (@correo, 'Pendiente', 'super_admin'); SELECT LAST_INSERT_ID();",
            new { correo });
        await cn.ExecuteAsync(
            "INSERT INTO UsuarioToken (UsuarioId, Tipo, TokenHash, FechaExpiracion) VALUES (@id, 'invitacion', @hash, DATE_ADD(UTC_TIMESTAMP(), INTERVAL @horas HOUR))",
            new { id, hash = TokenUtil.Hash(token), horas });
        return token;
    }

    private async Task<string> CrearActivoAsync()
    {
        var correo = Correo();
        var token = await SembrarInvitadoAsync(correo);
        var r = await _http.PostAsJsonAsync("/api/v1/auth/aceptar-invitacion", new { token, nombre = "Ana", contrasena = Clave }, Ct);
        Assert.Equal(HttpStatusCode.NoContent, r.StatusCode);
        return correo;
    }

    private Task<HttpResponseMessage> LoginAsync(string correo, string contrasena) =>
        _http.PostAsJsonAsync("/api/v1/auth/login", new { correo, contrasena }, Ct);

    private static string SetCookieSesion(HttpResponseMessage r) =>
        r.Headers.GetValues("Set-Cookie").First(c => c.StartsWith("datahub_sesion="));

    private Task<HttpResponseMessage> MeAsync(string cookie)
    {
        var req = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/me");
        req.Headers.Add("Cookie", cookie.Split(';')[0]);
        return _http.SendAsync(req, Ct);
    }

    [Fact]
    public async Task Flujo_completo_invitacion_login_me_logout()
    {
        var correo = Correo();
        var token = await SembrarInvitadoAsync(correo);

        var acept = await _http.PostAsJsonAsync("/api/v1/auth/aceptar-invitacion", new { token, nombre = "Ana", contrasena = Clave }, Ct);
        Assert.Equal(HttpStatusCode.NoContent, acept.StatusCode);

        var login = await LoginAsync(correo, Clave);
        Assert.Equal(HttpStatusCode.NoContent, login.StatusCode);
        var setCookie = SetCookieSesion(login).ToLowerInvariant();
        Assert.Contains("httponly", setCookie);
        Assert.Contains("secure", setCookie);
        Assert.Contains("samesite=strict", setCookie);

        var me = await MeAsync(SetCookieSesion(login));
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        var json = await me.Content.ReadFromJsonAsync<JsonElement>(Ct);
        Assert.Equal("Ana", json.GetProperty("nombre").GetString());
        Assert.Equal(correo, json.GetProperty("correo").GetString());
        Assert.Equal("super_admin", json.GetProperty("perfil").GetString());
        Assert.Equal(JsonValueKind.Null, json.GetProperty("cliente").ValueKind);

        var logout = await _http.PostAsync("/api/v1/auth/logout", null, Ct);
        Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);
        Assert.Contains("datahub_sesion=;", logout.Headers.GetValues("Set-Cookie").First());

        var sinCookie = await _http.GetAsync("/api/v1/auth/me", Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, sinCookie.StatusCode);
        Assert.Equal("application/problem+json", sinCookie.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Token_de_invitacion_reutilizado_o_vencido_da_400()
    {
        var token = await SembrarInvitadoAsync(Correo());
        var cuerpo = new { token, nombre = "Ana", contrasena = Clave };
        Assert.Equal(HttpStatusCode.NoContent, (await _http.PostAsJsonAsync("/api/v1/auth/aceptar-invitacion", cuerpo, Ct)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await _http.PostAsJsonAsync("/api/v1/auth/aceptar-invitacion", cuerpo, Ct)).StatusCode);

        var vencido = await SembrarInvitadoAsync(Correo(), horas: -1);
        var r = await _http.PostAsJsonAsync("/api/v1/auth/aceptar-invitacion", new { token = vencido, nombre = "Ana", contrasena = Clave }, Ct);
        Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
    }

    [Fact]
    public async Task Cinco_fallos_bloquean_aunque_la_contrasena_sea_correcta()
    {
        var correo = await CrearActivoAsync();
        for (var i = 0; i < 5; i++)
            Assert.Equal(HttpStatusCode.Unauthorized, (await LoginAsync(correo, "incorrecta-123")).StatusCode);

        Assert.Equal(HttpStatusCode.Unauthorized, (await LoginAsync(correo, Clave)).StatusCode);
    }

    [Fact]
    public async Task Usuario_desactivado_pierde_acceso_con_su_cookie_vigente()
    {
        var correo = await CrearActivoAsync();
        var cookie = SetCookieSesion(await LoginAsync(correo, Clave));
        Assert.Equal(HttpStatusCode.OK, (await MeAsync(cookie)).StatusCode);

        await using var cn = new MySqlConnection(_db.ConnectionString);
        await cn.ExecuteAsync("UPDATE Usuario SET Estado = 'inactivo' WHERE Correo = @correo", new { correo });

        Assert.Equal(HttpStatusCode.Unauthorized, (await MeAsync(cookie)).StatusCode);
    }

    [Fact]
    public async Task Olvide_y_restablecer_contrasena()
    {
        var inexistente = await _http.PostAsJsonAsync("/api/v1/auth/olvide-contrasena", new { correo = Correo() }, Ct);
        Assert.Equal(HttpStatusCode.Accepted, inexistente.StatusCode);
        Assert.False(Directory.Exists(_factory.CarpetaCorreos) && Directory.GetFiles(_factory.CarpetaCorreos).Length > 0);

        var correo = await CrearActivoAsync();
        var activo = await _http.PostAsJsonAsync("/api/v1/auth/olvide-contrasena", new { correo }, Ct);
        Assert.Equal(HttpStatusCode.Accepted, activo.StatusCode);

        var archivo = Assert.Single(Directory.GetFiles(_factory.CarpetaCorreos, "*.html"));
        var token = Regex.Match(await File.ReadAllTextAsync(archivo, Ct), "token=([0-9a-f]{64})").Groups[1].Value;
        Assert.NotEmpty(token);

        const string nueva = "OtraClave456789";
        var rest = await _http.PostAsJsonAsync("/api/v1/auth/restablecer-contrasena", new { token, contrasena = nueva }, Ct);
        Assert.Equal(HttpStatusCode.NoContent, rest.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await LoginAsync(correo, nueva)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await LoginAsync(correo, Clave)).StatusCode);
    }

    [Fact]
    public async Task Login_de_usuario_invitado_da_401()
    {
        var correo = Correo();
        await SembrarInvitadoAsync(correo);
        Assert.Equal(HttpStatusCode.Unauthorized, (await LoginAsync(correo, Clave)).StatusCode);
    }
}
