using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Dapper;
using DataGlobal.DataHub.Services.Seguridad;
using MySqlConnector;

namespace DataGlobal.DataHub.Tests.Integration;

/// <summary>Módulo 4: workspaces, miembros, espacios, colecciones y páginas (RF-JER-01..06).</summary>
public class JerarquiaTests : IClassFixture<MySqlFixture>, IAsyncDisposable
{
    private const string Clave = "ClaveSegura@123";
    private readonly MySqlFixture _db;
    private readonly ApiFactory _factory;
    private readonly HttpClient _http;

    public JerarquiaTests(MySqlFixture db)
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

    // ---------- pruebas

    [Fact]
    public async Task Aislamiento_entre_clientes()
    {
        var a = await AdminAsync();
        var b = await AdminAsync();
        var (ws, esp, col, pag) = await CadenaAsync(a);

        Assert.Contains(ws, Guids(await ArbolAsync(a)));
        Assert.DoesNotContain(ws, Guids(await ArbolAsync(b)));

        Assert.Equal(HttpStatusCode.NotFound, await GetPaginaAsync(b, pag));
        Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Put, "/api/v1/workspaces/" + ws, b, new { nombre = "X" }));
        Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Delete, "/api/v1/workspaces/" + ws, b));
        Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Put, "/api/v1/espacios/" + esp, b, new { nombre = "X" }));
        Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Delete, "/api/v1/espacios/" + esp, b));
        Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Put, "/api/v1/colecciones/" + col, b, new { nombre = "X" }));
        Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Delete, "/api/v1/colecciones/" + col, b));
        Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Put, "/api/v1/paginas/" + pag, b, new { titulo = "X" }));
        Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Delete, "/api/v1/paginas/" + pag, b));
        Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Post, "/api/v1/espacios", b, new { workspaceGuid = ws, nombre = "X" }));
        Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Post, "/api/v1/paginas", b, new { coleccionGuid = col, titulo = "X" }));
        Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Get, $"/api/v1/workspaces/{ws}/miembros", b));
        Assert.Equal(HttpStatusCode.OK, await GetPaginaAsync(a, pag));
    }

    [Fact]
    public async Task Colaborador_solo_ve_los_workspaces_asignados()
    {
        var admin = await AdminAsync();
        var (colab, cookie) = await UsuarioAsync(admin, "colaborador");
        var (ws, _, _, pag) = await CadenaAsync(admin);

        Assert.Empty((await ArbolAsync(cookie)).EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound, await GetPaginaAsync(cookie, pag));
        Assert.Empty((await (await EnviarAsync(HttpMethod.Get, "/api/v1/paginas/recientes", cookie)).Content.ReadFromJsonAsync<JsonElement>(Ct)).EnumerateArray());

        await AsignarAsync(admin, ws, colab);

        Assert.Equal([ws], Guids(await ArbolAsync(cookie)));
        Assert.Equal(HttpStatusCode.OK, await GetPaginaAsync(cookie, pag));
        var recientes = await (await EnviarAsync(HttpMethod.Get, "/api/v1/paginas/recientes", cookie)).Content.ReadFromJsonAsync<JsonElement>(Ct);
        Assert.Equal([pag], Guids(recientes));

        await AsignarAsync(admin, ws);
        Assert.Empty((await ArbolAsync(cookie)).EnumerateArray());
    }

    [Fact]
    public async Task Permisos_por_perfil_en_workspaces_y_espacios()
    {
        var admin = await AdminAsync();
        var (coord, cCoord) = await UsuarioAsync(admin, "coordinador");
        var (_, cColab) = await UsuarioAsync(admin, "colaborador");
        var asignado = await WorkspaceAsync(admin, "Asignado");
        var ajeno = await WorkspaceAsync(admin, "Ajeno");
        await AsignarAsync(admin, asignado, coord);

        Assert.Equal(HttpStatusCode.Forbidden, await CodigoAsync(HttpMethod.Post, "/api/v1/workspaces", cCoord, new { nombre = "X" }));
        Assert.Equal(HttpStatusCode.Forbidden, await CodigoAsync(HttpMethod.Delete, "/api/v1/workspaces/" + asignado, cCoord));
        Assert.Equal(HttpStatusCode.Forbidden, await CodigoAsync(HttpMethod.Get, $"/api/v1/workspaces/{asignado}/miembros", cCoord));

        await EspacioAsync(cCoord, asignado);
        Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Post, "/api/v1/espacios", cCoord, new { workspaceGuid = ajeno, nombre = "X" }));
        Assert.Equal(HttpStatusCode.Forbidden, await CodigoAsync(HttpMethod.Post, "/api/v1/espacios", cColab, new { workspaceGuid = asignado, nombre = "X" }));
        Assert.Equal(HttpStatusCode.Forbidden, await CodigoAsync(HttpMethod.Post, "/api/v1/workspaces", cColab, new { nombre = "X" }));
        Assert.Equal([asignado], Guids(await ArbolAsync(cCoord)));
    }

    [Fact]
    public async Task Eliminar_espacio_elimina_en_cascada()
    {
        var admin = await AdminAsync();
        var (ws, esp, col, pag) = await CadenaAsync(admin);
        var hija = await PaginaAsync(admin, col, "Hija", pag);

        Assert.Equal(HttpStatusCode.NoContent, await CodigoAsync(HttpMethod.Delete, "/api/v1/espacios/" + esp, admin));

        var w = (await ArbolAsync(admin)).EnumerateArray().Single(x => x.GetProperty("guid").GetGuid() == ws);
        Assert.Empty(w.GetProperty("espacios").EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound, await GetPaginaAsync(admin, pag));
        Assert.Equal(HttpStatusCode.NotFound, await GetPaginaAsync(admin, hija));
        Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Delete, "/api/v1/colecciones/" + col, admin));
        Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Delete, "/api/v1/espacios/" + esp, admin));
    }

    [Fact]
    public async Task Eliminar_workspace_elimina_todo_lo_que_cuelga()
    {
        var admin = await AdminAsync();
        var (ws, _, _, pag) = await CadenaAsync(admin);

        Assert.Equal(HttpStatusCode.NoContent, await CodigoAsync(HttpMethod.Delete, "/api/v1/workspaces/" + ws, admin));

        Assert.DoesNotContain(ws, Guids(await ArbolAsync(admin)));
        Assert.Equal(HttpStatusCode.NotFound, await GetPaginaAsync(admin, pag));
    }

    [Fact]
    public async Task Colaborador_elimina_solo_sus_paginas_sin_subpaginas()
    {
        var admin = await AdminAsync();
        var (colab, cookie) = await UsuarioAsync(admin, "colaborador");
        var (ws, _, col, ajena) = await CadenaAsync(admin);
        await AsignarAsync(admin, ws, colab);

        var propia = await PaginaAsync(cookie, col, "Propia");
        var conHija = await PaginaAsync(cookie, col, "ConHija");
        var hija = await PaginaAsync(admin, col, "Hija", conHija);

        Assert.Equal(HttpStatusCode.Forbidden, await CodigoAsync(HttpMethod.Delete, "/api/v1/paginas/" + ajena, cookie));
        Assert.Equal(HttpStatusCode.Forbidden, await CodigoAsync(HttpMethod.Delete, "/api/v1/paginas/" + conHija, cookie));

        Assert.False(await PuedeEliminarAsync(cookie, ajena));
        Assert.False(await PuedeEliminarAsync(cookie, conHija));
        Assert.True(await PuedeEliminarAsync(cookie, propia));
        Assert.True(await PuedeEliminarAsync(admin, ajena));

        Assert.Equal(HttpStatusCode.NoContent, await CodigoAsync(HttpMethod.Delete, "/api/v1/paginas/" + propia, cookie));
        Assert.Equal(HttpStatusCode.NotFound, await GetPaginaAsync(cookie, propia));

        // El Admin elimina la página con sus descendientes.
        Assert.Equal(HttpStatusCode.NoContent, await CodigoAsync(HttpMethod.Delete, "/api/v1/paginas/" + conHija, admin));
        Assert.Equal(HttpStatusCode.NotFound, await GetPaginaAsync(admin, hija));
        Assert.Equal(HttpStatusCode.OK, await GetPaginaAsync(admin, ajena));
    }

    private async Task<bool> PuedeEliminarAsync(string cookie, Guid pag) =>
        (await (await EnviarAsync(HttpMethod.Get, "/api/v1/paginas/" + pag, cookie)).Content.ReadFromJsonAsync<JsonElement>(Ct)).GetProperty("puedeEliminar").GetBoolean();

    [Fact]
    public async Task Mover_pagina_valida_el_padre()
    {
        var admin = await AdminAsync();
        var (ws, esp, col, raiz) = await CadenaAsync(admin);
        var hija = await PaginaAsync(admin, col, "Hija", raiz);
        var nieta = await PaginaAsync(admin, col, "Nieta", hija);
        var otraCol = await ColeccionAsync(admin, esp, "Otra");
        var enOtra = await PaginaAsync(admin, otraCol, "EnOtra");

        Assert.Equal(HttpStatusCode.BadRequest, await CodigoAsync(HttpMethod.Put, "/api/v1/paginas/" + raiz, admin, new { titulo = "Raíz", paginaPadreGuid = nieta }));
        Assert.Equal(HttpStatusCode.BadRequest, await CodigoAsync(HttpMethod.Put, "/api/v1/paginas/" + raiz, admin, new { titulo = "Raíz", paginaPadreGuid = hija }));
        Assert.Equal(HttpStatusCode.BadRequest, await CodigoAsync(HttpMethod.Put, "/api/v1/paginas/" + raiz, admin, new { titulo = "Raíz", paginaPadreGuid = raiz }));
        Assert.Equal(HttpStatusCode.BadRequest, await CodigoAsync(HttpMethod.Put, "/api/v1/paginas/" + hija, admin, new { titulo = "Hija", paginaPadreGuid = enOtra }));
        Assert.Equal(HttpStatusCode.BadRequest, await CodigoAsync(HttpMethod.Put, "/api/v1/paginas/" + hija, admin, new { titulo = "Hija", paginaPadreGuid = Guid.NewGuid() }));
        Assert.Equal(HttpStatusCode.BadRequest, await CodigoAsync(HttpMethod.Post, "/api/v1/paginas", admin, new { coleccionGuid = col, paginaPadreGuid = enOtra, titulo = "X" }));

        // Mover la nieta a la raíz y cambiar el título (el slug se regenera).
        Assert.Equal(HttpStatusCode.NoContent, await CodigoAsync(HttpMethod.Put, "/api/v1/paginas/" + nieta, admin, new { titulo = "Nieta Nueva" }));
        var p = await (await EnviarAsync(HttpMethod.Get, "/api/v1/paginas/" + nieta, admin)).Content.ReadFromJsonAsync<JsonElement>(Ct);
        Assert.Equal("Nieta Nueva", p.GetProperty("titulo").GetString());
        Assert.Equal(JsonValueKind.Null, p.GetProperty("paginaPadreGuid").ValueKind);
        Assert.Equal(2, ((await ArbolAsync(admin)).EnumerateArray().Single(x => x.GetProperty("guid").GetGuid() == ws)
            .GetProperty("espacios")[0].GetProperty("colecciones")[0].GetProperty("paginas")).GetArrayLength());

        // Ahora sí se puede mover la raíz bajo su antigua descendiente: es hermana, no descendiente.
        Assert.Equal(HttpStatusCode.NoContent, await CodigoAsync(HttpMethod.Put, "/api/v1/paginas/" + raiz, admin, new { titulo = "Raíz", paginaPadreGuid = nieta }));
    }

    [Fact]
    public async Task Posicion_reordena_a_los_hermanos()
    {
        var admin = await AdminAsync();
        var sa = await WorkspaceAsync(admin, "A");
        var sb = await WorkspaceAsync(admin, "B");
        var sc = await WorkspaceAsync(admin, "C");
        var antes = Guids(await ArbolAsync(admin));
        Assert.Equal([sa, sb, sc], antes.Where(g => g == sa || g == sb || g == sc));

        Assert.Equal(HttpStatusCode.NoContent, await CodigoAsync(HttpMethod.Put, "/api/v1/workspaces/" + sc, admin, new { nombre = "C", posicion = 0 }));
        var orden = Guids(await ArbolAsync(admin));
        Assert.Equal(sc, orden[0]);
        Assert.Equal([sc, sa, sb], orden);

        // Posición mayor que la cantidad: queda al final.
        Assert.Equal(HttpStatusCode.NoContent, await CodigoAsync(HttpMethod.Put, "/api/v1/workspaces/" + sc, admin, new { nombre = "C", posicion = 99 }));
        Assert.Equal([sa, sb, sc], Guids(await ArbolAsync(admin)));

        // Sin posición no cambia el orden.
        Assert.Equal(HttpStatusCode.NoContent, await CodigoAsync(HttpMethod.Put, "/api/v1/workspaces/" + sa, admin, new { nombre = "A2" }));
        Assert.Equal([sa, sb, sc], Guids(await ArbolAsync(admin)));

        // Páginas hermanas.
        var esp = await EspacioAsync(admin, sa);
        var col = await ColeccionAsync(admin, esp);
        var p1 = await PaginaAsync(admin, col, "Uno");
        var p2 = await PaginaAsync(admin, col, "Dos");
        var p3 = await PaginaAsync(admin, col, "Tres");
        Assert.Equal(HttpStatusCode.NoContent, await CodigoAsync(HttpMethod.Put, "/api/v1/paginas/" + p3, admin, new { titulo = "Tres", posicion = 1 }));
        var paginas = (await ArbolAsync(admin)).EnumerateArray().Single(x => x.GetProperty("guid").GetGuid() == sa)
            .GetProperty("espacios")[0].GetProperty("colecciones")[0].GetProperty("paginas");
        Assert.Equal([p1, p3, p2], Guids(paginas));
    }

    [Fact]
    public async Task Miembros_lista_y_valida_los_usuarios()
    {
        var admin = await AdminAsync();
        var (coord, _) = await UsuarioAsync(admin, "coordinador");
        var (colab, _) = await UsuarioAsync(admin, "colaborador");
        var (otroAdmin, _) = await UsuarioAsync(admin, "admin");
        var ws = await WorkspaceAsync(admin);

        var lista = await (await EnviarAsync(HttpMethod.Get, $"/api/v1/workspaces/{ws}/miembros", admin)).Content.ReadFromJsonAsync<JsonElement>(Ct);
        Assert.Equal(new[] { colab, coord }.Order(), Guids(lista).Order());
        Assert.DoesNotContain(otroAdmin, Guids(lista));
        Assert.All(lista.EnumerateArray(), m => Assert.False(m.GetProperty("asignado").GetBoolean()));

        Assert.Equal(HttpStatusCode.BadRequest, await CodigoAsync(HttpMethod.Put, $"/api/v1/workspaces/{ws}/miembros", admin, new { usuarios = new[] { colab, otroAdmin } }));
        Assert.Equal(HttpStatusCode.BadRequest, await CodigoAsync(HttpMethod.Put, $"/api/v1/workspaces/{ws}/miembros", admin, new { usuarios = new[] { Guid.NewGuid() } }));
        Assert.Equal(HttpStatusCode.NotFound, await CodigoAsync(HttpMethod.Put, $"/api/v1/workspaces/{Guid.NewGuid()}/miembros", admin, new { usuarios = new Guid[0] }));

        await AsignarAsync(admin, ws, colab, colab);
        lista = await (await EnviarAsync(HttpMethod.Get, $"/api/v1/workspaces/{ws}/miembros", admin)).Content.ReadFromJsonAsync<JsonElement>(Ct);
        Assert.Equal([colab], lista.EnumerateArray().Where(m => m.GetProperty("asignado").GetBoolean()).Select(m => m.GetProperty("guid").GetGuid()));
        Assert.Equal("colaborador", lista.EnumerateArray().Single(m => m.GetProperty("guid").GetGuid() == colab).GetProperty("perfil").GetString());
    }

    [Fact]
    public async Task Promover_a_admin_limpia_las_membresias()
    {
        var admin = await AdminAsync();
        var (colab, _) = await UsuarioAsync(admin, "colaborador");
        var ws1 = await WorkspaceAsync(admin, "Uno");
        var ws2 = await WorkspaceAsync(admin, "Dos");
        await AsignarAsync(admin, ws1, colab);
        await AsignarAsync(admin, ws2, colab);
        Assert.Equal(2, await MembresiasAsync(colab));

        var r = await EnviarAsync(HttpMethod.Put, "/api/v1/usuarios/" + colab, admin, new { perfil = "admin", activo = true });
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        Assert.Equal(0, await MembresiasAsync(colab));

        // Un Admin ya no aparece entre los asignables.
        var lista = await (await EnviarAsync(HttpMethod.Get, $"/api/v1/workspaces/{ws1}/miembros", admin)).Content.ReadFromJsonAsync<JsonElement>(Ct);
        Assert.DoesNotContain(colab, Guids(lista));
    }

    private async Task<int> MembresiasAsync(Guid usuario)
    {
        await using var cn = new MySqlConnection(_db.ConnectionString);
        return await cn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM WorkspaceMiembro m JOIN Usuario u ON u.Id = m.UsuarioId WHERE u.Guid = @usuario", new { usuario });
    }

    [Fact]
    public async Task Recientes_solo_dentro_del_alcance_y_maximo_diez()
    {
        var admin = await AdminAsync();
        var otro = await AdminAsync();
        var (coord, cCoord) = await UsuarioAsync(admin, "coordinador");
        var (wsA, _, colA, _) = await CadenaAsync(admin);
        await CadenaAsync(otro);
        var wsB = await WorkspaceAsync(admin, "Otro");
        var colB = await ColeccionAsync(admin, await EspacioAsync(admin, wsB));
        var enB = await PaginaAsync(admin, colB, "EnB");
        await AsignarAsync(admin, wsA, coord);

        var recientes = await (await EnviarAsync(HttpMethod.Get, "/api/v1/paginas/recientes", cCoord)).Content.ReadFromJsonAsync<JsonElement>(Ct);
        Assert.DoesNotContain(enB, Guids(recientes));
        Assert.Equal("Workspace", recientes[0].GetProperty("workspace").GetString());
        Assert.Equal("Colección", recientes[0].GetProperty("coleccion").GetString());

        for (var i = 0; i < 11; i++) await PaginaAsync(admin, colA, "P" + i);
        recientes = await (await EnviarAsync(HttpMethod.Get, "/api/v1/paginas/recientes", admin)).Content.ReadFromJsonAsync<JsonElement>(Ct);
        Assert.Equal(10, recientes.GetArrayLength());
    }

    [Fact]
    public async Task Pagina_devuelve_la_ruta_y_las_subpaginas()
    {
        var admin = await AdminAsync();
        var ws = await WorkspaceAsync(admin, "Mi WS");
        var esp = await EspacioAsync(admin, ws, "Mi Espacio");
        var col = await ColeccionAsync(admin, esp, "Mi Colección");
        var abuela = await PaginaAsync(admin, col, "Abuela");
        var madre = await PaginaAsync(admin, col, "Madre", abuela);
        var hija = await PaginaAsync(admin, col, "Hija", madre);
        var hermana = await PaginaAsync(admin, col, "Hermana", madre);

        var p = await (await EnviarAsync(HttpMethod.Get, "/api/v1/paginas/" + hija, admin)).Content.ReadFromJsonAsync<JsonElement>(Ct);
        var ruta = p.GetProperty("ruta").EnumerateArray().Select(x => (x.GetProperty("tipo").GetString(), x.GetProperty("guid").GetGuid(), x.GetProperty("nombre").GetString())).ToList();
        Assert.Equal(
            [("workspace", ws, "Mi WS"), ("espacio", esp, "Mi Espacio"), ("coleccion", col, "Mi Colección"), ("pagina", abuela, "Abuela"), ("pagina", madre, "Madre")],
            ruta);
        Assert.Equal(madre, p.GetProperty("paginaPadreGuid").GetGuid());
        Assert.Equal(col, p.GetProperty("coleccionGuid").GetGuid());
        Assert.Empty(p.GetProperty("subpaginas").EnumerateArray());

        var m = await (await EnviarAsync(HttpMethod.Get, "/api/v1/paginas/" + madre, admin)).Content.ReadFromJsonAsync<JsonElement>(Ct);
        Assert.Equal([hija, hermana], Guids(m.GetProperty("subpaginas")));

        // El árbol anida las páginas.
        var raiz = (await ArbolAsync(admin)).EnumerateArray().Single(x => x.GetProperty("guid").GetGuid() == ws)
            .GetProperty("espacios")[0].GetProperty("colecciones")[0].GetProperty("paginas");
        Assert.Equal([abuela], Guids(raiz));
        Assert.Equal([hija, hermana], Guids(raiz[0].GetProperty("paginas")[0].GetProperty("paginas")));
    }

    [Fact]
    public async Task Validacion_de_nombres()
    {
        var admin = await AdminAsync();
        Assert.Equal(HttpStatusCode.BadRequest, await CodigoAsync(HttpMethod.Post, "/api/v1/workspaces", admin, new { nombre = "   " }));
        Assert.Equal(HttpStatusCode.BadRequest, await CodigoAsync(HttpMethod.Post, "/api/v1/workspaces", admin, new { nombre = new string('a', 151) }));
        Assert.Equal(HttpStatusCode.BadRequest, await CodigoAsync(HttpMethod.Post, "/api/v1/workspaces", admin, new { nombre = "Ok", descripcion = new string('a', 501) }));
        var ws = await WorkspaceAsync(admin, "  Con espacios  ");
        Assert.Equal("Con espacios", (await ArbolAsync(admin)).EnumerateArray().Single(x => x.GetProperty("guid").GetGuid() == ws).GetProperty("nombre").GetString());
        Assert.Equal(HttpStatusCode.Unauthorized, await CodigoAsync(HttpMethod.Get, "/api/v1/arbol", null));
    }

    // ---------- módulo 5: contenido de páginas

    private static object Doc(string texto) => new
    {
        type = "doc",
        content = new object[] { new { type = "paragraph", content = new object[] { new { type = "text", text = texto } } } }
    };

    private Task<HttpResponseMessage> GuardarAsync(string cookie, Guid pag, object contenido, int version) =>
        EnviarAsync(HttpMethod.Put, $"/api/v1/paginas/{pag}/contenido", cookie, new { contenido, version });

    private async Task<JsonElement> ContenidoAsync(string cookie, Guid pag)
    {
        var r = await EnviarAsync(HttpMethod.Get, $"/api/v1/paginas/{pag}/contenido", cookie);
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        return await r.Content.ReadFromJsonAsync<JsonElement>(Ct);
    }

    private async Task<string> TextoPlanoAsync(Guid pag)
    {
        await using var cn = new MySqlConnection(_db.ConnectionString);
        return await cn.ExecuteScalarAsync<string>(
            "SELECT c.TextoPlano FROM PaginaContenido c JOIN Pagina p ON p.Id = c.PaginaId WHERE p.Guid = @pag", new { pag }) ?? "";
    }

    [Fact]
    public async Task Contenido_vacio_guardar_y_leer()
    {
        var admin = await AdminAsync();
        var (_, _, _, pag) = await CadenaAsync(admin);

        var vacio = await ContenidoAsync(admin, pag);
        Assert.Equal(JsonValueKind.Null, vacio.GetProperty("contenido").ValueKind);
        Assert.Equal(0, vacio.GetProperty("version").GetInt32());

        var r = await GuardarAsync(admin, pag, Doc("Hola"), 0);
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        Assert.Equal(1, (await r.Content.ReadFromJsonAsync<JsonElement>(Ct)).GetProperty("version").GetInt32());

        var c = await ContenidoAsync(admin, pag);
        Assert.Equal(1, c.GetProperty("version").GetInt32());
        Assert.Equal("Hola", c.GetProperty("contenido").GetProperty("content")[0].GetProperty("content")[0].GetProperty("text").GetString());
        Assert.Equal("Hola", await TextoPlanoAsync(pag));

        r = await GuardarAsync(admin, pag, Doc("Chau"), 1);
        Assert.Equal(2, (await r.Content.ReadFromJsonAsync<JsonElement>(Ct)).GetProperty("version").GetInt32());
        Assert.Equal("Chau", await TextoPlanoAsync(pag));
    }

    [Fact]
    public async Task Contenido_con_version_vieja_da_409_y_no_cambia_nada()
    {
        var admin = await AdminAsync();
        var (_, _, _, pag) = await CadenaAsync(admin);
        Assert.Equal(HttpStatusCode.OK, (await GuardarAsync(admin, pag, Doc("Uno"), 0)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await GuardarAsync(admin, pag, Doc("Dos"), 1)).StatusCode);

        var r = await GuardarAsync(admin, pag, Doc("Viejo"), 1);
        Assert.Equal(HttpStatusCode.Conflict, r.StatusCode);
        Assert.Equal("Otra persona guardó cambios en esta página. Recarga para ver la última versión.",
            (await r.Content.ReadFromJsonAsync<JsonElement>(Ct)).GetProperty("detail").GetString());
        Assert.Equal(HttpStatusCode.Conflict, (await GuardarAsync(admin, pag, Doc("Viejo"), 0)).StatusCode);

        var c = await ContenidoAsync(admin, pag);
        Assert.Equal(2, c.GetProperty("version").GetInt32());
        Assert.Equal("Dos", await TextoPlanoAsync(pag));
    }

    [Fact]
    public async Task Contenido_guardados_concurrentes_con_la_misma_version_solo_pasa_uno()
    {
        var admin = await AdminAsync();
        var (_, _, _, pag) = await CadenaAsync(admin);
        var rs = await Task.WhenAll(Enumerable.Range(0, 4).Select(i => GuardarAsync(admin, pag, Doc("T" + i), 0)));
        Assert.Equal(1, rs.Count(r => r.StatusCode == HttpStatusCode.OK));
        Assert.Equal(3, rs.Count(r => r.StatusCode == HttpStatusCode.Conflict));
        Assert.Equal(1, (await ContenidoAsync(admin, pag)).GetProperty("version").GetInt32());
    }

    [Fact]
    public async Task Contenido_aislamiento_alcance_y_permisos()
    {
        var a = await AdminAsync();
        var b = await AdminAsync();
        var (colab, cColab) = await UsuarioAsync(a, "colaborador");
        var (ws, _, col, pag) = await CadenaAsync(a);
        var eliminada = await PaginaAsync(a, col, "Borrar");
        Assert.Equal(HttpStatusCode.NoContent, await CodigoAsync(HttpMethod.Delete, "/api/v1/paginas/" + eliminada, a));

        Assert.Equal(HttpStatusCode.NotFound, (await EnviarAsync(HttpMethod.Get, $"/api/v1/paginas/{pag}/contenido", b)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await GuardarAsync(b, pag, Doc("X"), 0)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await EnviarAsync(HttpMethod.Get, $"/api/v1/paginas/{pag}/contenido", cColab)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await GuardarAsync(cColab, pag, Doc("X"), 0)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await EnviarAsync(HttpMethod.Get, $"/api/v1/paginas/{eliminada}/contenido", a)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await GuardarAsync(a, eliminada, Doc("X"), 0)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await EnviarAsync(HttpMethod.Get, $"/api/v1/paginas/{pag}/contenido", null)).StatusCode);

        await AsignarAsync(a, ws, colab);
        Assert.Equal(HttpStatusCode.OK, (await GuardarAsync(cColab, pag, Doc("Colab"), 0)).StatusCode);
        Assert.Equal("Colab", await TextoPlanoAsync(pag));
    }

    [Fact]
    public async Task Contenido_invalido_da_400()
    {
        var admin = await AdminAsync();
        var (_, _, _, pag) = await CadenaAsync(admin);
        object Enlace(string href) => new { type = "doc", content = new object[] { new { type = "paragraph", content = new object[] {
            new { type = "text", text = "x", marks = new object[] { new { type = "link", attrs = new { href } } } } } } } };
        object Imagen(object attrs) => new { type = "doc", content = new object[] { new { type = "image", attrs } } };

        Assert.Equal(HttpStatusCode.BadRequest, (await GuardarAsync(admin, pag, Enlace("javascript:alert(1)"), 0)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await GuardarAsync(admin, pag, Imagen(new { src = "https://x/y.png" }), 0)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await GuardarAsync(admin, pag, Imagen(new { attachmentId = Guid.NewGuid(), src = "data:x" }), 0)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await GuardarAsync(admin, pag, Imagen(new { attachmentId = "no-es-guid" }), 0)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await GuardarAsync(admin, pag, new { type = "paragraph" }, 0)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await GuardarAsync(admin, pag, Doc(new string('a', 2 * 1024 * 1024 + 10)), 0)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await GuardarAsync(admin, pag, Enlace("https://datahub.test/x"), 0)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await GuardarAsync(admin, pag, Imagen(new { attachmentId = Guid.NewGuid() }), 1)).StatusCode);
        Assert.Equal(2, (await ContenidoAsync(admin, pag)).GetProperty("version").GetInt32());
    }

    [Fact]
    public async Task Guardar_contenido_actualiza_las_recientes()
    {
        var admin = await AdminAsync();
        var ws = await WorkspaceAsync(admin);
        var col = await ColeccionAsync(admin, await EspacioAsync(admin, ws));
        var primera = await PaginaAsync(admin, col, "Primera");
        await Task.Delay(1100, Ct);
        var segunda = await PaginaAsync(admin, col, "Segunda");
        var antes = await (await EnviarAsync(HttpMethod.Get, "/api/v1/paginas/recientes", admin)).Content.ReadFromJsonAsync<JsonElement>(Ct);
        Assert.Equal([segunda, primera], Guids(antes));

        await Task.Delay(1100, Ct);
        Assert.Equal(HttpStatusCode.OK, (await GuardarAsync(admin, primera, Doc("Editada"), 0)).StatusCode);
        var despues = await (await EnviarAsync(HttpMethod.Get, "/api/v1/paginas/recientes", admin)).Content.ReadFromJsonAsync<JsonElement>(Ct);
        Assert.Equal([primera, segunda], Guids(despues));
    }
}
