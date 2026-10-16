using System;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class VwBienDongKho
{
    public DateTime NgayGiaoDich { get; set; }

    public int MaKho { get; set; }

    public int MaHang { get; set; }

    public string LoaiChungTu { get; set; } = null!;

    public int MaChungTu { get; set; }

    public decimal SoLuongTang { get; set; }

    public decimal SoLuongGiam { get; set; }
}
