using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Dapper;
using DataGlobal.DataHub.Services.Seguridad;
using MySqlConnector;

namespace DataGlobal.DataHub.Tests.Integration;

public class ClientesTests : IClassFixture<MySqlFixture>, IAsyncDisposable
{
    private const string Clave = "ClaveSegura123";
    private readonly MySqlFixture _db;
    private readonly ApiFactory _factory;
    private readonly HttpClient _http;

    public ClientesTests(MySqlFixture db)
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
    private static string Slug() => "c-" + Guid.NewGuid().ToString("N")[..12];

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
        var r = await _http.PostAsJsonAsync("/api/v1/auth/aceptar-invitacion", new { token, nombre = "Root", contrasena = Clave }, Ct);
        Assert.Equal(HttpStatusCode.NoContent, r.StatusCode);
        return await LoginCookieAsync(correo);
    }

    /// <summary>Crea un cliente y devuelve su guid, el correo del Admin y el token tomado del .html de invitación.</summary>
    private async Task<(Guid Guid, string CorreoAdmin, string Token)> CrearClienteAsync(string cookieSa, string? slug = null, string? correoAdmin = null)
    {
        correoAdmin ??= Correo();
        var r = await EnviarAsync(HttpMethod.Post, "/api/v1/clientes", cookieSa, new { nombre = "Acme", slug = slug ?? Slug(), correoAdmin });
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        var json = await r.Content.ReadFromJsonAsync<JsonElement>(Ct);
        var guid = json.GetProperty("guid").GetGuid();
        Assert.EndsWith("/api/v1/clientes/" + guid, r.Headers.Location!.ToString());

        var archivo = Directory.GetFiles(_factory.CarpetaCorreos, "*.html")
            .Single(f => File.ReadAllText(f).Contains($"<!-- Para: {correoAdmin} -->"));
        var token = Regex.Match(await File.ReadAllTextAsync(archivo, Ct), "aceptar-invitacion\\?token=([0-9a-f]{64})").Groups[1].Value;
        Assert.NotEmpty(token);
        return (guid, correoAdmin, token);
    }

    private async Task<string> AdminCookieAsync(string cookieSa)
    {
        var (_, correo, token) = await CrearClienteAsync(cookieSa);
        var r = await _http.PostAsJsonAsync("/api/v1/auth/aceptar-invitacion", new { token, nombre = "Admin", contrasena = Clave }, Ct);
        Assert.Equal(HttpStatusCode.NoContent, r.StatusCode);
        return await LoginCookieAsync(correo);
    }

    [Fact]
    public async Task Crear_cliente_invita_al_admin_que_puede_entrar()
    {
        var sa = await SuperAdminCookieAsync();
        var (guid, correo, token) = await CrearClienteAsync(sa);

        await using (var cn = new MySqlConnection(_db.ConnectionString))
        {
            var fila = await cn.QuerySingleAsync<(string Perfil, string Estado, string Nombre)>(
                "SELECT Perfil, Estado, Nombre FROM Usuario WHERE Correo = @correo", new { correo });
            Assert.Equal(("admin", "invitado", correo), fila);
            Assert.Equal(1, await cn.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM UsuarioToken t JOIN Usuario u ON u.Id = t.UsuarioId WHERE u.Correo = @correo AND t.Tipo = 'invitacion' AND t.TokenHash = @h",
                new { correo, h = TokenUtil.Hash(token) }));
        }

        var acept = await _http.PostAsJsonAsync("/api/v1/auth/aceptar-invitacion", new { token, nombre = "Admin", contrasena = Clave }, Ct);
        Assert.Equal(HttpStatusCode.NoContent, acept.StatusCode);

        var me = await EnviarAsync(HttpMethod.Get, "/api/v1/auth/me", await LoginCookieAsync(correo));
        var json = await me.Content.ReadFromJsonAsync<JsonElement>(Ct);
        Assert.Equal("admin", json.GetProperty("perfil").GetString());
        Assert.Equal(guid, json.GetProperty("cliente").GetProperty("guid").GetGuid());
        var permisos = json.GetProperty("permisos").EnumerateArray().Select(p => p.GetString()).ToList();
        Assert.DoesNotContain("clientesGestionar", permisos);
        Assert.Contains("usuariosGestionar", permisos);
        Assert.Equal(12, permisos.Count);
    }

    [Fact]
    public async Task Super_admin_ve_todas_las_acciones_en_me()
    {
        var me = await EnviarAsync(HttpMethod.Get, "/api/v1/auth/me", await SuperAdminCookieAsync());
        var json = await me.Content.ReadFromJsonAsync<JsonElement>(Ct);
        Assert.Equal("super_admin", json.GetProperty("perfil").GetString());
        var permisos = json.GetProperty("permisos").EnumerateArray().Select(p => p.GetString()).ToList();
        Assert.Equal(13, permisos.Count);
        Assert.Contains("clientesGestionar", permisos);
    }

    [Fact]
    public async Task Duplicados_dan_409_y_slug_invalido_400()
    {
        var sa = await SuperAdminCookieAsync();
        var slug = Slug();
        var (_, correo, _) = await CrearClienteAsync(sa, slug);

        var dupSlug = await EnviarAsync(HttpMethod.Post, "/api/v1/clientes", sa, new { nombre = "X", slug, correoAdmin = Correo() });
        Assert.Equal(HttpStatusCode.Conflict, dupSlug.StatusCode);
        Assert.Contains("\"campo\":\"slug\"", await dupSlug.Content.ReadAsStringAsync(Ct));

        var dupCorreo = await EnviarAsync(HttpMethod.Post, "/api/v1/clientes", sa, new { nombre = "X", slug = Slug(), correoAdmin = correo });
        Assert.Equal(HttpStatusCode.Conflict, dupCorreo.StatusCode);
        Assert.Contains("\"campo\":\"correoAdmin\"", await dupCorreo.Content.ReadAsStringAsync(Ct));

        foreach (var malo in new[] { "Mayus", "con espacio", "ab", "-guion", "doble--guion" })
        {
            var r = await EnviarAsync(HttpMethod.Post, "/api/v1/clientes", sa, new { nombre = "X", slug = malo, correoAdmin = Correo() });
            Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
        }
        var correoMalo = await EnviarAsync(HttpMethod.Post, "/api/v1/clientes", sa, new { nombre = "X", slug = Slug(), correoAdmin = "no-es-correo" });
        Assert.Equal(HttpStatusCode.BadRequest, correoMalo.StatusCode);
    }

    [Fact]
    public async Task Admin_recibe_403_y_sin_sesion_401()
    {
        var admin = await AdminCookieAsync(await SuperAdminCookieAsync());
        Assert.Equal(HttpStatusCode.Forbidden, (await EnviarAsync(HttpMethod.Get, "/api/v1/clientes", admin)).StatusCode);
        var post = await EnviarAsync(HttpMethod.Post, "/api/v1/clientes", admin, new { nombre = "X", slug = Slug(), correoAdmin = Correo() });
        Assert.Equal(HttpStatusCode.Forbidden, post.StatusCode);
        Assert.Equal("application/problem+json", post.Content.Headers.ContentType?.MediaType);

        Assert.Equal(HttpStatusCode.Unauthorized, (await EnviarAsync(HttpMethod.Get, "/api/v1/clientes", null)).StatusCode);
    }

    [Fact]
    public async Task Cliente_inexistente_da_404()
    {
        var sa = await SuperAdminCookieAsync();
        var url = "/api/v1/clientes/" + Guid.NewGuid();
        Assert.Equal(HttpStatusCode.NotFound, (await EnviarAsync(HttpMethod.Get, url, sa)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await EnviarAsync(HttpMethod.Put, url, sa, new { nombre = "X", slug = Slug(), activo = true })).StatusCode);
    }

    [Fact]
    public async Task Listar_y_actualizar_con_slug_repetido_da_409()
    {
        var sa = await SuperAdminCookieAsync();
        var slugA = Slug();
        await CrearClienteAsync(sa, slugA);
        var (guidB, _, _) = await CrearClienteAsync(sa);

        var lista = await (await EnviarAsync(HttpMethod.Get, "/api/v1/clientes", sa)).Content.ReadFromJsonAsync<JsonElement>(Ct);
        Assert.True(lista.GetArrayLength() >= 2);

        var r = await EnviarAsync(HttpMethod.Put, "/api/v1/clientes/" + guidB, sa, new { nombre = "B", slug = slugA, activo = true });
        Assert.Equal(HttpStatusCode.Conflict, r.StatusCode);

        var ok = await EnviarAsync(HttpMethod.Put, "/api/v1/clientes/" + guidB, sa, new { nombre = "  Nuevo  ", slug = slugA + "-b", activo = true });
        Assert.Equal(HttpStatusCode.OK, ok.StatusCode);
        Assert.Equal("Nuevo", (await ok.Content.ReadFromJsonAsync<JsonElement>(Ct)).GetProperty("nombre").GetString());
    }

    [Fact]
    public async Task Cliente_inactivo_deja_fuera_a_sus_usuarios_y_reactivar_los_devuelve()
    {
        var sa = await SuperAdminCookieAsync();
        var (guid, correo, token) = await CrearClienteAsync(sa);
        await _http.PostAsJsonAsync("/api/v1/auth/aceptar-invitacion", new { token, nombre = "Admin", contrasena = Clave }, Ct);
        var admin = await LoginCookieAsync(correo);
        Assert.Equal(HttpStatusCode.OK, (await EnviarAsync(HttpMethod.Get, "/api/v1/auth/me", admin)).StatusCode);

        var url = "/api/v1/clientes/" + guid;
        var cuerpo = await (await EnviarAsync(HttpMethod.Get, url, sa)).Content.ReadFromJsonAsync<JsonElement>(Ct);
        var slug = cuerpo.GetProperty("slug").GetString();
        Assert.Equal(HttpStatusCode.OK, (await EnviarAsync(HttpMethod.Put, url, sa, new { nombre = "Acme", slug, activo = false })).StatusCode);

        Assert.Equal(HttpStatusCode.Unauthorized, (await EnviarAsync(HttpMethod.Get, "/api/v1/auth/me", admin)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await _http.PostAsJsonAsync("/api/v1/auth/login", new { correo, contrasena = Clave }, Ct)).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await EnviarAsync(HttpMethod.Put, url, sa, new { nombre = "Acme", slug, activo = true })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent,
            (await _http.PostAsJsonAsync("/api/v1/auth/login", new { correo, contrasena = Clave }, Ct)).StatusCode);
    }

    [Fact]
    public async Task Cliente_inactivo_no_acepta_invitacion()
    {
        var sa = await SuperAdminCookieAsync();
        var (guid, _, token) = await CrearClienteAsync(sa);
        var slug = (await (await EnviarAsync(HttpMethod.Get, "/api/v1/clientes/" + guid, sa)).Content.ReadFromJsonAsync<JsonElement>(Ct)).GetProperty("slug").GetString();
        await EnviarAsync(HttpMethod.Put, "/api/v1/clientes/" + guid, sa, new { nombre = "Acme", slug, activo = false });

        var r = await _http.PostAsJsonAsync("/api/v1/auth/aceptar-invitacion", new { token, nombre = "Admin", contrasena = Clave }, Ct);
        Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
    }
}
