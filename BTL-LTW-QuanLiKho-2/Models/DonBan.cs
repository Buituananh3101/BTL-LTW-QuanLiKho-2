using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class DonBan
{
    public int MaDonBan { get; set; }

    public int? MaKh { get; set; }

    public int MaKho { get; set; }

    public int MaNvlap { get; set; }

    public DateTime NgayLap { get; set; }

    public string TrangThai { get; set; } = null!;

    public string? GhiChu { get; set; }

    public virtual ICollection<ChiTietDonBan> ChiTietDonBans { get; set; } = new List<ChiTietDonBan>();

    public virtual ICollection<KhoanThu> KhoanThus { get; set; } = new List<KhoanThu>();

    public virtual KhachHang? MaKhNavigation { get; set; }

    public virtual Kho MaKhoNavigation { get; set; } = null!;

    public virtual NhanVien MaNvlapNavigation { get; set; } = null!;

    public virtual PhieuXuat? PhieuXuat { get; set; }
}
