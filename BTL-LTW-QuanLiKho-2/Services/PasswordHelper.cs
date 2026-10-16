using System.Security.Cryptography;
using System.Text;

namespace BTL_LTW_QuanLiKho_2.Services;

public static class PasswordHelper
{
    public static string HashPassword(string password)
    {
        if (string.IsNullOrEmpty(password)) return string.Empty;
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public static bool VerifyPassword(string inputPassword, string? storedHash)
    {
        if (string.IsNullOrEmpty(inputPassword) || string.IsNullOrEmpty(storedHash))
            return false;


        if (string.Equals(inputPassword, storedHash, StringComparison.Ordinal))
            return true;

        var inputHash = HashPassword(inputPassword);
        return string.Equals(inputHash, storedHash, StringComparison.OrdinalIgnoreCase);
    }
}
