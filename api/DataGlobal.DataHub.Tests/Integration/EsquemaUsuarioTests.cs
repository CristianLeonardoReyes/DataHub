using Dapper;
using MySqlConnector;

namespace DataGlobal.DataHub.Tests.Integration;

public class EsquemaUsuarioTests(MySqlFixture db) : IClassFixture<MySqlFixture>
{
    private async Task<long> CrearOrgAsync()
    {
        await using var cn = new MySqlConnection(db.ConnectionString);
        return await cn.ExecuteScalarAsync<long>(
            "INSERT INTO organization (name, slug) VALUES ('Org', @slug); SELECT LAST_INSERT_ID();",
            new { slug = Guid.NewGuid().ToString("N") });
    }

    private async Task InsertarUsuarioAsync(string email, string role, long? orgId)
    {
        await using var cn = new MySqlConnection(db.ConnectionString);
        await cn.ExecuteAsync(
            "INSERT INTO `user` (organization_id, email, name, role) VALUES (@orgId, @email, 'U', @role)",
            new { orgId, email, role });
    }

    private static string Email() => $"{Guid.NewGuid():N}@test.co";

    [Fact]
    public async Task SuperAdmin_con_organizacion_falla()
    {
        var org = await CrearOrgAsync();
        await Assert.ThrowsAsync<MySqlException>(() => InsertarUsuarioAsync(Email(), "super_admin", org));
    }

    [Fact]
    public async Task Admin_sin_organizacion_falla()
    {
        await Assert.ThrowsAsync<MySqlException>(() => InsertarUsuarioAsync(Email(), "admin", null));
    }

    [Fact]
    public async Task Email_duplicado_falla()
    {
        var org = await CrearOrgAsync();
        var email = Email();
        await InsertarUsuarioAsync(email, "admin", org);
        await Assert.ThrowsAsync<MySqlException>(() => InsertarUsuarioAsync(email, "admin", org));
    }

    [Fact]
    public async Task Insert_valido_genera_guid()
    {
        var org = await CrearOrgAsync();
        var email = Email();
        await InsertarUsuarioAsync(email, "colaborador", org);

        // MySqlConnector lee CHAR(36) como System.Guid
        await using var cn = new MySqlConnection(db.ConnectionString);
        var guid = await cn.ExecuteScalarAsync<Guid>("SELECT guid FROM `user` WHERE email = @email", new { email });

        Assert.NotEqual(Guid.Empty, guid);
    }
}
