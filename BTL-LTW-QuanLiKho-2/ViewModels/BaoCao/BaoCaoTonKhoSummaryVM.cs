namespace BTL_LTW_QuanLiKho_2.ViewModels;

/// <summary>
/// Các chỉ số KPI tổng hợp cho Báo cáo Tồn kho theo kho
/// </summary>
public class BaoCaoTonKhoSummaryVM
{
    /// <summary>
    /// Tổng số mặt hàng (SKU)
    /// </summary>
    public int TongSoMatHang { get; set; }

    /// <summary>
    /// Tổng số lượng tồn kho của toàn bộ mặt hàng
    /// </summary>
    public decimal TongSoLuongTon { get; set; }

    /// <summary>
    /// Tổng giá trị vốn tồn kho (Tổng số lượng * Giá vốn)
    /// </summary>
    public decimal TongGiaTriTon { get; set; }

    /// <summary>
    /// Số mặt hàng cần lưu ý (Dưới định mức tối thiểu hoặc hết hàng)
    /// </summary>
    public int SoMatHangCanLuuY { get; set; }
}
