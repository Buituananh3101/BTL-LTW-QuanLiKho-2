namespace BTL_LTW_QuanLiKho_2.ViewModels.Common;

/// <summary>
/// Đại diện cho 1 lựa chọn trạng thái
/// </summary>
public class KiotStatusOptionVM
{
    public string Value { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public bool Checked { get; set; } = false;

    public KiotStatusOptionVM() { }

    public KiotStatusOptionVM(string value, string label, bool isChecked = false)
    {
        Value = value;
        Label = label;
        Checked = isChecked;
    }
}

/// <summary>
/// Chế độ hiển thị của bộ lọc trạng thái: Dạng nút viên thuốc (Pills) hoặc Hộp kiểm (Checkbox)
/// </summary>
public enum KiotStatusRenderMode
{
    Checkbox,
    Pills
}

/// <summary>
/// KiotStatusFilterVM – ViewModel cho component Bộ lọc Trạng thái chuẩn KiotViet dùng chung trên Sidebar
/// </summary>
public class KiotStatusFilterVM
{
    public string Id { get; set; } = "TrangThai";
    public string Title { get; set; } = "Trạng thái";
    public string DotId { get; set; } = "dotSt";
    public string ContainerId { get; set; } = "pillsStatus";
    public KiotStatusRenderMode RenderMode { get; set; } = KiotStatusRenderMode.Checkbox;
    public List<KiotStatusOptionVM> Options { get; set; } = new();

    public KiotStatusFilterVM() { }

    public KiotStatusFilterVM(string title, string dotId, List<KiotStatusOptionVM> options, KiotStatusRenderMode renderMode = KiotStatusRenderMode.Checkbox, string containerId = "pillsStatus")
    {
        Title = title;
        DotId = dotId;
        Options = options;
        RenderMode = renderMode;
        ContainerId = containerId;
    }

    public KiotStatusFilterVM(string title, List<KiotStatusOptionVM> options, KiotStatusRenderMode renderMode = KiotStatusRenderMode.Checkbox)
    {
        Title = title;
        DotId = "dotSt";
        Options = options;
        RenderMode = renderMode;
    }
}
