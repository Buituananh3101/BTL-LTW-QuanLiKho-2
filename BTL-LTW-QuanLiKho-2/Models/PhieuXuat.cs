using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class PhieuXuat
{
    public int MaPhieuXuat { get; set; }

    public string? MaPhieu { get; set; }

    public int? MaDonBan { get; set; }

    public string LoaiPhieuXuat { get; set; } = "XUAT_BAN";

    public int MaKho { get; set; }

    public int MaNvlap { get; set; }

    public int? MaNvxacNhan { get; set; }

    public DateTime NgayLap { get; set; }

    public DateTime? NgayXacNhan { get; set; }

    public string TrangThai { get; set; } = null!;

    public string? GhiChu { get; set; }

    public bool DaDanhDau { get; set; }

    public virtual ICollection<ChiTietPhieuXuat> ChiTietPhieuXuats { get; set; } = new List<ChiTietPhieuXuat>();

    public virtual DonBan? MaDonBanNavigation { get; set; }

    public virtual Kho? MaKhoNavigation { get; set; }

    public virtual NhanVien MaNvlapNavigation { get; set; } = null!;

    public virtual NhanVien? MaNvxacNhanNavigation { get; set; }
}
