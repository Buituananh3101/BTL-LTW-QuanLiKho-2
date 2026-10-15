namespace BTL_LTW_QuanLiKho_2.ViewModels;

/// <summary>
/// Lớp cơ sở không generic chứa thông tin phân trang, phục vụ Partial View _Pagination.cshtml.
/// </summary>
public class PagedResultBase
{
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 15;
    public int TotalItems { get; set; } = 0;

    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalItems / PageSize) : 0;
    public bool HasPreviousPage => PageIndex > 1;
    public bool HasNextPage => PageIndex < TotalPages;

    /// <summary>
    /// Bản ghi đầu tiên của trang hiện tại (VD: Hiển thị 1 - 15 trong số 100)
    /// </summary>
    public int StartItemIndex => TotalItems == 0 ? 0 : (PageIndex - 1) * PageSize + 1;

    /// <summary>
    /// Bản ghi cuối cùng của trang hiện tại
    /// </summary>
    public int EndItemIndex => Math.Min(PageIndex * PageSize, TotalItems);
}

/// <summary>
/// Kết quả phân trang có kiểu dữ liệu generic cho danh sách bản ghi Items.
/// Dùng chung cho mọi danh mục (Hàng hóa, Khách hàng, NCC, Phiếu nhập...).
/// </summary>
/// <typeparam name="T">Kiểu dữ liệu của phần tử trong danh sách</typeparam>
public class PagedResult<T> : PagedResultBase
{
    public List<T> Items { get; set; } = new();

    public PagedResult() { }

    public PagedResult(List<T> items, int totalItems, int pageIndex, int pageSize)
    {
        Items = items;
        TotalItems = totalItems;
        PageIndex = pageIndex < 1 ? 1 : pageIndex;
        PageSize = pageSize < 1 ? 15 : pageSize;
    }
}
