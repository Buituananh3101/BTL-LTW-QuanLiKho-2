using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace BTL_LTW_QuanLiKho_2.ViewModels;

/// <summary>
/// ViewModel chính cho màn hình Báo cáo Thẻ kho (/BaoCao/TheKho)
/// </summary>
public class TheKhoIndexVM
{
    /// <summary>
    /// Tham số lọc hiện hành
    /// </summary>
    public TheKhoFilterParams Filter { get; set; } = new();

    /// <summary>
    /// Thông tin hàng hóa và KPI tổng hợp
    /// </summary>
    public TheKhoTongHopVM? TongHop { get; set; }

    /// <summary>
    /// Danh sách dòng thẻ kho phân trang
    /// </summary>
    public PagedResult<TheKhoDongVM> DanhSachDong { get; set; } = new();

    /// <summary>
    /// Danh sách kho để chọn trên dropdown lọc
    /// </summary>
    public List<SelectListItem> DanhSachKho { get; set; } = new();

    /// <summary>
    /// Danh sách nhóm hàng hóa phục vụ lọc/tra cứu
    /// </summary>
    public List<SelectListItem> DanhSachNhomHang { get; set; } = new();
}
