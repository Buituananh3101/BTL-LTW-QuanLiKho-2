namespace BTL_LTW_QuanLiKho_2.ViewModels.Common;

/// <summary>
/// Đại diện cho 1 phần tử trong danh sách lựa chọn của Dropdown Multi-Select
/// </summary>
public class KiotMultiSelectItemVM
{
    public string Value { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public bool Selected { get; set; } = false;

    public KiotMultiSelectItemVM() { }

    public KiotMultiSelectItemVM(string value, string text, bool selected = false)
    {
        Value = value;
        Text = text;
        Selected = selected;
    }
}

/// <summary>
/// KiotMultiSelectVM – ViewModel cho component Dropdown chọn nhiều (Multi-Select kèm ô tìm kiếm con) dùng chung trên Sidebar
/// </summary>
public class KiotMultiSelectVM
{
    public string Id { get; set; } = string.Empty;
    public string DataFilter { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Placeholder { get; set; } = string.Empty;
    public string? SearchPlaceholder { get; set; }
    public bool HasSearch { get; set; } = true;
    public string? DotId { get; set; }
    public string? HeaderActionText { get; set; }
    public string? HeaderActionId { get; set; }
    public List<KiotMultiSelectItemVM> Items { get; set; } = new();

    public KiotMultiSelectVM() { }

    public KiotMultiSelectVM(string id, string dataFilter, string title, string placeholder, bool hasSearch = true, string? dotId = null)
    {
        Id = id;
        DataFilter = dataFilter;
        Title = title;
        Placeholder = placeholder;
        HasSearch = hasSearch;
        DotId = dotId;
    }
}
