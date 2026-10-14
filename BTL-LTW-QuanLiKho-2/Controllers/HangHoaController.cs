using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using BTL_LTW_QuanLiKho_2.Models;
using BTL_LTW_QuanLiKho_2.ViewModels;
using BTL_LTW_QuanLiKho_2.Services;
using ClosedXML.Excel;
using System.IO;
using System.Globalization;

namespace BTL_LTW_QuanLiKho_2.Controllers;

[Authorize]
public class HangHoaController : BaseKhoController
{
    public HangHoaController(QuanLyKhoPhuQuocLtwContext context) : base(context)
    {
    }


    public async Task<IActionResult> Index(
        string? q, string? nhom = null, string? trangThai = null, string tonKhoFilter = "ALL",
        string? nhaCungCap = null, string? loaiHang = null, string? viTri = null,
        string duKienFilter = "ALL", string tgTaoFilter = "ALL",
        DateTime? tgTaoFrom = null, DateTime? tgTaoTo = null,
        bool daDanhDau = false,
        string? sortBy = null, string? sortDir = null,
        int page = 1)
    {
        var vm = await BuildIndexVM(q, nhom, trangThai, tonKhoFilter, nhaCungCap, loaiHang, viTri, duKienFilter, tgTaoFilter, tgTaoFrom, tgTaoTo, daDanhDau, sortBy, sortDir, page);
        return View(vm);
    }

    // AJAX Action trả về Partial View danh sách bảng
    public async Task<IActionResult> Filter(
        string? q, string? nhom = null, string? trangThai = null, string tonKhoFilter = "ALL",
        string? nhaCungCap = null, string? loaiHang = null, string? viTri = null,
        string duKienFilter = "ALL", string tgTaoFilter = "ALL",
        DateTime? tgTaoFrom = null, DateTime? tgTaoTo = null,
        bool daDanhDau = false,
        string? sortBy = null, string? sortDir = null,
        int page = 1)
    {
        var vm = await BuildIndexVM(q, nhom, trangThai, tonKhoFilter, nhaCungCap, loaiHang, viTri, duKienFilter, tgTaoFilter, tgTaoFrom, tgTaoTo, daDanhDau, sortBy, sortDir, page);
        return PartialView("_HangHoaTable", vm);
    }

    // AJAX Action bật/tắt đánh dấu sao (sản phẩm yêu thích)
    [AcceptVerbs("GET", "POST")]
    public async Task<IActionResult> ToggleFavorite(int id)
    {
        var item = await _context.HangHoas.FindAsync(id);
        if (item == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy hàng hóa." });
        }

        item.DaDanhDau = !item.DaDanhDau;
        await _context.SaveChangesAsync();

        return Json(new { success = true, isFavorite = item.DaDanhDau, maHang = item.MaHang });
    }

    // Lấy ảnh trực tiếp từ CSDL (hỗ trợ ảnh chính hoặc theo index 0-4)
    [HttpGet]
    [ResponseCache(Duration = 86400, Location = ResponseCacheLocation.Client)]
    public async Task<IActionResult> GetImage(int id, int? index = 0)
    {
        byte[]? data = null;
        int idx = index ?? 0;

        if (idx > 0)
        {
            data = await _context.HinhAnhHangHoas
                .AsNoTracking()
                .Where(x => x.MaHang == id && x.ThuTu == idx)
                .Select(x => x.DuLieuAnh)
                .FirstOrDefaultAsync();
        }
        else
        {
            // Ưu tiên ảnh được đánh dấu LaAnhChinh trong bảng HinhAnhHangHoa
            data = await _context.HinhAnhHangHoas
                .AsNoTracking()
                .Where(x => x.MaHang == id && x.LaAnhChinh)
                .Select(x => x.DuLieuAnh)
                .FirstOrDefaultAsync();

            if (data == null || data.Length == 0)
            {
                data = await _context.HinhAnhHangHoas
                    .AsNoTracking()
                    .Where(x => x.MaHang == id)
                    .OrderBy(x => x.ThuTu)
                    .Select(x => x.DuLieuAnh)
                    .FirstOrDefaultAsync();
            }
        }

        if (data == null || data.Length == 0)
        {
            var item = await _context.HangHoas.AsNoTracking().FirstOrDefaultAsync(x => x.MaHang == id);
            data = item?.HinhAnh;
        }

        if (data == null || data.Length == 0)
        {
            return File(GetDefaultPlaceholderSvg(), "image/svg+xml");
        }

        string mime = "image/jpeg";
        if (data.Length > 4 && data[0] == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47)
        {
            mime = "image/png";
        }
        else if (data.Length > 2 && data[0] == 0x47 && data[1] == 0x49)
        {
            mime = "image/gif";
        }
        else if (data.Length > 12 && data[8] == 0x57 && data[9] == 0x45 && data[10] == 0x42 && data[11] == 0x50)
        {
            mime = "image/webp";
        }

        return File(data, mime);
    }

