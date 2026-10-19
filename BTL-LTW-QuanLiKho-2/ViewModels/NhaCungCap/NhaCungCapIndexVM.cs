using System.Collections.Generic;
using BTL_LTW_QuanLiKho_2.Models;
using BTL_LTW_QuanLiKho_2.ViewModels.Common;

namespace BTL_LTW_QuanLiKho_2.ViewModels.NhaCungCap;

public class NhaCungCapIndexVM
{
    public PagedResult<NhaCungCapItemVM> PagedData { get; set; } = new();
    public NhaCungCapFilterParams Filter { get; set; } = new();
    public List<NhomNhaCungCap> NhomNccList { get; set; } = new();

    public string? SortBy { get; set; }
    public string? SortDir { get; set; }

    public decimal TongNoToanBo { get; set; }
    public decimal TongMuaToanBo { get; set; }
    public bool DaDanhDauFilter => Filter?.DaDanhDau ?? false;
}
