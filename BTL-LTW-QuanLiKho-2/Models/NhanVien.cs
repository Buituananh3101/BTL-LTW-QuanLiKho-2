using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class NhanVien
{
    public int MaNv { get; set; }

    public string HoTen { get; set; } = null!;

    public string? DienThoai { get; set; }

    public string? Email { get; set; }

    public string? DiaChi { get; set; }

    public DateOnly? NgayVaoLam { get; set; }

    public string TrangThai { get; set; } = null!;

    public virtual ICollection<DonBan> DonBans { get; set; } = new List<DonBan>();

    public virtual ICollection<KhoanThu> KhoanThus { get; set; } = new List<KhoanThu>();

    public virtual ICollection<PhieuChuyenKho> PhieuChuyenKhoMaNvlapNavigations { get; set; } = new List<PhieuChuyenKho>();

    public virtual ICollection<PhieuChuyenKho> PhieuChuyenKhoMaNvnhanNavigations { get; set; } = new List<PhieuChuyenKho>();

    public virtual ICollection<PhieuChuyenKho> PhieuChuyenKhoMaNvxuatNavigations { get; set; } = new List<PhieuChuyenKho>();

    public virtual ICollection<PhieuDieuChinh> PhieuDieuChinhMaNvduyetNavigations { get; set; } = new List<PhieuDieuChinh>();

    public virtual ICollection<PhieuDieuChinh> PhieuDieuChinhMaNvlapNavigations { get; set; } = new List<PhieuDieuChinh>();

    public virtual ICollection<PhieuKiemKe> PhieuKiemKes { get; set; } = new List<PhieuKiemKe>();

    public virtual ICollection<PhieuNhap> PhieuNhapMaNvlapNavigations { get; set; } = new List<PhieuNhap>();

    public virtual ICollection<PhieuNhap> PhieuNhapMaNvxacNhanNavigations { get; set; } = new List<PhieuNhap>();

    public virtual ICollection<PhieuXuat> PhieuXuatMaNvlapNavigations { get; set; } = new List<PhieuXuat>();

    public virtual ICollection<PhieuXuat> PhieuXuatMaNvxacNhanNavigations { get; set; } = new List<PhieuXuat>();

    public virtual ICollection<PhieuTraHangNhap> PhieuTraHangNhapMaNvlapNavigations { get; set; } = new List<PhieuTraHangNhap>();

    public virtual ICollection<PhieuTraHangNhap> PhieuTraHangNhapMaNvtraNavigations { get; set; } = new List<PhieuTraHangNhap>();

    public virtual TaiKhoan? TaiKhoan { get; set; }
}
