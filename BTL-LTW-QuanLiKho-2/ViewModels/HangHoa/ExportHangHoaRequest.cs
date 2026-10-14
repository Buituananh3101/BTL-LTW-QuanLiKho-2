using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.ViewModels;

public class ExportHangHoaRequest
{
    /// <summary>
    /// Danh sách mã cột người bán chọn xuất (ví dụ: LoaiHang, NhomHang, MaHang, TenHang...)
    /// </summary>
    public List<string> Columns { get; set; } = new();

    /// <summary>
    /// Phạm vi xuất: "ALL" (theo bộ lọc hiện tại) hoặc "SELECTED" (chỉ hàng được chọn trên bảng)
    /// </summary>
    public string ExportScope { get; set; } = "ALL";

    /// <summary>
    /// Danh sách ID hàng hóa được chọn (dạng "1,2,5") khi ExportScope == "SELECTED"
    /// </summary>
    public string? SelectedIds { get; set; }

    // Các tiêu chí bộ lọc đồng bộ với trang danh sách
    public string? Q { get; set; }
    public string? Nhom { get; set; }
    public string? TonKhoFilter { get; set; }
    public string? NhaCungCap { get; set; }
    public string? ViTri { get; set; }
    public string? LoaiHang { get; set; }
    public string? DuKienFilter { get; set; }
    public string? TgTaoFilter { get; set; }
    public DateTime? TgTaoFrom { get; set; }
    public DateTime? TgTaoTo { get; set; }
    public bool? DaDanhDau { get; set; }
}
