using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.ViewModels.KhachHang;

public class KhachHangItemVM
{
    public int MaKh { get; set; }
    
    private string? _maKhHienThi;
    public string MaKhHienThi
    {
        get => !string.IsNullOrWhiteSpace(_maKhHienThi) ? _maKhHienThi : $"KH{MaKh:D5}";
        set => _maKhHienThi = value;
    }

    public string TenKh { get; set; } = "";
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
    public string? TenNhomKhachHang { get; set; }

    public string? GhiChu { get; set; }
    public DateTime NgayTao { get; set; } = DateTime.Now;
    public string? NguoiTao { get; set; }
    public bool DaDanhDau { get; set; } = false;

    public string LoaiKhachHang { get; set; } = "LE";
    public string TenLoaiKhachHang => LoaiKhachHang == "CUA_HANG" ? "Cửa hàng / Công ty" : "Khách cá nhân";
    public string TrangThai { get; set; } = "HOAT_DONG";
    public string TenTrangThai => TrangThai == "HOAT_DONG" ? "Đang hoạt động" : "Ngừng giao dịch";

    // Số liệu tài chính & giao dịch
    public decimal TongBan { get; set; }
    public decimal TongBanTruTraHang { get; set; }
    public decimal DaThu { get; set; }
    public decimal NoHienTai { get; set; }
    public int SoDonBan { get; set; }

    // Thông tin xuất hóa đơn
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

    public List<KhachHangLichSuDonBanVM> LichSuDonBans { get; set; } = new();
}
