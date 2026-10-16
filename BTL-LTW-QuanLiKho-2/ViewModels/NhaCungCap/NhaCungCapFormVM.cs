using System.ComponentModel.DataAnnotations;

namespace BTL_LTW_QuanLiKho_2.ViewModels.NhaCungCap;

public class NhaCungCapFormVM
{
    public int? MaDonViCapHang { get; set; }

    public string? MaNcc { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập tên nhà cung cấp.")]
    [StringLength(150, ErrorMessage = "Tên nhà cung cấp tối đa 150 ký tự.")]
    public string TenDonVi { get; set; } = "";

    [StringLength(15, ErrorMessage = "Số điện thoại tối đa 15 ký tự.")]
    public string? DienThoai { get; set; }

    [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
    [StringLength(100, ErrorMessage = "Email tối đa 100 ký tự.")]
    public string? Email { get; set; }

    [StringLength(255, ErrorMessage = "Địa chỉ tối đa 255 ký tự.")]
    public string? DiaChi { get; set; }

    [StringLength(100, ErrorMessage = "Khu vực tối đa 100 ký tự.")]
    public string? KhuVuc { get; set; }

    [StringLength(100, ErrorMessage = "Phường/Xã tối đa 100 ký tự.")]
    public string? PhuongXa { get; set; }

    public int? MaNhomNcc { get; set; }

    [StringLength(500, ErrorMessage = "Ghi chú tối đa 500 ký tự.")]
    public string? GhiChu { get; set; }

    [StringLength(200, ErrorMessage = "Tên công ty tối đa 200 ký tự.")]
    public string? TenCongTy { get; set; }

    [StringLength(30, ErrorMessage = "Mã số thuế tối đa 30 ký tự.")]
    public string? MaSoThue { get; set; }

    [StringLength(30, ErrorMessage = "Số CCCD/CMND tối đa 30 ký tự.")]
    public string? SoCccd { get; set; }

    public string TrangThai { get; set; } = "HOAT_DONG";
}
