using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class NhomKhachHang
{
    public int MaNhomKhachHang { get; set; }

    public string TenNhom { get; set; } = null!;

    public string? GhiChu { get; set; }

    public virtual ICollection<KhachHang> KhachHangs { get; set; } = new List<KhachHang>();
}
