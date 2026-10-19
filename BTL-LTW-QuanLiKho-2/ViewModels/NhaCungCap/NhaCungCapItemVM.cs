using System;

namespace BTL_LTW_QuanLiKho_2.ViewModels.NhaCungCap;

public class NhaCungCapItemVM
{
    public int MaDonViCapHang { get; set; }
    public string MaNcc { get; set; } = "";
    public string TenDonVi { get; set; } = "";
    public string? DienThoai { get; set; }
    public string? Email { get; set; }
    public int? MaNhomNcc { get; set; }
    public string? TenNhomNcc { get; set; }
    public string? DiaChi { get; set; }
    public string? KhuVuc { get; set; }
    public string? PhuongXa { get; set; }
    public decimal NoCanTraHienTai { get; set; }
    public decimal TongMua { get; set; }
    public string TrangThai { get; set; } = "HOAT_DONG";
    public DateTime NgayTao { get; set; }
    public string? NguoiTao { get; set; }
    public string? GhiChu { get; set; }
    public string? TenCongTy { get; set; }
    public string? MaSoThue { get; set; }
    public string? SoCccd { get; set; }
    public bool DaDanhDau { get; set; }
    public bool IsFavorite => DaDanhDau;
}
