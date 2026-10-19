using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.ViewModels.QuanLyKho;

/// <summary>
/// Tham số lọc và phân trang danh sách kho
/// </summary>
public class KhoFilterParams : BaseFilterParams
{
    /// <summary>
    /// Danh sách trạng thái cần lọc: "HOAT_DONG", "NGUNG_HOAT_DONG"
    /// </summary>
    public List<string> TrangThais { get; set; } = new();
}
