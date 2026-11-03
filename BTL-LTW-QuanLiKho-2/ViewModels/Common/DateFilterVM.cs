namespace BTL_LTW_QuanLiKho_2.ViewModels.Common;

/// <summary>
/// KiotDateFilterVM – ViewModel cho component Bộ lọc Thời gian & Lịch 2 tháng dùng chung
/// </summary>
public class KiotDateFilterVM
{
    public string Target { get; set; } = "date";
    public string Title { get; set; } = "Thời gian";
    public string DefaultText { get; set; } = "Toàn thời gian";
    public bool ShowFutureOptions { get; set; } = false;

    public KiotDateFilterVM() { }

    public KiotDateFilterVM(string target, string title, bool showFuture = false)
    {
        Target = target;
        Title = title;
        ShowFutureOptions = showFuture;
    }

    public KiotDateFilterVM(string target, string title, bool showFuture, string defaultText)
    {
        Target = target;
        Title = title;
        ShowFutureOptions = showFuture;
        DefaultText = string.Equals(defaultText, "thangnay", StringComparison.OrdinalIgnoreCase) ? "Tháng này" : defaultText;
    }
}
