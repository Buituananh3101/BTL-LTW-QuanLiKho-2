using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class KhachHang
{
    public int MaKh { get; set; }

    public string? MaKhHienThi { get; set; }

    public string TenKh { get; set; } = null!;

    public string? DienThoai { get; set; }

    public string? DienThoai2 { get; set; }

    public DateOnly? NgaySinh { get; set; }

    public string? GioiTinh { get; set; }

    public string? Email { get; set; }

    public string? Facebook { get; set; }

    public string? HinhAnh { get; set; }

    public string? DiaChi { get; set; }

    public string? KhuVuc { get; set; }

    public string? PhuongXa { get; set; }

    public int? MaNhomKhachHang { get; set; }

    public string? GhiChu { get; set; }

    public DateTime NgayTao { get; set; } = DateTime.Now;

    public string? NguoiTao { get; set; }

    public bool DaDanhDau { get; set; } = false;

    public string LoaiKhachHang { get; set; } = "LE";

    public string TrangThai { get; set; } = "HOAT_DONG";

    // --- CÁC TRƯỜNG THÔNG TIN XUẤT HÓA ĐƠN ---
    public string? XhdLoaiKhachHang { get; set; } = "CA_NHAN";

    public string? MaSoThue { get; set; }

    public string? XhdTenDonVi { get; set; }

    public string? SoCccd { get; set; }

    public string? TenNguoiMua { get; set; }

    public string? XhdDiaChi { get; set; }

    public string? XhdKhuVuc { get; set; }

    public string? XhdPhuongXa { get; set; }

    public string? XhdEmail { get; set; }

    public string? SoHoChieu { get; set; }

    public string? MaDvqhns { get; set; }

    public string? XhdSoDienThoai { get; set; }

    public string? TenNganHang { get; set; }

    public string? SoTaiKhoanNganHang { get; set; }

    // --- NAVIGATION PROPERTIES ---
    public virtual NhomKhachHang? MaNhomKhachHangNavigation { get; set; }

    public virtual ICollection<DonBan> DonBans { get; set; } = new List<DonBan>();
}
