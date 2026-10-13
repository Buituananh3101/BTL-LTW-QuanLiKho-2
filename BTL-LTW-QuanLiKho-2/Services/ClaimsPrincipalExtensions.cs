using System.Security.Claims;

namespace BTL_LTW_QuanLiKho_2.Services;

public static class ClaimsPrincipalExtensions
{
    public static int GetMaTaiKhoan(this ClaimsPrincipal user)
    {
        var claim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 1;
    }

    public static int GetMaNv(this ClaimsPrincipal user)
    {
        var claim = user.FindFirst(ClaimTypes.UserData)?.Value;
        return int.TryParse(claim, out int id) ? id : 1;
    }

    public static string GetTenHienThi(this ClaimsPrincipal user)
    {
        return user.FindFirst(ClaimTypes.GivenName)?.Value
            ?? user.FindFirst(ClaimTypes.Name)?.Value
            ?? "Người dùng";
    }

    public static string GetVaiTro(this ClaimsPrincipal user)
    {
        var role = user.FindFirst(ClaimTypes.Role)?.Value;
        if (string.IsNullOrWhiteSpace(role)) return "Nhân viên";
        return role;
    }
}
