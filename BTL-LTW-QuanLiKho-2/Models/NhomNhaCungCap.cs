using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class NhomNhaCungCap
{
    public int MaNhomNcc { get; set; }

    public string TenNhom { get; set; } = null!;

    public string? GhiChu { get; set; }

    public virtual ICollection<DonViCapHang> DonViCapHangs { get; set; } = new List<DonViCapHang>();
}
