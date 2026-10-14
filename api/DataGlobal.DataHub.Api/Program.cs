using DataGlobal.DataHub.Repository;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks();
builder.Services.AddSingleton(new DapperContext(builder.Configuration.GetConnectionString("DataHub") ?? string.Empty));

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
app.MapFallback("/api/{**path}", () => Results.NotFound()); // una ruta de API inexistente no devuelve el SPA
app.MapFallbackToFile("index.html");

app.Run();

public partial class Program;
