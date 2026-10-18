using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class ChiTietPhieuChuyenKho
{
    public int MaCtphieuChuyen { get; set; }

    public int MaPhieuChuyen { get; set; }

    public int MaHang { get; set; }

    public decimal SoLuong { get; set; }

    public decimal? SoLuongNhan { get; set; }

    public decimal DonGiaChuyen { get; set; }

    public decimal ThanhTien { get; set; }

    public virtual HangHoa MaHangNavigation { get; set; } = null!;

    public virtual PhieuChuyenKho MaPhieuChuyenNavigation { get; set; } = null!;
}
