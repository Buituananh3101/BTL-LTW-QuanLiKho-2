using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class NhatKyThaoTac
{
    public long MaNhatKy { get; set; }

    public int MaTaiKhoan { get; set; }

    public DateTime ThoiDiem { get; set; }

    public string ThaoTac { get; set; } = null!;

    public string LoaiDoiTuong { get; set; } = null!;

    public string MaDoiTuong { get; set; } = null!;

    public string? NoiDung { get; set; }

    public virtual TaiKhoan MaTaiKhoanNavigation { get; set; } = null!;
}
