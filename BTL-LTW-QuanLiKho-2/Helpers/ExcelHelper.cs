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
    /// Đọc an toàn giá trị của một ô Excel thành chuỗi (hỗ trợ cả ô Text, Number, DateTime, Boolean, Formula).
    /// Tuyệt đối không ném ngoại lệ InvalidCastException khi kiểu dữ liệu ô trong Excel không phải Text.
    /// </summary>
    public static string GetCellValueAsString(IXLCell? cell)
    {
        if (cell == null || cell.IsEmpty()) return string.Empty;
        try
        {
            switch (cell.Value.Type)
            {
                case XLDataType.Text:
                    return cell.Value.GetText().Trim();
                case XLDataType.Number:
                    return cell.Value.GetNumber().ToString(CultureInfo.InvariantCulture).Trim();
                case XLDataType.Boolean:
                    return cell.Value.GetBoolean().ToString().Trim();
                case XLDataType.DateTime:
                    return cell.Value.GetDateTime().ToString("dd/MM/yyyy HH:mm:ss").Trim();
                case XLDataType.TimeSpan:
                    return cell.Value.GetTimeSpan().ToString().Trim();
                default:
                    return cell.GetFormattedString()?.Trim() ?? cell.Value.ToString().Trim();
            }
        }
        catch
        {
            try { return cell.GetFormattedString()?.Trim() ?? string.Empty; }
            catch { return string.Empty; }
        }
    }

    /// <summary>
    /// Đọc giá trị chuỗi từ ô Excel an toàn, tự động Trim.
    /// </summary>
    public static string GetCellString(IXLWorksheet ws, int row, Dictionary<string, int> colMap, string key)
    {
        if (!colMap.TryGetValue(key, out int col)) return string.Empty;
        var cell = ws.Cell(row, col);
        if (cell.IsEmpty()) return string.Empty;
        return GetCellValueAsString(cell);
    }

    /// <summary>
    /// Đọc giá trị số decimal từ ô Excel an toàn, xử lý các ký hiệu tiền tệ ₫, VND và văn hóa vi-VN / Invariant.
    /// </summary>
    public static decimal GetCellDecimal(IXLWorksheet ws, int row, Dictionary<string, int> colMap, string key, decimal defaultValue = 0)
    {
        if (!colMap.TryGetValue(key, out int col)) return defaultValue;
        var cell = ws.Cell(row, col);
        if (cell.IsEmpty()) return defaultValue;

        try
        {
            if (cell.Value.Type == XLDataType.Number)
            {
                return Convert.ToDecimal(cell.Value.GetNumber());
            }

            string str = GetCellValueAsString(cell);
            if (string.IsNullOrEmpty(str)) return defaultValue;

            str = str.Replace("₫", "").Replace("VND", "", StringComparison.OrdinalIgnoreCase).Replace(" ", "");
            if (decimal.TryParse(str, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal val)) return val;
            if (decimal.TryParse(str, NumberStyles.Any, new CultureInfo("vi-VN"), out val)) return val;

            return defaultValue;
        }
        catch
        {
            return defaultValue;
        }
    }

    /// <summary>
    /// Đọc giá trị số decimal có thể null từ ô Excel.
    /// </summary>
    public static decimal? GetCellDecimalNullable(IXLWorksheet ws, int row, Dictionary<string, int> colMap, string key)
    {
        if (!colMap.TryGetValue(key, out int col)) return null;
        var cell = ws.Cell(row, col);
        if (cell.IsEmpty()) return null;

        try
        {
            if (cell.Value.Type == XLDataType.Number)
            {
                return Convert.ToDecimal(cell.Value.GetNumber());
            }

            string str = GetCellValueAsString(cell);
            if (string.IsNullOrEmpty(str)) return null;

            str = str.Replace("₫", "").Replace("VND", "", StringComparison.OrdinalIgnoreCase).Replace(" ", "");
            if (decimal.TryParse(str, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal val)) return val;
            if (decimal.TryParse(str, NumberStyles.Any, new CultureInfo("vi-VN"), out val)) return val;

            return null;
        }
        catch
        {
            return null;
        }
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

    /// <summary>
    /// Xuất danh sách dữ liệu ra mảng byte file Excel chuẩn KiotViet với ClosedXML.
    /// Tự động áp dụng Header xanh KiotViet, kẻ viền bảng, căn lề, format số/ngày và tự động co giãn độ rộng cột.
    /// </summary>
    public static byte[] ExportToExcel<T>(
        string sheetName,
        IEnumerable<ExcelExportColumn<T>> columns,
        IEnumerable<T> data)
    {
        var colList = columns.ToList();
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add(sheetName);

        // 1. Tiêu đề cột
        for (int i = 0; i < colList.Count; i++)
        {
            ws.Cell(1, i + 1).Value = colList[i].Header;
        }
        ApplyKiotVietHeaderStyle(ws.Range(1, 1, 1, colList.Count));
        ws.Row(1).Height = 28;

        // 2. Dữ liệu các dòng
        int rowIdx = 2;
        foreach (var item in data)
        {
            for (int c = 0; c < colList.Count; c++)
            {
                var col = colList[c];
                var cell = ws.Cell(rowIdx, c + 1);
                var raw = col.Selector(item);

                if (raw == null)
                {
                    cell.Value = string.Empty;
                }
                else
                {
                    switch (col.Type)
                    {
                        case ExcelColumnType.Currency:
                        case ExcelColumnType.Number:
                        case ExcelColumnType.Decimal:
                        case ExcelColumnType.Integer:
                            if (raw is decimal mVal)
                            {
                                cell.Value = mVal;
                            }
                            else if (raw is double dVal)
                            {
                                cell.Value = dVal;
                            }
                            else if (raw is int iVal)
                            {
                                cell.Value = iVal;
                            }
                            else if (raw is long lVal)
                            {
                                cell.Value = lVal;
                            }
                            else if (decimal.TryParse(raw.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed))
                            {
                                cell.Value = parsed;
                            }
                            else
                            {
                                cell.Value = raw.ToString();
                            }

                            if (!string.IsNullOrEmpty(col.NumberFormat))
                            {
                                cell.Style.NumberFormat.Format = col.NumberFormat;
                            }
                            else if (col.Type == ExcelColumnType.Currency || col.Type == ExcelColumnType.Integer)
                            {
                                cell.Style.NumberFormat.Format = "#,##0";
                            }
                            else
                            {
                                cell.Style.NumberFormat.Format = "#,##0.##";
                            }
                            break;

                        case ExcelColumnType.DateTime:
                            if (raw is DateTime dtVal)
                            {
                                cell.Value = dtVal.ToString(col.NumberFormat ?? "dd/MM/yyyy HH:mm");
                            }
                            else
                            {
                                cell.Value = raw.ToString();
                            }
                            break;

                        case ExcelColumnType.Date:
                            if (raw is DateTime dtDate)
                            {
                                cell.Value = dtDate.ToString(col.NumberFormat ?? "dd/MM/yyyy");
                            }
                            else
                            {
                                cell.Value = raw.ToString();
                            }
                            break;

                        default: // Text
                            cell.Value = raw.ToString();
                            break;
                    }
                }

                // Căn lề
                if (col.Alignment.HasValue)
                {
                    cell.Style.Alignment.Horizontal = col.Alignment.Value;
                }
                else if (col.Type == ExcelColumnType.DateTime || col.Type == ExcelColumnType.Date)
                {
                    cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                }
            }
            rowIdx++;
        }

        // 3. Viền bảng
        if (rowIdx > 2)
        {
            ApplyTableBorders(ws.Range(1, 1, rowIdx - 1, colList.Count));
        }

        // 4. Căn chỉnh độ rộng cột
        for (int c = 0; c < colList.Count; c++)
        {
            if (colList[c].Width is double widthVal)
            {
                ws.Column(c + 1).Width = widthVal;
            }
        }
        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    /// <summary>
    /// Xuất danh sách dữ liệu ra file Excel theo cú pháp Fluent Builder ngắn gọn.
    /// </summary>
    public static byte[] Export<T>(string sheetName, IEnumerable<T> data, Action<ExcelExportBuilder<T>> configure)
    {
        var builder = new ExcelExportBuilder<T>();
        configure(builder);
        return builder.Build(sheetName, data);
    }
}

/// <summary>
/// Kiểu dữ liệu cột xuất Excel
/// </summary>
public enum ExcelColumnType
{
    Text,
    Number,
    Decimal,
    Currency,
    Integer,
    DateTime,
    Date
}

/// <summary>
/// Định nghĩa một cột xuất Excel ClosedXML
/// </summary>
public class ExcelExportColumn<T>
{
    public string Header { get; set; } = string.Empty;
    public Func<T, object?> Selector { get; set; } = null!;
    public ExcelColumnType Type { get; set; } = ExcelColumnType.Text;
    public string? NumberFormat { get; set; }
    public XLAlignmentHorizontalValues? Alignment { get; set; }
    public double? Width { get; set; }

    public ExcelExportColumn() { }

    public ExcelExportColumn(
        string header,
        Func<T, object?> selector,
        ExcelColumnType type = ExcelColumnType.Text,
        string? numberFormat = null,
        XLAlignmentHorizontalValues? alignment = null,
        double? width = null)
    {
        Header = header;
        Selector = selector;
        Type = type;
        NumberFormat = numberFormat;
        Alignment = alignment;
        Width = width;
    }
}

/// <summary>
/// Fluent Builder tạo cấu hình các cột xuất Excel
/// </summary>
public class ExcelExportBuilder<T>
{
    private readonly List<ExcelExportColumn<T>> _columns = new();

    public ExcelExportBuilder<T> Add(string header, Func<T, object?> selector, ExcelColumnType type = ExcelColumnType.Text, string? format = null, XLAlignmentHorizontalValues? align = null, double? width = null)
    {
        _columns.Add(new ExcelExportColumn<T>(header, selector, type, format, align, width));
        return this;
    }

    public ExcelExportBuilder<T> AddText(string header, Func<T, object?> selector, XLAlignmentHorizontalValues? align = null)
        => Add(header, selector, ExcelColumnType.Text, null, align);

    public ExcelExportBuilder<T> AddCenter(string header, Func<T, object?> selector)
        => Add(header, selector, ExcelColumnType.Text, null, XLAlignmentHorizontalValues.Center);

    public ExcelExportBuilder<T> AddNumber(string header, Func<T, object?> selector, string format = "#,##0.##")
        => Add(header, selector, ExcelColumnType.Number, format);

    public ExcelExportBuilder<T> AddCurrency(string header, Func<T, object?> selector, string format = "#,##0")
        => Add(header, selector, ExcelColumnType.Currency, format);

    public ExcelExportBuilder<T> AddDateTime(string header, Func<T, object?> selector, string format = "dd/MM/yyyy HH:mm")
        => Add(header, selector, ExcelColumnType.DateTime, format, XLAlignmentHorizontalValues.Center);

    public ExcelExportBuilder<T> AddDate(string header, Func<T, object?> selector, string format = "dd/MM/yyyy")
        => Add(header, selector, ExcelColumnType.Date, format, XLAlignmentHorizontalValues.Center);

    public byte[] Build(string sheetName, IEnumerable<T> data)
        => ExcelHelper.ExportToExcel(sheetName, _columns, data);
}
