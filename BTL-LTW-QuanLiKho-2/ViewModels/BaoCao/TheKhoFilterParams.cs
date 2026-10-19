using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.ViewModels;

/// <summary>
/// Tham số tìm kiếm, lọc và phân trang cho Báo cáo Thẻ kho
/// </summary>
public class TheKhoFilterParams : BaseFilterParams
{
    /// <summary>
    /// Mã hàng hóa cần theo dõi thẻ kho (Bắt buộc)
    /// </summary>
    public int? MaHang { get; set; }

    /// <summary>
    /// Mã chi nhánh kho cần lọc (nếu null = toàn bộ các kho)
    /// </summary>
    public int? MaKho { get; set; }

    /// <summary>
    /// Mã bộ lọc thời gian tiện ích: THIS_MONTH, LAST_MONTH, TODAY, YESTERDAY, LAST_7_DAYS, THIS_QUARTER, CUSTOM
    /// </summary>
    public string? DateRange { get; set; } = "THIS_MONTH";

    /// <summary>
    /// Mốc ngày bắt đầu (nếu chọn CUSTOM hoặc sau khi Resolve)
    /// </summary>
    public DateTime? TuNgay { get; set; }

    /// <summary>
    /// Mốc ngày kết thúc (nếu chọn CUSTOM hoặc sau khi Resolve)
    /// </summary>
    public DateTime? DenNgay { get; set; }

    /// <summary>
    /// Danh sách loại chứng từ cần lọc: PHIEU_NHAP, XUAT_HUY, XUAT_BAN, CHUYEN_XUAT, CHUYEN_NHAP, KIEM_KE, TRA_HANG_NHAP
    /// </summary>
    public List<string> LoaiChungTu { get; set; } = new();

    /// <summary>
    /// Từ khóa tìm kiếm nhanh trên bảng dòng thẻ kho (Mã chứng từ, đối tác, ghi chú)
    /// </summary>
    public string? TuKhoa { get; set; }
}
