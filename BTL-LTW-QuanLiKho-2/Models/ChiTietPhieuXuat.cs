using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class ChiTietPhieuXuat
{
    public int MaCtphieuXuat { get; set; }

    public int MaPhieuXuat { get; set; }

    public int? MaCtdonBan { get; set; }

    public int? MaHang { get; set; }

    public decimal SoLuongXuat { get; set; }

    public decimal DonGiaXuat { get; set; }

    public virtual ChiTietDonBan? MaCtdonBanNavigation { get; set; }

    public virtual HangHoa? MaHangNavigation { get; set; }

    public virtual PhieuXuat MaPhieuXuatNavigation { get; set; } = null!;
}
