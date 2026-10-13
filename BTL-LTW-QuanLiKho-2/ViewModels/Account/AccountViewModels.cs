using System.ComponentModel.DataAnnotations;

namespace BTL_LTW_QuanLiKho_2.ViewModels;

public class LoginVM
{
    [Required(ErrorMessage = "Vui lòng nhập tên đăng nhập.")]
    public string TenDangNhap { get; set; } = "";

    [Required(ErrorMessage = "Vui lòng nhập mật khẩu.")]
    [DataType(DataType.Password)]
    public string MatKhau { get; set; } = "";

    public bool GhiNho { get; set; } = false;
    public string? ReturnUrl { get; set; }
}
