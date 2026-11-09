namespace BTL_LTW_QuanLiKho_2.ViewModels;

public class QuickDvtRequest
{
    public string TenDvt { get; set; } = "";
}

public class UpdateDvtRequest
{
    public int MaDvt { get; set; }
    public string TenDvt { get; set; } = "";
}

public class DeleteDvtRequest
{
    public int MaDvt { get; set; }
}
