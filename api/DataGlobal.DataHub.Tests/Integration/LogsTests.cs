using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace DataGlobal.DataHub.Tests.Integration;

/// <summary>RNF-05: los logs de producción no llevan tokens, contraseñas ni búsquedas; los errores traen traceId.</summary>
public class LogsTests(MySqlFixture db) : IClassFixture<MySqlFixture>
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    private sealed class ProveedorMemoria : ILoggerProvider, ISupportExternalScope, ILogger
    {
        private IExternalScopeProvider _scopes = new LoggerExternalScopeProvider();
        public ConcurrentQueue<string> Lineas { get; } = new();

        public ILogger CreateLogger(string categoria) => this;
        public void SetScopeProvider(IExternalScopeProvider scopes) => _scopes = scopes;
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => _scopes.Push(state);
        public bool IsEnabled(LogLevel nivel) => true;
        public void Dispose() { }

        public void Log<TState>(LogLevel nivel, EventId id, TState state, Exception? ex, Func<TState, Exception?, string> formato)
        {
            var scopes = new List<string>();
            _scopes.ForEachScope((s, l) => l.Add(s?.ToString() ?? ""), scopes);
            Lineas.Enqueue($"{formato(state, ex)} {ex} {string.Join(' ', scopes)}");
        }
    }

    private (ApiFactory Factory, HttpClient Http, ProveedorMemoria Logs) Crear()
    {
        var logs = new ProveedorMemoria();
        var factory = new ApiFactory(db.ConnectionString);
        var produccion = factory.WithWebHostBuilder(b =>
        {
            b.UseEnvironment("Production");
            b.ConfigureServices(s => s.AddSingleton<ILoggerProvider>(logs));
        });
        return (factory, produccion.CreateClient(new() { BaseAddress = new Uri("https://localhost") }), logs);
    }

    [Theory]
    [InlineData("/aceptar-invitacion?token=TOKENPRUEBA123", "TOKENPRUEBA123")]
    [InlineData("/restablecer-contrasena?token=TOKENPRUEBA123", "TOKENPRUEBA123")]
    [InlineData("/api/v1/buscar?q=consultasecreta", "consultasecreta")]
    public async Task La_url_con_token_o_busqueda_no_llega_a_los_logs(string ruta, string secreto)
    {
        var (factory, http, logs) = Crear();
        using var _f = factory; using var _h = http;
        await http.GetAsync(ruta, Ct);

        Assert.DoesNotContain(logs.Lineas, l => l.Contains(secreto));
    }

    [Fact]
    public async Task Login_fallido_no_registra_la_contrasena_y_el_problema_trae_traceId()
    {
        var (factory, http, logs) = Crear();
        using var _f = factory; using var _h = http;
        var r = await http.PostAsJsonAsync("/api/v1/auth/login",
            new { correo = "nadie@test.co", contrasena = "ClaveSecreta!987", recordarme = false }, Ct);

        Assert.Equal(HttpStatusCode.Unauthorized, r.StatusCode);
        using var json = JsonDocument.Parse(await r.Content.ReadAsStringAsync(Ct));
        Assert.False(string.IsNullOrWhiteSpace(json.RootElement.GetProperty("traceId").GetString()));
        Assert.DoesNotContain(logs.Lineas, l => l.Contains("ClaveSecreta!987"));
    }
}
