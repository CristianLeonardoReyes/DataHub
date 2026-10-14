namespace DataGlobal.DataHub.Repository.Interfaces;

public interface IUsuarioTokenRepository
{
    Task CrearAsync(long usuarioId, string tipo, string tokenHash, int horas);
    Task InvalidarPendientesAsync(long usuarioId, string tipo);
}
