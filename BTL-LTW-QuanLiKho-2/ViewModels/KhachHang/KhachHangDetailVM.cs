using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.ViewModels.KhachHang;

public class KhachHangDetailVM
{
    public KhachHangItemVM ThongTin { get; set; } = new();

    public List<KhachHangLichSuDonBanVM> LichSuDonBans { get; set; } = new();
}

public class KhachHangLichSuDonBanVM
{
    public int MaDonBan { get; set; }
    public string MaDonBanHienThi => $"DB{MaDonBan:D5}";
    public DateTime NgayLap { get; set; }
    public string TenKho { get; set; } = "";
    public string NguoiLap { get; set; } = "";
    public decimal TongTien { get; set; }
    public decimal DaThu { get; set; }
    public decimal ConNo => TongTien - DaThu;
    public string TrangThai { get; set; } = "";
    public string? GhiChu { get; set; }
}
