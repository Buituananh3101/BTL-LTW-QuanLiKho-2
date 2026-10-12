using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class ChiTietDonBan
{
    public int MaCtdonBan { get; set; }

    public int MaDonBan { get; set; }

    public int MaHang { get; set; }

    public decimal SoLuong { get; set; }

    public decimal DonGiaApDung { get; set; }

    public decimal ChietKhau { get; set; }

    public virtual ChiTietPhieuXuat? ChiTietPhieuXuat { get; set; }

    public virtual DonBan MaDonBanNavigation { get; set; } = null!;

    public virtual HangHoa MaHangNavigation { get; set; } = null!;
}
