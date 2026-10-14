using DataGlobal.DataHub.Common.Const;
using DataGlobal.DataHub.Repository.Interfaces;

namespace DataGlobal.DataHub.Repository.Implementations;

public class UsuarioTokenRepository(DapperContext context) : BaseRepository(context), IUsuarioTokenRepository
{
    public Task CrearAsync(long usuarioId, string tipo, string tokenHash, int horas) =>
        ExecuteAsync(SpNombres.UsuarioTokenCrear,
            new { p_UsuarioId = usuarioId, p_Tipo = tipo, p_TokenHash = tokenHash, p_Horas = horas });

    public Task InvalidarPendientesAsync(long usuarioId, string tipo) =>
        ExecuteAsync(SpNombres.UsuarioTokenInvalidarPendientes, new { p_UsuarioId = usuarioId, p_Tipo = tipo });
}
