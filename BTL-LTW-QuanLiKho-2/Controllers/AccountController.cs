using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BTL_LTW_QuanLiKho_2.Models;
using BTL_LTW_QuanLiKho_2.Services;
using BTL_LTW_QuanLiKho_2.ViewModels;

namespace BTL_LTW_QuanLiKho_2.Controllers;

public class AccountController : Controller
{
    private readonly QuanLyKhoPhuQuocLtwContext _context;

    public AccountController(QuanLyKhoPhuQuocLtwContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public IActionResult Login(string? returnUrl)
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            return RedirectToAction("Index", "HangHoa");
        }

        ViewBag.ReturnUrl = returnUrl;
        return View(new LoginVM { ReturnUrl = returnUrl });
    }

    [HttpPost]
    [AllowAnonymous]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(LoginVM model)
    {
        if (!ModelState.IsValid)
        {
            return View(model);
        }

        var username = model.TenDangNhap.Trim().ToLowerInvariant();

        var taiKhoan = await _context.TaiKhoans
            .Include(t => t.MaNvNavigation)
            .Include(t => t.MaVaiTroNavigation)
            .FirstOrDefaultAsync(t => t.TenDangNhap.ToLower() == username);

        if (taiKhoan == null || !PasswordHelper.VerifyPassword(model.MatKhau, taiKhoan.MatKhauHash))
        {
            ModelState.AddModelError(string.Empty, "Tên đăng nhập hoặc mật khẩu không chính xác.");
            return View(model);
        }

        if (taiKhoan.TrangThai != "HOAT_DONG")
        {
            ModelState.AddModelError(string.Empty, "Tài khoản này đang bị khóa hoặc ngưng hoạt động.");
            return View(model);
        }

        // Chuẩn hóa tên vai trò tiếng Việt có dấu
        string rawRole = taiKhoan.MaVaiTroNavigation?.TenVaiTro ?? "";
        string vaiTro = "Nhân viên";
        if (rawRole.Contains("Qu") || rawRole.Contains("qu")) vaiTro = "Quản lý";
        else if (rawRole.Contains("kho") || rawRole.Contains("Kho")) vaiTro = "Nhân viên kho";
        else if (rawRole.Contains("b") || rawRole.Contains("B")) vaiTro = "Nhân viên bán hàng";
        else if (!string.IsNullOrWhiteSpace(rawRole)) vaiTro = rawRole;

        // Tạo Claims
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, taiKhoan.MaTaiKhoan.ToString()),
            new(ClaimTypes.Name, taiKhoan.TenDangNhap),
            new(ClaimTypes.GivenName, taiKhoan.MaNvNavigation?.HoTen ?? taiKhoan.TenDangNhap),
            new(ClaimTypes.Role, vaiTro),
            new(ClaimTypes.UserData, taiKhoan.MaNv.ToString())
        };

        var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var authProperties = new AuthenticationProperties
        {
            IsPersistent = model.GhiNho,
            ExpiresUtc = model.GhiNho ? DateTimeOffset.UtcNow.AddDays(7) : DateTimeOffset.UtcNow.AddHours(8)
        };

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(claimsIdentity),
            authProperties);

        // Gán kho mặc định nếu Session chưa có
        if (HttpContext.Session.GetInt32("CurrentWarehouseId") == null)
        {
            var userKho = await _context.TaiKhoanKhos
                .Where(tk => tk.MaTaiKhoan == taiKhoan.MaTaiKhoan)
                .Select(tk => tk.MaKho)
                .FirstOrDefaultAsync();

            HttpContext.Session.SetInt32("CurrentWarehouseId", userKho > 0 ? userKho : 1);
        }

        // Ghi nhật ký thao tác
        try
        {
            _context.NhatKyThaoTacs.Add(new NhatKyThaoTac
            {
                MaTaiKhoan = taiKhoan.MaTaiKhoan,
                ThoiDiem = DateTime.Now,
                ThaoTac = "Đăng nhập",
                LoaiDoiTuong = "TaiKhoan",
                MaDoiTuong = taiKhoan.MaTaiKhoan.ToString(),
                NoiDung = $"Đăng nhập thành công với tài khoản {taiKhoan.TenDangNhap} ({taiKhoan.MaVaiTroNavigation?.TenVaiTro})"
            });
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Bỏ qua lỗi log để không chặn đăng nhập
        }

        if (!string.IsNullOrEmpty(model.ReturnUrl) && Url.IsLocalUrl(model.ReturnUrl))
        {
            return Redirect(model.ReturnUrl);
        }

        return RedirectToAction("Index", "HangHoa");
    }

    [HttpGet]
    public async Task<IActionResult> LogoutGet()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        HttpContext.Session.Clear();
        return RedirectToAction("Login", "Account");
    }

    [HttpGet]
    [AllowAnonymous]
    public IActionResult AccessDenied()
    {
        return View();
    }

    [HttpPost]
    public IActionResult SwitchWarehouse(int warehouseId)
    {
        if (warehouseId > 0)
        {
            HttpContext.Session.SetInt32("CurrentWarehouseId", warehouseId);
        }
        return Ok(new { success = true, warehouseId });
    }

    /// <summary>
    /// Đổi mật khẩu cá nhân cho tài khoản đang đăng nhập
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> DoiMatKhau([FromBody] DoiMatKhauCaNhanVM model)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return Json(new { success = false, message = string.Join("<br/>", errors) });
        }

        int maTaiKhoan = User.GetMaTaiKhoan();
        var taiKhoan = await _context.TaiKhoans.FindAsync(maTaiKhoan);
        if (taiKhoan == null)
        {
            return Json(new { success = false, message = "Không tìm thấy thông tin tài khoản." });
        }

        // 1. Kiểm tra mật khẩu hiện tại
        if (!PasswordHelper.VerifyPassword(model.MatKhauHienTai, taiKhoan.MatKhauHash))
        {
            return Json(new { success = false, message = "Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại." });
        }

        // 2. Kiểm tra mật khẩu mới không được trùng mật khẩu cũ
        if (PasswordHelper.VerifyPassword(model.MatKhauMoi, taiKhoan.MatKhauHash))
        {
            return Json(new { success = false, message = "Mật khẩu mới không được trùng với mật khẩu hiện tại." });
        }

        // 3. Cập nhật mật khẩu mới (băm SHA-256)
        taiKhoan.MatKhauHash = PasswordHelper.HashPassword(model.MatKhauMoi.Trim());
        await _context.SaveChangesAsync();

        // 4. Ghi nhật ký thao tác
        try
        {
            _context.NhatKyThaoTacs.Add(new NhatKyThaoTac
            {
                MaTaiKhoan = taiKhoan.MaTaiKhoan,
                ThoiDiem = DateTime.Now,
                ThaoTac = "Đổi mật khẩu",
                LoaiDoiTuong = "TaiKhoan",
                MaDoiTuong = taiKhoan.MaTaiKhoan.ToString(),
                NoiDung = $"Người dùng '{taiKhoan.TenDangNhap}' tự đổi mật khẩu cá nhân thành công."
            });
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Bỏ qua lỗi log để không chặn luồng chính
        }

        return Json(new { success = true, message = "Đổi mật khẩu thành công! Vui lòng sử dụng mật khẩu mới cho lần đăng nhập sau." });
    }
}
