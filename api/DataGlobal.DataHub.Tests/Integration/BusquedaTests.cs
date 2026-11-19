using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Dapper;
using DataGlobal.DataHub.Services.Seguridad;
using MySqlConnector;

namespace DataGlobal.DataHub.Tests.Integration;

/// <summary>Módulo 8: búsqueda de páginas (RF-BUS-01..03).</summary>
public class BusquedaTests : IClassFixture<MySqlFixture>, IAsyncDisposable
{
    private const string Clave = "ClaveSegura@123";
    private readonly MySqlFixture _db;
    private readonly ApiFactory _factory;
    private readonly HttpClient _http;

    public BusquedaTests(MySqlFixture db)
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

    private static object Doc(string texto) => new
    {
        type = "doc",
        content = new object[] { new { type = "paragraph", content = new object[] { new { type = "text", text = texto } } } }
    };

    private async Task GuardarAsync(string cookie, Guid pag, string texto) =>
        Assert.Equal(HttpStatusCode.OK, (await EnviarAsync(HttpMethod.Put, $"/api/v1/paginas/{pag}/contenido", cookie, new { contenido = Doc(texto), version = 0 })).StatusCode);

    private async Task<JsonElement> BuscarAsync(string cookie, string q, int pagina = 1)
    {
        var r = await EnviarAsync(HttpMethod.Get, $"/api/v1/buscar?q={Uri.EscapeDataString(q)}&pagina={pagina}", cookie);
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        return await r.Content.ReadFromJsonAsync<JsonElement>(Ct);
    }

    private async Task<List<Guid>> GuidsBusquedaAsync(string cookie, string q) => Guids((await BuscarAsync(cookie, q)).GetProperty("resultados"));

    private async Task<(string Admin, Guid Col)> EntornoAsync()
    {
        var admin = await AdminAsync();
        var ws = await WorkspaceAsync(admin, "Plataforma");
        var esp = await EspacioAsync(admin, ws, "Backend");
        return (admin, await ColeccionAsync(admin, esp, "Guías"));
    }

    [Fact]
    public async Task Encuentra_por_titulo_y_por_contenido_con_ruta_y_fragmento()
    {
        var (admin, col) = await EntornoAsync();
        var porTitulo = await PaginaAsync(admin, col, "Zafiro del servidor");
        var padre = await PaginaAsync(admin, col, "Padre");
        var porContenido = await PaginaAsync(admin, col, "Otra", padre);
        await GuardarAsync(admin, porContenido, "Texto inicial largo. El zafiro aparece aquí al final.");
        await PaginaAsync(admin, col, "Sin relación");

        var r = await BuscarAsync(admin, "zafiro");
        Assert.Equal(2, r.GetProperty("total").GetInt32());
        Assert.Equal(1, r.GetProperty("pagina").GetInt32());
        Assert.Equal(20, r.GetProperty("porPagina").GetInt32());
        var res = r.GetProperty("resultados");
        Assert.Equal(new[] { porTitulo, porContenido }.Order(), Guids(res).Order());
        var c = res.EnumerateArray().Single(x => x.GetProperty("guid").GetGuid() == porContenido);
        Assert.Equal("Plataforma / Backend / Guías / Padre", c.GetProperty("ruta").GetString());
        Assert.Contains("zafiro", c.GetProperty("fragmento").GetString(), StringComparison.OrdinalIgnoreCase);
        var t = res.EnumerateArray().Single(x => x.GetProperty("guid").GetGuid() == porTitulo);
        Assert.Equal("Plataforma / Backend / Guías", t.GetProperty("ruta").GetString());
    }

    [Fact]
    public async Task Busca_por_prefijo_y_exige_todos_los_terminos()
    {
        var (admin, col) = await EntornoAsync();
        var a = await PaginaAsync(admin, col, "Arquitectura hexagonal");
        var b = await PaginaAsync(admin, col, "Arquitectura limpia");

        Assert.Equal(new[] { a, b }.Order(), (await GuidsBusquedaAsync(admin, "arqui")).Order());
        Assert.Equal([a], await GuidsBusquedaAsync(admin, "arquitectura hexagonal"));
        Assert.Empty(await GuidsBusquedaAsync(admin, "arquitectura inexistente"));
    }

    [Fact]
    public async Task No_muestra_resultados_de_otro_cliente()
    {
        var (a, colA) = await EntornoAsync();
        var (b, colB) = await EntornoAsync();
        var pa = await PaginaAsync(a, colA, "Topacio compartido");
        var pb = await PaginaAsync(b, colB, "Topacio compartido");
        await GuardarAsync(b, pb, "topacio en contenido");

        Assert.Equal([pa], await GuidsBusquedaAsync(a, "topacio"));
        Assert.Equal([pb], await GuidsBusquedaAsync(b, "topacio"));
    }

