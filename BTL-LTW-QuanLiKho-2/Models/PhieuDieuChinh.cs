using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class PhieuDieuChinh
{
    public int MaPhieuDieuChinh { get; set; }

    public int MaPhieuKiemKe { get; set; }

    public int MaNvlap { get; set; }

    public int? MaNvduyet { get; set; }

    public DateTime NgayLap { get; set; }

    public DateTime? NgayDuyet { get; set; }

    public string TrangThai { get; set; } = null!;

    public string? GhiChu { get; set; }

    public virtual ICollection<ChiTietPhieuDieuChinh> ChiTietPhieuDieuChinhs { get; set; } = new List<ChiTietPhieuDieuChinh>();

    public virtual NhanVien? MaNvduyetNavigation { get; set; }

    public virtual NhanVien MaNvlapNavigation { get; set; } = null!;

    public virtual PhieuKiemKe MaPhieuKiemKeNavigation { get; set; } = null!;
}