    private async Task<List<HangHoaItemVM>> BuildFilteredItemsListAsync(
        string? q, string? nhom, string? trangThai, string tonKhoFilter,
        string? nhaCungCap, string? loaiHang, string? viTri,
        string duKienFilter, string tgTaoFilter,
        DateTime? tgTaoFrom, DateTime? tgTaoTo,
        bool daDanhDau,
        string? sortBy, string? sortDir,
        int whId)
    {
        var query = _context.HangHoas.AsNoTracking()
            .Include(x => x.MaNhomNavigation)
            .Include(x => x.MaDvtNavigation)
            .Include(x => x.NguongTonKhos.Where(n => n.MaKho == whId))
            .AsQueryable();

        // Lọc theo đánh dấu sao (Favorite)
        if (daDanhDau)
        {
            query = query.Where(x => x.DaDanhDau);
        }

        // 1. Tìm kiếm theo mã hoặc tên hoặc quy cách
        q = q?.Trim();
        if (!string.IsNullOrEmpty(q))
        {
            query = query.Where(x => x.TenHang.Contains(q) || x.MaHangNoiBo.Contains(q) || (x.QuyCach != null && x.QuyCach.Contains(q)));
        }

        // 2. Lọc theo Nhóm hàng (hỗ trợ chọn nhiều nhóm hàng)
        if (!string.IsNullOrWhiteSpace(nhom))
        {
            var nhomIds = nhom.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(s => int.TryParse(s.Trim(), out int id) ? id : 0)
                .Where(id => id > 0)
                .ToList();

            if (nhomIds.Any())
            {
                query = query.Where(x => nhomIds.Contains(x.MaNhom));
            }
        }

        // 3. Lọc theo Trạng thái
        if (!string.IsNullOrEmpty(trangThai))
        {
            query = query.Where(x => x.TrangThai == trangThai);
        }

        // 4. Lọc theo Nhà cung cấp (hỗ trợ chọn nhiều nhà cung cấp)
        if (!string.IsNullOrWhiteSpace(nhaCungCap))
        {
            var nccList = nhaCungCap.Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(s => s.Trim())
                .Where(s => !string.IsNullOrEmpty(s) && s != "Tất cả")
                .ToList();

            if (nccList.Any())
            {
                var matchedHangIds = await _context.ChiTietPhieuNhaps
                    .Where(ct => ct.MaPhieuNhapNavigation.MaDonViCapHangNavigation != null &&
                                 nccList.Contains(ct.MaPhieuNhapNavigation.MaDonViCapHangNavigation.TenDonVi))
                    .Select(ct => ct.MaHang)
                    .Distinct()
                    .ToListAsync();

                query = query.Where(x => matchedHangIds.Contains(x.MaHang));
            }
        }

        // 5. Lọc theo Loại hàng (hỗ trợ chọn nhiều: Hàng hóa, Dịch vụ, Combo - đóng gói)
        if (!string.IsNullOrWhiteSpace(loaiHang) && loaiHang != "Tất cả")
        {
            var lhList = loaiHang.Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(s => s.Trim())
                .Where(s => !string.IsNullOrEmpty(s) && s != "Tất cả")
                .ToList();

            if (lhList.Any() && lhList.Count < 3)
            {
                bool hasDichVu = lhList.Contains("Dịch vụ");
                bool hasCombo = lhList.Contains("Combo - đóng gói");
                bool hasHangHoa = lhList.Contains("Hàng hóa");

                if (hasHangHoa && !hasDichVu && !hasCombo)
                {
                    query = query.Where(x => (x.QuyCach == null || (!x.QuyCach.Contains("Dịch vụ") && !x.QuyCach.Contains("Combo")))
                                          && !x.TenHang.Contains("Dịch vụ") && !x.TenHang.Contains("Combo"));
                }
                else if (!hasHangHoa)
                {
                    if (hasDichVu && hasCombo)
                    {
                        query = query.Where(x => (x.QuyCach != null && (x.QuyCach.Contains("Dịch vụ") || x.QuyCach.Contains("Combo")))
                                              || x.TenHang.Contains("Dịch vụ") || x.TenHang.Contains("Combo"));
                    }
                    else if (hasDichVu)
                    {
                        query = query.Where(x => (x.QuyCach != null && x.QuyCach.Contains("Dịch vụ")) || x.TenHang.Contains("Dịch vụ"));
                    }
                    else if (hasCombo)
                    {
                        query = query.Where(x => (x.QuyCach != null && x.QuyCach.Contains("Combo")) || x.TenHang.Contains("Combo"));
                    }
                }
                else
                {
                    if (hasDichVu && !hasCombo)
                    {
                        query = query.Where(x => (x.QuyCach == null || !x.QuyCach.Contains("Combo")) && !x.TenHang.Contains("Combo"));
                    }
                    else if (!hasDichVu && hasCombo)
                    {
                        query = query.Where(x => (x.QuyCach == null || !x.QuyCach.Contains("Dịch vụ")) && !x.TenHang.Contains("Dịch vụ"));
                    }
                }
            }
        }

        // 6. Lọc theo Vị trí (hỗ trợ chọn nhiều vị trí)
        if (!string.IsNullOrWhiteSpace(viTri) && viTri != "Tất cả")
        {
            var vtList = viTri.Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(s => s.Trim())
                .Where(s => !string.IsNullOrEmpty(s) && s != "Tất cả")
                .ToList();

            if (vtList.Any())
            {
                var parameter = System.Linq.Expressions.Expression.Parameter(typeof(HangHoa), "x");
                var viTriProp = System.Linq.Expressions.Expression.Property(parameter, nameof(HangHoa.ViTri));
                var notNull = System.Linq.Expressions.Expression.NotEqual(viTriProp, System.Linq.Expressions.Expression.Constant(null, typeof(string)));
                var containsMethod = typeof(string).GetMethod(nameof(string.Contains), new[] { typeof(string) })!;

                System.Linq.Expressions.Expression? orExpr = null;
                foreach (var vt in vtList)
                {
                    var call = System.Linq.Expressions.Expression.Call(viTriProp, containsMethod, System.Linq.Expressions.Expression.Constant(vt));
                    orExpr = orExpr == null ? call : System.Linq.Expressions.Expression.OrElse(orExpr, call);
                }

                if (orExpr != null)
                {
                    var finalBody = System.Linq.Expressions.Expression.AndAlso(notNull, orExpr);
                    var lambda = System.Linq.Expressions.Expression.Lambda<Func<HangHoa, bool>>(finalBody, parameter);
                    query = query.Where(lambda);
                }
            }
        }

        // 7. Lọc theo Thời gian tạo
        var today = DateTime.Today;
        if (tgTaoFilter == "HOM_NAY")
        {
            query = query.Where(x => x.NgayTao >= today);
        }
        else if (tgTaoFilter == "HOM_QUA")
        {
            query = query.Where(x => x.NgayTao >= today.AddDays(-1) && x.NgayTao < today);
        }
        else if (tgTaoFilter == "TUAN_NAY")
        {
            int diff = (7 + (today.DayOfWeek - DayOfWeek.Monday)) % 7;
            var startOfWeek = today.AddDays(-diff);
            query = query.Where(x => x.NgayTao >= startOfWeek);
        }
        else if (tgTaoFilter == "TUAN_TRUOC")
        {
            int diff = (7 + (today.DayOfWeek - DayOfWeek.Monday)) % 7;
            var startOfWeek = today.AddDays(-diff);
            var startOfLastWeek = startOfWeek.AddDays(-7);
            query = query.Where(x => x.NgayTao >= startOfLastWeek && x.NgayTao < startOfWeek);
        }
        else if (tgTaoFilter == "7_NGAY")
        {
            query = query.Where(x => x.NgayTao >= today.AddDays(-7));
        }
        else if (tgTaoFilter == "THANG_NAY")
        {
            var startOfMonth = new DateTime(today.Year, today.Month, 1);
            query = query.Where(x => x.NgayTao >= startOfMonth);
        }
        else if (tgTaoFilter == "THANG_TRUOC")
        {
            var startOfThisMonth = new DateTime(today.Year, today.Month, 1);
            var startOfLastMonth = startOfThisMonth.AddMonths(-1);
            query = query.Where(x => x.NgayTao >= startOfLastMonth && x.NgayTao < startOfThisMonth);
        }
        else if (tgTaoFilter == "30_NGAY")
        {
            query = query.Where(x => x.NgayTao >= today.AddDays(-30));
        }
        else if (tgTaoFrom.HasValue || tgTaoTo.HasValue)
        {
            if (tgTaoFrom.HasValue) query = query.Where(x => x.NgayTao >= tgTaoFrom.Value);
            if (tgTaoTo.HasValue) query = query.Where(x => x.NgayTao <= tgTaoTo.Value.AddDays(1));
        }

        // Tồn kho theo kho hiện tại
        var tonKhoDict = await _context.VwTonKhoHienTais
            .Where(t => t.MaKho == whId)
            .ToDictionaryAsync(t => t.MaHang, t => t.SoLuongTon ?? 0);

        // Giá vốn mới nhất
        var latestCosts = await _context.ChiTietPhieuNhaps
            .GroupBy(c => c.MaHang)
            .Select(g => new { MaHang = g.Key, DonGia = g.OrderByDescending(x => x.MaCtphieuNhap).Select(x => x.DonGiaNhap).FirstOrDefault() })
            .ToDictionaryAsync(x => x.MaHang, x => x.DonGia);

        // [ISSUE-04] Dùng Projection để không tải mảng byte VARBINARY(MAX) HinhAnh vào RAM server
        var rawList = await query
            .OrderBy(x => x.MaHangNoiBo)
            .Select(x => new
            {
                x.MaHang,
                x.MaHangNoiBo,
                x.TenHang,
                x.MaNhom,
                TenNhom = x.MaNhomNavigation != null ? x.MaNhomNavigation.TenNhom : "---",
                x.MaDvt,
                TenDvt = x.MaDvtNavigation != null ? x.MaDvtNavigation.TenDvt : "---",
                x.GiaBanThamKhao,
                x.GiaVon,
                TonToiThieu = x.NguongTonKhos.Where(n => n.MaKho == whId).Select(n => (decimal?)n.TonToiThieu).FirstOrDefault(),
                TonCaoNhat = x.NguongTonKhos.Where(n => n.MaKho == whId).Select(n => (decimal?)n.TonCaoNhat).FirstOrDefault(),
                x.ViTri,
                x.TrongLuong,
                x.DonViTrongLuong,
                x.ThuocTinh,
                x.QuyCach,
                x.TrangThai,
                x.DaDanhDau,
                HasImage = x.HinhAnh != null || x.HinhAnhHangHoas.Any(),
                ImageVersion = x.HinhAnhHangHoas.Where(h => h.LaAnhChinh).Select(h => (long?)h.MaHinhAnh).FirstOrDefault()
                               ?? x.HinhAnhHangHoas.Select(h => (long?)h.MaHinhAnh).Max()
                               ?? (x.NgayTao.HasValue ? x.NgayTao.Value.Ticks : (long)x.MaHang),
                x.NgayTao
            })
            .ToListAsync();

        var allItems = rawList.Select(x =>
        {
            decimal stock = tonKhoDict.TryGetValue(x.MaHang, out var s) ? s : 0;
            decimal cost = x.GiaVon > 0 ? x.GiaVon : (latestCosts.TryGetValue(x.MaHang, out var c) && c > 0 ? c : x.GiaBanThamKhao);

            return new HangHoaItemVM
            {
                MaHang = x.MaHang,
                MaHangNoiBo = x.MaHangNoiBo,
                TenHang = x.TenHang,
                MaNhom = x.MaNhom,
                TenNhom = x.TenNhom,
                MaDvt = x.MaDvt,
                TenDvt = x.TenDvt,
                GiaBan = x.GiaBanThamKhao,
                GiaVon = cost,
                TonKho = stock,
                TonToiThieu = x.TonToiThieu,
                TonCaoNhat = x.TonCaoNhat,
                ViTri = x.ViTri,
                TrongLuong = x.TrongLuong,
                DonViTrongLuong = x.DonViTrongLuong ?? "g",
                ThuocTinhJson = x.ThuocTinh,
                ThuocTinhs = ParseThuocTinhJson(x.ThuocTinh),
                QuyCach = x.QuyCach,
                TrangThai = x.TrangThai,
                IsFavorite = x.DaDanhDau,
                DaDanhDau = x.DaDanhDau,
                HasImage = x.HasImage,
                ImageVersion = x.ImageVersion,
                NgayTao = x.NgayTao,
                KhachDat = 0,
                DuKienHetHang = stock <= 0 ? "Đã hết hàng" :
                                (x.TonToiThieu.HasValue && stock <= x.TonToiThieu.Value) ? "Trong 3 ngày tới" :
                                stock <= 10 ? "Trong 7 ngày tới" :
                                stock <= 30 ? "Trong tháng này" : "> 30 ngày"
            };
        }).ToList();

        // 8. Lọc theo Tồn kho
        if (tonKhoFilter == "DUOI_DINH_MUC")
        {
            allItems = allItems.Where(x => x.TonToiThieu.HasValue && x.TonKho < x.TonToiThieu.Value).ToList();
        }
        else if (tonKhoFilter == "CON_HANG")
        {
            allItems = allItems.Where(x => x.TonKho > 0).ToList();
        }
        else if (tonKhoFilter == "HET_HANG")
        {
            allItems = allItems.Where(x => x.TonKho <= 0).ToList();
        }

        // 9. Lọc theo Dự kiến hết hàng
        if (duKienFilter != "ALL" && !string.IsNullOrWhiteSpace(duKienFilter))
        {
            if (duKienFilter == "NGAY_MAI")
            {
                allItems = allItems.Where(x => x.TonKho <= 5).ToList();
            }
            else if (duKienFilter == "NGAY_KIA" || duKienFilter == "3_NGAY")
            {
                allItems = allItems.Where(x => x.TonKho <= 15).ToList();
            }
            else if (duKienFilter == "5_NGAY" || duKienFilter == "7_NGAY" || duKienFilter == "TUAN_NAY")
            {
                allItems = allItems.Where(x => x.TonKho <= 30).ToList();
            }
            else if (duKienFilter == "TUAN_TOI" || duKienFilter == "2_TUAN")
            {
                allItems = allItems.Where(x => x.TonKho <= 50).ToList();
            }
            else if (duKienFilter == "THANG_NAY" || duKienFilter == "THANG_TOI" || duKienFilter == "30_NGAY" || duKienFilter == "2_THANG" || duKienFilter == "3_THANG")
            {
                allItems = allItems.Where(x => x.TonKho <= 100).ToList();
            }
            else
            {
                allItems = allItems.Where(x => x.TonKho <= 20 || (x.TonToiThieu.HasValue && x.TonKho <= x.TonToiThieu.Value)).ToList();
            }
        }

        // 10. Sắp xếp cột theo yêu cầu (3-state: ASC, DESC, None)
        if (!string.IsNullOrWhiteSpace(sortBy) && !string.IsNullOrWhiteSpace(sortDir))
        {
            bool isAsc = string.Equals(sortDir, "asc", StringComparison.OrdinalIgnoreCase);
            switch (sortBy.Trim().ToLower())
            {
                case "mahang":
                case "mahangnoibo":
                    allItems = isAsc
                        ? allItems.OrderBy(x => x.MaHangNoiBo).ToList()
                        : allItems.OrderByDescending(x => x.MaHangNoiBo).ToList();
                    break;
                case "tenhang":
                    allItems = isAsc
                        ? allItems.OrderBy(x => x.TenHang).ToList()
                        : allItems.OrderByDescending(x => x.TenHang).ToList();
                    break;
                case "giaban":
                    allItems = isAsc
                        ? allItems.OrderBy(x => x.GiaBan).ToList()
                        : allItems.OrderByDescending(x => x.GiaBan).ToList();
                    break;
                case "giavon":
                    allItems = isAsc
                        ? allItems.OrderBy(x => x.GiaVon).ToList()
                        : allItems.OrderByDescending(x => x.GiaVon).ToList();
                    break;
                case "tonkho":
                    allItems = isAsc
                        ? allItems.OrderBy(x => x.TonKho).ToList()
                        : allItems.OrderByDescending(x => x.TonKho).ToList();
                    break;
                case "khachdat":
                    allItems = isAsc
                        ? allItems.OrderBy(x => x.KhachDat).ToList()
                        : allItems.OrderByDescending(x => x.KhachDat).ToList();
                    break;
                case "ngaytao":
                    allItems = isAsc
                        ? allItems.OrderBy(x => x.NgayTao ?? DateTime.MinValue).ToList()
                        : allItems.OrderByDescending(x => x.NgayTao ?? DateTime.MinValue).ToList();
                    break;
                case "dukienhethang":
                    allItems = isAsc
                        ? allItems.OrderBy(x => x.TonKho).ToList()
                        : allItems.OrderByDescending(x => x.TonKho).ToList();
                    break;
            }
        }

        return allItems;
    }

