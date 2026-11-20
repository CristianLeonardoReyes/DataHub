using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Dapper;
using DataGlobal.DataHub.Services.Seguridad;
using MySqlConnector;

namespace DataGlobal.DataHub.Tests.Integration;

/// <summary>Módulo 6: metadata y etiquetas de páginas (RF-MET-01..04).</summary>
public class MetadataTests : IClassFixture<MySqlFixture>, IAsyncDisposable
{
    private const string Clave = "ClaveSegura@123";
    private readonly MySqlFixture _db;
    private readonly ApiFactory _factory;
    private readonly HttpClient _http;

    public MetadataTests(MySqlFixture db)
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
            new { nombre = "Acme " + Guid.NewGuid().ToString("N")[..8], slug = "c-" + Guid.NewGuid().ToString("N")[..12], correoAdmin = correo });
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

    private async Task<JsonElement> ArbolAsync(string cookie)
    {
        var r = await EnviarAsync(HttpMethod.Get, "/api/v1/arbol", cookie);
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        return await r.Content.ReadFromJsonAsync<JsonElement>(Ct);
    }

    private static List<Guid> Guids(JsonElement arreglo, string propiedad = "guid") =>
        [.. arreglo.EnumerateArray().Select(x => x.GetProperty(propiedad).GetGuid())];

    private async Task<HttpStatusCode> CodigoAsync(HttpMethod m, string url, string? cookie, object? cuerpo = null) =>
        (await EnviarAsync(m, url, cookie, cuerpo)).StatusCode;

    private Task<HttpStatusCode> GetPaginaAsync(string cookie, Guid pag) => CodigoAsync(HttpMethod.Get, "/api/v1/paginas/" + pag, cookie);


    private async Task<JsonElement> DetalleAsync(string cookie, Guid pag)
    {
        var r = await EnviarAsync(HttpMethod.Get, "/api/v1/paginas/" + pag, cookie);
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        return await r.Content.ReadFromJsonAsync<JsonElement>(Ct);
    }

    private Task<HttpStatusCode> MetadataAsync(string cookie, Guid pag, string estado = "borrador", Guid? responsable = null,
        string? fecha = null, string[]? etiquetas = null, string tipo = "general") =>
        CodigoAsync(HttpMethod.Put, $"/api/v1/paginas/{pag}/metadata", cookie,
            new { estado, tipoDocumento = tipo, responsableGuid = responsable, fechaRevision = fecha, etiquetas = etiquetas ?? [] });

    private static List<string> Textos(JsonElement arreglo) => [.. arreglo.EnumerateArray().Select(x => x.GetString()!)];

    private async Task<List<string>> EtiquetasDeAsync(string cookie, string q = "") =>
        Textos(await (await EnviarAsync(HttpMethod.Get, "/api/v1/etiquetas?q=" + Uri.EscapeDataString(q), cookie)).Content.ReadFromJsonAsync<JsonElement>(Ct));

    private async Task InactivarAsync(Guid usuario)
    {
        await using var cn = new MySqlConnection(_db.ConnectionString);
        await cn.ExecuteAsync("UPDATE Usuario SET Estado = 'inactivo' WHERE Guid = @g", new { g = usuario.ToString() });
    }

    [Fact]
    public async Task Detalle_trae_metadata_por_defecto()
    {
        var admin = await AdminAsync();
        var (ws, _, _, pag) = await CadenaAsync(admin);
        var (colab, cc) = await UsuarioAsync(admin, "colaborador");
        await AsignarAsync(admin, ws, colab);

        var d = await DetalleAsync(admin, pag);
        Assert.Equal("borrador", d.GetProperty("estado").GetString());
        Assert.Equal("general", d.GetProperty("tipoDocumento").GetString());
        Assert.Equal(JsonValueKind.Null, d.GetProperty("responsable").ValueKind);
        Assert.Equal(JsonValueKind.Null, d.GetProperty("fechaRevision").ValueKind);
        Assert.Empty(d.GetProperty("etiquetas").EnumerateArray());
        Assert.True(d.GetProperty("puedeAprobar").GetBoolean());
        Assert.False((await DetalleAsync(cc, pag)).GetProperty("puedeAprobar").GetBoolean());
    }

    [Fact]
    public async Task Admin_guarda_la_metadata_y_el_detalle_la_refleja()
    {
        var admin = await AdminAsync();
        var (_, _, _, pag) = await CadenaAsync(admin);
        var (resp, _) = await UsuarioAsync(admin, "colaborador");

        Assert.Equal(HttpStatusCode.NoContent, await MetadataAsync(admin, pag, "aprobado", resp, "2027-03-15", ["Zeta", "alfa"], "adr"));
        var d = await DetalleAsync(admin, pag);
        Assert.Equal("aprobado", d.GetProperty("estado").GetString());
        Assert.Equal("adr", d.GetProperty("tipoDocumento").GetString());
        Assert.Equal(resp, d.GetProperty("responsable").GetProperty("guid").GetGuid());
        Assert.Equal("Persona", d.GetProperty("responsable").GetProperty("nombre").GetString());
        Assert.Equal("2027-03-15", d.GetProperty("fechaRevision").GetString());
        Assert.Equal(["alfa", "zeta"], Textos(d.GetProperty("etiquetas")));

        // Reemplazo total: null quita responsable y fecha; [] quita las etiquetas.
        Assert.Equal(HttpStatusCode.NoContent, await MetadataAsync(admin, pag, "archivado"));
        d = await DetalleAsync(admin, pag);
        Assert.Equal("archivado", d.GetProperty("estado").GetString());
        Assert.Equal(JsonValueKind.Null, d.GetProperty("responsable").ValueKind);
        Assert.Equal(JsonValueKind.Null, d.GetProperty("fechaRevision").ValueKind);
        Assert.Empty(d.GetProperty("etiquetas").EnumerateArray());
    }

    [Fact]
    public async Task Aprobar_exige_coordinador_o_superior()
    {
        var admin = await AdminAsync();
        var (ws, _, _, pag) = await CadenaAsync(admin);
        var (colab, cc) = await UsuarioAsync(admin, "colaborador");
        var (coord, co) = await UsuarioAsync(admin, "coordinador");
        await AsignarAsync(admin, ws, colab, coord);

        Assert.Equal(HttpStatusCode.Forbidden, await MetadataAsync(cc, pag, "aprobado", etiquetas: ["x"], tipo: "api"));
        var d = await DetalleAsync(admin, pag);
        Assert.Equal("borrador", d.GetProperty("estado").GetString());
        Assert.Equal("general", d.GetProperty("tipoDocumento").GetString());
        Assert.Empty(d.GetProperty("etiquetas").EnumerateArray());

        Assert.Equal(HttpStatusCode.NoContent, await MetadataAsync(co, pag, "aprobado"));
        // El colaborador edita otros campos manteniendo 'aprobado'.
        Assert.Equal(HttpStatusCode.NoContent, await MetadataAsync(cc, pag, "aprobado", tipo: "runbook", etiquetas: ["ops"]));
        Assert.Equal("runbook", (await DetalleAsync(admin, pag)).GetProperty("tipoDocumento").GetString());
    }

    [Fact]
    public async Task Responsable_de_otro_cliente_o_inactivo_es_400()
    {
        var admin = await AdminAsync();
        var otro = await AdminAsync();
        var (_, _, _, pag) = await CadenaAsync(admin);
        var (ajeno, _) = await UsuarioAsync(otro, "colaborador");
        var (inactivo, _) = await UsuarioAsync(admin, "colaborador");
        await InactivarAsync(inactivo);

        Assert.Equal(HttpStatusCode.BadRequest, await MetadataAsync(admin, pag, responsable: ajeno));
        Assert.Equal(HttpStatusCode.BadRequest, await MetadataAsync(admin, pag, responsable: inactivo));
        Assert.Equal(HttpStatusCode.BadRequest, await MetadataAsync(admin, pag, responsable: Guid.NewGuid()));
    }

    [Fact]
    public async Task Valida_estado_tipo_y_etiquetas()
    {
        var admin = await AdminAsync();
        var (_, _, _, pag) = await CadenaAsync(admin);
        Assert.Equal(HttpStatusCode.BadRequest, await MetadataAsync(admin, pag, "inventado"));
        Assert.Equal(HttpStatusCode.BadRequest, await MetadataAsync(admin, pag, tipo: "otro"));
        Assert.Equal(HttpStatusCode.BadRequest, await MetadataAsync(admin, pag, etiquetas: [new string('a', 51)]));
        Assert.Equal(HttpStatusCode.BadRequest, await MetadataAsync(admin, pag, etiquetas: [.. Enumerable.Range(0, 21).Select(i => "e" + i)]));
        Assert.Equal(HttpStatusCode.NoContent, await MetadataAsync(admin, pag, etiquetas: [.. Enumerable.Range(0, 20).Select(i => "e" + i)]));
    }

    [Fact]
    public async Task Etiquetas_se_normalizan_y_no_se_duplican()
    {
        var admin = await AdminAsync();
        var (_, _, col, pag) = await CadenaAsync(admin);
        var pag2 = await PaginaAsync(admin, col, "Otra");

        Assert.Equal(HttpStatusCode.NoContent, await MetadataAsync(admin, pag, etiquetas: ["  Backend  API ", "backend api", "   "]));
        Assert.Equal(HttpStatusCode.NoContent, await MetadataAsync(admin, pag2, etiquetas: ["BACKEND API"]));
        Assert.Equal(["backend api"], Textos((await DetalleAsync(admin, pag)).GetProperty("etiquetas")));
        await using var cn = new MySqlConnection(_db.ConnectionString);
        Assert.Equal(1, await cn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM Etiqueta e JOIN Pagina p ON p.ClienteId = e.ClienteId WHERE p.Guid = @g AND e.Nombre = 'backend api'", new { g = pag.ToString() }));
    }

    [Fact]
    public async Task Sugerencias_solo_del_cliente_y_por_prefijo()
    {
        var admin = await AdminAsync();
        var otro = await AdminAsync();
        var (_, _, _, pag) = await CadenaAsync(admin);
        var (_, _, _, pagOtro) = await CadenaAsync(otro);
        await MetadataAsync(admin, pag, etiquetas: ["api rest", "api docs", "base de datos"]);
        await MetadataAsync(otro, pagOtro, etiquetas: ["api ajena"]);

        Assert.Equal(["api docs", "api rest"], await EtiquetasDeAsync(admin, "  API "));
        Assert.Equal(["api docs", "api rest", "base de datos"], await EtiquetasDeAsync(admin));
        Assert.Equal(["base de datos"], await EtiquetasDeAsync(admin, "b"));
        Assert.Equal(["api ajena"], await EtiquetasDeAsync(otro, "api"));
    }

    [Fact]
    public async Task Fuera_de_alcance_es_404()
    {
        var admin = await AdminAsync();
        var otro = await AdminAsync();
        var (_, _, _, pag) = await CadenaAsync(admin);
        var (_, cc) = await UsuarioAsync(admin, "colaborador");

        Assert.Equal(HttpStatusCode.NotFound, await MetadataAsync(otro, pag));
        Assert.Equal(HttpStatusCode.NotFound, await MetadataAsync(cc, pag));
        Assert.Equal(HttpStatusCode.NotFound, await MetadataAsync(admin, Guid.NewGuid()));
    }

    [Fact]
    public async Task Responsables_sin_inactivos_ni_otros_clientes_y_super_admin_sin_cliente_400()
    {
        var admin = await AdminAsync();
        var otro = await AdminAsync();
        var (activo, _) = await UsuarioAsync(admin, "colaborador");
        var (inactivo, _) = await UsuarioAsync(admin, "colaborador");
        var (ajeno, _) = await UsuarioAsync(otro, "colaborador");
        await InactivarAsync(inactivo);

        var r = await EnviarAsync(HttpMethod.Get, "/api/v1/responsables", admin);
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        var guids = Guids(await r.Content.ReadFromJsonAsync<JsonElement>(Ct));
        Assert.Contains(activo, guids);
        Assert.DoesNotContain(inactivo, guids);
        Assert.DoesNotContain(ajeno, guids);

        var sa = await SuperAdminCookieAsync();
        Assert.Equal(HttpStatusCode.BadRequest, await CodigoAsync(HttpMethod.Get, "/api/v1/responsables", sa));
        Assert.Equal(HttpStatusCode.BadRequest, await CodigoAsync(HttpMethod.Get, "/api/v1/etiquetas?q=a", sa));
    }
}
