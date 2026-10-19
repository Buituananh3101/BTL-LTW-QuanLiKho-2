using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.ViewModels.NhaCungCap;

public class NhaCungCapDetailVM
{
    public NhaCungCapItemVM ThongTin { get; set; } = new();
    public string? GhiChu { get; set; }
    public string? TenCongTy { get; set; }
    public string? MaSoThue { get; set; }
    public string? SoCccd { get; set; }

    public List<NhaCungCapLichSuNhapVM> LichSuPhieuNhaps { get; set; } = new();
}

public class NhaCungCapLichSuNhapVM
{
    public int MaPhieuNhap { get; set; }
    public string MaPhieuHienThi { get; set; } = "";
    public DateTime NgayNhap { get; set; }
    public decimal TongTien { get; set; }
    public string TrangThai { get; set; } = "";
    public string TenKho { get; set; } = "";
}
