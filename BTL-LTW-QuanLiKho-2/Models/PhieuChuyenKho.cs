using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class PhieuChuyenKho
{
    public int MaPhieuChuyen { get; set; }

    public int MaKhoNguon { get; set; }

    public int MaKhoDich { get; set; }

    public int MaNvlap { get; set; }

    public int? MaNvxuat { get; set; }

    public int? MaNvnhan { get; set; }

    public DateTime NgayLap { get; set; }

    public DateTime? ThoiDiemXuat { get; set; }

    public DateTime? ThoiDiemNhan { get; set; }

    public string TrangThai { get; set; } = null!;

    public string? GhiChu { get; set; }

    public virtual ICollection<ChiTietPhieuChuyenKho> ChiTietPhieuChuyenKhos { get; set; } = new List<ChiTietPhieuChuyenKho>();

    public virtual Kho MaKhoDichNavigation { get; set; } = null!;

    public virtual Kho MaKhoNguonNavigation { get; set; } = null!;

    public virtual NhanVien MaNvlapNavigation { get; set; } = null!;

    public virtual NhanVien? MaNvnhanNavigation { get; set; }

    public virtual NhanVien? MaNvxuatNavigation { get; set; }
}