    private async Task<HangHoaIndexVM> BuildIndexVM(
        string? q, string? nhom, string? trangThai, string tonKhoFilter,
        string? nhaCungCap, string? loaiHang, string? viTri,
        string duKienFilter, string tgTaoFilter,
        DateTime? tgTaoFrom, DateTime? tgTaoTo,
        bool daDanhDau,
        string? sortBy, string? sortDir,
        int page)
    {
        int whId = GetCurrentWarehouseId();
        var wh = await _context.Khos.FindAsync(whId);

        var allItems = await BuildFilteredItemsListAsync(
            q, nhom, trangThai, tonKhoFilter,
            nhaCungCap, loaiHang, viTri,
            duKienFilter, tgTaoFilter,
            tgTaoFrom, tgTaoTo,
            daDanhDau,
            sortBy, sortDir,
            whId);

        const int pageSize = 15;
        int totalCount = allItems.Count;
        int totalPages = Math.Max(1, (int)Math.Ceiling(totalCount / (double)pageSize));
        page = Math.Clamp(page, 1, totalPages);

        var pagedItems = allItems.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        var nhomList = await _context.NhomHangs.AsNoTracking().OrderBy(x => x.TenNhom).ToListAsync();
        var dvtList = await _context.DonViTinhs.AsNoTracking().OrderBy(x => x.TenDvt).ToListAsync();
        var supplierList = await _context.DonViCapHangs.AsNoTracking().Where(s => s.TrangThai == "HOAT_DONG").OrderBy(s => s.TenDonVi).ToListAsync();

        var defaultLocations = new List<string> { "Kho trung tâm", "Kệ A1 - Tầng 1", "Kệ A2 - Tầng 2", "Khu vực đóng gói", "Kho mát" };
        var dbLocations = await _context.HangHoas.AsNoTracking()
            .Where(x => !string.IsNullOrEmpty(x.ViTri))
            .Select(x => x.ViTri!)
            .Distinct()
            .ToListAsync();

        var allLocations = defaultLocations
            .Union(dbLocations.SelectMany(v => v.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim())))
            .Where(s => !string.IsNullOrEmpty(s))
            .Distinct()
            .OrderBy(s => s)
            .ToList();

