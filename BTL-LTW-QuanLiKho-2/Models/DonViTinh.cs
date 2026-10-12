using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class DonViTinh
{
    public int MaDvt { get; set; }

    public string TenDvt { get; set; } = null!;

    public string? MoTa { get; set; }

    public virtual ICollection<HangHoa> HangHoas { get; set; } = new List<HangHoa>();
}
