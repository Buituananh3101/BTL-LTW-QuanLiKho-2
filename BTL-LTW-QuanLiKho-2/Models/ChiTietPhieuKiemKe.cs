using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class ChiTietPhieuKiemKe
{
    public int MaCtkiemKe { get; set; }

    public int MaPhieuKiemKe { get; set; }

    public int MaHang { get; set; }

    public decimal SoLuongTheoSo { get; set; }

    public decimal? SoLuongThucTe { get; set; }

    public decimal DonGia { get; set; }

    public virtual ChiTietPhieuDieuChinh? ChiTietPhieuDieuChinh { get; set; }

    public virtual HangHoa MaHangNavigation { get; set; } = null!;

    public virtual PhieuKiemKe MaPhieuKiemKeNavigation { get; set; } = null!;
}
