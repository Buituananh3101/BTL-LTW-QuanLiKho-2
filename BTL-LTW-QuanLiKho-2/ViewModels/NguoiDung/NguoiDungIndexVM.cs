using System.Collections.Generic;
using BTL_LTW_QuanLiKho_2.Models;

namespace BTL_LTW_QuanLiKho_2.ViewModels.NguoiDung;

/// <summary>
/// ViewModel nạp vào trang Index Quản lý Người dùng & Phân quyền
/// </summary>
public class NguoiDungIndexVM
{
    public PagedResult<NguoiDungItemVM> PagedData { get; set; } = new();
    public NguoiDungFilterParams Filter { get; set; } = new();

    /// <summary>
    /// Danh sách tất cả vai trò để hiển thị bộ lọc và modal chọn
    /// </summary>
    public List<VaiTro> VaiTroList { get; set; } = new();

    /// <summary>
    /// Danh sách tất cả các chi nhánh kho đang hoạt động để phân quyền
    /// </summary>
    public List<Kho> KhoList { get; set; } = new();

    public int TongNguoiDung { get; set; }
    public int TongHoatDong { get; set; }
    public int TongBiKhoa { get; set; }

    public string? SortBy { get; set; }
    public string? SortDir { get; set; }
}
