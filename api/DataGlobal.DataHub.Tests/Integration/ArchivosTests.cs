using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Azure.Storage.Blobs;
using Dapper;
using DataGlobal.DataHub.Services.Seguridad;
using MySqlConnector;

namespace DataGlobal.DataHub.Tests.Integration;

/// <summary>Módulo 7: archivos de páginas en Blob privado (RF-ARC-01..06).</summary>
public class ArchivosTests : IClassFixture<MySqlFixture>, IClassFixture<AzuriteFixture>, IAsyncDisposable
{
    private const string Clave = "ClaveSegura@123";
    private const int MaxMb = 1;
    private readonly MySqlFixture _db;
    private readonly AzuriteFixture _azurite;
    private readonly ApiFactory _factory;
    private readonly HttpClient _http;

    public ArchivosTests(MySqlFixture db, AzuriteFixture azurite)
    {
        _db = db;
        _azurite = azurite;
        _factory = new ApiFactory(db.ConnectionString, azurite.ConnectionString, MaxMb);
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

    private async Task<(Guid Ws, Guid Pag)> PaginaAsync(string cookie)
    {
        var ws = await CrearAsync(cookie, "/api/v1/workspaces", new { nombre = "Workspace" });
        var esp = await CrearAsync(cookie, "/api/v1/espacios", new { workspaceGuid = ws, nombre = "Espacio" });
        var col = await CrearAsync(cookie, "/api/v1/colecciones", new { espacioGuid = esp, nombre = "Colección" });
        return (ws, await CrearAsync(cookie, "/api/v1/paginas", new { coleccionGuid = col, titulo = "Página" }));
    }

    private async Task AsignarAsync(string admin, Guid ws, params Guid[] usuarios) =>
        Assert.Equal(HttpStatusCode.NoContent, (await EnviarAsync(HttpMethod.Put, $"/api/v1/workspaces/{ws}/miembros", admin, new { usuarios })).StatusCode);

    private Task<HttpResponseMessage> SubirRawAsync(string cookie, Guid pag, byte[] datos, string nombre = "nota.txt", string tipo = "text/plain")
    {
        var contenido = new ByteArrayContent(datos);
        contenido.Headers.ContentType = new MediaTypeHeaderValue(tipo);
        var form = new MultipartFormDataContent { { contenido, "archivo", nombre } };
        var req = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/paginas/{pag}/adjuntos") { Content = form };
        req.Headers.Add("Cookie", cookie);
        return _http.SendAsync(req, Ct);
    }

    private async Task<Guid> SubirAsync(string cookie, Guid pag, byte[]? datos = null, string nombre = "nota.txt", string tipo = "text/plain")
    {
        var r = await SubirRawAsync(cookie, pag, datos ?? "hola"u8.ToArray(), nombre, tipo);
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        return (await r.Content.ReadFromJsonAsync<JsonElement>(Ct)).GetProperty("guid").GetGuid();
    }

    private async Task<JsonElement> ListarAsync(string cookie, Guid pag)
    {
        var r = await EnviarAsync(HttpMethod.Get, $"/api/v1/paginas/{pag}/adjuntos", cookie);
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        return await r.Content.ReadFromJsonAsync<JsonElement>(Ct);
    }

    private async Task<HttpStatusCode> CodigoAsync(HttpMethod m, string url, string cookie) => (await EnviarAsync(m, url, cookie)).StatusCode;

    private async Task<(string Url, DateTime Expira)> UrlAsync(string cookie, Guid adj, bool descargar = false)
    {
        var r = await EnviarAsync(HttpMethod.Get, $"/api/v1/adjuntos/{adj}/url?descargar={descargar.ToString().ToLowerInvariant()}", cookie);
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        var j = await r.Content.ReadFromJsonAsync<JsonElement>(Ct);
        return (j.GetProperty("url").GetString()!, j.GetProperty("expira").GetDateTime());
    }

    private static async Task<HttpResponseMessage> DescargarAsync(string url)
    {
        using var http = new HttpClient();
        return await http.GetAsync(url, Ct);
    }

    private async Task<List<string>> BlobsAsync(string prefijo)
    {
        var c = new BlobContainerClient(_azurite.ConnectionString, ApiFactory.ContenedorArchivos);
        var nombres = new List<string>();
        await foreach (var b in c.GetBlobsAsync(Azure.Storage.Blobs.Models.BlobTraits.None, Azure.Storage.Blobs.Models.BlobStates.None, prefijo, Ct)) nombres.Add(b.Name);
        return nombres;
    }

    // ---------- pruebas

    [Fact]
    public async Task Sube_lista_y_deja_el_blob_en_la_ruta_esperada()
    {
        var admin = await AdminAsync();
        var (ws, pag) = await PaginaAsync(admin);
        var r = await SubirRawAsync(admin, pag, "hola"u8.ToArray(), @"C:\temp\..\informe.txt");
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        var creado = await r.Content.ReadFromJsonAsync<JsonElement>(Ct);
        var adj = creado.GetProperty("guid").GetGuid();
        Assert.Equal("informe.txt", creado.GetProperty("nombre").GetString());
        Assert.True(creado.GetProperty("puedeEliminar").GetBoolean());

        var lista = await ListarAsync(admin, pag);
        var f = Assert.Single(lista.EnumerateArray());
        Assert.Equal(adj, f.GetProperty("guid").GetGuid());
        Assert.Equal("informe.txt", f.GetProperty("nombre").GetString());
        Assert.Equal("text/plain", f.GetProperty("tipoMime").GetString());
        Assert.Equal(4, f.GetProperty("tamanoBytes").GetInt64());
        Assert.Equal("Persona", f.GetProperty("subidoPor").GetProperty("nombre").GetString());

        var blob = Assert.Single(await BlobsAsync(""), b => b.EndsWith($"/{ws}/{pag}/{adj}"));
        Assert.True(Guid.TryParse(blob.Split('/')[0], out _));
        Assert.Equal(4, blob.Split('/').Length);
    }

    [Fact]
    public async Task Archivo_mayor_al_maximo_o_vacio_responde_400()
    {
        var admin = await AdminAsync();
        var (_, pag) = await PaginaAsync(admin);

        var grande = await SubirRawAsync(admin, pag, new byte[MaxMb * 1024 * 1024 + 1]);
        Assert.Equal(HttpStatusCode.BadRequest, grande.StatusCode);
        Assert.Equal($"El archivo supera el máximo de {MaxMb} MB",
            (await grande.Content.ReadFromJsonAsync<JsonElement>(Ct)).GetProperty("detail").GetString());

        Assert.Equal(HttpStatusCode.BadRequest, (await SubirRawAsync(admin, pag, [])).StatusCode);
        Assert.Empty((await ListarAsync(admin, pag)).EnumerateArray());
    }

    [Fact]
    public async Task Cuerpo_que_supera_el_tope_se_corta_antes_de_llegar_al_servicio()
    {
        var admin = await AdminAsync();
        var (_, pag) = await PaginaAsync(admin);

        // Máximo + 2 MB: pasa el margen de 1 MB del filtro LimiteSubida, así que no se recibe entero.
        var r = await SubirRawAsync(admin, pag, new byte[(MaxMb + 2) * 1024 * 1024]);
        Assert.False(r.IsSuccessStatusCode);
        // Si el filtro no cortara, el servicio respondería su 400 con este mensaje tras recibir todo.
        Assert.DoesNotContain("El archivo supera", await r.Content.ReadAsStringAsync(Ct));
        Assert.Empty((await ListarAsync(admin, pag)).EnumerateArray());
    }

    [Theory]
    [InlineData("foto.png", "image/png", false, "inline", "image/png")]
    [InlineData("doc.pdf", "application/pdf", false, "inline", "application/pdf")]
    [InlineData("dibujo.svg", "image/svg+xml", false, "attachment", "application/octet-stream")]
    [InlineData("datos.zip", "application/zip", false, "attachment", "application/octet-stream")]
    [InlineData("foto.png", "image/png", true, "attachment", "application/octet-stream")]
    public async Task Url_sas_entrega_el_contenido_con_su_disposicion(string nombre, string tipo, bool descargar, string disposicion, string tipoRespuesta)
    {
        var admin = await AdminAsync();
        var (_, pag) = await PaginaAsync(admin);
        byte[] datos = [1, 2, 3, 4, 5];
        var adj = await SubirAsync(admin, pag, datos, nombre, tipo);

        var (url, expira) = await UrlAsync(admin, adj, descargar);
        Assert.InRange(expira, DateTime.UtcNow.AddMinutes(9), DateTime.UtcNow.AddMinutes(10).AddSeconds(5));
        var r = await DescargarAsync(url);
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        Assert.Equal(datos, await r.Content.ReadAsByteArrayAsync(Ct));
        Assert.Equal(tipoRespuesta, r.Content.Headers.ContentType!.MediaType);
        Assert.StartsWith(disposicion, r.Content.Headers.ContentDisposition!.ToString());
        if (disposicion == "attachment") Assert.Equal(nombre, r.Content.Headers.ContentDisposition!.FileNameStar);
    }

    [Fact]
    public async Task Otro_cliente_y_colaborador_no_asignado_reciben_404()
    {
        var admin = await AdminAsync();
        var (ws, pag) = await PaginaAsync(admin);
        var adj = await SubirAsync(admin, pag);
        var otroAdmin = await AdminAsync();
        var (_, noAsignado) = await UsuarioAsync(admin, "colaborador");

        foreach (var cookie in new[] { otroAdmin, noAsignado })
        {
            Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Get, $"/api/v1/paginas/{pag}/adjuntos", cookie));
            Assert.Equal(HttpStatusCode.NotFound, (await SubirRawAsync(cookie, pag, "x"u8.ToArray())).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Get, $"/api/v1/adjuntos/{adj}/url", cookie));
            Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Delete, $"/api/v1/adjuntos/{adj}", cookie));
        }
        Assert.Single((await ListarAsync(admin, pag)).EnumerateArray());
        Assert.DoesNotContain(await BlobsAsync(""), b => b.Contains($"/{ws}/{pag}/") && !b.EndsWith("/" + adj));
    }

    [Fact]
    public async Task Colaborador_elimina_solo_sus_propios_archivos()
    {
        var admin = await AdminAsync();
        var (ws, pag) = await PaginaAsync(admin);
        var (colab, cc) = await UsuarioAsync(admin, "colaborador");
        await AsignarAsync(admin, ws, colab);
        var ajeno = await SubirAsync(admin, pag);
        var propio = await SubirAsync(cc, pag);

        var lista = (await ListarAsync(cc, pag)).EnumerateArray().ToDictionary(x => x.GetProperty("guid").GetGuid(), x => x.GetProperty("puedeEliminar").GetBoolean());
        Assert.False(lista[ajeno]);
        Assert.True(lista[propio]);

        Assert.Equal(HttpStatusCode.Forbidden, await CodigoAsync(HttpMethod.Delete, $"/api/v1/adjuntos/{ajeno}", cc));
        Assert.Equal(HttpStatusCode.NoContent, await CodigoAsync(HttpMethod.Delete, $"/api/v1/adjuntos/{propio}", cc));
        Assert.Equal(HttpStatusCode.NoContent, await CodigoAsync(HttpMethod.Delete, $"/api/v1/adjuntos/{ajeno}", admin));
    }

    [Fact]
    public async Task Adjunto_eliminado_deja_de_listarse_y_su_blob_se_conserva()
    {
        var admin = await AdminAsync();
        var (_, pag) = await PaginaAsync(admin);
        var adj = await SubirAsync(admin, pag);

        Assert.Equal(HttpStatusCode.NoContent, await CodigoAsync(HttpMethod.Delete, $"/api/v1/adjuntos/{adj}", admin));
        Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Get, $"/api/v1/adjuntos/{adj}/url", admin));
        Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Delete, $"/api/v1/adjuntos/{adj}", admin));
        Assert.Empty((await ListarAsync(admin, pag)).EnumerateArray());
        Assert.Contains(await BlobsAsync(""), b => b.EndsWith($"/{pag}/{adj}"));
    }

    [Fact]
    public async Task Pagina_eliminada_deja_sus_adjuntos_inaccesibles()
    {
        var admin = await AdminAsync();
        var (_, pag) = await PaginaAsync(admin);
        var adj = await SubirAsync(admin, pag);

        Assert.Equal(HttpStatusCode.NoContent, await CodigoAsync(HttpMethod.Delete, $"/api/v1/paginas/{pag}", admin));
        Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Get, $"/api/v1/paginas/{pag}/adjuntos", admin));
        Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Get, $"/api/v1/adjuntos/{adj}/url", admin));
        Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Delete, $"/api/v1/adjuntos/{adj}", admin));
        Assert.Equal(HttpStatusCode.NotFound, (await SubirRawAsync(admin, pag, "x"u8.ToArray())).StatusCode);
    }

    [Fact]
    public async Task Super_admin_sin_cliente_recibe_400()
    {
        var sa = await SuperAdminCookieAsync();
        Assert.Equal(HttpStatusCode.BadRequest, await CodigoAsync(HttpMethod.Get, $"/api/v1/paginas/{Guid.NewGuid()}/adjuntos", sa));
    }
}
