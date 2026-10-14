using Testcontainers.MySql;

namespace DataGlobal.DataHub.Tests.Integration;

/// <summary>MySQL 8 en Docker con todas las migraciones de db/Migraciones aplicadas por orden de nombre.</summary>
public class MySqlFixture : IAsyncLifetime
{
    private readonly MySqlContainer _container = new MySqlBuilder("mysql:8.0")
        // Misma collation por defecto que el servidor real, para detectar mezclas de collation en los SP.
        .WithCommand("--character-set-server=utf8mb4", "--collation-server=utf8mb4_unicode_ci")
        .Build();

    public string ConnectionString => _container.GetConnectionString();

    public async ValueTask InitializeAsync()
    {
        await _container.StartAsync();

        // Con el cliente mysql del contenedor: entiende DELIMITER (MySqlCommand no).
        var dir = Path.Combine(RaizRepo(), "db", "Migraciones");
        foreach (var archivo in Directory.GetFiles(dir, "*.sql").OrderBy(Path.GetFileName, StringComparer.Ordinal))
        {
            var r = await _container.ExecScriptAsync(await File.ReadAllTextAsync(archivo));
            if (r.ExitCode != 0)
                throw new InvalidOperationException($"Falló {Path.GetFileName(archivo)}: {r.Stderr}");
        }
    }

    public async ValueTask DisposeAsync() => await _container.DisposeAsync();

    private static string RaizRepo()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null && !Directory.Exists(Path.Combine(dir.FullName, "db", "Migraciones")))
            dir = dir.Parent;
        return dir?.FullName ?? throw new DirectoryNotFoundException("No se encontró db/Migraciones.");
    }
}
