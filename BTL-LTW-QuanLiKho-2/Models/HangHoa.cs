using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class HangHoa
{
    [Key]
    public int MaHang { get; set; }

    public int MaNhom { get; set; }

    public int MaDvt { get; set; }

    public string MaHangNoiBo { get; set; } = null!;

    public string TenHang { get; set; } = null!;

    public string? QuyCach { get; set; }

    public decimal GiaBanThamKhao { get; set; }

    public decimal GiaVon { get; set; }

    public string TrangThai { get; set; } = null!;

    public byte[]? HinhAnh { get; set; }

    public DateTime? NgayTao { get; set; }

    public virtual ICollection<ChiTietDonBan> ChiTietDonBans { get; set; } = new List<ChiTietDonBan>();

    public virtual ICollection<ChiTietPhieuChuyenKho> ChiTietPhieuChuyenKhos { get; set; } = new List<ChiTietPhieuChuyenKho>();

    public virtual ICollection<ChiTietPhieuKiemKe> ChiTietPhieuKiemKes { get; set; } = new List<ChiTietPhieuKiemKe>();

    public virtual ICollection<ChiTietPhieuNhap> ChiTietPhieuNhaps { get; set; } = new List<ChiTietPhieuNhap>();
 
    public virtual ICollection<ChiTietPhieuXuat> ChiTietPhieuXuats { get; set; } = new List<ChiTietPhieuXuat>();

    public virtual DonViTinh MaDvtNavigation { get; set; } = null!;

    public virtual NhomHang MaNhomNavigation { get; set; } = null!;

    public virtual ICollection<NguongTonKho> NguongTonKhos { get; set; } = new List<NguongTonKho>();
}
