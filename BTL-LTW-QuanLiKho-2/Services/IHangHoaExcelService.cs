using BTL_LTW_QuanLiKho_2.ViewModels;
using BTL_LTW_QuanLiKho_2.ViewModels.HangHoa;
using Microsoft.AspNetCore.Http;

namespace BTL_LTW_QuanLiKho_2.Services;

/// <summary>
/// Service chuyên trách xử lý các tác vụ Excel cho phân hệ Hàng hóa
/// (Tạo template mẫu, Xuất dữ liệu ra file, Nhập dữ liệu từ file).
/// </summary>
public interface IHangHoaExcelService
{
    /// <summary>
    /// Tạo file Excel mẫu chuẩn KiotViet để người dùng tải về nhập liệu
    /// </summary>
    byte[] GenerateTemplate();

    /// <summary>
    /// Xuất danh sách hàng hóa ra file Excel theo các cột được người dùng tùy chọn
    /// </summary>
    byte[] ExportExcel(List<HangHoaItemVM> items, List<string>? selectedColumns);

    /// <summary>
    /// Nhập hàng hóa từ file Excel vào cơ sở dữ liệu
    /// </summary>
    Task<ImportHangHoaResult> ImportExcelAsync(IFormFile file, string duplicateMode, int whId, int nvId);
}
