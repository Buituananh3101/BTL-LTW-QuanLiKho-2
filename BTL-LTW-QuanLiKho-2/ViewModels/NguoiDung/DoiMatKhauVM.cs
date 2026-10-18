using System.ComponentModel.DataAnnotations;

namespace BTL_LTW_QuanLiKho_2.ViewModels.NguoiDung;

/// <summary>
/// DTO xử lý Đặt lại mật khẩu nhanh cho tài khoản
/// </summary>
public class DoiMatKhauVM
{
    [Required]
    public int MaTaiKhoan { get; set; }

    public string TenDangNhap { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập mật khẩu mới")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu mới phải có ít nhất 6 ký tự")]
    public string MatKhauMoi { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng xác nhận lại mật khẩu mới")]
    [Compare("MatKhauMoi", ErrorMessage = "Mật khẩu xác nhận không khớp")]
    public string XacNhanMatKhau { get; set; } = string.Empty;
}
