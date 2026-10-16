using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class ChiTietPhieuDieuChinh
{
    public int MaCtdieuChinh { get; set; }

    public int MaPhieuDieuChinh { get; set; }

    public int MaCtkiemKe { get; set; }

    public decimal SoLuongDieuChinh { get; set; }

    public virtual ChiTietPhieuKiemKe MaCtkiemKeNavigation { get; set; } = null!;

    public virtual PhieuDieuChinh MaPhieuDieuChinhNavigation { get; set; } = null!;
}
