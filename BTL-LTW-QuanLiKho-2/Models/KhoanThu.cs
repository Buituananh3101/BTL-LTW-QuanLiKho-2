using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class KhoanThu
{
    public int MaKhoanThu { get; set; }

    public int MaDonBan { get; set; }

    public int MaNvthu { get; set; }

    public decimal SoTien { get; set; }

    public string PhuongThuc { get; set; } = null!;

    public DateTime ThoiDiemThu { get; set; }

    public string? GhiChu { get; set; }

    public virtual DonBan MaDonBanNavigation { get; set; } = null!;

    public virtual NhanVien MaNvthuNavigation { get; set; } = null!;
}
