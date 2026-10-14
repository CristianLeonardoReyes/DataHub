using Microsoft.AspNetCore.Mvc.Testing;

namespace DataGlobal.DataHub.Tests.Unit;

public class HealthTests
{
    [Fact]
    public async Task Health_devuelve_200()
    {
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        var resp = await client.GetAsync("/health", TestContext.Current.CancellationToken);

        Assert.Equal(System.Net.HttpStatusCode.OK, resp.StatusCode);
    }
}
