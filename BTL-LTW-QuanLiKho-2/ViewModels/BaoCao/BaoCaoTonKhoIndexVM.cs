using BTL_LTW_QuanLiKho_2.Models;

namespace BTL_LTW_QuanLiKho_2.ViewModels;

/// <summary>
/// ViewModel chính phục vụ trang Báo cáo Tồn kho theo kho
/// </summary>
public class BaoCaoTonKhoIndexVM
{
    /// <summary>
    /// Dữ liệu phân trang các mặt hàng hiển thị trên bảng Pivot
    /// </summary>
    public PagedResult<BaoCaoTonKhoItemVM> PagedData { get; set; } = new();

    /// <summary>
    /// Các chỉ số KPI thống kê tổng hợp toàn bộ tập dữ liệu lọc
    /// </summary>
    public BaoCaoTonKhoSummaryVM Summary { get; set; } = new();

    /// <summary>
    /// Danh sách tất cả các kho người dùng được quyền truy cập
    /// </summary>
    public List<Kho> DanhSachKho { get; set; } = new();

    /// <summary>
    /// Danh sách các mã kho đang được chọn hiển thị cột trên bảng Pivot
    /// </summary>
    public List<int> SelectedKhoIds { get; set; } = new();

    /// <summary>
    /// Danh sách nhóm hàng hóa phục vụ bộ lọc combobox
    /// </summary>
    public List<NhomHang> DanhSachNhomHang { get; set; } = new();

    /// <summary>
    /// Các tham số lọc hiện hành
    /// </summary>
    public BaoCaoTonKhoFilterParams Filter { get; set; } = new();
}
