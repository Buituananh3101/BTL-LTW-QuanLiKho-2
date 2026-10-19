namespace BTL_LTW_QuanLiKho_2.ViewModels;

/// <summary>
/// Đại diện cho một dòng hàng hóa trên bảng Pivot Báo cáo Tồn kho
/// </summary>
public class BaoCaoTonKhoItemVM
{
    public int MaHang { get; set; }
    public string MaHangNoiBo { get; set; } = string.Empty;
    public string TenHang { get; set; } = string.Empty;
    public string TenDvt { get; set; } = string.Empty;
    public string TenNhom { get; set; } = string.Empty;
    public string? ViTri { get; set; }
    public decimal GiaVon { get; set; }
    public decimal GiaBanThamKhao { get; set; }
    public string TrangThai { get; set; } = "DANG_KINH_DOANH";

    /// <summary>
    /// Số lượng tồn của mặt hàng tại từng kho: Key = MaKho, Value = SoLuongTon
    /// </summary>
    public Dictionary<int, decimal> TonTheoKho { get; set; } = new();

    /// <summary>
    /// Tổng tồn của mặt hàng trên các kho đang được chọn lọc
    /// </summary>
    public decimal TongTon { get; set; }

    /// <summary>
    /// Tổng giá trị tồn kho = TongTon * GiaVon
    /// </summary>
    public decimal GiaTriTon => TongTon * GiaVon;

    /// <summary>
    /// Cờ cảnh báo có kho nào bị dưới định mức tồn tối thiểu
    /// </summary>
    public bool CoDuoiDinhMuc { get; set; }

    /// <summary>
    /// Cờ cảnh báo có kho nào bị vượt định mức tồn cao nhất
    /// </summary>
    public bool CoVuotDinhMuc { get; set; }

    /// <summary>
    /// Ngưỡng tồn chi tiết theo từng kho: Key = MaKho, Value = (TonToiThieu, TonCaoNhat)
    /// </summary>
    public Dictionary<int, (decimal TonToiThieu, decimal? TonCaoNhat)> DinhMucTheoKho { get; set; } = new();
}
