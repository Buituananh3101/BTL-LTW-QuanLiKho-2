using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.ViewModels.QuanLyKho;

/// <summary>
/// Dòng hiển thị thông tin kho trên bảng danh sách quản lý kho
/// </summary>
public class KhoListItemVM
{
    public int MaKho { get; set; }
    public string TenKho { get; set; } = string.Empty;
    public string? DiaChi { get; set; }
    public string? MoTa { get; set; }
    public string TrangThai { get; set; } = "HOAT_DONG";

    /// <summary>
    /// Số lượng nhân sự/tài khoản được phân công tại kho này
    /// </summary>
    public int SoNhanVien { get; set; }

    /// <summary>
    /// Danh sách tên tài khoản / họ tên nhân viên được phân công tại kho
    /// </summary>
    public List<string> DanhSachNhanVien { get; set; } = new();

    /// <summary>
    /// Số lượng chứng từ liên quan đã phát sinh (Nhập, Xuất, Chuyển, Kiểm)
    /// </summary>
    public int SoChungTuLienQuan { get; set; }

    /// <summary>
    /// Kiểm tra kho này có phải là kho làm việc hiện tại của phiên đăng nhập không
    /// </summary>
    public bool IsCurrentWarehouse { get; set; }
}
