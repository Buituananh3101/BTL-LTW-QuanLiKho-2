namespace BTL_LTW_QuanLiKho_2.ViewModels.HangHoa;

/// <summary>
/// Model gom nhóm toàn bộ các tham số lọc tìm kiếm và phân trang cho màn hình Hàng hóa.
/// Kế thừa từ BaseFilterParams để tái sử dụng chuẩn hóa (Q, Page, PageSize, SortBy, SortDir).
/// </summary>
public class HangHoaFilterParams : BaseFilterParams
{
    /// <summary>
    /// Chuỗi ID các nhóm hàng được chọn (phân tách bởi dấu phẩy)
    /// </summary>
    public string? Nhom { get; set; }

    /// <summary>
    /// Trạng thái kinh doanh: DANG_BAN hoặc NGUNG_BAN
    /// </summary>
    public string? TrangThai { get; set; }

    /// <summary>
    /// Tiêu chí tồn kho: ALL, CON_HANG, HET_HANG, DUOI_DINH_MUC
    /// </summary>
    public string TonKhoFilter { get; set; } = "ALL";

    /// <summary>
    /// Chuỗi tên các nhà cung cấp được chọn (phân tách bởi dấu phẩy/chấm phẩy)
    /// </summary>
    public string? NhaCungCap { get; set; }

    /// <summary>
    /// Loại hàng: Hàng hóa, Dịch vụ, Combo - đóng gói
    /// </summary>
    public string? LoaiHang { get; set; }

    /// <summary>
    /// Vị trí lưu kho
    /// </summary>
    public string? ViTri { get; set; }

    /// <summary>
    /// Tiêu chí dự kiến hết hàng
    /// </summary>
    public string DuKienFilter { get; set; } = "ALL";

    /// <summary>
    /// Tiêu chí thời gian tạo (Hôm nay, Tuần này, Tháng này...)
    /// </summary>
    public string TgTaoFilter { get; set; } = "ALL";

    /// <summary>
    /// Thời gian tạo từ ngày
    /// </summary>
    public DateTime? TgTaoFrom { get; set; }

    /// <summary>
    /// Thời gian tạo đến ngày
    /// </summary>
    public DateTime? TgTaoTo { get; set; }

    /// <summary>
    /// Cờ lọc các mặt hàng được đánh dấu sao (Favorite)
    /// </summary>
    public bool DaDanhDau { get; set; } = false;
}
