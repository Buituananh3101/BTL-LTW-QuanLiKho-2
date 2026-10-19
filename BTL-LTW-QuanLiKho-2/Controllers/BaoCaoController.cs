using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using BTL_LTW_QuanLiKho_2.Models;
using BTL_LTW_QuanLiKho_2.Services;
using BTL_LTW_QuanLiKho_2.ViewModels;
using BTL_LTW_QuanLiKho_2.Helpers;
using ClosedXML.Excel;

namespace BTL_LTW_QuanLiKho_2.Controllers;

/// <summary>
/// Controller phân hệ Báo cáo (Tồn kho theo kho, Thẻ kho, Báo cáo biến động)
/// </summary>
[Authorize]
public class BaoCaoController : BaseKhoController
{
    private readonly ITheKhoService _theKhoService;
    private readonly ILogger<BaoCaoController> _logger;

    public BaoCaoController(
        QuanLyKhoPhuQuocLtwContext context,
        ITheKhoService theKhoService,
        ILogger<BaoCaoController> logger) : base(context)
    {
        _theKhoService = theKhoService;
        _logger = logger;
    }

    /// <summary>
    /// Chuyển tiếp mặc định /BaoCao hoặc /BaoCao/Index về Báo cáo Tồn kho
    /// </summary>
    [HttpGet]
    public IActionResult Index([FromQuery] BaoCaoTonKhoFilterParams filter)
    {
        return RedirectToAction(nameof(TonKho), filter);
    }

    #region 1. BÁO CÁO TỒN KHO THEO KHO (PIVOT KHO KIOTVIET)

    /// <summary>
    /// Màn hình chính Báo cáo Tồn kho theo kho (/BaoCao/TonKho)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> TonKho([FromQuery] BaoCaoTonKhoFilterParams filter)
    {
        filter ??= new BaoCaoTonKhoFilterParams();
        var vm = await BuildTonKhoIndexVMAsync(filter);
        return View(vm);
    }

    /// <summary>
    /// AJAX Action phục vụ phân trang, lọc và sắp xếp bảng Pivot Tồn kho
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Filter([FromQuery] BaoCaoTonKhoFilterParams filter)
    {
        return await FilterTonKho(filter);
    }

    [HttpGet]
    public async Task<IActionResult> FilterTonKho([FromQuery] BaoCaoTonKhoFilterParams filter)
    {
        filter ??= new BaoCaoTonKhoFilterParams();
        var vm = await BuildTonKhoIndexVMAsync(filter);

        // Đính kèm dữ liệu KPI Summary vào Header phản hồi để client JS cập nhật các thẻ thống kê tức thời
        var summaryJson = JsonSerializer.Serialize(vm.Summary);
        Response.Headers.Append("X-Summary-Json", Uri.EscapeDataString(summaryJson));

        return PartialView("_TonKhoTable", vm);
    }

    /// <summary>
    /// Xuất Báo cáo Tồn kho ra file Excel chuẩn ClosedXML (Header xanh KiotViet, format số lượng, tiền tệ)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> ExportExcel([FromQuery] BaoCaoTonKhoFilterParams filter)
    {
        return await ExportTonKho(filter);
    }

