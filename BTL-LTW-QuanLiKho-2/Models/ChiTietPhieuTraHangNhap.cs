using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class ChiTietPhieuTraHangNhap
{
    public int MaCtphieuTra { get; set; }

    public int MaPhieuTraHang { get; set; }

    public int MaHang { get; set; }

    public decimal SoLuong { get; set; } = 0;

    public decimal GiaVon { get; set; } = 0;

    public decimal DonGiaTra { get; set; } = 0;

    public decimal ThanhTien { get; set; } = 0;

    public string? GhiChu { get; set; }

    public virtual HangHoa MaHangNavigation { get; set; } = null!;

    public virtual PhieuTraHangNhap MaPhieuTraHangNavigation { get; set; } = null!;
}