    [Fact]
    public async Task Colaborador_solo_busca_en_sus_workspaces()
    {
        var admin = await AdminAsync();
        var ws1 = await WorkspaceAsync(admin, "Uno");
        var ws2 = await WorkspaceAsync(admin, "Dos");
        var p1 = await PaginaAsync(admin, await ColeccionAsync(admin, await EspacioAsync(admin, ws1)), "Rubi uno");
        var p2 = await PaginaAsync(admin, await ColeccionAsync(admin, await EspacioAsync(admin, ws2)), "Rubi dos");
        var (colab, cc) = await UsuarioAsync(admin, "colaborador");

        Assert.Empty(await GuidsBusquedaAsync(cc, "rubi"));
        Assert.Equal(2, (await GuidsBusquedaAsync(admin, "rubi")).Count);

        await AsignarAsync(admin, ws1, colab);
        var r = await BuscarAsync(cc, "rubi");
        Assert.Equal(1, r.GetProperty("total").GetInt32());
        Assert.Equal([p1], Guids(r.GetProperty("resultados")));
        Assert.DoesNotContain(p2, Guids(r.GetProperty("resultados")));
    }

    [Fact]
    public async Task No_muestra_paginas_eliminadas_ni_de_colecciones_eliminadas()
    {
        var (admin, col) = await EntornoAsync();
        var viva = await PaginaAsync(admin, col, "Jade viva");
        var eliminada = await PaginaAsync(admin, col, "Jade eliminada");
        var esp = await EspacioAsync(admin, await WorkspaceAsync(admin, "Otro"));
        var col2 = await ColeccionAsync(admin, esp);
        await PaginaAsync(admin, col2, "Jade en colección eliminada");
        Assert.Equal(3, (await GuidsBusquedaAsync(admin, "jade")).Count);

        Assert.Equal(HttpStatusCode.NoContent, await CodigoAsync(HttpMethod.Delete, "/api/v1/paginas/" + eliminada, admin));
        Assert.Equal(HttpStatusCode.NoContent, await CodigoAsync(HttpMethod.Delete, "/api/v1/colecciones/" + col2, admin));

        Assert.Equal([viva], await GuidsBusquedaAsync(admin, "jade"));
    }

    [Fact]
    public async Task Pagina_de_20_en_20()
    {
        var (admin, col) = await EntornoAsync();
        for (var i = 0; i < 25; i++) await PaginaAsync(admin, col, $"Onix {i}");

        var p1 = await BuscarAsync(admin, "onix");
        Assert.Equal(25, p1.GetProperty("total").GetInt32());
        Assert.Equal(20, p1.GetProperty("resultados").GetArrayLength());
        var p2 = await BuscarAsync(admin, "onix", 2);
        Assert.Equal(25, p2.GetProperty("total").GetInt32());
        Assert.Equal(2, p2.GetProperty("pagina").GetInt32());
        Assert.Equal(5, p2.GetProperty("resultados").GetArrayLength());
        Assert.Empty(Guids(p1.GetProperty("resultados")).Intersect(Guids(p2.GetProperty("resultados"))));
    }

    [Theory]
    [InlineData("+a -b ~c (d) \"e\" *")]
    [InlineData("@@@")]
    [InlineData("")]
    [InlineData("a")]
    [InlineData("   ")]
    public async Task Consultas_sin_terminos_validos_dan_400(string q)
    {
        var (admin, _) = await EntornoAsync();
        var r = await EnviarAsync(HttpMethod.Get, "/api/v1/buscar?q=" + Uri.EscapeDataString(q), admin);
        Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
        Assert.Contains("al menos 2 letras", await r.Content.ReadAsStringAsync(Ct));
    }

    [Fact]
    public async Task Operadores_en_la_consulta_no_rompen_la_busqueda()
    {
        var (admin, col) = await EntornoAsync();
        var p = await PaginaAsync(admin, col, "Cuarzo azul");

        Assert.Equal([p], await GuidsBusquedaAsync(admin, "+cuarzo ~azul (\"@<>*"));
        Assert.Equal([p], await GuidsBusquedaAsync(admin, "cuarzo*"));
        foreach (var q in new[] { "-- ++ ()", "cuarzo\"", "x'; DROP TABLE Pagina; --", new string('x', 500) })
            Assert.NotEqual(HttpStatusCode.InternalServerError, await CodigoAsync(HttpMethod.Get, "/api/v1/buscar?q=" + Uri.EscapeDataString(q), admin));
    }

    [Fact]
    public async Task Pagina_fuera_de_rango_sin_sesion_o_sin_cliente()
    {
        var (admin, _) = await EntornoAsync();
        Assert.Equal(HttpStatusCode.BadRequest, await CodigoAsync(HttpMethod.Get, "/api/v1/buscar?q=hola&pagina=0", admin));
        Assert.Equal(HttpStatusCode.BadRequest, await CodigoAsync(HttpMethod.Get, "/api/v1/buscar?q=hola&pagina=501", admin));
        Assert.Equal(HttpStatusCode.Unauthorized, await CodigoAsync(HttpMethod.Get, "/api/v1/buscar?q=hola", null));
        Assert.Equal(HttpStatusCode.BadRequest, await CodigoAsync(HttpMethod.Get, "/api/v1/buscar?q=hola", await SuperAdminCookieAsync()));
    }

    [Fact]
    public async Task Ignora_stopwords_y_acepta_prefijo_de_dos_letras()
    {
        var (admin, col) = await EntornoAsync();
        var p = await PaginaAsync(admin, col, "Arquitectura de software");

        Assert.Equal([p], await GuidsBusquedaAsync(admin, "arquitectura de software"));
        Assert.Equal([p], await GuidsBusquedaAsync(admin, "ar"));
        Assert.Equal(HttpStatusCode.BadRequest, await CodigoAsync(HttpMethod.Get, "/api/v1/buscar?q=de", admin));
    }
}
