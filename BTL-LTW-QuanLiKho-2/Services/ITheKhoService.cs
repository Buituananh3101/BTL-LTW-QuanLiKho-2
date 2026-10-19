using System.Collections.Generic;
using System.Threading.Tasks;
using BTL_LTW_QuanLiKho_2.ViewModels;

namespace BTL_LTW_QuanLiKho_2.Services;

/// <summary>
/// Giao diện dịch vụ tính toán và kết xuất Báo cáo Thẻ kho
/// </summary>
public interface ITheKhoService
{
    /// <summary>
    /// Nạp dữ liệu báo cáo Thẻ kho đầy đủ kèm KPI tổng hợp, tồn đầu kỳ, tồn lũy kế và phân trang
    /// </summary>
    Task<TheKhoIndexVM> LayBaoCaoTheKhoAsync(TheKhoFilterParams filter, int? userKhoId = null, bool isQuanLy = false);

    /// <summary>
    /// Xuất toàn bộ dữ liệu dòng biến động Thẻ kho ra file Excel ClosedXML
    /// </summary>
    Task<byte[]> XuatExcelTheKhoAsync(TheKhoFilterParams filter, int? userKhoId = null, bool isQuanLy = false);

    /// <summary>
    /// Nạp nhanh N dòng biến động gần nhất của mặt hàng tại kho phục vụ hiển thị trong Drawer Hàng hóa
    /// </summary>
    Task<List<TheKhoDongVM>> LayLichSuTheKhoNhanhAsync(int maHang, int maKho, int soLuong = 10);
}
