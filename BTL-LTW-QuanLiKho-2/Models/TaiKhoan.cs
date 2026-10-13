using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class TaiKhoan
{
    public int MaTaiKhoan { get; set; }

    public int MaNv { get; set; }

    public int MaVaiTro { get; set; }

    public string TenDangNhap { get; set; } = null!;

    public string MatKhauHash { get; set; } = null!;

    public string TrangThai { get; set; } = null!;

    public DateTime? LanDangNhapCuoi { get; set; }

    public virtual NhanVien MaNvNavigation { get; set; } = null!;

    public virtual VaiTro MaVaiTroNavigation { get; set; } = null!;

    public virtual ICollection<NhatKyThaoTac> NhatKyThaoTacs { get; set; } = new List<NhatKyThaoTac>();

    public virtual ICollection<TaiKhoanKho> TaiKhoanKhos { get; set; } = new List<TaiKhoanKho>();
}
