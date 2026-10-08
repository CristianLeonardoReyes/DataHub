using MySqlConnector;
using Testcontainers.MySql;

namespace DataGlobal.DataHub.Tests.Integration;

/// <summary>MySQL 8 en Docker con todas las migraciones de db/Migraciones aplicadas por orden de nombre.</summary>
public class MySqlFixture : IAsyncLifetime
{
    private readonly MySqlContainer _container = new MySqlBuilder("mysql:8.0").Build();

    public string ConnectionString => _container.GetConnectionString();

    public async ValueTask InitializeAsync()
    {
        await _container.StartAsync();

        var dir = Path.Combine(RaizRepo(), "db", "Migraciones");
        await using var cn = new MySqlConnection(ConnectionString);
        await cn.OpenAsync();
        foreach (var archivo in Directory.GetFiles(dir, "*.sql").OrderBy(Path.GetFileName, StringComparer.Ordinal))
        {
            await using var cmd = new MySqlCommand(await File.ReadAllTextAsync(archivo), cn);
            await cmd.ExecuteNonQueryAsync();
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
