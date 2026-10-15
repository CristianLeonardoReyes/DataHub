using DataGlobal.DataHub.Common.Enums;
using DataGlobal.DataHub.Common.Models;
using DataGlobal.DataHub.Services;

namespace DataGlobal.DataHub.Tests.Unit;

public class AutorizacionTests
{
    private static readonly Accion[] Colaborador =
        [Accion.PaginasEditar, Accion.PaginasEliminar, Accion.MetadataEditar, Accion.ArchivosGestionar,
         Accion.ArchivosEliminar, Accion.Buscar, Accion.ExportarMarkdown];

    private static bool Esperado(string perfil, Accion a) => perfil switch
    {
        "super_admin" => true,
        "admin" => a != Accion.ClientesGestionar,
        "coordinador" => a >= Accion.EspaciosColeccionesGestionar,
        _ => Colaborador.Contains(a)
    };

    public static TheoryData<string, Accion> Casos()
    {
        var d = new TheoryData<string, Accion>();
        foreach (var p in new[] { "super_admin", "admin", "coordinador", "colaborador" })
            foreach (var a in Enum.GetValues<Accion>()) d.Add(p, a);
        return d;
    }

    [Theory, MemberData(nameof(Casos))]
    public void Matriz_completa(string perfil, Accion accion)
    {
        var u = new UsuarioActual { Perfil = perfil, ClienteId = perfil == "super_admin" ? null : 1 };
        Assert.Equal(Esperado(perfil, accion), Autorizacion.Can(u, accion));
    }

    [Fact]
    public void Alcance_de_cliente()
    {
        var admin = new UsuarioActual { Perfil = "admin", ClienteId = 1 };
        Assert.True(Autorizacion.Can(admin, Accion.UsuariosGestionar, 1));
        Assert.False(Autorizacion.Can(admin, Accion.UsuariosGestionar, 2));

        var sa = new UsuarioActual { Perfil = "super_admin" };
        Assert.True(Autorizacion.Can(sa, Accion.UsuariosGestionar, 2));
    }
}
