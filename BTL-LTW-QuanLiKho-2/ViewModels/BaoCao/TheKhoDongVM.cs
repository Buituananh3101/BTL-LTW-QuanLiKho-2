using System;

namespace BTL_LTW_QuanLiKho_2.ViewModels;

/// <summary>
/// Đại diện cho 1 dòng giao dịch biến động trên Thẻ kho
/// </summary>
public class TheKhoDongVM
{
    /// <summary>
    /// Số thứ tự dòng
    /// </summary>
    public int Stt { get; set; }

    /// <summary>
    /// Thời gian phát sinh giao dịch
    /// </summary>
    public DateTime NgayGiaoDich { get; set; }

    /// <summary>
    /// Mã ID chứng từ nội bộ
    /// </summary>
    public int MaChungTu { get; set; }

    /// <summary>
    /// Mã chứng từ hiển thị (PN000001, PX000002, CK000003, KK000001, THN000001)
    /// </summary>
    public string MaChungTuHienThi { get; set; } = string.Empty;

    /// <summary>
    /// Mã loại chứng từ nguyên thủy (PHIEU_NHAP, XUAT_HUY, XUAT_BAN, CHUYEN_XUAT, CHUYEN_NHAP, KIEM_KE, TRA_HANG_NHAP)
    /// </summary>
    public string LoaiChungTu { get; set; } = string.Empty;

    /// <summary>
    /// Tên loại giao dịch thân thiện (Nhập hàng, Xuất hủy, Bán hàng, Chuyển đến, Chuyển đi, Kiểm kê, Trả hàng nhập)
    /// </summary>
    public string TenLoaiChungTu { get; set; } = string.Empty;

    /// <summary>
    /// CSS Class cho badge loại giao dịch
    /// </summary>
    public string BadgeClass { get; set; } = "bg-secondary";

    /// <summary>
    /// Đối tác liên quan (Nhà cung cấp, Khách hàng, Chi nhánh kho chuyển/nhận, Lý do xuất)
    /// </summary>
    public string DoiTac { get; set; } = string.Empty;

    /// <summary>
    /// Ghi chú kèm theo chứng từ
    /// </summary>
    public string? GhiChu { get; set; }

    /// <summary>
    /// Đơn giá giao dịch / Giá vốn tại thời điểm phát sinh
    /// </summary>
    public decimal DonGia { get; set; }

    /// <summary>
    /// Số lượng nhập (Tăng kho)
    /// </summary>
    public decimal SoLuongTang { get; set; }

    /// <summary>
    /// Số lượng xuất (Giảm kho)
    /// </summary>
    public decimal SoLuongGiam { get; set; }

    /// <summary>
    /// Số lượng tồn lũy kế sau khi thực hiện giao dịch này
    /// </summary>
    public decimal TonLuyKe { get; set; }

    /// <summary>
    /// Đường dẫn mở chi tiết chứng từ (nếu có)
    /// </summary>
    public string? UrlChiTiet { get; set; }
}
