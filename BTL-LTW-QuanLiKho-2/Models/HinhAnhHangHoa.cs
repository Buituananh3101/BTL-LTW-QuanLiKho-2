using System;
using System.ComponentModel.DataAnnotations;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class HinhAnhHangHoa
{
    [Key]
    public int MaHinhAnh { get; set; }

    public int MaHang { get; set; }

    public byte[] DuLieuAnh { get; set; } = null!;

    public int ThuTu { get; set; }

    public bool LaAnhChinh { get; set; }

    public DateTime? NgayTao { get; set; }

    public virtual HangHoa MaHangNavigation { get; set; } = null!;
}