    [HttpGet]
    public async Task<IActionResult> ExportTonKho([FromQuery] BaoCaoTonKhoFilterParams filter)
    {
        filter ??= new BaoCaoTonKhoFilterParams();
        // Xuất toàn bộ dữ liệu khớp bộ lọc, không phân trang
        filter.Page = 1;
        filter.PageSize = int.MaxValue;

        var vm = await BuildTonKhoIndexVMAsync(filter);
        var items = vm.PagedData.Items;
        var selectedKhos = vm.DanhSachKho.Where(k => vm.SelectedKhoIds.Contains(k.MaKho)).ToList();

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("TonKhoTheoKho");

        // 1. Dòng tiêu đề báo cáo
        int startRow = 1;
        ws.Cell(startRow, 1).Value = "BÁO CÁO TỒN KHO THEO CHI NHÁNH KHO";
        ws.Cell(startRow, 1).Style.Font.Bold = true;
        ws.Cell(startRow, 1).Style.Font.FontSize = 15;
        ws.Cell(startRow, 1).Style.Font.FontColor = XLColor.FromHtml("#0066cc");

        ws.Cell(startRow + 1, 1).Value = $"Thời điểm xuất: {DateTime.Now:dd/MM/yyyy HH:mm} | Người xuất: {User.GetTenHienThi()}";
        ws.Cell(startRow + 1, 1).Style.Font.Italic = true;
        ws.Cell(startRow + 1, 1).Style.Font.FontColor = XLColor.FromHtml("#475569");

        // 2. Định nghĩa danh sách cột
        int headerRow = 4;
        var headers = new List<string>
        {
            "STT",
            "Mã hàng",
            "Tên hàng hóa",
            "ĐVT",
            "Nhóm hàng",
            "Vị trí",
            "Giá vốn",
            "Giá trị tồn"
        };

        foreach (var kho in selectedKhos)
        {
            headers.Add($"Tồn - {kho.TenKho}");
        }
        headers.Add("Tổng tồn");

        for (int i = 0; i < headers.Count; i++)
        {
            ws.Cell(headerRow, i + 1).Value = headers[i];
        }

        var headerRange = ws.Range(headerRow, 1, headerRow, headers.Count);
        ExcelHelper.ApplyKiotVietHeaderStyle(headerRange);
        ws.Row(headerRow).Height = 26;

        // 3. Đổ dữ liệu các dòng
        int curRow = headerRow + 1;
        int stt = 1;

        foreach (var item in items)
        {
            int col = 1;
            ws.Cell(curRow, col++).Value = stt++;
            ws.Cell(curRow, col++).Value = item.MaHangNoiBo;
            ws.Cell(curRow, col++).Value = item.TenHang;
            ws.Cell(curRow, col++).Value = item.TenDvt;
            ws.Cell(curRow, col++).Value = item.TenNhom;
            ws.Cell(curRow, col++).Value = item.ViTri ?? "";

            // Giá vốn
            var cellGiaVon = ws.Cell(curRow, col++);
            cellGiaVon.Value = item.GiaVon;
            cellGiaVon.Style.NumberFormat.Format = "#,##0";
            cellGiaVon.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

            // Giá trị tồn
            var cellGiaTriTon = ws.Cell(curRow, col++);
            cellGiaTriTon.Value = item.GiaTriTon;
            cellGiaTriTon.Style.NumberFormat.Format = "#,##0";
            cellGiaTriTon.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

            // Tồn từng kho
            foreach (var kho in selectedKhos)
            {
                decimal slKho = item.TonTheoKho.TryGetValue(kho.MaKho, out var sl) ? sl : 0m;
                var cellKho = ws.Cell(curRow, col++);
                cellKho.Value = slKho;
                cellKho.Style.NumberFormat.Format = "#,##0.##";
                cellKho.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
                if (slKho < 0) cellKho.Style.Font.FontColor = XLColor.Red;
            }

            // Tổng tồn
            var cellTongTon = ws.Cell(curRow, col++);
            cellTongTon.Value = item.TongTon;
            cellTongTon.Style.NumberFormat.Format = "#,##0.##";
            cellTongTon.Style.Font.Bold = true;
            cellTongTon.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
            if (item.TongTon < 0) cellTongTon.Style.Font.FontColor = XLColor.Red;

            curRow++;
        }

        // 4. Dòng Tổng cộng
        if (items.Count > 0)
        {
            ws.Cell(curRow, 1).Value = "TỔNG CỘNG";
            ws.Range(curRow, 1, curRow, 6).Merge();
            ws.Cell(curRow, 1).Style.Font.Bold = true;
            ws.Cell(curRow, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            // Tổng giá trị tồn
            ws.Cell(curRow, 8).FormulaA1 = $"SUM(H{headerRow + 1}:H{curRow - 1})";
            ws.Cell(curRow, 8).Style.Font.Bold = true;
            ws.Cell(curRow, 8).Style.NumberFormat.Format = "#,##0";
            ws.Cell(curRow, 8).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

            // Tổng tồn từng kho
            int cIndex = 9;
            foreach (var kho in selectedKhos)
            {
                string colLetter = ws.Column(cIndex).ColumnLetter();
                ws.Cell(curRow, cIndex).FormulaA1 = $"SUM({colLetter}{headerRow + 1}:{colLetter}{curRow - 1})";
                ws.Cell(curRow, cIndex).Style.Font.Bold = true;
                ws.Cell(curRow, cIndex).Style.NumberFormat.Format = "#,##0.##";
                ws.Cell(curRow, cIndex).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
                cIndex++;
            }

            // Tổng toàn bộ tồn
            string totalColLetter = ws.Column(cIndex).ColumnLetter();
            ws.Cell(curRow, cIndex).FormulaA1 = $"SUM({totalColLetter}{headerRow + 1}:{totalColLetter}{curRow - 1})";
            ws.Cell(curRow, cIndex).Style.Font.Bold = true;
            ws.Cell(curRow, cIndex).Style.NumberFormat.Format = "#,##0.##";
            ws.Cell(curRow, cIndex).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

            var totalRowRange = ws.Range(curRow, 1, curRow, headers.Count);
            totalRowRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#f1f5f9");
            totalRowRange.Style.Font.Bold = true;
            curRow++;
        }

        // 5. Viền bảng và tự động co giãn cột
        var tableRange = ws.Range(headerRow, 1, curRow - 1, headers.Count);
        ExcelHelper.ApplyTableBorders(tableRange);
        ws.Columns(1, headers.Count).AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        var bytes = stream.ToArray();

        string fileName = $"BaoCaoTonKho_{DateTime.Now:yyyyMMdd_HHmm}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    /// <summary>
    /// API trả về chi tiết định mức và tồn kho của một mặt hàng tại từng kho phục vụ Drawer
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetChiTietDinhMuc(int maHang)
    {
        var hang = await _context.HangHoas
            .Include(h => h.MaDvtNavigation)
            .Include(h => h.MaNhomNavigation)
            .FirstOrDefaultAsync(h => h.MaHang == maHang);

        if (hang == null) return NotFound(new { message = "Không tìm thấy hàng hóa." });

        var allowedKhos = await GetAllowedWarehousesAsync();
        var khoIds = allowedKhos.Select(k => k.MaKho).ToList();

        var tonKhoMap = await _context.VwTonKhoHienTais
            .Where(t => t.MaHang == maHang && khoIds.Contains(t.MaKho))
            .ToDictionaryAsync(t => t.MaKho, t => t.SoLuongTon ?? 0m);

        var dinhMucList = await _context.NguongTonKhos
            .Where(n => n.MaHang == maHang && khoIds.Contains(n.MaKho))
            .ToListAsync();

        var chiTietKhos = allowedKhos.Select(k =>
        {
            decimal ton = tonKhoMap.TryGetValue(k.MaKho, out var sl) ? sl : 0m;
            var dm = dinhMucList.FirstOrDefault(n => n.MaKho == k.MaKho);
            decimal tonMin = dm?.TonToiThieu ?? 0m;
            decimal? tonMax = dm?.TonCaoNhat;

            string trangThaiDinhMuc = "Bình thường";
            if (ton < 0) trangThaiDinhMuc = "Tồn âm";
            else if (ton == 0) trangThaiDinhMuc = "Hết hàng";
            else if (tonMin > 0 && ton < tonMin) trangThaiDinhMuc = "Dưới định mức";
            else if (tonMax.HasValue && ton > tonMax.Value) trangThaiDinhMuc = "Vượt định mức";

            return new
            {
                maKho = k.MaKho,
                tenKho = k.TenKho,
                tonHienTai = ton,
                tonToiThieu = tonMin,
                tonCaoNhat = tonMax,
                trangThaiDinhMuc
            };
        }).ToList();

        return Json(new
        {
            maHang = hang.MaHang,
            maHangNoiBo = hang.MaHangNoiBo,
            tenHang = hang.TenHang,
            tenDvt = hang.MaDvtNavigation?.TenDvt ?? "",
            tenNhom = hang.MaNhomNavigation?.TenNhom ?? "",
            viTri = hang.ViTri ?? "",
            giaVon = hang.GiaVon,
            giaBan = hang.GiaBanThamKhao,
            tongTon = chiTietKhos.Sum(x => x.tonHienTai),
            tongGiaTriTon = chiTietKhos.Sum(x => x.tonHienTai) * hang.GiaVon,
            chiTietKhos
        });
    }

    #endregion

    #region 2. BÁO CÁO THẺ KHO

    /// <summary>
    /// Màn hình chính Báo cáo Thẻ kho (/BaoCao/TheKho)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> TheKho([FromQuery] TheKhoFilterParams filter)
    {
        filter ??= new TheKhoFilterParams();

        // Mặc định kho làm việc nếu chưa chỉ định
        if (!filter.MaKho.HasValue && !IsQuanLy)
        {
            filter.MaKho = CurrentWarehouseId;
        }

        var vm = await _theKhoService.LayBaoCaoTheKhoAsync(filter, CurrentWarehouseId, IsQuanLy);
        return View(vm);
    }

    /// <summary>
    /// API AJAX lọc và phân trang bảng Thẻ kho
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> FilterTheKho([FromQuery] TheKhoFilterParams filter)
    {
        filter ??= new TheKhoFilterParams();

        if (!filter.MaKho.HasValue && !IsQuanLy)
        {
            filter.MaKho = CurrentWarehouseId;
        }

        var vm = await _theKhoService.LayBaoCaoTheKhoAsync(filter, CurrentWarehouseId, IsQuanLy);
        return PartialView("_TheKhoTable", vm);
    }

    /// <summary>
    /// Xuất dữ liệu Thẻ kho ra file Excel ClosedXML
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> ExportTheKho([FromQuery] TheKhoFilterParams filter)
    {
        filter ??= new TheKhoFilterParams();

        if (!filter.MaKho.HasValue && !IsQuanLy)
        {
            filter.MaKho = CurrentWarehouseId;
        }

        var bytes = await _theKhoService.XuatExcelTheKhoAsync(filter, CurrentWarehouseId, IsQuanLy);
        if (bytes == null || bytes.Length == 0)
        {
            return NotFound("Không tìm thấy dữ liệu để xuất file Excel.");
        }

        string fileName = $"TheKho_{DateTime.Now:yyyyMMdd_HHmm}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    /// <summary>
    /// API nạp nhanh 10 giao dịch gần nhất của mặt hàng tại kho phục vụ tab Thẻ kho trong Drawer Hàng hóa
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetTheKhoQuick(int maHang, int? maKho = null, int soLuong = 10)
    {
        int effectiveKho = maKho ?? CurrentWarehouseId;
        var list = await _theKhoService.LayLichSuTheKhoNhanhAsync(maHang, effectiveKho, soLuong);
        return Json(ApiResponse<List<TheKhoDongVM>>.Ok(list));
    }

    /// <summary>
    /// API tìm kiếm hàng hóa phục vụ Autocomplete (F3) chọn mặt hàng trên sidebar Thẻ kho
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> SearchHangHoa(string? q, string? term, int? warehouseId, int? whId, int limit = 15)
    {
        string kw = (q ?? term ?? "").Trim().ToLower();
        int targetWhId = (warehouseId.HasValue && warehouseId.Value > 0)
            ? warehouseId.Value
            : ((whId.HasValue && whId.Value > 0) ? whId.Value : 0);

        var query = _context.HangHoas.AsNoTracking()
            .Include(h => h.MaDvtNavigation)
            .Include(h => h.MaNhomNavigation)
            .Where(h => h.TrangThai == "DANG_BAN" || h.TrangThai == "DANG_KINH_DOANH");

        if (!string.IsNullOrEmpty(kw))
        {
            query = query.Where(h =>
                h.TenHang.ToLower().Contains(kw) ||
                h.MaHangNoiBo.ToLower().Contains(kw));
        }

        var products = await query
            .OrderBy(h => h.TenHang)
            .Take(limit)
            .ToListAsync();

        var productIds = products.Select(h => h.MaHang).ToList();

        // Lấy tồn kho theo chi nhánh kho đã chọn
        var stockMap = new Dictionary<int, decimal>();
        if (productIds.Any())
        {
            if (targetWhId > 0)
            {
                stockMap = await _context.VwTonKhoHienTais
                    .Where(s => s.MaKho == targetWhId && productIds.Contains(s.MaHang))
                    .ToDictionaryAsync(s => s.MaHang, s => s.SoLuongTon ?? 0);
            }
            else
            {
                stockMap = await _context.VwTonKhoHienTais
                    .Where(s => productIds.Contains(s.MaHang))
                    .GroupBy(s => s.MaHang)
                    .Select(g => new { MaHang = g.Key, TongTon = g.Sum(x => x.SoLuongTon ?? 0) })
                    .ToDictionaryAsync(s => s.MaHang, s => s.TongTon);
            }
        }

        var items = products.Select(h => new
        {
            id = h.MaHang,
            maHang = h.MaHang,
            maHangNoiBo = h.MaHangNoiBo,
            tenHang = h.TenHang,
            tenDvt = h.MaDvtNavigation != null ? h.MaDvtNavigation.TenDvt : "Cái",
            tenNhom = h.MaNhomNavigation != null ? h.MaNhomNavigation.TenNhom : "",
            gia = h.GiaVon > 0 ? h.GiaVon : (h.GiaBanThamKhao > 0 ? h.GiaBanThamKhao : 0),
            tonKho = stockMap.TryGetValue(h.MaHang, out var ton) ? ton : 0
        }).ToList();

        return Json(items);
    }

    #endregion

    #region 3. HELPER METHODS CHO TỒN KHO

    /// <summary>
    /// Lấy danh sách các kho mà người dùng hiện tại có quyền truy cập
    /// </summary>
    private async Task<List<Kho>> GetAllowedWarehousesAsync()
    {
        var allKhos = await _context.Khos
            .Where(k => k.TrangThai == "HOAT_DONG")
            .OrderBy(k => k.MaKho)
            .ToListAsync();

        if (IsQuanLy)
        {
            return allKhos;
        }

        var assignedKhoIds = await _context.TaiKhoanKhos
            .Where(tk => tk.MaTaiKhoan == CurrentUserId)
            .Select(tk => tk.MaKho)
            .ToListAsync();

        if (assignedKhoIds.Count == 0)
        {
            int curId = CurrentWarehouseId;
            return allKhos.Where(k => k.MaKho == curId).ToList();
        }

        return allKhos.Where(k => assignedKhoIds.Contains(k.MaKho)).ToList();
    }

    /// <summary>
    /// Xây dựng toàn bộ dữ liệu báo cáo tồn kho Pivot, KPI Summary và phân trang
    /// </summary>
    private async Task<BaoCaoTonKhoIndexVM> BuildTonKhoIndexVMAsync(BaoCaoTonKhoFilterParams filter)
    {
        var allowedKhos = await GetAllowedWarehousesAsync();
        var allowedKhoIds = allowedKhos.Select(k => k.MaKho).ToList();

        // 1. Xác định danh sách kho được chọn
        List<int> selectedKhoIds;
        if (filter.SelectedKhoIds != null && filter.SelectedKhoIds.Count > 0)
        {
            selectedKhoIds = filter.SelectedKhoIds.Where(id => allowedKhoIds.Contains(id)).ToList();
            if (selectedKhoIds.Count == 0) selectedKhoIds = allowedKhoIds;
        }
        else
        {
            selectedKhoIds = allowedKhoIds;
        }

        // 2. Lấy dữ liệu mặt hàng cơ bản
        var queryHangHoa = _context.HangHoas
            .Include(h => h.MaDvtNavigation)
            .Include(h => h.MaNhomNavigation)
            .AsNoTracking()
            .AsQueryable();

        // Lọc trạng thái kinh doanh
        if (filter.SelectedTrangThais != null && filter.SelectedTrangThais.Count > 0)
        {
            queryHangHoa = queryHangHoa.Where(h => filter.SelectedTrangThais.Contains(h.TrangThai));
        }
        else if (!string.IsNullOrWhiteSpace(filter.TrangThaiHang) && filter.TrangThaiHang != "ALL")
        {
            queryHangHoa = queryHangHoa.Where(h => h.TrangThai == filter.TrangThaiHang);
        }

        // Lọc nhóm hàng (hỗ trợ cả SelectedNhomIds và MaNhom)
        if (filter.SelectedNhomIds != null && filter.SelectedNhomIds.Count > 0)
        {
            queryHangHoa = queryHangHoa.Where(h => filter.SelectedNhomIds.Contains(h.MaNhom));
        }
        else if (filter.MaNhom.HasValue && filter.MaNhom.Value > 0)
        {
            queryHangHoa = queryHangHoa.Where(h => h.MaNhom == filter.MaNhom.Value);
        }

        // Lọc từ khóa tìm kiếm (F3)
        if (!string.IsNullOrWhiteSpace(filter.Q))
        {
            string keyword = filter.Q.Trim().ToLower();
            queryHangHoa = queryHangHoa.Where(h =>
                h.MaHangNoiBo.ToLower().Contains(keyword) ||
                h.TenHang.ToLower().Contains(keyword) ||
                (h.ViTri != null && h.ViTri.ToLower().Contains(keyword)));
        }

        var danhSachHangHoa = await queryHangHoa.ToListAsync();
        var hangIds = danhSachHangHoa.Select(h => h.MaHang).ToList();

        // 3. Đọc số dư tồn kho từ View vw_TonKhoHienTai
        var tonKhoRecords = await _context.VwTonKhoHienTais
            .Where(t => selectedKhoIds.Contains(t.MaKho) && hangIds.Contains(t.MaHang))
            .AsNoTracking()
            .ToListAsync();

        // Group tồn kho theo MaHang: Dictionary<MaHang, Dictionary<MaKho, SoLuongTon>>
        var tonKhoLookup = tonKhoRecords
            .GroupBy(t => t.MaHang)
            .ToDictionary(
                g => g.Key,
                g => g.ToDictionary(x => x.MaKho, x => x.SoLuongTon ?? 0m)
            );

        // 4. Đọc ngưỡng tồn kho
        var dinhMucRecords = await _context.NguongTonKhos
            .Where(n => selectedKhoIds.Contains(n.MaKho) && hangIds.Contains(n.MaHang))
            .AsNoTracking()
            .ToListAsync();

        var dinhMucLookup = dinhMucRecords
            .GroupBy(n => n.MaHang)
            .ToDictionary(
                g => g.Key,
                g => g.ToDictionary(x => x.MaKho, x => (x.TonToiThieu, x.TonCaoNhat))
            );

        // 5. Khởi tạo danh sách ItemVM và tính toán tổng tồn, cờ định mức
        var allItems = new List<BaoCaoTonKhoItemVM>(danhSachHangHoa.Count);

        foreach (var h in danhSachHangHoa)
        {
            var tonMap = tonKhoLookup.TryGetValue(h.MaHang, out var tm) ? tm : new Dictionary<int, decimal>();
            var dmMap = dinhMucLookup.TryGetValue(h.MaHang, out var dm) ? dm : new Dictionary<int, (decimal, decimal?)>();

            decimal tongTon = 0m;
            bool coDuoiDinhMuc = false;
            bool coVuotDinhMuc = false;

            foreach (var khoId in selectedKhoIds)
            {
                decimal sl = tonMap.TryGetValue(khoId, out var v) ? v : 0m;
                tongTon += sl;

                if (dmMap.TryGetValue(khoId, out var muc))
                {
                    if (muc.Item1 > 0 && sl < muc.Item1) coDuoiDinhMuc = true;
                    if (muc.Item2.HasValue && sl > muc.Item2.Value) coVuotDinhMuc = true;
                }
            }

            allItems.Add(new BaoCaoTonKhoItemVM
            {
                MaHang = h.MaHang,
                MaHangNoiBo = h.MaHangNoiBo,
                TenHang = h.TenHang,
                TenDvt = h.MaDvtNavigation?.TenDvt ?? "",
                TenNhom = h.MaNhomNavigation?.TenNhom ?? "",
                ViTri = h.ViTri,
                GiaVon = h.GiaVon,
                GiaBanThamKhao = h.GiaBanThamKhao,
                TrangThai = h.TrangThai,
                TonTheoKho = tonMap,
                TongTon = tongTon,
                CoDuoiDinhMuc = coDuoiDinhMuc,
                CoVuotDinhMuc = coVuotDinhMuc,
                DinhMucTheoKho = dmMap
            });
        }

        // 6. Lọc theo Tình trạng tồn (TinhTrangTon)
        IEnumerable<BaoCaoTonKhoItemVM> filteredQuery = allItems;
        switch (filter.TinhTrangTon)
        {
            case "CON_TON":
                filteredQuery = filteredQuery.Where(x => x.TongTon > 0);
                break;
            case "HET_HANG":
                filteredQuery = filteredQuery.Where(x => x.TongTon == 0);
                break;
            case "TON_AM":
                filteredQuery = filteredQuery.Where(x => x.TongTon < 0);
                break;
            case "DUOI_DINH_MUC":
                filteredQuery = filteredQuery.Where(x => x.CoDuoiDinhMuc || x.TongTon == 0);
                break;
            case "VUOT_DINH_MUC":
                filteredQuery = filteredQuery.Where(x => x.CoVuotDinhMuc);
                break;
        }

        var filteredList = filteredQuery.ToList();

        // 7. Thống kê KPI Summary trên toàn bộ tập dữ liệu đã lọc
        var summary = new BaoCaoTonKhoSummaryVM
        {
            TongSoMatHang = filteredList.Count,
            TongSoLuongTon = filteredList.Sum(x => x.TongTon),
            TongGiaTriTon = filteredList.Sum(x => x.GiaTriTon),
            SoMatHangCanLuuY = filteredList.Count(x => x.TongTon <= 0 || x.CoDuoiDinhMuc)
        };

        // 8. Sắp xếp dữ liệu (SortBy, SortDir)
        bool isDesc = string.Equals(filter.SortDir, "desc", StringComparison.OrdinalIgnoreCase);
        filteredList = (filter.SortBy?.ToLower()) switch
        {
            "mahang" or "mahangnoibo" => isDesc ? filteredList.OrderByDescending(x => x.MaHangNoiBo).ToList() : filteredList.OrderBy(x => x.MaHangNoiBo).ToList(),
            "tenhang" => isDesc ? filteredList.OrderByDescending(x => x.TenHang).ToList() : filteredList.OrderBy(x => x.TenHang).ToList(),
            "giavon" => isDesc ? filteredList.OrderByDescending(x => x.GiaVon).ToList() : filteredList.OrderBy(x => x.GiaVon).ToList(),
            "giatriton" => isDesc ? filteredList.OrderByDescending(x => x.GiaTriTon).ToList() : filteredList.OrderBy(x => x.GiaTriTon).ToList(),
            "tongton" => isDesc ? filteredList.OrderByDescending(x => x.TongTon).ToList() : filteredList.OrderBy(x => x.TongTon).ToList(),
            var s when s != null && s.StartsWith("kho_") && int.TryParse(s[4..], out int kId) =>
                isDesc
                    ? filteredList.OrderByDescending(x => x.TonTheoKho.TryGetValue(kId, out var sl) ? sl : 0m).ToList()
                    : filteredList.OrderBy(x => x.TonTheoKho.TryGetValue(kId, out var sl) ? sl : 0m).ToList(),
            _ => isDesc ? filteredList.OrderByDescending(x => x.TenHang).ToList() : filteredList.OrderBy(x => x.TenHang).ToList()
        };

        // 9. Phân trang
        int totalItems = filteredList.Count;
        int pageIndex = filter.Page < 1 ? 1 : filter.Page;
        int pageSize = filter.PageSize < 1 ? 15 : filter.PageSize;

        var pagedItems = filteredList
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var pagedResult = new PagedResult<BaoCaoTonKhoItemVM>(pagedItems, totalItems, pageIndex, pageSize);

        // 10. Danh sách nhóm hàng phục vụ combobox
        var nhomHangs = await _context.NhomHangs
            .OrderBy(n => n.TenNhom)
            .ToListAsync();

        return new BaoCaoTonKhoIndexVM
        {
            PagedData = pagedResult,
            Summary = summary,
            DanhSachKho = allowedKhos,
            SelectedKhoIds = selectedKhoIds,
            DanhSachNhomHang = nhomHangs,
            Filter = filter
        };
    }

    #endregion
}
