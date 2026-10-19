using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.ViewModels.QuanLyKho;

/// <summary>
/// ViewModel nạp vào trang Index Quản lý Kho
/// </summary>
public class KhoIndexVM
{
    public PagedResult<KhoListItemVM> PagedData { get; set; } = new();
    public KhoFilterParams Filter { get; set; } = new();

    /// <summary>
    /// Danh sách tất cả tài khoản người dùng để phục vụ chọn phân quyền khi thêm/sửa kho
    /// </summary>
    public List<TaiKhoanItemForKhoVM> DanhSachTaiKhoan { get; set; } = new();

    public int TongSoKho { get; set; }
    public int TongHoatDong { get; set; }
    public int TongNgungHoatDong { get; set; }

    public string? SortBy { get; set; }
    public string? SortDir { get; set; }
}

/// <summary>
/// DTO rút gọn của tài khoản để chọn phân quyền kho
/// </summary>
public class TaiKhoanItemForKhoVM
{
    public int MaTaiKhoan { get; set; }
    public string TenDangNhap { get; set; } = string.Empty;
    public string HoTen { get; set; } = string.Empty;
    public string TenVaiTro { get; set; } = string.Empty;
}
