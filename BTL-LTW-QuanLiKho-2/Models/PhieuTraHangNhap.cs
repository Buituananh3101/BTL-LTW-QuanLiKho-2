using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class PhieuTraHangNhap
{
    public int MaPhieuTraHang { get; set; }

    public string? MaPhieu { get; set; }

    public int MaKho { get; set; }

    public int? MaDonViCapHang { get; set; }

    public int MaNvlap { get; set; }

    public int? MaNvtra { get; set; }

    public DateTime NgayLap { get; set; } = DateTime.Now;

    public DateTime NgayTra { get; set; } = DateTime.Now;

    public string TrangThai { get; set; } = "NHAP";

    public decimal TongSoLuong { get; set; } = 0;

    public decimal TongTienHang { get; set; } = 0;

    public decimal GiamGia { get; set; } = 0;

    public decimal CanThuNcc { get; set; } = 0;

    public decimal DaThuNcc { get; set; } = 0;

    public string? GhiChu { get; set; }

    public bool DaDanhDau { get; set; } = false;

    public virtual Kho MaKhoNavigation { get; set; } = null!;

    public virtual DonViCapHang? MaDonViCapHangNavigation { get; set; }

    public virtual NhanVien MaNvlapNavigation { get; set; } = null!;

    public virtual NhanVien? MaNvtraNavigation { get; set; }

    public virtual ICollection<ChiTietPhieuTraHangNhap> ChiTietPhieuTraHangNhaps { get; set; } = new List<ChiTietPhieuTraHangNhap>();
}
