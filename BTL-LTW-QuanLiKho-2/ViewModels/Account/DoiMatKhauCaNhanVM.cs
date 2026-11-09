using System.ComponentModel.DataAnnotations;

namespace BTL_LTW_QuanLiKho_2.ViewModels;

/// <summary>
/// DTO nhận thông tin người dùng tự đổi mật khẩu cá nhân
/// </summary>
public class DoiMatKhauCaNhanVM
{
    [Required(ErrorMessage = "Vui lòng nhập mật khẩu hiện tại.")]
    public string MatKhauHienTai { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập mật khẩu mới.")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu mới phải có ít nhất 6 ký tự.")]
    public string MatKhauMoi { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng xác nhận mật khẩu mới.")]
    [Compare("MatKhauMoi", ErrorMessage = "Mật khẩu xác nhận không trùng khớp.")]
    public string XacNhanMatKhau { get; set; } = string.Empty; 
}
