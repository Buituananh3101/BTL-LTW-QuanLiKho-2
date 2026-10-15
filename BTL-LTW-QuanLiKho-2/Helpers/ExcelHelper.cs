using ClosedXML.Excel;
using System.Globalization;
using System.Text;

namespace BTL_LTW_QuanLiKho_2.Helpers;

/// <summary>
/// Bộ công cụ tiện ích xử lý đọc và ghi file Excel bằng ClosedXML dùng chung cho toàn bộ dự án.
/// Phục vụ các tính năng Xuất danh sách, Nhập từ Excel, Tải mẫu template.
/// </summary>
public static class ExcelHelper
{
    /// <summary>
    /// Đọc giá trị chuỗi từ ô Excel an toàn, tự động Trim.
    /// </summary>
    public static string GetCellString(IXLWorksheet ws, int row, Dictionary<string, int> colMap, string key)
    {
        if (!colMap.TryGetValue(key, out int col)) return string.Empty;
        var cell = ws.Cell(row, col);
        if (cell.IsEmpty()) return string.Empty;
        return cell.GetString()?.Trim() ?? string.Empty;
    }

    /// <summary>
    /// Đọc giá trị số decimal từ ô Excel an toàn, xử lý các ký hiệu tiền tệ ₫, VND và văn hóa vi-VN / Invariant.
    /// </summary>
    public static decimal GetCellDecimal(IXLWorksheet ws, int row, Dictionary<string, int> colMap, string key, decimal defaultValue = 0)
    {
        if (!colMap.TryGetValue(key, out int col)) return defaultValue;
        var cell = ws.Cell(row, col);
        if (cell.IsEmpty()) return defaultValue;

        if (cell.DataType == XLDataType.Number)
        {
            return Convert.ToDecimal(cell.GetDouble());
        }

        string str = cell.GetString()?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(str)) return defaultValue;

        str = str.Replace("₫", "").Replace("VND", "", StringComparison.OrdinalIgnoreCase).Replace(" ", "");
        if (decimal.TryParse(str, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal val)) return val;
        if (decimal.TryParse(str, NumberStyles.Any, new CultureInfo("vi-VN"), out val)) return val;

        return defaultValue;
    }

    /// <summary>
    /// Đọc giá trị số decimal có thể null từ ô Excel.
    /// </summary>
    public static decimal? GetCellDecimalNullable(IXLWorksheet ws, int row, Dictionary<string, int> colMap, string key)
    {
        if (!colMap.TryGetValue(key, out int col)) return null;
        var cell = ws.Cell(row, col);
        if (cell.IsEmpty()) return null;

        if (cell.DataType == XLDataType.Number)
        {
            return Convert.ToDecimal(cell.GetDouble());
        }

        string str = cell.GetString()?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(str)) return null;

        str = str.Replace("₫", "").Replace("VND", "", StringComparison.OrdinalIgnoreCase).Replace(" ", "");
        if (decimal.TryParse(str, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal val)) return val;
        if (decimal.TryParse(str, NumberStyles.Any, new CultureInfo("vi-VN"), out val)) return val;

        return null;
    }

    /// <summary>
    /// Chuẩn hóa chuỗi tiếng Việt: Bỏ dấu, chuyển thành chữ thường không dấu để so khớp tiêu đề cột Excel linh hoạt.
    /// </summary>
    public static string RemoveDiacritics(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        var normalizedString = text.Normalize(NormalizationForm.FormD);
        var stringBuilder = new StringBuilder(capacity: normalizedString.Length);

        for (int i = 0; i < normalizedString.Length; i++)
        {
            char c = normalizedString[i];
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                stringBuilder.Append(c);
            }
        }

        return stringBuilder
            .ToString()
            .Normalize(NormalizationForm.FormC)
            .Replace('đ', 'd')
            .Replace('Đ', 'D')
            .Trim()
            .ToLowerInvariant();
    }

    /// <summary>
    /// Áp dụng định dạng Header chuẩn KiotViet: Màu nền xanh đậm `#0066cc`, chữ trắng, in đậm, căn giữa.
    /// </summary>
    public static void ApplyKiotVietHeaderStyle(IXLRange range)
    {
        range.Style.Font.Bold = true;
        range.Style.Font.FontColor = XLColor.White;
        range.Style.Fill.BackgroundColor = XLColor.FromHtml("#0066cc");
        range.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        range.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        range.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        range.Style.Border.OutsideBorderColor = XLColor.FromHtml("#004c99");
    }

    /// <summary>
    /// Áp dụng viền mỏng chuẩn bảng dữ liệu Excel cho toàn bộ vùng cell.
    /// </summary>
    public static void ApplyTableBorders(IXLRange range)
    {
        range.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
        range.Style.Border.InsideBorderColor = XLColor.FromHtml("#e2e8f0");
        range.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        range.Style.Border.OutsideBorderColor = XLColor.FromHtml("#cbd5e1");
    }
}
