using Testcontainers.Azurite;

namespace DataGlobal.DataHub.Tests.Integration;

/// <summary>Azurite (emulador de Azure Blob) en Docker.</summary>
public class AzuriteFixture : IAsyncLifetime
{
    private readonly AzuriteContainer _container = new AzuriteBuilder("mcr.microsoft.com/azure-storage/azurite:3.37.0")
        .WithCommand("--skipApiVersionCheck") // el SDK puede pedir una versión de API más nueva que la imagen
        .Build();

    public string ConnectionString => _container.GetConnectionString();

    public async ValueTask InitializeAsync() => await _container.StartAsync();

    public async ValueTask DisposeAsync() => await _container.DisposeAsync();
}
