using MySqlConnector;

namespace DataGlobal.DataHub.Repository;

public class DapperContext(string connectionString)
{
    public MySqlConnection CreateConnection() => new(connectionString);
}
