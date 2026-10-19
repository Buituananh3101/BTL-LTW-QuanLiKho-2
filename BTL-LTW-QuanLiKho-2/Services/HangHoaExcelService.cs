using ClosedXML.Excel;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using BTL_LTW_QuanLiKho_2.Models;
using BTL_LTW_QuanLiKho_2.ViewModels;
using BTL_LTW_QuanLiKho_2.ViewModels.HangHoa;
using BTL_LTW_QuanLiKho_2.Helpers;

namespace BTL_LTW_QuanLiKho_2.Services;

/// <summary>
/// Triển khai dịch vụ xuất/nhập Excel chuẩn ClosedXML cho phân hệ Hàng hóa.
/// </summary>
public class HangHoaExcelService : IHangHoaExcelService
{
    private readonly QuanLyKhoPhuQuocLtwContext _context;

    public HangHoaExcelService(QuanLyKhoPhuQuocLtwContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Tạo file Excel mẫu chuẩn KiotViet để người dùng tải về nhập liệu
    /// </summary>
    public byte[] GenerateTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("DanhSachHangHoa");

        var columns = new[]
        {
            ("Loại hàng", "Hàng hóa / Dịch vụ / Combo"),
            ("Nhóm hàng", "Tên nhóm (tự tạo nếu chưa có)"),
            ("Mã hàng", "Để trống sẽ tự sinh mã HH..."),
            ("Tên hàng (*)", "Bắt buộc nhập"),
            ("Giá bán", "Số tiền (VNĐ)"),
            ("Giá vốn", "Số tiền (VNĐ)"),
            ("Tồn kho", "Tồn ban đầu trong kho"),
            ("Tồn nhỏ nhất", "Định mức tồn tối thiểu"),
            ("Tồn lớn nhất", "Định mức tồn tối đa"),
            ("Đơn vị tính", "Tên ĐVT (tự tạo nếu chưa có)"),
            ("Thuộc tính", "Ví dụ: Màu sắc:Đỏ,Size:XL"),
            ("Trọng lượng", "Số thập phân"),
            ("Đơn vị trọng lượng", "g hoặc kg"),
            ("Vị trí", "Ví dụ: Kệ A1, Ngăn 2"),
            ("Mô tả", "Mô tả chi tiết sản phẩm"),
            ("Trạng thái", "Đang kinh doanh / Ngừng bán")
        };

        // Row 1: Header
        for (int i = 0; i < columns.Length; i++)
        {
            var cell = ws.Cell(1, i + 1);
            cell.Value = columns[i].Item1;
        }
        ExcelHelper.ApplyKiotVietHeaderStyle(ws.Range(1, 1, 1, columns.Length));
        ws.Row(1).Height = 28;

        // Row 2: Chú thích / Hướng dẫn
        for (int i = 0; i < columns.Length; i++)
        {
            var cell = ws.Cell(2, i + 1);
            cell.Value = columns[i].Item2;
            cell.Style.Font.Italic = true;
            cell.Style.Font.FontSize = 10;
            cell.Style.Font.FontColor = XLColor.FromHtml("#6c757d");
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#f8f9fa");
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            cell.Style.Border.OutsideBorderColor = XLColor.FromHtml("#e9ecef");
        }
        ws.Row(2).Height = 22;

        // Dòng mẫu 1
        ws.Cell(3, 1).Value = "Hàng hóa";
        ws.Cell(3, 2).Value = "Bánh kẹo";
        ws.Cell(3, 3).Value = "HH000001";
        ws.Cell(3, 4).Value = "Bánh Cosy Marie 144g";
        ws.Cell(3, 5).Value = 15000;
        ws.Cell(3, 6).Value = 10000;
        ws.Cell(3, 7).Value = 50;
        ws.Cell(3, 8).Value = 10;
        ws.Cell(3, 9).Value = 200;
        ws.Cell(3, 10).Value = "Hộp";
        ws.Cell(3, 11).Value = "Hương vị:Vani,Quy cách:144g";
        ws.Cell(3, 12).Value = 144;
        ws.Cell(3, 13).Value = "g";
        ws.Cell(3, 14).Value = "Kệ A1-02";
        ws.Cell(3, 15).Value = "Bánh quy bơ xốp thơm ngon dinh dưỡng";
        ws.Cell(3, 16).Value = "Đang kinh doanh";

        // Dòng mẫu 2
        ws.Cell(4, 1).Value = "Hàng hóa";
        ws.Cell(4, 2).Value = "Nước giải khát";
        ws.Cell(4, 3).Value = ""; // để trống để test tự sinh mã
        ws.Cell(4, 4).Value = "Nước khoáng Lavie 500ml";
        ws.Cell(4, 5).Value = 7000;
        ws.Cell(4, 6).Value = 4500;
        ws.Cell(4, 7).Value = 120;
        ws.Cell(4, 8).Value = 24;
        ws.Cell(4, 9).Value = 500;
        ws.Cell(4, 10).Value = "Chai";
        ws.Cell(4, 11).Value = "Dung tích:500ml";
        ws.Cell(4, 12).Value = 500;
        ws.Cell(4, 13).Value = "g";
        ws.Cell(4, 14).Value = "Kệ B2-01";
        ws.Cell(4, 15).Value = "Nước khoáng thiên nhiên đóng chai tiện lợi";
        ws.Cell(4, 16).Value = "Đang kinh doanh";

        for (int r = 3; r <= 4; r++)
        {
            ws.Cell(r, 5).Style.NumberFormat.Format = "#,##0";
            ws.Cell(r, 6).Style.NumberFormat.Format = "#,##0";
            ws.Cell(r, 7).Style.NumberFormat.Format = "#,##0";
            ws.Cell(r, 8).Style.NumberFormat.Format = "#,##0";
            ws.Cell(r, 9).Style.NumberFormat.Format = "#,##0";
            ws.Cell(r, 12).Style.NumberFormat.Format = "#,##0";
            ws.Row(r).Height = 22;
        }

        ExcelHelper.ApplyTableBorders(ws.Range(3, 1, 4, columns.Length));
        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    /// <summary>
    /// Xuất danh sách hàng hóa ra file Excel theo các cột được tùy chọn
    /// </summary>
    public byte[] ExportExcel(List<HangHoaItemVM> items, List<string>? selectedColumns)
    {
        var allColMap = new Dictionary<string, ExcelExportColumn<HangHoaItemVM>>(StringComparer.OrdinalIgnoreCase)
        {
            ["LoaiHang"] = new("Loại hàng", x => "Hàng hóa"),
            ["NhomHang"] = new("Nhóm hàng", x => x.TenNhom),
            ["MaHang"] = new("Mã hàng", x => x.MaHangNoiBo, alignment: XLAlignmentHorizontalValues.Center),
            ["TenHang"] = new("Tên hàng", x => x.TenHang),
            ["GiaBan"] = new("Giá bán", x => x.GiaBan, ExcelColumnType.Currency),
            ["GiaVon"] = new("Giá vốn", x => x.GiaVon, ExcelColumnType.Currency),
            ["TonKho"] = new("Tồn kho", x => x.TonKho, ExcelColumnType.Number),
            ["TonNhoNhat"] = new("Tồn nhỏ nhất", x => x.TonToiThieu ?? 0, ExcelColumnType.Number),
            ["TonLonNhat"] = new("Tồn lớn nhất", x => x.TonCaoNhat ?? 0, ExcelColumnType.Number),
            ["Dvt"] = new("Đơn vị tính", x => x.TenDvt, alignment: XLAlignmentHorizontalValues.Center),
            ["ThuocTinh"] = new("Thuộc tính", x => x.ThuocTinhs != null && x.ThuocTinhs.Any() ? string.Join(",", x.ThuocTinhs.Select(a => $"{a.Ten}:{a.GiaTri}")) : ""),
            ["TrongLuong"] = new("Trọng lượng", x => x.TrongLuong ?? 0, ExcelColumnType.Number),
            ["DonViTrongLuong"] = new("Đơn vị trọng lượng", x => x.DonViTrongLuong ?? "g", alignment: XLAlignmentHorizontalValues.Center),
            ["ViTri"] = new("Vị trí", x => x.ViTri ?? ""),
            ["MoTa"] = new("Mô tả", x => x.MoTa ?? x.QuyCach ?? ""),
            ["TrangThai"] = new("Trạng thái", x => x.TrangThai == "NGUNG_BAN" ? "Ngừng bán" : "Đang kinh doanh", alignment: XLAlignmentHorizontalValues.Center)
        };

        var selectedCols = (selectedColumns != null && selectedColumns.Count > 0)
            ? selectedColumns.Where(allColMap.ContainsKey).Select(k => allColMap[k]).ToList()
            : allColMap.Values.ToList();

        if (!selectedCols.Any()) selectedCols = allColMap.Values.ToList();

        return ExcelHelper.ExportToExcel("DanhSachHangHoa", selectedCols, items);
    }

    /// <summary>
    /// Nhập hàng hóa từ file Excel vào CSDL
    /// </summary>
    public async Task<ImportHangHoaResult> ImportExcelAsync(IFormFile file, string duplicateMode, int whId, int nvId)
    {
        using var stream = file.OpenReadStream();
        using var workbook = new XLWorkbook(stream);
        var ws = workbook.Worksheets.FirstOrDefault();
        if (ws == null)
        {
            return new ImportHangHoaResult { Success = false, Message = "File Excel không chứa bất kỳ trang tính nào." };
        }

        // Tìm dòng header
        int headerRow = 1;
        var colMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        for (int r = 1; r <= Math.Min(5, ws.LastRowUsed()?.RowNumber() ?? 1); r++)
        {
            var tempMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            int lastCol = ws.Row(r).LastCellUsed()?.Address.ColumnNumber ?? 0;
            for (int col = 1; col <= lastCol; col++)
            {
                string header = ExcelHelper.GetCellValueAsString(ws.Cell(r, col));
                if (string.IsNullOrEmpty(header)) continue;
                string norm = ExcelHelper.RemoveDiacritics(header).Replace(" ", "").Replace("(*)", "").Replace("*", "");

                if (norm.Contains("tenhang") || norm.Contains("tensanpham")) tempMap["TenHang"] = col;
                else if (norm.Contains("mahang") || norm.Contains("masanpham") || norm == "ma") tempMap["MaHang"] = col;
                else if (norm.Contains("loaihang")) tempMap["LoaiHang"] = col;
                else if (norm.Contains("nhomhang") || norm.Contains("nhom")) tempMap["NhomHang"] = col;
                else if (norm.Contains("giaban")) tempMap["GiaBan"] = col;
                else if (norm.Contains("giavon") || norm.Contains("gianhap")) tempMap["GiaVon"] = col;
                else if (norm.Contains("tonkho") || norm.Contains("tonbandau") || norm == "ton") tempMap["TonKho"] = col;
                else if (norm.Contains("tonnhonhat") || norm.Contains("tontoithieu")) tempMap["TonNhoNhat"] = col;
                else if (norm.Contains("tonlonnhat") || norm.Contains("tontoida") || norm.Contains("toncaonhat")) tempMap["TonLonNhat"] = col;
                else if (norm.Contains("donvitinh") || norm == "dvt") tempMap["Dvt"] = col;
                else if (norm.Contains("thuoctinh")) tempMap["ThuocTinh"] = col;
                else if (norm.Contains("trongluong")) tempMap["TrongLuong"] = col;
                else if (norm.Contains("donvitrongluong") || norm.Contains("donvitl")) tempMap["DonViTrongLuong"] = col;
                else if (norm.Contains("vitri")) tempMap["ViTri"] = col;
                else if (norm.Contains("mota") || norm.Contains("quycach")) tempMap["MoTa"] = col;
                else if (norm.Contains("trangthai")) tempMap["TrangThai"] = col;
            }

            if (tempMap.ContainsKey("TenHang"))
            {
                headerRow = r;
                colMap = tempMap;
                break;
            }
        }

        if (!colMap.ContainsKey("TenHang"))
        {
            return new ImportHangHoaResult
            {
                Success = false,
                Message = "File Excel thiếu cột bắt buộc 'Tên hàng (*)' hoặc tiêu đề không đúng định dạng."
            };
        }

        int startRow = headerRow + 1;
        int lastRow = ws.LastRowUsed()?.RowNumber() ?? headerRow;

        if (startRow <= lastRow)
        {
            string sampleCheck = ExcelHelper.GetCellValueAsString(ws.Cell(startRow, colMap["TenHang"])).ToLower();
            if (sampleCheck.Contains("bắt buộc") || sampleCheck.Contains("hướng dẫn") || sampleCheck.Contains("ví dụ"))
            {
                startRow++;
            }
        }

        if (startRow > lastRow)
        {
            return new ImportHangHoaResult { Success = false, Message = "File Excel không có dữ liệu hàng hóa nào để nhập." };
        }

        var existingNhom = await _context.NhomHangs.ToDictionaryAsync(x => x.TenNhom.Trim().ToLower(), x => x);
        var existingDvt = await _context.DonViTinhs.ToDictionaryAsync(x => x.TenDvt.Trim().ToLower(), x => x);
        var existingHangHoa = await _context.HangHoas.ToDictionaryAsync(x => x.MaHangNoiBo.Trim().ToLower(), x => x);

        var defaultNhom = existingNhom.Values.FirstOrDefault();
        if (defaultNhom == null)
        {
            defaultNhom = new NhomHang { TenNhom = "Mặc định", TrangThai = "ACTIVE" };
            _context.NhomHangs.Add(defaultNhom);
            await _context.SaveChangesAsync();
            existingNhom[defaultNhom.TenNhom.ToLower()] = defaultNhom;
        }

        var defaultDvt = existingDvt.Values.FirstOrDefault();
        if (defaultDvt == null)
        {
            defaultDvt = new DonViTinh { TenDvt = "Cái" };
            _context.DonViTinhs.Add(defaultDvt);
            await _context.SaveChangesAsync();
            existingDvt[defaultDvt.TenDvt.ToLower()] = defaultDvt;
        }

        int nextAutoNum = await GetNextAutoProductNumberAsync();
        int insertedCount = 0;
        int updatedCount = 0;
        int skippedCount = 0;
        var errorList = new List<string>();
        var initialStockList = new List<(int MaHang, decimal SoLuong, decimal DonGia)>();

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            for (int r = startRow; r <= lastRow; r++)
            {
                bool isRowEmpty = true;
                foreach (var col in colMap.Values)
                {
                    if (!ws.Cell(r, col).IsEmpty())
                    {
                        isRowEmpty = false;
                        break;
                    }
                }
                if (isRowEmpty) continue;

                string tenHang = ExcelHelper.GetCellString(ws, r, colMap, "TenHang");
                if (string.IsNullOrWhiteSpace(tenHang))
                {
                    errorList.Add($"Dòng {r}: Tên hàng không được để trống.");
                    continue;
                }

                string maHang = ExcelHelper.GetCellString(ws, r, colMap, "MaHang");
                string nhom = ExcelHelper.GetCellString(ws, r, colMap, "NhomHang");
                string dvt = ExcelHelper.GetCellString(ws, r, colMap, "Dvt");
                decimal giaBan = ExcelHelper.GetCellDecimal(ws, r, colMap, "GiaBan", 0);
                decimal giaVon = ExcelHelper.GetCellDecimal(ws, r, colMap, "GiaVon", 0);
                decimal tonKho = ExcelHelper.GetCellDecimal(ws, r, colMap, "TonKho", 0);
                decimal? tonNhoNhat = ExcelHelper.GetCellDecimalNullable(ws, r, colMap, "TonNhoNhat");
                decimal? tonLonNhat = ExcelHelper.GetCellDecimalNullable(ws, r, colMap, "TonLonNhat");
                string thuocTinhText = ExcelHelper.GetCellString(ws, r, colMap, "ThuocTinh");
                decimal? trongLuong = ExcelHelper.GetCellDecimalNullable(ws, r, colMap, "TrongLuong");
                string donViTrongLuong = ExcelHelper.GetCellString(ws, r, colMap, "DonViTrongLuong");
                if (string.IsNullOrWhiteSpace(donViTrongLuong)) donViTrongLuong = "g";
                string viTri = ExcelHelper.GetCellString(ws, r, colMap, "ViTri");
                string moTa = ExcelHelper.GetCellString(ws, r, colMap, "MoTa");
                string trangThai = ExcelHelper.GetCellString(ws, r, colMap, "TrangThai");
                string status = (trangThai != null && trangThai.ToLower().Contains("ngừng")) ? "NGUNG_BAN" : "DANG_BAN";

                int maNhom = defaultNhom.MaNhom;
                if (!string.IsNullOrWhiteSpace(nhom))
                {
                    string key = nhom.Trim().ToLower();
                    if (existingNhom.TryGetValue(key, out var grp))
                    {
                        maNhom = grp.MaNhom;
                    }
                    else
                    {
                        var newGrp = new NhomHang { TenNhom = nhom.Trim(), TrangThai = "ACTIVE" };
                        _context.NhomHangs.Add(newGrp);
                        await _context.SaveChangesAsync();
                        existingNhom[key] = newGrp;
                        maNhom = newGrp.MaNhom;
                    }
                }

                int maDvt = defaultDvt.MaDvt;
                if (!string.IsNullOrWhiteSpace(dvt))
                {
                    string key = dvt.Trim().ToLower();
                    if (existingDvt.TryGetValue(key, out var u))
                    {
                        maDvt = u.MaDvt;
                    }
                    else
                    {
                        var newU = new DonViTinh { TenDvt = dvt.Trim() };
                        _context.DonViTinhs.Add(newU);
                        await _context.SaveChangesAsync();
                        existingDvt[key] = newU;
                        maDvt = newU.MaDvt;
                    }
                }

                string? thuocTinhJson = ParseThuocTinhTextToJson(thuocTinhText);

                HangHoa? existingItem = null;
                bool isExisting = !string.IsNullOrWhiteSpace(maHang) && existingHangHoa.TryGetValue(maHang.Trim().ToLower(), out existingItem);

                if (isExisting && existingItem != null)
                {
                    if (duplicateMode == "ERROR")
                    {
                        errorList.Add($"Dòng {r}: Mã hàng '{maHang}' đã tồn tại trong hệ thống.");
                        continue;
                    }
                    if (duplicateMode == "SKIP")
                    {
                        skippedCount++;
                        continue;
                    }

                    // Chế độ UPDATE
                    existingItem.TenHang = tenHang;
                    existingItem.MaNhom = maNhom;
                    existingItem.MaDvt = maDvt;
                    if (giaBan > 0) existingItem.GiaBanThamKhao = giaBan;
                    if (giaVon > 0) existingItem.GiaVon = giaVon;
                    if (!string.IsNullOrWhiteSpace(viTri)) existingItem.ViTri = viTri;
                    if (trongLuong.HasValue && trongLuong.Value > 0) existingItem.TrongLuong = trongLuong;
                    if (!string.IsNullOrWhiteSpace(donViTrongLuong)) existingItem.DonViTrongLuong = donViTrongLuong;
                    if (!string.IsNullOrWhiteSpace(moTa))
                    {
                        existingItem.MoTa = moTa;
                        existingItem.QuyCach = moTa;
                    }
                    if (!string.IsNullOrWhiteSpace(thuocTinhJson)) existingItem.ThuocTinh = thuocTinhJson;
                    existingItem.TrangThai = status;

                    if (tonNhoNhat.HasValue || tonLonNhat.HasValue)
                    {
                        var nguong = await _context.NguongTonKhos.FirstOrDefaultAsync(n => n.MaHang == existingItem.MaHang && n.MaKho == whId);
                        if (nguong == null)
                        {
                            _context.NguongTonKhos.Add(new NguongTonKho
                            {
                                MaHang = existingItem.MaHang,
                                MaKho = whId,
                                TonToiThieu = tonNhoNhat ?? 0,
                                TonCaoNhat = tonLonNhat ?? 999999999m
                            });
                        }
                        else
                        {
                            if (tonNhoNhat.HasValue) nguong.TonToiThieu = tonNhoNhat.Value;
                            if (tonLonNhat.HasValue) nguong.TonCaoNhat = tonLonNhat.Value;
                        }
                    }

                    updatedCount++;
                }
                else
                {
                    // Chế độ INSERT
                    string newCode = !string.IsNullOrWhiteSpace(maHang) ? maHang.Trim() : MaChungTuHelper.FormatMaHang(nextAutoNum++);
                    while (existingHangHoa.ContainsKey(newCode.ToLower()))
                    {
                        newCode = MaChungTuHelper.FormatMaHang(nextAutoNum++);
                    }

                    var newItem = new HangHoa
                    {
                        MaHangNoiBo = newCode,
                        TenHang = tenHang,
                        MaNhom = maNhom,
                        MaDvt = maDvt,
                        GiaBanThamKhao = giaBan,
                        GiaVon = giaVon,
                        ViTri = viTri,
                        TrongLuong = trongLuong,
                        DonViTrongLuong = donViTrongLuong,
                        MoTa = moTa,
                        QuyCach = moTa,
                        ThuocTinh = thuocTinhJson,
                        TrangThai = status,
                        NgayTao = DateTime.Now,
                        DaDanhDau = false
                    };

                    _context.HangHoas.Add(newItem);
                    await _context.SaveChangesAsync();
                    existingHangHoa[newCode.ToLower()] = newItem;

                    if (tonNhoNhat.HasValue || tonLonNhat.HasValue)
                    {
                        _context.NguongTonKhos.Add(new NguongTonKho
                        {
                            MaHang = newItem.MaHang,
                            MaKho = whId,
                            TonToiThieu = tonNhoNhat ?? 0,
                            TonCaoNhat = tonLonNhat ?? 999999999m
                        });
                        await _context.SaveChangesAsync();
                    }

                    if (tonKho > 0)
                    {
                        decimal cost = giaVon > 0 ? giaVon : (giaBan > 0 ? giaBan : 0);
                        initialStockList.Add((newItem.MaHang, tonKho, cost));
                    }

                    insertedCount++;
                }
            }

            if (duplicateMode == "ERROR" && errorList.Any())
            {
                await trans.RollbackAsync();
                return new ImportHangHoaResult
                {
                    Success = false,
                    Message = $"Phát hiện {errorList.Count} lỗi trong quá trình xử lý. Dữ liệu chưa được lưu.",
                    Errors = errorList
                };
            }

            // Tạo phiếu nhập đầu kỳ nếu có sản phẩm có tồn ban đầu > 0
            if (initialStockList.Any())
            {
                var phieuNhap = new PhieuNhap
                {
                    MaKho = whId,
                    MaNvlap = nvId,
                    MaNvxacNhan = nvId,
                    NgayLap = DateTime.Now,
                    NgayXacNhan = DateTime.Now,
                    LoaiPhieuNhap = "DAU_KY",
                    TrangThai = "DA_XAC_NHAN",
                    GhiChu = $"Tồn kho ban đầu từ file Excel ({initialStockList.Count} mặt hàng)"
                };
                _context.PhieuNhaps.Add(phieuNhap);
                await _context.SaveChangesAsync();

                foreach (var stock in initialStockList)
                {
                    _context.ChiTietPhieuNhaps.Add(new ChiTietPhieuNhap
                    {
                        MaPhieuNhap = phieuNhap.MaPhieuNhap,
                        MaHang = stock.MaHang,
                        SoLuong = stock.SoLuong,
                        DonGiaNhap = stock.DonGia
                    });
                }
                await _context.SaveChangesAsync();
            }

            await trans.CommitAsync();

            return new ImportHangHoaResult
            {
                Success = true,
                TotalRows = lastRow - startRow + 1,
                InsertedCount = insertedCount,
                UpdatedCount = updatedCount,
                SkippedCount = skippedCount,
                Errors = errorList,
                Message = $"Nhập file thành công! Thêm mới: {insertedCount}, Cập nhật: {updatedCount}, Bỏ qua: {skippedCount}."
            };
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return new ImportHangHoaResult
            {
                Success = false,
                Message = "Lỗi khi nhập dữ liệu từ file Excel: " + ex.Message
            };
        }
    }

    private async Task<int> GetNextAutoProductNumberAsync()
    {
        var existingCodes = await _context.HangHoas
            .Where(x => x.MaHangNoiBo.StartsWith("HH"))
            .Select(x => x.MaHangNoiBo)
            .ToListAsync();

        int maxNum = 0;
        foreach (var code in existingCodes)
        {
            if (code.Length > 2 && int.TryParse(code[2..], out int num))
            {
                if (num > maxNum) maxNum = num;
            }
        }

        int maxId = await _context.HangHoas.MaxAsync(x => (int?)x.MaHang) ?? 0;
        return Math.Max(maxNum, maxId) + 1;
    }

    private static string? ParseThuocTinhTextToJson(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;
        var pairs = text.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries);
        var list = new List<ThuocTinhItemVM>();
        foreach (var pair in pairs)
        {
            var parts = pair.Split(new[] { ':', '=' }, 2);
            if (parts.Length == 2 && !string.IsNullOrWhiteSpace(parts[0]))
            {
                list.Add(new ThuocTinhItemVM
                {
                    Ten = parts[0].Trim(),
                    GiaTri = parts[1].Trim()
                });
            }
        }
        return list.Any() ? System.Text.Json.JsonSerializer.Serialize(list) : null;
    }
}
