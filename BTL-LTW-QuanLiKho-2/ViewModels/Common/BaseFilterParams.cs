namespace BTL_LTW_QuanLiKho_2.ViewModels;

/// <summary>
/// Lớp cơ sở chứa các tham số lọc, tìm kiếm và phân trang dùng chung cho mọi màn hình danh sách.
/// Các ViewModel Filter cụ thể (Hàng hóa, Khách hàng, Nhà cung cấp...) kế thừa từ lớp này.
/// </summary>
public class BaseFilterParams
{
    /// <summary>
    /// Từ khóa tìm kiếm (Tên, Mã, Ghi chú...)
    /// </summary>
    public string? Q { get; set; }

    /// <summary>
    /// Trang hiện tại (1-indexed, mặc định là 1)
    /// </summary>
    public int Page { get; set; } = 1;

    /// <summary>
    /// Số lượng bản ghi trên một trang (mặc định là 15)
    /// </summary>
    public int PageSize { get; set; } = 15;

    /// <summary>
    /// Tên cột cần sắp xếp
    /// </summary>
    public string? SortBy { get; set; }

    /// <summary>
    /// Hướng sắp xếp: "asc" hoặc "desc"
    /// </summary>
    public string? SortDir { get; set; }

    /// <summary>
    /// Lọc từ ngày
    /// </summary>
    public DateTime? FromDate { get; set; }

    /// <summary>
    /// Lọc đến ngày
    /// </summary>
    public DateTime? ToDate { get; set; }

    /// <summary>
    /// Tính số bản ghi cần bỏ qua khi phân trang trong LINQ
    /// </summary>
    public int GetSkipCount()
    {
        int p = Page < 1 ? 1 : Page;
        int size = PageSize < 1 ? 15 : PageSize;
        return (p - 1) * size;
    }
}
