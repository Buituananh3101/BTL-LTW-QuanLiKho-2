using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace BTL_LTW_QuanLiKho_2.ViewModels.KhachHang;

public class KhachHangFormVM
{
    public int? MaKh { get; set; }

    [Display(Name = "Mã khách hàng")]
    public string? MaKhCustom { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập tên khách hàng.")]
    [StringLength(150, ErrorMessage = "Tên khách hàng tối đa 150 ký tự.")]
    [Display(Name = "Tên khách hàng")]
    public string TenKh { get; set; } = "";

    [StringLength(15, ErrorMessage = "Số điện thoại tối đa 15 ký tự.")]
    [Display(Name = "Điện thoại 1")]
    public string? DienThoai { get; set; }

    [StringLength(15, ErrorMessage = "Số điện thoại phụ tối đa 15 ký tự.")]
    [Display(Name = "Điện thoại 2")]
    public string? DienThoai2 { get; set; }

    [Display(Name = "Sinh nhật")]
    public DateOnly? NgaySinh { get; set; }

    [Display(Name = "Giới tính")]
    public string? GioiTinh { get; set; } // 'Nam' | 'Nữ' | 'Khác'

    [StringLength(150, ErrorMessage = "Email tối đa 150 ký tự.")]
    [EmailAddress(ErrorMessage = "Định dạng email không hợp lệ.")]
    [Display(Name = "Email")]
    public string? Email { get; set; }

    [StringLength(255, ErrorMessage = "Facebook tối đa 255 ký tự.")]
    [Display(Name = "Facebook")]
    public string? Facebook { get; set; }

    [Display(Name = "Ảnh đại diện")]
    public string? HinhAnh { get; set; }

    public IFormFile? AvatarFile { get; set; }

    // --- ĐỊA CHỈ ---
    [StringLength(255, ErrorMessage = "Địa chỉ tối đa 255 ký tự.")]
    [Display(Name = "Địa chỉ")]
    public string? DiaChi { get; set; }

    [StringLength(100, ErrorMessage = "Tỉnh/Thành phố tối đa 100 ký tự.")]
    [Display(Name = "Khu vực")]
    public string? KhuVuc { get; set; }

    [StringLength(100, ErrorMessage = "Phường/Xã tối đa 100 ký tự.")]
    [Display(Name = "Phường/Xã")]
    public string? PhuongXa { get; set; }

    // --- NHÓM & GHI CHÚ ---
    [Display(Name = "Nhóm khách hàng")]
    public int? MaNhomKhachHang { get; set; }

    [StringLength(1000, ErrorMessage = "Ghi chú tối đa 1000 ký tự.")]
    [Display(Name = "Ghi chú")]
    public string? GhiChu { get; set; }

    [Display(Name = "Loại khách hàng")]
    public string LoaiKhachHang { get; set; } = "LE"; // 'CUA_HANG' | 'LE'

    [Display(Name = "Trạng thái")]
    public string TrangThai { get; set; } = "HOAT_DONG"; // 'HOAT_DONG' | 'NGUNG_GIAO_DICH'

    // --- THÔNG TIN XUẤT HÓA ĐƠN ---
    [Display(Name = "Loại xuất hóa đơn")]
    public string XhdLoaiKhachHang { get; set; } = "CA_NHAN"; // 'CA_NHAN' | 'DOANH_NGHIEP'

    [StringLength(20, ErrorMessage = "Mã số thuế tối đa 20 ký tự.")]
    [Display(Name = "Mã số thuế")]
    public string? MaSoThue { get; set; }

    [StringLength(255, ErrorMessage = "Tên đơn vị/công ty tối đa 255 ký tự.")]
    [Display(Name = "Tên đơn vị / Tên công ty")]
    public string? XhdTenDonVi { get; set; }

    [StringLength(20, ErrorMessage = "Số CCCD/CMND tối đa 20 ký tự.")]
    [Display(Name = "Số CCCD/CMND")]
    public string? SoCccd { get; set; }

    [StringLength(150, ErrorMessage = "Tên người mua tối đa 150 ký tự.")]
    [Display(Name = "Tên người mua")]
    public string? TenNguoiMua { get; set; }

    [StringLength(255, ErrorMessage = "Địa chỉ xuất hóa đơn tối đa 255 ký tự.")]
    [Display(Name = "Địa chỉ xuất HĐ")]
    public string? XhdDiaChi { get; set; }

    [StringLength(100, ErrorMessage = "Tỉnh/Thành phố tối đa 100 ký tự.")]
    [Display(Name = "Tỉnh/Thành xuất HĐ")]
    public string? XhdKhuVuc { get; set; }

    [StringLength(100, ErrorMessage = "Phường/Xã tối đa 100 ký tự.")]
    [Display(Name = "Phường/Xã xuất HĐ")]
    public string? XhdPhuongXa { get; set; }

    [StringLength(150, ErrorMessage = "Email nhận HĐ tối đa 150 ký tự.")]
    [EmailAddress(ErrorMessage = "Email xuất HĐ không hợp lệ.")]
    [Display(Name = "Email nhận HĐ")]
    public string? XhdEmail { get; set; }

    [StringLength(30, ErrorMessage = "Số hộ chiếu tối đa 30 ký tự.")]
    [Display(Name = "Số hộ chiếu")]
    public string? SoHoChieu { get; set; }

    [StringLength(30, ErrorMessage = "Mã ĐVQHNS tối đa 30 ký tự.")]
    [Display(Name = "Mã ĐVQHNS")]
    public string? MaDvqhns { get; set; }

    [StringLength(15, ErrorMessage = "Số điện thoại xuất HĐ tối đa 15 ký tự.")]
    [Display(Name = "Số điện thoại xuất HĐ")]
    public string? XhdSoDienThoai { get; set; }

    [StringLength(150, ErrorMessage = "Tên ngân hàng tối đa 150 ký tự.")]
    [Display(Name = "Ngân hàng")]
    public string? TenNganHang { get; set; }

    [StringLength(50, ErrorMessage = "Số tài khoản ngân hàng tối đa 50 ký tự.")]
    [Display(Name = "Số tài khoản ngân hàng")]
    public string? SoTaiKhoanNganHang { get; set; }
}
