using System;

namespace BTL_LTW_QuanLiKho_2.ViewModels;

/// <summary>
/// Các thông tin tóm tắt hàng hóa và chỉ số KPI tổng hợp cho Thẻ kho
/// </summary>
public class TheKhoTongHopVM
{
    // Thông tin hàng hóa
    public int MaHang { get; set; }
    public string MaHangNoiBo { get; set; } = string.Empty;
    public string TenHang { get; set; } = string.Empty;
    public string TenDvt { get; set; } = string.Empty;
    public string? TenNhomHang { get; set; }
    public string? ViTri { get; set; }
    public decimal GiaVon { get; set; }
    public decimal GiaBan { get; set; }

    // Kho & Thời gian báo cáo
    public int? MaKho { get; set; }
    public string TenKho { get; set; } = "Tất cả kho";
    public DateTime TuNgay { get; set; }
    public DateTime DenNgay { get; set; }

    // Chỉ số KPI Thẻ kho
    public decimal TonDauKy { get; set; }
    public decimal TongNhapKy { get; set; }
    public decimal TongXuatKy { get; set; }
    public decimal TonCuoiKy { get; set; }
    public int TongSoGiaoDich { get; set; }
}
