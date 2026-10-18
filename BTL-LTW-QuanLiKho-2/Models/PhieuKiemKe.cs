using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class PhieuKiemKe
{
    public int MaPhieuKiemKe { get; set; }

    public string? MaPhieu { get; set; }

    public int MaKho { get; set; }

    public int MaNvlap { get; set; }

    public DateTime ThoiDiemChot { get; set; }

    public string TrangThai { get; set; } = null!;

    public string? GhiChu { get; set; }

    public bool DaDanhDau { get; set; }

    public virtual ICollection<ChiTietPhieuKiemKe> ChiTietPhieuKiemKes { get; set; } = new List<ChiTietPhieuKiemKe>();

    public virtual Kho MaKhoNavigation { get; set; } = null!;

    public virtual NhanVien MaNvlapNavigation { get; set; } = null!;

    public virtual PhieuDieuChinh? PhieuDieuChinh { get; set; }
}
