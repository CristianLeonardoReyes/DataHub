using System.Data;
using Dapper;

namespace DataGlobal.DataHub.Repository;

public abstract class BaseRepository(DapperContext context)
{
    protected async Task<IReadOnlyList<T>> QueryListAsync<T>(string sp, object? parametros = null)
    {
        using var cn = context.CreateConnection();
        var filas = await cn.QueryAsync<T>(sp, parametros, commandType: CommandType.StoredProcedure);
        return filas.AsList();
    }

    protected async Task<T?> QueryFirstOrNullAsync<T>(string sp, object? parametros = null)
    {
        using var cn = context.CreateConnection();
        return await cn.QueryFirstOrDefaultAsync<T>(sp, parametros, commandType: CommandType.StoredProcedure);
    }

    /// <summary>Ejecuta el SP y devuelve las filas afectadas.</summary>
    protected async Task<int> ExecuteAsync(string sp, object? parametros = null)
    {
        using var cn = context.CreateConnection();
        return await cn.ExecuteAsync(sp, parametros, commandType: CommandType.StoredProcedure);
    }

    /// <summary>Ejecuta el SP y devuelve la primera columna de la primera fila.</summary>
    protected async Task<T?> ExecuteScalarAsync<T>(string sp, object? parametros = null)
    {
        using var cn = context.CreateConnection();
        return await cn.ExecuteScalarAsync<T>(sp, parametros, commandType: CommandType.StoredProcedure);
    }
}
