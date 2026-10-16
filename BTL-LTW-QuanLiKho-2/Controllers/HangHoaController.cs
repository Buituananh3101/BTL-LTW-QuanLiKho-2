using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using BTL_LTW_QuanLiKho_2.Models;
using BTL_LTW_QuanLiKho_2.ViewModels;
using BTL_LTW_QuanLiKho_2.Services;

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
        int page = 1)
    {
        var vm = await BuildIndexVM(q, nhom, trangThai, tonKhoFilter, nhaCungCap, loaiHang, viTri, duKienFilter, tgTaoFilter, tgTaoFrom, tgTaoTo, daDanhDau, page);
        return View(vm);
    }

    // AJAX Action trả về Partial View danh sách bảng
    public async Task<IActionResult> Filter(
        string? q, string? nhom = null, string? trangThai = null, string tonKhoFilter = "ALL",
        string? nhaCungCap = null, string? loaiHang = null, string? viTri = null,
        string duKienFilter = "ALL", string tgTaoFilter = "ALL",
        DateTime? tgTaoFrom = null, DateTime? tgTaoTo = null,
        bool daDanhDau = false,
        int page = 1)
    {
        var vm = await BuildIndexVM(q, nhom, trangThai, tonKhoFilter, nhaCungCap, loaiHang, viTri, duKienFilter, tgTaoFilter, tgTaoFrom, tgTaoTo, daDanhDau, page);
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
    [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Client)]
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

    private async Task<HangHoaIndexVM> BuildIndexVM(
        string? q, string? nhom, string? trangThai, string tonKhoFilter,
        string? nhaCungCap, string? loaiHang, string? viTri,
        string duKienFilter, string tgTaoFilter,
        DateTime? tgTaoFrom, DateTime? tgTaoTo,
        bool daDanhDau,
        int page)
    {
        int whId = GetCurrentWarehouseId();
        var wh = await _context.Khos.FindAsync(whId);

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
                HasImage = x.HinhAnh != null,
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
            || await _context.ChiTietPhieuChuyenKhos.AnyAsync(x => x.MaHang == id)
            || await _context.ChiTietPhieuKiemKes.AnyAsync(x => x.MaHang == id);

        if (used)
        {
            return BadRequest(new { message = "Hàng hóa này đã phát sinh giao dịch/chứng từ trong hệ thống, không thể xóa. Bạn có thể chuyển sang trạng thái 'Ngừng bán'." });
        }

        var nguongs = await _context.NguongTonKhos.Where(x => x.MaHang == id).ToListAsync();
        _context.NguongTonKhos.RemoveRange(nguongs);

        _context.HangHoas.Remove(item);
        await _context.SaveChangesAsync();

        return Json(new { success = true, message = $"Đã xóa hàng hóa {item.TenHang} thành công." });
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
