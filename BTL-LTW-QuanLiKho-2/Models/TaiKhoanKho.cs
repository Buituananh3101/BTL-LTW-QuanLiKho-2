using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class TaiKhoanKho
{
    public int MaTaiKhoan { get; set; }

    public int MaKho { get; set; }

    public DateTime NgayPhanCong { get; set; }

    public string? GhiChu { get; set; }

    public virtual Kho MaKhoNavigation { get; set; } = null!;

    public virtual TaiKhoan MaTaiKhoanNavigation { get; set; } = null!;
}
