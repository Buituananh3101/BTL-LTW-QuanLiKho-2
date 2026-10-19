namespace BTL_LTW_QuanLiKho_2.ViewModels;

/// <summary>
/// Tham số tìm kiếm, lọc và phân trang cho Báo cáo Tồn kho theo kho
/// </summary>
public class BaoCaoTonKhoFilterParams : BaseFilterParams
{
    /// <summary>
    /// Danh sách mã kho đang được chọn lọc (nếu rỗng = xem tất cả kho được phép)
    /// </summary>
    public List<int> SelectedKhoIds { get; set; } = new();

    /// <summary>
    /// Danh sách mã nhóm hàng đang được chọn lọc (nếu rỗng = tất cả)
    /// </summary>
    public List<int> SelectedNhomIds { get; set; } = new();

    /// <summary>
    /// Mã nhóm hàng cần lọc (tương thích ngược)
    /// </summary>
    public int? MaNhom { get; set; }

    /// <summary>
    /// Tình trạng tồn: ALL, CON_TON, HET_HANG, TON_AM, DUOI_DINH_MUC, VUOT_DINH_MUC
    /// </summary>
    public string TinhTrangTon { get; set; } = "ALL";

    /// <summary>
    /// Trạng thái kinh doanh của hàng hóa: DANG_KINH_DOANH, NGUNG_KINH_DOANH, ALL
    /// </summary>
    public string TrangThaiHang { get; set; } = "DANG_KINH_DOANH";

    /// <summary>
    /// Danh sách trạng thái hàng hóa được chọn từ checkbox filter
    /// </summary>
    public List<string> SelectedTrangThais { get; set; } = new();
}
