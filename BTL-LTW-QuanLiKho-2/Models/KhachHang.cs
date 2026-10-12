using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class KhachHang
{
    public int MaKh { get; set; }

    public string TenKh { get; set; } = null!;

    public string? DienThoai { get; set; }

    public string? DiaChi { get; set; }

    public string LoaiKhachHang { get; set; } = null!;

    public string TrangThai { get; set; } = null!;

    public virtual ICollection<DonBan> DonBans { get; set; } = new List<DonBan>();
}
