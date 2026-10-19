using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class ChiTietPhieuNhap
{
    public int MaCtphieuNhap { get; set; }

    public int MaPhieuNhap { get; set; }

    public int MaHang { get; set; }

    public decimal SoLuong { get; set; }

    public decimal DonGiaNhap { get; set; }

    public decimal GiamGia { get; set; } = 0;

    public decimal ThanhTien { get; set; } = 0;

    public virtual HangHoa MaHangNavigation { get; set; } = null!;

    public virtual PhieuNhap MaPhieuNhapNavigation { get; set; } = null!;
}
