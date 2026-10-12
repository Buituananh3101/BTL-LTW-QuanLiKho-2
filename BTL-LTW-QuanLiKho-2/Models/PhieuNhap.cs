using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class PhieuNhap
{
    public int MaPhieuNhap { get; set; }

    public int MaKho { get; set; }

    public int? MaDonViCapHang { get; set; }

    public int MaNvlap { get; set; }

    public int? MaNvxacNhan { get; set; }

    public DateTime NgayLap { get; set; }

    public DateTime? NgayXacNhan { get; set; }

    public string LoaiPhieuNhap { get; set; } = null!;

    public string TrangThai { get; set; } = null!;

    public string? GhiChu { get; set; }

    public virtual ICollection<ChiTietPhieuNhap> ChiTietPhieuNhaps { get; set; } = new List<ChiTietPhieuNhap>();

    public virtual DonViCapHang? MaDonViCapHangNavigation { get; set; }

    public virtual Kho MaKhoNavigation { get; set; } = null!;

    public virtual NhanVien MaNvlapNavigation { get; set; } = null!;

    public virtual NhanVien? MaNvxacNhanNavigation { get; set; }
}
