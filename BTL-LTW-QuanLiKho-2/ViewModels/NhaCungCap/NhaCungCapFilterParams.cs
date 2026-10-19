using System;
using BTL_LTW_QuanLiKho_2.ViewModels;

namespace BTL_LTW_QuanLiKho_2.ViewModels.NhaCungCap;

public class NhaCungCapFilterParams : BaseFilterParams
{
    public string? NhomNcc { get; set; }
    public decimal? TongMuaTu { get; set; }
    public decimal? TongMuaDen { get; set; }
    public string? ThoiGian { get; set; }
    public decimal? NoTu { get; set; }
    public decimal? NoDen { get; set; }
    public string? TrangThai { get; set; }
    public bool DaDanhDau { get; set; } = false;
}
