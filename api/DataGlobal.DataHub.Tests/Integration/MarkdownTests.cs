using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Dapper;
using DataGlobal.DataHub.Services.Seguridad;
using MySqlConnector;

namespace DataGlobal.DataHub.Tests.Integration;

/// <summary>Módulo 9: exportación de páginas a Markdown (RF-MD-01..03).</summary>
public class MarkdownTests : IClassFixture<MySqlFixture>, IAsyncDisposable
{
    private const string Clave = "ClaveSegura@123";
    private readonly MySqlFixture _db;
    private readonly ApiFactory _factory;
    private readonly HttpClient _http;

    public MarkdownTests(MySqlFixture db)
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

    // ---------- soporte

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

    private async Task<string> TokenAsync(string correo)
    {
        string? token = null;
        foreach (var f in Directory.GetFiles(_factory.CarpetaCorreos, "*.html").OrderBy(Path.GetFileName, StringComparer.Ordinal))
        {
            var html = await File.ReadAllTextAsync(f, Ct);
            if (html.Contains($"<!-- Para: {correo} -->"))
                token = Regex.Match(html, "aceptar-invitacion\\?token=([0-9a-f]{64})").Groups[1].Value;
        }
        return token!;
    }

    private async Task AceptarAsync(string correo) =>
        Assert.Equal(HttpStatusCode.NoContent,
            (await _http.PostAsJsonAsync("/api/v1/auth/aceptar-invitacion", new { token = await TokenAsync(correo), nombre = "Persona", contrasena = Clave }, Ct)).StatusCode);

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
        Assert.Equal(HttpStatusCode.NoContent,
            (await _http.PostAsJsonAsync("/api/v1/auth/aceptar-invitacion", new { token, nombre = "Super", contrasena = Clave }, Ct)).StatusCode);
        return await LoginCookieAsync(correo);
    }

    /// <summary>Crea un cliente con su Admin ya activo; devuelve la cookie del Admin.</summary>
    private async Task<string> AdminAsync()
    {
        var sa = await SuperAdminCookieAsync();
        var correo = Correo();
        var r = await EnviarAsync(HttpMethod.Post, "/api/v1/clientes", sa,
            new { nombre = "Acme", slug = "c-" + Guid.NewGuid().ToString("N")[..12], correoAdmin = correo });
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        await AceptarAsync(correo);
        return await LoginCookieAsync(correo);
    }

    /// <summary>Invita, acepta y entra: guid y cookie del nuevo usuario.</summary>
    private async Task<(Guid Guid, string Cookie)> UsuarioAsync(string cookieAdmin, string perfil)
    {
        var correo = Correo();
        var r = await EnviarAsync(HttpMethod.Post, "/api/v1/usuarios", cookieAdmin, new { correo, perfil });
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        var guid = (await r.Content.ReadFromJsonAsync<JsonElement>(Ct)).GetProperty("guid").GetGuid();
        await AceptarAsync(correo);
        return (guid, await LoginCookieAsync(correo));
    }

    private async Task<Guid> CrearAsync(string cookie, string url, object cuerpo)
    {
        var r = await EnviarAsync(HttpMethod.Post, url, cookie, cuerpo);
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        return (await r.Content.ReadFromJsonAsync<JsonElement>(Ct)).GetProperty("guid").GetGuid();
    }

    private Task<Guid> WorkspaceAsync(string cookie, string nombre = "Workspace") => CrearAsync(cookie, "/api/v1/workspaces", new { nombre });
    private Task<Guid> EspacioAsync(string cookie, Guid ws, string nombre = "Espacio") => CrearAsync(cookie, "/api/v1/espacios", new { workspaceGuid = ws, nombre });
    private Task<Guid> ColeccionAsync(string cookie, Guid esp, string nombre = "Colección") => CrearAsync(cookie, "/api/v1/colecciones", new { espacioGuid = esp, nombre });
    private Task<Guid> PaginaAsync(string cookie, Guid col, string titulo = "Página", Guid? padre = null) =>
        CrearAsync(cookie, "/api/v1/paginas", new { coleccionGuid = col, paginaPadreGuid = padre, titulo });

    private async Task<(Guid Ws, Guid Esp, Guid Col, Guid Pag)> CadenaAsync(string cookie)
    {
        var ws = await WorkspaceAsync(cookie);
        var esp = await EspacioAsync(cookie, ws);
        var col = await ColeccionAsync(cookie, esp);
        return (ws, esp, col, await PaginaAsync(cookie, col));
    }

    private async Task AsignarAsync(string admin, Guid ws, params Guid[] usuarios) =>
        Assert.Equal(HttpStatusCode.NoContent, (await EnviarAsync(HttpMethod.Put, $"/api/v1/workspaces/{ws}/miembros", admin, new { usuarios })).StatusCode);

    private async Task<HttpStatusCode> CodigoAsync(HttpMethod m, string url, string? cookie, object? cuerpo = null) =>
        (await EnviarAsync(m, url, cookie, cuerpo)).StatusCode;

    private Task<HttpResponseMessage> MarkdownAsync(string? cookie, Guid pag) => EnviarAsync(HttpMethod.Get, $"/api/v1/paginas/{pag}/markdown", cookie);

    private async Task GuardarAsync(string cookie, Guid pag, string contenido) =>
        Assert.Equal(HttpStatusCode.OK, (await EnviarAsync(HttpMethod.Put, $"/api/v1/paginas/{pag}/contenido", cookie,
            new { contenido = JsonDocument.Parse(contenido).RootElement, version = 0 })).StatusCode);

    private const string Doc = """{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Hola"}]},{"type":"paragraph","content":[{"type":"text","text":"Mundo","marks":[{"type":"bold"}]}]}]}""";

    [Fact]
    public async Task Exporta_con_front_matter_cabeceras_y_cuerpo()
    {
        var admin = await AdminAsync();
        var ws = await WorkspaceAsync(admin, "Ingeniería");
        var col = await ColeccionAsync(admin, await EspacioAsync(admin, ws, "Arquitectura"), "Backend");
        var pag = await PaginaAsync(admin, col, "Arquitectura \"API\"");
        var (resp, _) = await UsuarioAsync(admin, "colaborador");
        string correo;
        await using (var cn = new MySqlConnection(_db.ConnectionString))
            correo = await cn.ExecuteScalarAsync<string>("SELECT Correo FROM Usuario WHERE Guid = @g", new { g = resp.ToString() }) ?? "";
        Assert.Equal(HttpStatusCode.NoContent, await CodigoAsync(HttpMethod.Put, $"/api/v1/paginas/{pag}/metadata", admin,
            new { estado = "aprobado", tipoDocumento = "arquitectura", responsableGuid = resp, fechaRevision = "2026-12-01", etiquetas = new[] { "zeta", "api" } }));
        await GuardarAsync(admin, pag, Doc);

        var r = await MarkdownAsync(admin, pag);
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        Assert.Equal("text/markdown", r.Content.Headers.ContentType!.MediaType);
        Assert.Equal("utf-8", r.Content.Headers.ContentType.CharSet);
        Assert.Equal("attachment", r.Content.Headers.ContentDisposition!.DispositionType);
        Assert.Equal("arquitectura-api.md", r.Content.Headers.ContentDisposition.FileName!.Trim('"'));
        var bytes = await r.Content.ReadAsByteArrayAsync(Ct);
        Assert.False(bytes.Length > 2 && bytes[0] == 0xEF && bytes[1] == 0xBB);
        var md = System.Text.Encoding.UTF8.GetString(bytes);

        Assert.StartsWith("---\ntitle: \"Arquitectura \\\"API\\\"\"\nstatus: aprobado\ntype: arquitectura\nworkspace: \"Ingeniería\"\nspace: \"Arquitectura\"\n"
            + $"collection: \"Backend\"\nowner: \"{correo}\"\ntags: [\"api\", \"zeta\"]\nreview_date: 2026-12-01\nupdated_at: ", md);
        Assert.Matches(@"updated_at: \d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ\n---\n\n# Hola\n\n\*\*Mundo\*\*\n$", md);
        Assert.Equal(md, await (await MarkdownAsync(admin, pag)).Content.ReadAsStringAsync(Ct));
    }

    [Fact]
    public async Task Pagina_sin_contenido_ni_metadata_solo_trae_front_matter()
    {
        var admin = await AdminAsync();
        var (_, _, _, pag) = await CadenaAsync(admin);
        var md = await (await MarkdownAsync(admin, pag)).Content.ReadAsStringAsync(Ct);
        Assert.StartsWith("---\ntitle: \"Página\"\nstatus: borrador\ntype: general\n", md);
        Assert.DoesNotContain("owner:", md);
        Assert.DoesNotContain("review_date:", md);
        Assert.Contains("\ntags: []\n", md);
        Assert.EndsWith("Z\n---\n", md);
    }

    [Fact]
    public async Task Colaborador_asignado_exporta_y_los_ajenos_reciben_404()
    {
        var admin = await AdminAsync();
        var otro = await AdminAsync();
        var (ws, _, _, pag) = await CadenaAsync(admin);
        var (colab, cc) = await UsuarioAsync(admin, "colaborador");
        var (_, sinAsignar) = await UsuarioAsync(admin, "colaborador");
        await AsignarAsync(admin, ws, colab);

        Assert.Equal(HttpStatusCode.OK, (await MarkdownAsync(cc, pag)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await MarkdownAsync(sinAsignar, pag)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await MarkdownAsync(otro, pag)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await MarkdownAsync(admin, Guid.NewGuid())).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await MarkdownAsync(null, pag)).StatusCode);
    }

    [Fact]
    public async Task Pagina_eliminada_es_404()
    {
        var admin = await AdminAsync();
        var (_, _, _, pag) = await CadenaAsync(admin);
        Assert.Equal(HttpStatusCode.NoContent, await CodigoAsync(HttpMethod.Delete, "/api/v1/paginas/" + pag, admin));
        Assert.Equal(HttpStatusCode.NotFound, (await MarkdownAsync(admin, pag)).StatusCode);
    }

    [Fact]
    public async Task Super_admin_sin_cliente_es_400()
    {
        var admin = await AdminAsync();
        var (_, _, _, pag) = await CadenaAsync(admin);
        Assert.Equal(HttpStatusCode.BadRequest, (await MarkdownAsync(await SuperAdminCookieAsync(), pag)).StatusCode);
    }
}
