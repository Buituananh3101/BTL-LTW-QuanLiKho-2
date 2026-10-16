using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class NguongTonKho
{
    public int MaKho { get; set; }

    public int MaHang { get; set; }

    public decimal TonToiThieu { get; set; }

    public decimal? TonCaoNhat { get; set; }

    public virtual HangHoa MaHangNavigation { get; set; } = null!;

    public virtual Kho MaKhoNavigation { get; set; } = null!;
}
