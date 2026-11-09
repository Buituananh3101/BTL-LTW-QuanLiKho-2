using BTL_LTW_QuanLiKho_2.ViewModels.Common;

namespace BTL_LTW_QuanLiKho_2.ViewModels;

public class XuatHuyFilterVM
{
    public string? Q { get; set; }
    public string DateFilterType { get; set; } = "THANG_NAY"; // THANG_NAY là mặc định chuẩn KhoPro
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public List<string> Statuses { get; set; } = new() { "NHAP", "DA_XAC_NHAN" };
    public List<int> CreatorIds { get; set; } = new();
    public List<int> ConfirmerIds { get; set; } = new();
    public int? WarehouseId { get; set; }
    public bool DaDanhDau { get; set; } = false;
    public string? SortBy { get; set; }
    public string? SortDir { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 15;
}

public class XuatHuyIndexVM
{
    public XuatHuyFilterVM Filter { get; set; } = new();
    public bool DaDanhDauFilter => Filter.DaDanhDau;
    public List<XuatHuyListItemVM> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int TotalPages => Math.Max(1, (int)Math.Ceiling(TotalCount / (double)Filter.PageSize));
    public PagedResult<XuatHuyListItemVM> PagedData => new()
    {
        Items = Items,
        TotalItems = TotalCount,
        PageIndex = Filter.Page,
        PageSize = Filter.PageSize
    };
    public int CurrentWarehouseId { get; set; }
    public string CurrentWarehouseName { get; set; } = "";
    public List<WarehouseItemVM> Warehouses { get; set; } = new();
    public List<CreatorItemVM> Creators { get; set; } = new();
    public List<CreatorItemVM> Confirmers { get; set; } = new();
    public string? SortBy { get; set; }
    public string? SortDir { get; set; }
}