        return new HangHoaIndexVM
        {
            Items = pagedItems,
            CurrentWarehouseId = whId,
            CurrentWarehouseName = wh?.TenKho ?? "Kho chính",
            Q = q,
            Nhom = nhom,
            TrangThai = trangThai,
            TonKhoFilter = tonKhoFilter,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
            ActiveCount = allItems.Count(x => x.TrangThai == "DANG_BAN"),
            TotalStockSum = allItems.Sum(x => x.TonKho),
            TotalValueSum = allItems.Sum(x => x.TonKho * x.GiaBan),
            TotalKhachDatSum = 0,
            NhaCungCap = nhaCungCap,
            LoaiHang = loaiHang,
            ViTri = viTri,
            DuKienFilter = duKienFilter,
            TgTaoFilter = tgTaoFilter,
            DaDanhDauFilter = daDanhDau,
            SortBy = sortBy,
            SortDir = sortDir,
            NhomHangs = nhomList,
            DonViTinhs = dvtList,
            DonViCapHangs = supplierList,
            ViTris = allLocations
        };
    }

    // Tạo nhanh nhóm hàng từ nút Tạo mới ở sidebar
    [HttpPost]
    public async Task<IActionResult> CreateGroupQuick([FromBody] QuickGroupRequest req)
    {
        if (string.IsNullOrWhiteSpace(req?.TenNhom)) return BadRequest(new { message = "Vui lòng nhập tên nhóm hàng." });
        var group = new NhomHang { TenNhom = req.TenNhom.Trim() };
        _context.NhomHangs.Add(group);
        await _context.SaveChangesAsync();
        return Json(new { success = true, maNhom = group.MaNhom, tenNhom = group.TenNhom });
    }

    // Tạo nhanh đơn vị tính từ modal form
    [HttpPost]
    public async Task<IActionResult> CreateDvtQuick([FromBody] QuickDvtRequest req)
    {
        if (string.IsNullOrWhiteSpace(req?.TenDvt)) return BadRequest(new { message = "Vui lòng nhập tên đơn vị tính." });
        string name = req.TenDvt.Trim();
        var existing = await _context.DonViTinhs.FirstOrDefaultAsync(u => u.TenDvt.ToLower() == name.ToLower());
        if (existing != null)
        {
            return Json(new { success = true, maDvt = existing.MaDvt, tenDvt = existing.TenDvt });
        }
        var dvt = new DonViTinh { TenDvt = name };
        _context.DonViTinhs.Add(dvt);
        await _context.SaveChangesAsync();
        return Json(new { success = true, maDvt = dvt.MaDvt, tenDvt = dvt.TenDvt });
    }

    // Lấy thông tin 1 hàng hóa qua JSON cho Modal Sửa
    [HttpGet]
    public async Task<IActionResult> GetItem(int id)
    {
        int whId = GetCurrentWarehouseId();
        var item = await _context.HangHoas
            .Include(x => x.NguongTonKhos.Where(n => n.MaKho == whId))
            .Include(x => x.HinhAnhHangHoas)
            .FirstOrDefaultAsync(x => x.MaHang == id);

        if (item == null) return NotFound(new { message = "Không tìm thấy hàng hóa." });

        decimal stock = await _context.VwTonKhoHienTais
            .Where(t => t.MaKho == whId && t.MaHang == id)
            .Select(t => t.SoLuongTon ?? 0)
            .FirstOrDefaultAsync();

        decimal cost = item.GiaVon > 0 ? item.GiaVon : await _context.ChiTietPhieuNhaps
            .Where(c => c.MaHang == id)
            .OrderByDescending(c => c.MaCtphieuNhap)
            .Select(c => c.DonGiaNhap)
            .FirstOrDefaultAsync();

        if (cost == 0) cost = item.GiaBanThamKhao;

        var nguong = item.NguongTonKhos.FirstOrDefault();

        // Xử lý danh sách ảnh (tối đa 5 ảnh)
        var imgList = new List<string>();
        int mainImgIdx = 0;
        if (item.HinhAnhHangHoas != null && item.HinhAnhHangHoas.Any())
        {
            var sorted = item.HinhAnhHangHoas.OrderBy(h => h.ThuTu).ToList();
            for (int i = 0; i < sorted.Count; i++)
            {
                if (sorted[i].LaAnhChinh) mainImgIdx = i;
                imgList.Add("data:image/jpeg;base64," + Convert.ToBase64String(sorted[i].DuLieuAnh));
            }
        }
        else if (item.HinhAnh != null && item.HinhAnh.Length > 0)
        {
            imgList.Add("data:image/jpeg;base64," + Convert.ToBase64String(item.HinhAnh));
        }

        string? imgBase64 = imgList.Count > 0 ? imgList[mainImgIdx] : null;

        return Json(new
        {
            maHang = item.MaHang,
            maHangNoiBo = item.MaHangNoiBo,
            tenHang = item.TenHang,
            maNhom = item.MaNhom,
            maDvt = item.MaDvt,
            quyCach = item.QuyCach,
            moTa = item.MoTa ?? "",
            giaBanThamKhao = item.GiaBanThamKhao,
            giaVon = cost,
            tonKhoBanDau = stock,
            tonToiThieu = nguong?.TonToiThieu ?? 0,
            tonCaoNhat = nguong?.TonCaoNhat ?? 999999999m,
            viTri = item.ViTri ?? "",
            trongLuong = item.TrongLuong ?? 0,
            donViTrongLuong = item.DonViTrongLuong ?? "g",
            thuocTinhJson = item.ThuocTinh ?? "[]",
            trangThai = item.TrangThai,
            hinhAnhBase64 = imgBase64,
            danhSachHinhAnhBase64 = imgList,
            viTriAnhChinh = mainImgIdx
        });
    }

    public async Task<IActionResult> Details(int? id)
    {
        if (id == null) return NotFound();
        int whId = GetCurrentWarehouseId();
        var item = await _context.HangHoas
            .Include(x => x.MaNhomNavigation)
            .Include(x => x.MaDvtNavigation)
            .Include(x => x.NguongTonKhos.Where(n => n.MaKho == whId))
            .FirstOrDefaultAsync(x => x.MaHang == id);

        if (item == null) return NotFound();

        ViewBag.TonKho = await _context.VwTonKhoHienTais
            .Where(t => t.MaKho == whId && t.MaHang == id)
            .Select(t => t.SoLuongTon ?? 0)
            .FirstOrDefaultAsync();

        ViewBag.GiaVon = await _context.ChiTietPhieuNhaps
            .Where(c => c.MaHang == id)
            .OrderByDescending(c => c.MaCtphieuNhap)
            .Select(c => c.DonGiaNhap)
            .FirstOrDefaultAsync();

        return View(item);
    }

    public async Task<IActionResult> Create()
    {
        await Options();
        return View(new HangHoaForm());
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] HangHoaForm model)
    {
        if (model == null) return BadRequest(new { message = "Dữ liệu không hợp lệ." });

        model.MaHang = 0;
        await ValidateAndPrepareForm(model);

        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(new { message = string.Join("; ", errors) });
        }

        var item = new HangHoa();
        Copy(model, item);
        item.NgayTao = DateTime.Now;

        // Xử lý danh sách ảnh (tối đa 5 ảnh)
        var validImages = new List<byte[]>();
        if (model.DanhSachHinhAnhBase64 != null && model.DanhSachHinhAnhBase64.Count > 0)
        {
            foreach (var b64 in model.DanhSachHinhAnhBase64.Take(5))
            {
                var parsed = ParseBase64Image(b64);
                if (parsed != null && parsed.Length > 0) validImages.Add(parsed);
            }
        }
        else if (!string.IsNullOrWhiteSpace(model.HinhAnhBase64))
        {
            var parsed = ParseBase64Image(model.HinhAnhBase64);
            if (parsed != null && parsed.Length > 0) validImages.Add(parsed);
        }

        int mainIdx = Math.Clamp(model.ViTriAnhChinh, 0, Math.Max(0, validImages.Count - 1));
        if (validImages.Count > 0)
        {
            item.HinhAnh = validImages[mainIdx];
        }

        bool isAutoCode = string.IsNullOrWhiteSpace(model.MaHangNoiBo);
        int retry = 0;
        bool saved = false;

        while (retry < 3 && !saved)
        {
            try
            {
                if (isAutoCode && retry > 0)
                {
                    item.MaHangNoiBo = await SinhMaHangNoiBoTuDongAsync();
                }

                _context.HangHoas.Add(item);
                await _context.SaveChangesAsync();
                saved = true;
            }
            catch (DbUpdateException ex)
            {
                _context.HangHoas.Remove(item);
                if (ex.InnerException?.Message.Contains("UQ_HangHoa_MaHangNoiBo") == true)
                {
                    if (isAutoCode)
                    {
                        retry++;
                        continue;
                    }
                    return BadRequest(new { message = $"Mã hàng nội bộ '{model.MaHangNoiBo}' đã bị trùng lặp trong hệ thống." });
                }
                return BadRequest(new { message = "Lỗi khi lưu dữ liệu hàng hóa: " + ex.Message });
            }
        }

        if (!saved)
        {
            return BadRequest(new { message = "Không thể sinh mã hàng tự động do đụng độ hệ thống. Vui lòng thử lại." });
        }

        int whId = CurrentWarehouseId;

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            // Lưu ngưỡng tồn kho (Tối thiểu & Tối đa)
            bool hasNguong = (model.TonToiThieu.HasValue && model.TonToiThieu.Value > 0) || (model.TonCaoNhat.HasValue && model.TonCaoNhat.Value > 0);
            if (hasNguong)
            {
                var nguong = new NguongTonKho
                {
                    MaHang = item.MaHang,
                    MaKho = whId,
                    TonToiThieu = model.TonToiThieu ?? 0,
                    TonCaoNhat = model.TonCaoNhat ?? 999999999m
                };
                _context.NguongTonKhos.Add(nguong);
                await _context.SaveChangesAsync();
            }

            // Lưu tối đa 5 ảnh vào bảng HinhAnhHangHoa
            if (validImages.Count > 0)
            {
                for (int i = 0; i < validImages.Count; i++)
                {
                    _context.HinhAnhHangHoas.Add(new HinhAnhHangHoa
                    {
                        MaHang = item.MaHang,
                        DuLieuAnh = validImages[i],
                        ThuTu = i,
                        LaAnhChinh = (i == mainIdx),
                        NgayTao = DateTime.Now
                    });
                }
                await _context.SaveChangesAsync();
            }

            // Tạo tồn kho ban đầu nếu có nhập số lượng > 0
            if (model.TonKhoBanDau.HasValue && model.TonKhoBanDau.Value > 0)
            {
                int nvId = CurrentNhanVienId;

                var phieuNhap = new PhieuNhap
                {
                    MaKho = whId,
                    MaNvlap = nvId,
                    MaNvxacNhan = nvId,
                    NgayLap = DateTime.Now,
                    NgayXacNhan = DateTime.Now,
                    LoaiPhieuNhap = "DAU_KY",
                    TrangThai = "DA_XAC_NHAN",
                    GhiChu = "Tồn kho đầu kỳ khi tạo hàng " + item.MaHangNoiBo
                };
                _context.PhieuNhaps.Add(phieuNhap);
                await _context.SaveChangesAsync();

                var ctpn = new ChiTietPhieuNhap
                {
                    MaPhieuNhap = phieuNhap.MaPhieuNhap,
                    MaHang = item.MaHang,
                    SoLuong = model.TonKhoBanDau.Value,
                    DonGiaNhap = model.GiaVon > 0 ? model.GiaVon : model.GiaBanThamKhao
                };
                _context.ChiTietPhieuNhaps.Add(ctpn);
                await _context.SaveChangesAsync();
            }

            await trans.CommitAsync();
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return BadRequest(new { message = "Lỗi khi lưu cấu hình tồn kho ban đầu: " + ex.Message });
        }

        return Json(new { success = true, id = item.MaHang, message = $"Đã thêm hàng hóa {item.TenHang} thành công." });
    }

    [HttpPost]
    public async Task<IActionResult> Edit(int id, [FromBody] HangHoaForm model)
    {
        if (model == null) return BadRequest(new { message = "Dữ liệu không hợp lệ." });
        model.MaHang = id;

        var item = await _context.HangHoas.FindAsync(id);
        if (item == null) return NotFound(new { message = "Không tìm thấy hàng hóa." });

        await ValidateAndPrepareForm(model);

        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(new { message = string.Join("; ", errors) });
        }

        Copy(model, item);

        // Xử lý ảnh: cập nhật hoặc xóa (tối đa 5 ảnh)
        if (model.XoaHinhAnh && (model.DanhSachHinhAnhBase64 == null || model.DanhSachHinhAnhBase64.Count == 0))
        {
            item.HinhAnh = null;
            var oldImages = await _context.HinhAnhHangHoas.Where(h => h.MaHang == id).ToListAsync();
            _context.HinhAnhHangHoas.RemoveRange(oldImages);
        }
        else if (model.DanhSachHinhAnhBase64 != null && model.DanhSachHinhAnhBase64.Count > 0)
        {
            var validImages = new List<byte[]>();
            foreach (var b64 in model.DanhSachHinhAnhBase64.Take(5))
            {
                var parsed = ParseBase64Image(b64);
                if (parsed != null && parsed.Length > 0) validImages.Add(parsed);
            }

            var oldImages = await _context.HinhAnhHangHoas.Where(h => h.MaHang == id).ToListAsync();
            _context.HinhAnhHangHoas.RemoveRange(oldImages);

            int mainIdx = Math.Clamp(model.ViTriAnhChinh, 0, Math.Max(0, validImages.Count - 1));
            if (validImages.Count > 0)
            {
                item.HinhAnh = validImages[mainIdx];
                for (int i = 0; i < validImages.Count; i++)
                {
                    _context.HinhAnhHangHoas.Add(new HinhAnhHangHoa
                    {
                        MaHang = id,
                        DuLieuAnh = validImages[i],
                        ThuTu = i,
                        LaAnhChinh = (i == mainIdx),
                        NgayTao = DateTime.Now
                    });
                }
            }
            else
            {
                item.HinhAnh = null;
            }
        }
        else if (!string.IsNullOrWhiteSpace(model.HinhAnhBase64))
        {
            item.HinhAnh = ParseBase64Image(model.HinhAnhBase64);
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            if (ex.InnerException?.Message.Contains("UQ_HangHoa_MaHangNoiBo") == true)
            {
                return BadRequest(new { message = $"Mã hàng nội bộ '{model.MaHangNoiBo}' đã bị trùng lặp trong hệ thống." });
            }
            return BadRequest(new { message = "Lỗi khi lưu dữ liệu hàng hóa: " + ex.Message });
        }

        int whId = GetCurrentWarehouseId();

        // Cập nhật ngưỡng tồn (Tối thiểu & Tối đa)
        var nguong = await _context.NguongTonKhos.FirstOrDefaultAsync(n => n.MaHang == id && n.MaKho == whId);
        bool hasThreshold = (model.TonToiThieu.HasValue && model.TonToiThieu.Value > 0) || (model.TonCaoNhat.HasValue && model.TonCaoNhat.Value > 0);
        if (hasThreshold)
        {
            if (nguong == null)
            {
                nguong = new NguongTonKho
                {
                    MaHang = id,
                    MaKho = whId,
                    TonToiThieu = model.TonToiThieu ?? 0,
                    TonCaoNhat = model.TonCaoNhat ?? 999999999m
                };
                _context.NguongTonKhos.Add(nguong);
            }
            else
            {
                nguong.TonToiThieu = model.TonToiThieu ?? 0;
                nguong.TonCaoNhat = model.TonCaoNhat ?? 999999999m;
            }
        }
        else if (nguong != null)
        {
            _context.NguongTonKhos.Remove(nguong);
        }

        await _context.SaveChangesAsync();

        return Json(new { success = true, id = item.MaHang, message = $"Đã cập nhật hàng hóa {item.TenHang} thành công." });
    }

    [HttpPost]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _context.HangHoas.FindAsync(id);
        if (item == null) return NotFound(new { message = "Không tìm thấy hàng hóa." });

        bool used = await _context.ChiTietDonBans.AnyAsync(x => x.MaHang == id)
            || await _context.ChiTietPhieuNhaps.AnyAsync(x => x.MaHang == id)
            || await _context.ChiTietPhieuXuats.AnyAsync(x => x.MaHang == id)
            || await _context.ChiTietPhieuChuyenKhos.AnyAsync(x => x.MaHang == id)
            || await _context.ChiTietPhieuKiemKes.AnyAsync(x => x.MaHang == id);

        if (used)
        {
            return BadRequest(new
            {
                success = false,
                hasTransaction = true,
                message = $"Hàng hóa '{item.TenHang}' ({item.MaHangNoiBo}) đã phát sinh giao dịch/chứng từ trong hệ thống, không thể xóa. Bạn có thể chuyển sang trạng thái 'Ngừng bán' để ẩn khỏi danh mục kinh doanh."
            });
        }

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            var images = await _context.HinhAnhHangHoas.Where(x => x.MaHang == id).ToListAsync();
            if (images.Any())
            {
                _context.HinhAnhHangHoas.RemoveRange(images);
            }

            var nguongs = await _context.NguongTonKhos.Where(x => x.MaHang == id).ToListAsync();
            if (nguongs.Any())
            {
                _context.NguongTonKhos.RemoveRange(nguongs);
            }

            _context.HangHoas.Remove(item);
            await _context.SaveChangesAsync();
            await trans.CommitAsync();

            return Json(new { success = true, message = $"Đã xóa hàng hóa '{item.TenHang}' ({item.MaHangNoiBo}) thành công." });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return BadRequest(new { message = "Lỗi khi xóa dữ liệu hàng hóa: " + ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> NgungBan(int id)
    {
        var item = await _context.HangHoas.FindAsync(id);
        if (item == null) return NotFound(new { message = "Không tìm thấy hàng hóa." });

        item.TrangThai = "NGUNG_BAN";
        await _context.SaveChangesAsync();

        return Json(new { success = true, message = $"Đã chuyển hàng hóa '{item.TenHang}' ({item.MaHangNoiBo}) sang trạng thái 'Ngừng bán'." });
    }

    private static byte[]? ParseBase64Image(string? base64)
    {
        if (string.IsNullOrWhiteSpace(base64)) return null;
        try
        {
            int commaIdx = base64.IndexOf(',');
            string clean = commaIdx >= 0 ? base64.Substring(commaIdx + 1) : base64;
            return Convert.FromBase64String(clean.Trim());
        }
        catch
        {
            return null;
        }
    }

    private static byte[] GetDefaultPlaceholderSvg()
    {
        string svg = @"<svg xmlns=""http://www.w3.org/2000/svg"" viewBox=""0 0 40 40"" width=""40"" height=""40"">
            <rect width=""40"" height=""40"" rx=""6"" fill=""#eef2f6""/>
            <path d=""M10 28l7-9 5 6 6-8 6 11H10z"" fill=""#94a3b8""/>
            <circle cx=""15"" cy=""14"" r=""2.5"" fill=""#94a3b8""/>
        </svg>";
        return System.Text.Encoding.UTF8.GetBytes(svg);
    }

    private async Task<string> SinhMaHangNoiBoTuDongAsync()
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
        int nextNum = Math.Max(maxNum, maxId) + 1;

        return MaChungTuHelper.FormatMaHang(nextNum);
    }

    private async Task ValidateAndPrepareForm(HangHoaForm m)
    {
        m.TenHang = m.TenHang?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(m.TenHang))
        {
            ModelState.AddModelError("TenHang", "Tên hàng hóa không được để trống.");
        }

        if (string.IsNullOrWhiteSpace(m.MaHangNoiBo))
        {
            m.MaHangNoiBo = await SinhMaHangNoiBoTuDongAsync();
        }
        else
        {
            m.MaHangNoiBo = m.MaHangNoiBo.Trim().ToUpper();
        }

        if (await _context.HangHoas.AnyAsync(x => x.MaHangNoiBo == m.MaHangNoiBo && x.MaHang != m.MaHang))
        {
            ModelState.AddModelError("MaHangNoiBo", $"Mã hàng '{m.MaHangNoiBo}' đã tồn tại trong hệ thống.");
        }

        if (!await _context.NhomHangs.AnyAsync(x => x.MaNhom == m.MaNhom))
        {
            ModelState.AddModelError("MaNhom", "Nhóm hàng không hợp lệ.");
        }

        if (!await _context.DonViTinhs.AnyAsync(x => x.MaDvt == m.MaDvt))
        {
            ModelState.AddModelError("MaDvt", "Đơn vị tính không hợp lệ.");
        }

        if (m.TrangThai != "DANG_BAN" && m.TrangThai != "NGUNG_BAN")
        {
            m.TrangThai = "DANG_BAN";
        }
    }

    private static void Copy(HangHoaForm m, HangHoa x)
    {
        x.MaHangNoiBo = m.MaHangNoiBo!;
        x.TenHang = m.TenHang;
        x.MaNhom = m.MaNhom;
        x.MaDvt = m.MaDvt;
        x.QuyCach = m.QuyCach?.Trim();
        x.GiaBanThamKhao = m.GiaBanThamKhao;
        x.GiaVon = m.GiaVon;
        x.TrangThai = m.TrangThai;
        x.ViTri = string.IsNullOrWhiteSpace(m.ViTri) ? null : m.ViTri.Trim();
        x.TrongLuong = m.TrongLuong;
        x.DonViTrongLuong = string.IsNullOrWhiteSpace(m.DonViTrongLuong) ? "g" : m.DonViTrongLuong.Trim();
        x.ThuocTinh = string.IsNullOrWhiteSpace(m.ThuocTinhJson) ? null : m.ThuocTinhJson.Trim();
        x.MoTa = string.IsNullOrWhiteSpace(m.MoTa) ? null : m.MoTa.Trim();
    }

    [HttpPost]
    public async Task<IActionResult> UpdateThuocTinh([FromBody] CapNhatThuocTinhRequest req)
    {
        if (req == null || req.MaHang <= 0) return BadRequest(new { message = "Dữ liệu không hợp lệ." });
        var item = await _context.HangHoas.FindAsync(req.MaHang);
        if (item == null) return NotFound(new { message = "Không tìm thấy hàng hóa." });

        item.ThuocTinh = string.IsNullOrWhiteSpace(req.ThuocTinhJson) ? null : req.ThuocTinhJson.Trim();
        await _context.SaveChangesAsync();
        return Json(new { success = true, message = "Đã cập nhật thuộc tính thành công." });
    }

    // ========================================================================
    // PHÂN HỆ XUẤT & NHẬP FILE EXCEL (.XLSX) CHUẨN KIOTVIET (CLOSEDXML)
    // ========================================================================

    /// <summary>
    /// Tải file mẫu Excel chuẩn để nhập hàng hóa
    /// </summary>
    [HttpGet]
    public IActionResult DownloadTemplate()
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
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#005baa");
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            cell.Style.Border.OutsideBorderColor = XLColor.FromHtml("#cccccc");
        }
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

        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return File(ms.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Mau_Nhap_Hang_Hoa_KiotViet.xlsx");
    }

    [HttpPost]
    public async Task<IActionResult> ExportExcel([FromForm] ExportHangHoaRequest req)
    {
        int whId = CurrentWarehouseId;

        var allItems = await BuildFilteredItemsListAsync(
            req.Q, req.Nhom, null, req.TonKhoFilter ?? "ALL",
            req.NhaCungCap, req.LoaiHang, req.ViTri,
            req.DuKienFilter ?? "ALL", req.TgTaoFilter ?? "ALL",
            req.TgTaoFrom, req.TgTaoTo,
            req.DaDanhDau ?? false,
            null, null,
            whId);

        if (req.ExportScope == "SELECTED" && !string.IsNullOrWhiteSpace(req.SelectedIds))
        {
            var selectedIds = req.SelectedIds.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(s => int.TryParse(s.Trim(), out int id) ? id : 0)
                .Where(id => id > 0)
                .ToHashSet();
            if (selectedIds.Any())
            {
                allItems = allItems.Where(x => selectedIds.Contains(x.MaHang)).ToList();
            }
        }

        var allColumnDefs = new List<(string Key, string Title)>
        {
            ("LoaiHang", "Loại hàng"),
            ("NhomHang", "Nhóm hàng"),
            ("MaHang", "Mã hàng"),
            ("TenHang", "Tên hàng"),
            ("GiaBan", "Giá bán"),
            ("GiaVon", "Giá vốn"),
            ("TonKho", "Tồn kho"),
            ("TonNhoNhat", "Tồn nhỏ nhất"),
            ("TonLonNhat", "Tồn lớn nhất"),
            ("Dvt", "Đơn vị tính"),
            ("ThuocTinh", "Thuộc tính"),
            ("TrongLuong", "Trọng lượng"),
            ("DonViTrongLuong", "Đơn vị trọng lượng"),
            ("ViTri", "Vị trí"),
            ("MoTa", "Mô tả"),
            ("TrangThai", "Trạng thái")
        };

        var selectedCols = (req.Columns != null && req.Columns.Count > 0)
            ? allColumnDefs.Where(c => req.Columns.Contains(c.Key, StringComparer.OrdinalIgnoreCase)).ToList()
            : allColumnDefs;

        if (!selectedCols.Any()) selectedCols = allColumnDefs;

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("DanhSachHangHoa");

        // Header
        for (int colIdx = 0; colIdx < selectedCols.Count; colIdx++)
        {
            var cell = ws.Cell(1, colIdx + 1);
            cell.Value = selectedCols[colIdx].Title;
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#005baa");
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            cell.Style.Border.OutsideBorderColor = XLColor.FromHtml("#cccccc");
        }
        ws.Row(1).Height = 28;

        // Data rows
        int rowIdx = 2;
        foreach (var item in allItems)
        {
            for (int colIdx = 0; colIdx < selectedCols.Count; colIdx++)
            {
                var key = selectedCols[colIdx].Key;
                var cell = ws.Cell(rowIdx, colIdx + 1);

                switch (key)
                {
                    case "LoaiHang":
                        cell.Value = "Hàng hóa";
                        break;
                    case "NhomHang":
                        cell.Value = item.TenNhom;
                        break;
                    case "MaHang":
                        cell.Value = item.MaHangNoiBo;
                        break;
                    case "TenHang":
                        cell.Value = item.TenHang;
                        break;
                    case "GiaBan":
                        cell.Value = item.GiaBan;
                        cell.Style.NumberFormat.Format = "#,##0";
                        break;
                    case "GiaVon":
                        cell.Value = item.GiaVon;
                        cell.Style.NumberFormat.Format = "#,##0";
                        break;
                    case "TonKho":
                        cell.Value = item.TonKho;
                        cell.Style.NumberFormat.Format = "#,##0";
                        break;
                    case "TonNhoNhat":
                        cell.Value = item.TonToiThieu ?? 0;
                        cell.Style.NumberFormat.Format = "#,##0";
                        break;
                    case "TonLonNhat":
                        cell.Value = item.TonCaoNhat ?? 0;
                        cell.Style.NumberFormat.Format = "#,##0";
                        break;
                    case "Dvt":
                        cell.Value = item.TenDvt;
                        break;
                    case "ThuocTinh":
                        if (item.ThuocTinhs != null && item.ThuocTinhs.Any())
                        {
                            cell.Value = string.Join(",", item.ThuocTinhs.Select(a => $"{a.Ten}:{a.GiaTri}"));
                        }
                        else
                        {
                            cell.Value = "";
                        }
                        break;
                    case "TrongLuong":
                        cell.Value = item.TrongLuong ?? 0;
                        cell.Style.NumberFormat.Format = "#,##0";
                        break;
                    case "DonViTrongLuong":
                        cell.Value = item.DonViTrongLuong ?? "g";
                        break;
                    case "ViTri":
                        cell.Value = item.ViTri ?? "";
                        break;
                    case "MoTa":
                        cell.Value = item.MoTa ?? item.QuyCach ?? "";
                        break;
                    case "TrangThai":
                        cell.Value = item.TrangThai == "NGUNG_BAN" ? "Ngừng bán" : "Đang kinh doanh";
                        break;
                }
                cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                cell.Style.Border.OutsideBorderColor = XLColor.FromHtml("#e9ecef");
            }
            ws.Row(rowIdx).Height = 22;
            rowIdx++;
        }

        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        string fileName = $"Danh_Sach_Hang_Hoa_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
        return File(ms.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    /// <summary>
    /// Nhập hàng hóa từ file Excel với đầy đủ các trường quản lý
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> ImportExcel(IFormFile? file, string duplicateMode = "UPDATE")
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { success = false, message = "Vui lòng chọn file Excel để nhập dữ liệu." });
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext != ".xlsx")
        {
            return BadRequest(new { success = false, message = "Hệ thống chỉ hỗ trợ file định dạng Excel (.xlsx)." });
        }

        using var stream = file.OpenReadStream();
        using var workbook = new XLWorkbook(stream);
        var ws = workbook.Worksheets.FirstOrDefault();
        if (ws == null)
        {
            return BadRequest(new { success = false, message = "File Excel không chứa bất kỳ trang tính nào." });
        }

        // Tìm dòng header (dòng 1 hoặc dòng đầu tiên có cột Tên hàng)
        int headerRow = 1;
        var colMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        for (int r = 1; r <= Math.Min(5, ws.LastRowUsed()?.RowNumber() ?? 1); r++)
        {
            var tempMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            int lastCol = ws.Row(r).LastCellUsed()?.Address.ColumnNumber ?? 0;
            for (int col = 1; col <= lastCol; col++)
            {
                string header = ws.Cell(r, col).GetString().Trim();
                if (string.IsNullOrEmpty(header)) continue;
                string norm = RemoveDiacritics(header).ToLower().Replace(" ", "").Replace("(*)", "").Replace("*", "");

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
            return BadRequest(new
            {
                success = false,
                message = "File Excel thiếu cột bắt buộc 'Tên hàng (*)' hoặc tiêu đề không đúng định dạng. Lưu ý: File xuất nếu bị thiếu các trường cốt lõi sẽ không thể làm file nhập ngược lại!"
            });
        }

        // Kiểm tra xem dòng kế tiếp có phải dòng chú thích/hướng dẫn không
        int startRow = headerRow + 1;
        int lastRow = ws.LastRowUsed()?.RowNumber() ?? headerRow;

        if (startRow <= lastRow)
        {
            string sampleCheck = ws.Cell(startRow, colMap["TenHang"]).GetString().ToLower();
            if (sampleCheck.Contains("bắt buộc") || sampleCheck.Contains("hướng dẫn") || sampleCheck.Contains("ví dụ"))
            {
                startRow++;
            }
        }

        if (startRow > lastRow)
        {
            return BadRequest(new { success = false, message = "File Excel không có dữ liệu hàng hóa nào để nhập." });
        }

        int whId = CurrentWarehouseId;
        int nvId = CurrentNhanVienId;

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
                // Kiểm tra dòng trống
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

                string tenHang = GetCellString(ws, r, colMap, "TenHang");
                if (string.IsNullOrWhiteSpace(tenHang))
                {
                    errorList.Add($"Dòng {r}: Tên hàng không được để trống.");
                    continue;
                }

                string maHang = GetCellString(ws, r, colMap, "MaHang");
                string nhom = GetCellString(ws, r, colMap, "NhomHang");
                string dvt = GetCellString(ws, r, colMap, "Dvt");
                decimal giaBan = GetCellDecimal(ws, r, colMap, "GiaBan", 0);
                decimal giaVon = GetCellDecimal(ws, r, colMap, "GiaVon", 0);
                decimal tonKho = GetCellDecimal(ws, r, colMap, "TonKho", 0);
                decimal? tonNhoNhat = GetCellDecimalNullable(ws, r, colMap, "TonNhoNhat");
                decimal? tonLonNhat = GetCellDecimalNullable(ws, r, colMap, "TonLonNhat");
                string thuocTinhText = GetCellString(ws, r, colMap, "ThuocTinh");
                decimal? trongLuong = GetCellDecimalNullable(ws, r, colMap, "TrongLuong");
                string donViTrongLuong = GetCellString(ws, r, colMap, "DonViTrongLuong");
                if (string.IsNullOrWhiteSpace(donViTrongLuong)) donViTrongLuong = "g";
                string viTri = GetCellString(ws, r, colMap, "ViTri");
                string moTa = GetCellString(ws, r, colMap, "MoTa");
                string trangThai = GetCellString(ws, r, colMap, "TrangThai");
                string status = (trangThai != null && trangThai.ToLower().Contains("ngừng")) ? "NGUNG_BAN" : "DANG_BAN";

                // Map Nhóm hàng
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

                // Map Đơn vị tính
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

                    // Chế độ UPDATE: Cập nhật thông tin
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
                    // Chế độ INSERT: Thêm mới hàng hóa
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
                return BadRequest(new
                {
                    success = false,
                    message = $"Phát hiện {errorList.Count} lỗi trong quá trình xử lý. Dữ liệu chưa được lưu.",
                    errors = errorList
                });
            }

            // Tạo phiếu nhập tồn kho đầu kỳ nếu có sản phẩm mới có số lượng tồn > 0
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

            return Json(new ImportHangHoaResult
            {
                Success = true,
                TotalRows = lastRow - startRow + 1,
                InsertedCount = insertedCount,
                UpdatedCount = updatedCount,
                SkippedCount = skippedCount,
                Errors = errorList,
                Message = $"Nhập file thành công! Thêm mới: {insertedCount}, Cập nhật: {updatedCount}, Bỏ qua: {skippedCount}."
            });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return BadRequest(new { success = false, message = "Lỗi khi nhập dữ liệu từ file Excel: " + ex.Message });
        }
    }

    // ========================================================================
    // CÁC HÀM TIỆN ÍCH HỖ TRỢ XỬ LÝ FILE EXCEL
    // ========================================================================

    private static string GetCellString(IXLWorksheet ws, int row, Dictionary<string, int> colMap, string key)
    {
        if (!colMap.TryGetValue(key, out int col)) return "";
        var cell = ws.Cell(row, col);
        if (cell.IsEmpty()) return "";
        return cell.GetString()?.Trim() ?? "";
    }

    private static decimal GetCellDecimal(IXLWorksheet ws, int row, Dictionary<string, int> colMap, string key, decimal defaultValue = 0)
    {
        if (!colMap.TryGetValue(key, out int col)) return defaultValue;
        var cell = ws.Cell(row, col);
        if (cell.IsEmpty()) return defaultValue;
        if (cell.DataType == XLDataType.Number)
        {
            return Convert.ToDecimal(cell.GetDouble());
        }
        string str = cell.GetString()?.Trim() ?? "";
        if (string.IsNullOrEmpty(str)) return defaultValue;
        str = str.Replace("₫", "").Replace("VND", "", StringComparison.OrdinalIgnoreCase).Replace(" ", "");
        if (decimal.TryParse(str, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal val)) return val;
        if (decimal.TryParse(str, NumberStyles.Any, new CultureInfo("vi-VN"), out val)) return val;
        return defaultValue;
    }

    private static decimal? GetCellDecimalNullable(IXLWorksheet ws, int row, Dictionary<string, int> colMap, string key)
    {
        if (!colMap.TryGetValue(key, out int col)) return null;
        var cell = ws.Cell(row, col);
        if (cell.IsEmpty()) return null;
        if (cell.DataType == XLDataType.Number)
        {
            return Convert.ToDecimal(cell.GetDouble());
        }
        string str = cell.GetString()?.Trim() ?? "";
        if (string.IsNullOrEmpty(str)) return null;
        str = str.Replace("₫", "").Replace("VND", "", StringComparison.OrdinalIgnoreCase).Replace(" ", "");
        if (decimal.TryParse(str, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal val)) return val;
        if (decimal.TryParse(str, NumberStyles.Any, new CultureInfo("vi-VN"), out val)) return val;
        return null;
    }

    private static string RemoveDiacritics(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return "";
        var normalizedString = text.Normalize(System.Text.NormalizationForm.FormD);
        var stringBuilder = new System.Text.StringBuilder(capacity: normalizedString.Length);

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
            .Normalize(System.Text.NormalizationForm.FormC)
            .Replace('đ', 'd')
            .Replace('Đ', 'D');
    }

    private static string? ParseThuocTinhTextToJson(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;
        var pairs = text.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries);
        var list = new List<ThuocTinhItemVM>();
        foreach (var pair in pairs)
        {
            var parts = pair.Split(new[] { ':', '=' }, 2);
            if (parts.Length == 2)
            {
                string k = parts[0].Trim();
                string v = parts[1].Trim();
                if (!string.IsNullOrEmpty(k) && !string.IsNullOrEmpty(v))
                {
                    list.Add(new ThuocTinhItemVM { Ten = k, GiaTri = v });
                }
            }
            else if (parts.Length == 1 && !string.IsNullOrWhiteSpace(parts[0]))
            {
                list.Add(new ThuocTinhItemVM { Ten = "Thuộc tính", GiaTri = parts[0].Trim() });
            }
        }
        return list.Any() ? System.Text.Json.JsonSerializer.Serialize(list) : null;
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

    private static List<ThuocTinhItemVM> ParseThuocTinhJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new();
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<List<ThuocTinhItemVM>>(json, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();
        }
        catch
        {
            return new();
        }
    }

    private async Task Options(HangHoaForm? model = null)
    {
        ViewBag.NhomHang = new SelectList(await _context.NhomHangs.AsNoTracking().OrderBy(x => x.TenNhom).ToListAsync(), "MaNhom", "TenNhom", model?.MaNhom);
        ViewBag.DonViTinh = new SelectList(await _context.DonViTinhs.AsNoTracking().OrderBy(x => x.TenDvt).ToListAsync(), "MaDvt", "TenDvt", model?.MaDvt);
        ViewBag.States = new List<SelectListItem>
        {
            new SelectListItem("Đang bán", "DANG_BAN"),
            new SelectListItem("Ngừng bán", "NGUNG_BAN")
        };
    }
}
