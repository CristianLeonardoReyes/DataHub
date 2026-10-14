using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using DataGlobal.DataHub.Api.Controllers;
using DataGlobal.DataHub.Api.Middleware;
using DataGlobal.DataHub.Common.Models;
using DataGlobal.DataHub.Common.Settings;
using DataGlobal.DataHub.Repository;
using DataGlobal.DataHub.Repository.Implementations;
using DataGlobal.DataHub.Repository.Interfaces;
using DataGlobal.DataHub.Services.Correo;
using DataGlobal.DataHub.Services.Services.Implementations;
using DataGlobal.DataHub.Services.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<SolicitudInvalidaHandler>();
builder.Services.AddHealthChecks();
builder.Services.AddSingleton(sp => new DapperContext(sp.GetRequiredService<IConfiguration>().GetConnectionString("DataHub") ?? string.Empty));

// Opciones (se leen al resolverlas, no al arrancar).
builder.Services.AddOptions<JwtOpciones>().Bind(config.GetSection("Jwt"))
    .Validate(o => Encoding.UTF8.GetByteCount(o.Clave) >= 32, "Jwt:Clave debe tener al menos 32 bytes (user-secrets).")
    .ValidateOnStart(); // sin clave la API no arranca, en vez de responder 500 a todo
builder.Services.Configure<CorreoOpciones>(config.GetSection("Correo"));
builder.Services.Configure<AppOpciones>(config.GetSection("App"));

// Acceso
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddScoped<IUsuarioTokenRepository, UsuarioTokenRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<UsuarioActual>();
builder.Services.AddSingleton<IEnviadorCorreo>(sp =>
{
    var o = sp.GetRequiredService<IOptions<CorreoOpciones>>().Value;
    return o.Modo switch
    {
        "Ses" => new EnviadorCorreoSes(o.Remitente, o.Region),
        "Archivo" => new EnviadorCorreoArchivo(o.Carpeta ??
            Path.GetFullPath(Path.Combine(sp.GetRequiredService<IWebHostEnvironment>().ContentRootPath, "..", "..", "correos-dev"))),
        _ => throw new InvalidOperationException("Correo:Modo debe ser Archivo o Ses.")
    };
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<JwtOpciones>>((o, jwt) =>
    {
        o.MapInboundClaims = false;
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwt.Value.Emisor,
            ValidAudience = jwt.Value.Audiencia,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Value.Clave)),
            ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
            ClockSkew = TimeSpan.Zero
        };
        o.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                ctx.Token = ctx.Request.Cookies[AuthController.Cookie];
                return Task.CompletedTask;
            },
            // 401 con ProblemDetails, igual que el resto de errores de la API.
            OnChallenge = async ctx =>
            {
                ctx.HandleResponse();
                ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await ctx.HttpContext.RequestServices.GetRequiredService<IProblemDetailsService>().TryWriteAsync(new()
                {
                    HttpContext = ctx.HttpContext,
                    ProblemDetails = { Status = 401, Title = "No autenticado", Detail = "Inicia sesión para continuar." }
                });
            },
            // RF-ACC-06 / PRD 9.3: el usuario debe existir y estar activo en cada petición.
            OnTokenValidated = async ctx =>
            {
                var sp = ctx.HttpContext.RequestServices;
                var u = Guid.TryParse(ctx.Principal?.FindFirstValue("usuarioId"), out var guid)
                    ? await sp.GetRequiredService<IAuthService>().ObtenerActivoAsync(guid)
                    : null;
                if (u is null) { ctx.Fail("Usuario inexistente o inactivo."); return; }

                var actual = sp.GetRequiredService<UsuarioActual>();
                actual.Id = u.Id;
                actual.Guid = u.Guid;
                actual.ClienteId = u.ClienteId;
                actual.ClienteGuid = u.ClienteGuid;
                actual.ClienteNombre = u.ClienteNombre;
                actual.Correo = u.Correo;
                actual.Nombre = u.Nombre;
                actual.Perfil = u.Perfil;
            }
        };
    });
builder.Services.AddAuthorization();

// RNF-03: ventana fija por IP.
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.OnRejected = async (ctx, _) =>
    {
        await ctx.HttpContext.RequestServices.GetRequiredService<IProblemDetailsService>().TryWriteAsync(new()
        {
            HttpContext = ctx.HttpContext,
            ProblemDetails = { Status = 429, Title = "Demasiadas solicitudes", Detail = "Intenta de nuevo en un minuto." }
        });
    };
    o.AddPolicy("login", c => Ventana(c, 10));
    o.AddPolicy("olvide", c => Ventana(c, 5));
    o.AddPolicy("token", c => Ventana(c, 10)); // aceptar invitación y restablecer comparten el cupo
});

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapHealthChecks("/health");

// El SPA de React se sirve desde wwwroot (puede no existir en desarrollo).
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

// Todo /api exige sesión salvo los [AllowAnonymous]; /health y el SPA quedan fuera.
app.MapControllers().RequireAuthorization();
app.MapFallback("/api/{**path}", () => Results.NotFound()); // una ruta de API inexistente no devuelve el SPA
app.MapFallbackToFile("index.html");

app.Run();

static RateLimitPartition<string> Ventana(HttpContext c, int limite) =>
    RateLimitPartition.GetFixedWindowLimiter(c.Connection.RemoteIpAddress?.ToString() ?? "desconocida",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = limite, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 });

public partial class Program;
