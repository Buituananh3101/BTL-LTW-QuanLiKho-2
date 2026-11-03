namespace BTL_LTW_QuanLiKho_2.ViewModels.Common;

/// <summary>
/// KiotValueFilterVM – ViewModel cho component Bộ lọc Khoảng giá trị (Từ - Tới) chuẩn KiotViet
/// </summary>
public class KiotValueFilterVM
{
    public string Id { get; set; } = "";
    public string? Title { get; set; }
    public string? SubTitle { get; set; } = "Giá trị";
    public string? DotId { get; set; }
    public string? FromId { get; set; }
    public string? ToId { get; set; }
    public string FromLabel { get; set; } = "Từ";
    public string ToLabel { get; set; } = "Tới";
    public string FromPlaceholder { get; set; } = "Nhập giá trị";
    public string ToPlaceholder { get; set; } = "Nhập giá trị";
    public decimal? FromValue { get; set; }
    public decimal? ToValue { get; set; }

    public KiotValueFilterVM() { }

    public KiotValueFilterVM(string id, string? title = null, string? subTitle = "Giá trị")
    {
        Id = id;
        Title = title;
        SubTitle = subTitle;
    }
}
