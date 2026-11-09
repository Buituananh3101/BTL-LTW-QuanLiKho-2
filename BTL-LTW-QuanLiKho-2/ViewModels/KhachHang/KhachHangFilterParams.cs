using System;
using System.Collections.Generic;
using BTL_LTW_QuanLiKho_2.ViewModels;

namespace BTL_LTW_QuanLiKho_2.ViewModels.KhachHang;

public class KhachHangFilterParams : BaseFilterParams
{
    public List<int> NhomKhachHangs { get; set; } = new();
    public List<string> LoaiKhachHangs { get; set; } = new();
    public string? LoaiKhachHangSegment { get; set; } = "ALL"; // 'ALL' | 'CA_NHAN' | 'CONG_TY'
    public string? GioiTinh { get; set; } = "ALL"; // 'ALL' | 'Nam' | 'Nu'
    public List<string> TrangThais { get; set; } = new();

    public string? TgTaoFilter { get; set; } = "ALL";
    public DateTime? TgTaoTu { get; set; }
    public DateTime? TgTaoDen { get; set; }

    public string? SinhNhatFilter { get; set; } = "ALL";
    public DateTime? SinhNhatTu { get; set; }
    public DateTime? SinhNhatDen { get; set; }

    public string? NguoiTao { get; set; }

    public decimal? TongBanTu { get; set; }
    public decimal? TongBanDen { get; set; }
    public decimal? NoTu { get; set; }
    public decimal? NoDen { get; set; }
    public bool DaDanhDau { get; set; } = false;
}
