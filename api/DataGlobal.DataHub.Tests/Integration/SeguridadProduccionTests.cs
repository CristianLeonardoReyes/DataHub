using System.Net;
using System.Net.Http.Json;
using Dapper;
using DataGlobal.DataHub.Services.Seguridad;
using Microsoft.AspNetCore.Hosting;
using MySqlConnector;

namespace DataGlobal.DataHub.Tests.Integration;

/// <summary>RNF-04 en Production: sin OpenAPI, con HSTS y cookie de sesión HttpOnly + Secure + SameSite=Strict.</summary>
public class SeguridadProduccionTests(MySqlFixture db) : IClassFixture<MySqlFixture>
{
    private const string Clave = "ClaveSegura@123";
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    // HSTS ignora localhost por defecto: el host de prueba debe ser otro.
    private static HttpClient Crear(MySqlFixture db, ApiFactory factory) =>
        factory.WithWebHostBuilder(b => b.UseEnvironment("Production"))
            .CreateClient(new() { BaseAddress = new Uri("https://datahub.test"), HandleCookies = false });

    [Fact]
    public async Task OpenApi_no_se_publica_y_las_respuestas_llevan_hsts()
    {
        using var factory = new ApiFactory(db.ConnectionString);
        using var http = Crear(db, factory);

        Assert.Equal(HttpStatusCode.NotFound, (await http.GetAsync("/openapi/v1.json", Ct)).StatusCode);
        var r = await http.GetAsync("/health", Ct);
        Assert.StartsWith("max-age=", r.Headers.GetValues("Strict-Transport-Security").Single());
    }

    [Fact]
    public async Task Cookie_de_sesion_es_httponly_secure_y_samesite_strict()
    {
        using var factory = new ApiFactory(db.ConnectionString);
        using var http = Crear(db, factory);
        var correo = $"{Guid.NewGuid():N}@test.co";
        var token = TokenUtil.Generar();
        await using (var cn = new MySqlConnection(db.ConnectionString))
        {
            var id = await cn.ExecuteScalarAsync<long>(
                "INSERT INTO Usuario (Correo, Nombre, Perfil) VALUES (@correo, 'Pendiente', 'super_admin'); SELECT LAST_INSERT_ID();", new { correo });
            await cn.ExecuteAsync(
                "INSERT INTO UsuarioToken (UsuarioId, Tipo, TokenHash, FechaExpiracion) VALUES (@id, 'invitacion', @hash, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 72 HOUR))",
                new { id, hash = TokenUtil.Hash(token) });
        }
        Assert.Equal(HttpStatusCode.NoContent,
            (await http.PostAsJsonAsync("/api/v1/auth/aceptar-invitacion", new { token, nombre = "Root", contrasena = Clave }, Ct)).StatusCode);

        var login = await http.PostAsJsonAsync("/api/v1/auth/login", new { correo, contrasena = Clave }, Ct);
        Assert.Equal(HttpStatusCode.NoContent, login.StatusCode);
        var cookie = login.Headers.GetValues("Set-Cookie").Single(c => c.StartsWith("datahub_sesion="));
        var atributos = cookie.Split(';').Select(x => x.Trim().ToLowerInvariant()).ToList();
        Assert.Contains("httponly", atributos);
        Assert.Contains("secure", atributos);
        Assert.Contains("samesite=strict", atributos);
    }
}
