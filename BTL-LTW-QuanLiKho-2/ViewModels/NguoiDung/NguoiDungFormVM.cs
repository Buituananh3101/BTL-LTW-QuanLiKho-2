using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BTL_LTW_QuanLiKho_2.ViewModels.NguoiDung;

/// <summary>
/// DTO nhận dữ liệu Tạo mới hoặc Chỉnh sửa người dùng & phân quyền kho
/// </summary>
public class NguoiDungFormVM
{
    public int MaTaiKhoan { get; set; } = 0;
    public int MaNv { get; set; } = 0;

    [Required(ErrorMessage = "Vui lòng nhập họ và tên nhân viên")]
    [StringLength(100, ErrorMessage = "Họ tên không được vượt quá 100 ký tự")]
    public string HoTen { get; set; } = string.Empty;

    [Phone(ErrorMessage = "Số điện thoại không đúng định dạng")]
    [StringLength(20, ErrorMessage = "Số điện thoại không quá 20 ký tự")]
    public string? DienThoai { get; set; }

    [EmailAddress(ErrorMessage = "Email không đúng định dạng")]
    [StringLength(100, ErrorMessage = "Email không quá 100 ký tự")]
    public string? Email { get; set; }

    [StringLength(255, ErrorMessage = "Địa chỉ không quá 255 ký tự")]
    public string? DiaChi { get; set; }

    [StringLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự")]
    public string? GhiChu { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập tên đăng nhập")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Tên đăng nhập từ 3 đến 50 ký tự")]
    [RegularExpression(@"^[a-zA-Z0-9_.-]+$", ErrorMessage = "Tên đăng nhập chỉ chứa chữ cái, chữ số, gạch dưới, gạch ngang hoặc dấu chấm")]
    public string TenDangNhap { get; set; } = string.Empty;

    /// <summary>
    /// Mật khẩu: Bắt buộc khi tạo mới, không bắt buộc khi cập nhật (nếu để trống giữ nguyên mật khẩu cũ)
    /// </summary>
    [StringLength(100, ErrorMessage = "Mật khẩu không được vượt quá 100 ký tự")]
    public string? MatKhau { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn vai trò cho người dùng")]
    [Range(1, int.MaxValue, ErrorMessage = "Vai trò không hợp lệ")]
    public int MaVaiTro { get; set; }

    public string TrangThai { get; set; } = "HOAT_DONG";

    /// <summary>
    /// Danh sách mã kho được tick chọn phân công
    /// </summary>
    public List<int> KhoIds { get; set; } = new();
}
