namespace BTL_LTW_QuanLiKho_2.ViewModels.Common;

/// <summary>
/// Đại diện cho 1 lựa chọn trạng thái checkbox
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
/// KiotStatusFilterVM – ViewModel cho component Bộ lọc Trạng thái chứng từ checkbox dùng chung trên Sidebar
/// </summary>
public class KiotStatusFilterVM
{
    public string Title { get; set; } = "Trạng thái";
    public string DotId { get; set; } = "dotSt";
    public List<KiotStatusOptionVM> Options { get; set; } = new();

    public KiotStatusFilterVM() { }

    public KiotStatusFilterVM(string title, string dotId, List<KiotStatusOptionVM> options)
    {
        Title = title;
        DotId = dotId;
        Options = options;
    }
}
