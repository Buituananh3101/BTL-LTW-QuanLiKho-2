using Microsoft.AspNetCore.Mvc;
using BTL_LTW_QuanLiKho_2.Models;
using BTL_LTW_QuanLiKho_2.Services;

namespace BTL_LTW_QuanLiKho_2.Controllers;

/// <summary>
/// Lớp Controller cơ sở dùng chung cho mọi Controller quản lý nghiệp vụ kho.
/// Cung cấp sẵn các tiện ích truy xuất Kho làm việc, Tài khoản đăng nhập, Nhân viên và Phân quyền.
/// </summary>
public abstract class BaseKhoController : Controller
{
    protected readonly QuanLyKhoPhuQuocLtwContext _context;

    protected BaseKhoController(QuanLyKhoPhuQuocLtwContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Mã kho làm việc hiện tại của phiên làm việc (Session), tự động gán kho đầu tiên nếu chưa chọn.
    /// </summary>
    protected int CurrentWarehouseId => GetCurrentWarehouseId();

    /// <summary>
    /// Mã tài khoản người dùng đang đăng nhập từ Claims.
    /// </summary>
    protected int CurrentUserId => User.GetMaTaiKhoan();

    /// <summary>
    /// Mã nhân viên ứng với tài khoản đang đăng nhập từ Claims.
    /// </summary>
    protected int CurrentNhanVienId => User.GetMaNv();

    /// <summary>
    /// Tên vai trò của người dùng ("Quản lý", "Nhân viên kho", "Nhân viên bán hàng"...).
    /// </summary>
    protected string CurrentUserRole => User.GetVaiTro();

    /// <summary>
    /// Kiểm tra người dùng hiện tại có phải là cấp Quản lý hay không.
    /// </summary>
    protected bool IsQuanLy => CurrentUserRole == "Quản lý";

    /// <summary>
    /// Đọc mã kho hiện tại từ Session, fallback về kho hoạt động đầu tiên nếu Session rỗng.
    /// </summary>
    protected int GetCurrentWarehouseId()
    {
        var whId = HttpContext.Session.GetInt32("CurrentWarehouseId");
        if (whId.HasValue && whId.Value > 0) return whId.Value;

        var firstWh = _context.Khos.FirstOrDefault(k => k.TrangThai == "HOAT_DONG");
        int defaultId = firstWh?.MaKho ?? 1;
        HttpContext.Session.SetInt32("CurrentWarehouseId", defaultId);
        return defaultId;
    }

    /// <summary>
    /// Hàm tiện ích tương thích ngược lấy mã tài khoản hiện tại.
    /// </summary>
    protected int GetCurrentAccountId() => CurrentUserId;

    /// <summary>
    /// Hàm tiện ích tương thích ngược lấy mã nhân viên hiện tại.
    /// </summary>
    protected int GetCurrentEmployeeId() => CurrentNhanVienId;

    /// <summary>
    /// Hàm tiện ích tương thích ngược lấy mã nhân viên (như code cũ PhieuKiemKe).
    /// </summary>
    protected int GetCurrentUserId() => CurrentNhanVienId;
}

