using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.ViewModels.NguoiDung;

/// <summary>
/// Đại diện cho 1 dòng dữ liệu người dùng trong bảng danh sách
/// </summary>
public class NguoiDungItemVM
{
    public int MaTaiKhoan { get; set; }
    public int MaNv { get; set; }
    public string TenDangNhap { get; set; } = string.Empty;
    public string HoTen { get; set; } = string.Empty;
    public string? DienThoai { get; set; }
    public string? Email { get; set; }
    public string? GhiChu { get; set; }
    public int MaVaiTro { get; set; }
    public string TenVaiTro { get; set; } = string.Empty;
    public string TrangThai { get; set; } = "HOAT_DONG";
    public DateTime? LanDangNhapCuoi { get; set; }

    /// <summary>
    /// Danh sách tên các kho được phân công
    /// </summary>
    public List<string> DanhSachKho { get; set; } = new();

    /// <summary>
    /// Danh sách mã các kho được phân công
    /// </summary>
    public List<int> DanhSachMaKho { get; set; } = new();

    /// <summary>
    /// Kiểm tra tài khoản này có phải là tài khoản hiện tại đang đăng nhập hay không (để chặn tự khóa chính mình)
    /// </summary>
    public bool IsCurrentUser { get; set; } = false;
}
