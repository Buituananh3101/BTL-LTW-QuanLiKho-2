using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class Kho
{
    public int MaKho { get; set; }

    public string TenKho { get; set; } = null!;

    public string? DiaChi { get; set; }

    public string? MoTa { get; set; }

    public string TrangThai { get; set; } = null!;

    public virtual ICollection<DonBan> DonBans { get; set; } = new List<DonBan>();

    public virtual ICollection<NguongTonKho> NguongTonKhos { get; set; } = new List<NguongTonKho>();

    public virtual ICollection<PhieuChuyenKho> PhieuChuyenKhoMaKhoDichNavigations { get; set; } = new List<PhieuChuyenKho>();

    public virtual ICollection<PhieuChuyenKho> PhieuChuyenKhoMaKhoNguonNavigations { get; set; } = new List<PhieuChuyenKho>();

    public virtual ICollection<PhieuKiemKe> PhieuKiemKes { get; set; } = new List<PhieuKiemKe>();

    public virtual ICollection<PhieuNhap> PhieuNhaps { get; set; } = new List<PhieuNhap>();

    public virtual ICollection<PhieuXuat> PhieuXuats { get; set; } = new List<PhieuXuat>();

    public virtual ICollection<TaiKhoanKho> TaiKhoanKhos { get; set; } = new List<TaiKhoanKho>();
}
