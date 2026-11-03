namespace BTL_LTW_QuanLiKho_2.ViewModels.Common;

/// <summary>
/// Đại diện cho 1 lựa chọn trạng thái
/// </summary>
public class StatusOptionVM
{
    public string Value { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public bool Checked { get; set; } = false;

    public StatusOptionVM() { }

    public StatusOptionVM(string value, string label, bool isChecked = false)
    {
        Value = value;
        Label = label;
        Checked = isChecked;
    }
}

/// <summary>
/// Chế độ hiển thị của bộ lọc trạng thái: Dạng nút viên thuốc (Pills) hoặc Hộp kiểm (Checkbox)
/// </summary>
public enum StatusRenderMode
{
    Checkbox,
    Pills
}

/// <summary>
/// StatusFilterVM – ViewModel cho component Bộ lọc Trạng thái chuẩn dùng chung trên Sidebar
/// </summary>
public class StatusFilterVM
{
    public string Id { get; set; } = "TrangThai";
    public string Title { get; set; } = "Trạng thái";
    public string DotId { get; set; } = "dotSt";
    public string ContainerId { get; set; } = "pillsStatus";
    public StatusRenderMode RenderMode { get; set; } = StatusRenderMode.Checkbox;
    public List<StatusOptionVM> Options { get; set; } = new();

    public StatusFilterVM() { }

    public StatusFilterVM(string title, string dotId, List<StatusOptionVM> options, StatusRenderMode renderMode = StatusRenderMode.Checkbox, string containerId = "pillsStatus")
    {
        Title = title;
        DotId = dotId;
        Options = options;
        RenderMode = renderMode;
        ContainerId = containerId;
    }

    public StatusFilterVM(string title, List<StatusOptionVM> options, StatusRenderMode renderMode = StatusRenderMode.Checkbox)
    {
        Title = title;
        DotId = "dotSt";
        Options = options;
        RenderMode = renderMode;
    }
}
