using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.ViewModels.NguoiDung;

/// <summary>
/// Tham số lọc danh sách người dùng & tài khoản
/// </summary>
public class NguoiDungFilterParams : BaseFilterParams
{
    /// <summary>
    /// Danh sách mã vai trò cần lọc (1: Quản lý, 2: Nhân viên kho, 3: Bán hàng...)
    /// </summary>
    public List<int> VaiTroIds { get; set; } = new();

    /// <summary>
    /// Trạng thái tài khoản cần lọc: "HOAT_DONG", "KHOA"
    /// </summary>
    public List<string> TrangThais { get; set; } = new();

    /// <summary>
    /// Danh sách mã kho cần lọc (những tài khoản được phân công làm việc tại các kho này)
    /// </summary>
    public List<int> KhoIds { get; set; } = new();
}
