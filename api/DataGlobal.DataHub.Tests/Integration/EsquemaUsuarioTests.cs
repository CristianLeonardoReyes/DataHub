using Dapper;
using MySqlConnector;

namespace DataGlobal.DataHub.Tests.Integration;

public class EsquemaUsuarioTests(MySqlFixture db) : IClassFixture<MySqlFixture>
{
    private async Task<long> CrearClienteAsync()
    {
        await using var cn = new MySqlConnection(db.ConnectionString);
        return await cn.ExecuteScalarAsync<long>(
            "INSERT INTO Cliente (Nombre, Slug) VALUES ('Cliente', @slug); SELECT LAST_INSERT_ID();",
            new { slug = Guid.NewGuid().ToString("N") });
    }

    private async Task InsertarUsuarioAsync(string correo, string perfil, long? clienteId)
    {
        await using var cn = new MySqlConnection(db.ConnectionString);
        await cn.ExecuteAsync(
            "INSERT INTO Usuario (ClienteId, Correo, Nombre, Perfil) VALUES (@clienteId, @correo, 'U', @perfil)",
            new { clienteId, correo, perfil });
    }

    private static string Correo() => $"{Guid.NewGuid():N}@test.co";

    [Fact]
    public async Task SuperAdmin_con_cliente_falla()
    {
        var cliente = await CrearClienteAsync();
        await Assert.ThrowsAsync<MySqlException>(() => InsertarUsuarioAsync(Correo(), "super_admin", cliente));
    }

    [Fact]
    public async Task Admin_sin_cliente_falla()
    {
        await Assert.ThrowsAsync<MySqlException>(() => InsertarUsuarioAsync(Correo(), "admin", null));
    }

    [Fact]
    public async Task Correo_duplicado_falla()
    {
        var cliente = await CrearClienteAsync();
        var correo = Correo();
        await InsertarUsuarioAsync(correo, "admin", cliente);
        await Assert.ThrowsAsync<MySqlException>(() => InsertarUsuarioAsync(correo, "admin", cliente));
    }

    [Fact]
    public async Task Insert_valido_genera_guid()
    {
        var cliente = await CrearClienteAsync();
        var correo = Correo();
        await InsertarUsuarioAsync(correo, "colaborador", cliente);

        // MySqlConnector lee CHAR(36) como System.Guid
        await using var cn = new MySqlConnection(db.ConnectionString);
        var guid = await cn.ExecuteScalarAsync<Guid>("SELECT Guid FROM Usuario WHERE Correo = @correo", new { correo });

        Assert.NotEqual(Guid.Empty, guid);
    }
}
