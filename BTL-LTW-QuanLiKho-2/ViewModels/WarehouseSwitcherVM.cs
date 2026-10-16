namespace BTL_LTW_QuanLiKho_2.ViewModels;

public class WarehouseSwitcherVM
{
    public int CurrentWarehouseId { get; set; }
    public string CurrentWarehouseName { get; set; } = "Chọn kho";
    public List<KhoItemVM> DanhSachKho { get; set; } = new();
}

public class KhoItemVM
{
    public int MaKho { get; set; }
    public string TenKho { get; set; } = "";
    public string? DiaChi { get; set; }
}
