using System.Collections.Generic;
using BTL_LTW_QuanLiKho_2.Models;
using BTL_LTW_QuanLiKho_2.ViewModels;

namespace BTL_LTW_QuanLiKho_2.ViewModels.KhachHang;

public class KhachHangIndexVM
{
    public PagedResult<KhachHangItemVM> PagedData { get; set; } = new();
    public KhachHangFilterParams Filter { get; set; } = new();

    public string? SortBy { get; set; }
    public string? SortDir { get; set; }

    public int TongSoKhachHang { get; set; }
    public decimal TongBanToanBo { get; set; }
    public decimal TongNoToanBo { get; set; }

    // Dữ liệu danh mục phục vụ bộ lọc & modal
    public List<NhomKhachHangItemVM> NhomKhachHangs { get; set; } = new();
    public List<string> NhanViens { get; set; } = new();
    public List<string> TinhThanhs { get; set; } = new();
}

public class NhomKhachHangItemVM
{
    public int MaNhomKhachHang { get; set; }
    public string TenNhom { get; set; } = "";
    public string? GhiChu { get; set; }
    public int SoKhachHang { get; set; }
}
