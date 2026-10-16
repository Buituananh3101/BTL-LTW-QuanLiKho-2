namespace BTL_LTW_QuanLiKho_2.ViewModels;

public class QuickGroupRequest
{
    public string TenNhom { get; set; } = "";
}

public class UpdateGroupRequest
{
    public int MaNhom { get; set; }
    public string TenNhom { get; set; } = "";
}

public class DeleteGroupRequest
{
    public int MaNhom { get; set; }
}
