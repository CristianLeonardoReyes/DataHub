using System.Security.Cryptography;
using System.Text;

namespace DataGlobal.DataHub.Services.Seguridad;

public static class TokenUtil
{
    /// <summary>32 bytes aleatorios en hex minúsculas (64 caracteres).</summary>
    public static string Generar() => Convert.ToHexStringLower(RandomNumberGenerator.GetBytes(32));

    /// <summary>SHA-256 del token (UTF-8) en hex minúsculas; equivale a SHA2(token, 256) de MySQL.</summary>
    public static string Hash(string token) => Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
