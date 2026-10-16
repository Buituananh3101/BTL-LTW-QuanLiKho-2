namespace BTL_LTW_QuanLiKho_2.ViewModels.NhaCungCap;

public class QuickGroupSupplierRequest
{
    public string TenNhom { get; set; } = null!;
    public string? GhiChu { get; set; }
}

public class UpdateGroupSupplierRequest
{
    public int MaNhomNcc { get; set; }
    public string TenNhom { get; set; } = null!;
    public string? GhiChu { get; set; }
}

public class DeleteGroupSupplierRequest
{
    public int MaNhomNcc { get; set; }
}
