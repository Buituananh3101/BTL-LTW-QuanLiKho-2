using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BTL_LTW_QuanLiKho_2.Models;
using BTL_LTW_QuanLiKho_2.ViewModels;
using BTL_LTW_QuanLiKho_2.Services;

namespace BTL_LTW_QuanLiKho_2.Controllers;

public class PhieuKiemKeController : Controller
{
    private readonly QuanLyKhoPhuQuocLtwContext _context;
    private readonly ITonKhoService _tonKhoService;

    public PhieuKiemKeController(QuanLyKhoPhuQuocLtwContext context, ITonKhoService tonKhoService)
    {
        _context = context;
        _tonKhoService = tonKhoService;
    }

    private int GetCurrentWarehouseId()
    {
        var whId = HttpContext.Session.GetInt32("CurrentWarehouseId");
        if (!whId.HasValue || whId.Value <= 0)
        {
            var firstWh = _context.Khos.OrderBy(k => k.MaKho).FirstOrDefault();
            whId = firstWh?.MaKho ?? 1;
            HttpContext.Session.SetInt32("CurrentWarehouseId", whId.Value);
        }
        return whId.Value;
    }

    private int GetCurrentUserId()
    {
        var userId = HttpContext.Session.GetInt32("CurrentUserId");
        if (!userId.HasValue || userId.Value <= 0)
        {
            // Mặc định là Thủ kho (MaNV = 2) hoặc Quản lý (MaNV = 1)
            userId = 2;
            HttpContext.Session.SetInt32("CurrentUserId", userId.Value);
        }
        return userId.Value;
    }

    private (DateTime fromDate, DateTime toDate) ResolveDateRange(string filterType, DateTime? customFrom, DateTime? customTo)
    {
        var now = DateTime.Now;
        var today = now.Date;

        return filterType switch
        {
            "TODAY" => (today, today.AddDays(1).AddTicks(-1)),
            "YESTERDAY" => (today.AddDays(-1), today.AddTicks(-1)),
            "THIS_WEEK" =>
                (today.AddDays(-(int)(today.DayOfWeek == DayOfWeek.Sunday ? 6 : (int)today.DayOfWeek - 1)),
                 today.AddDays(7 - (today.DayOfWeek == DayOfWeek.Sunday ? 7 : (int)today.DayOfWeek)).AddDays(1).AddTicks(-1)),
            "LAST_WEEK" =>
                (today.AddDays(-(int)(today.DayOfWeek == DayOfWeek.Sunday ? 6 : (int)today.DayOfWeek - 1) - 7),
                 today.AddDays(-(int)(today.DayOfWeek == DayOfWeek.Sunday ? 6 : (int)today.DayOfWeek - 1)).AddTicks(-1)),
            "LAST_7_DAYS" => (today.AddDays(-6), now),
            "THIS_MONTH" => (new DateTime(now.Year, now.Month, 1), new DateTime(now.Year, now.Month, 1).AddMonths(1).AddTicks(-1)),
            "LAST_MONTH" =>
                (new DateTime(now.Year, now.Month, 1).AddMonths(-1),
                 new DateTime(now.Year, now.Month, 1).AddTicks(-1)),
            "LAST_30_DAYS" => (today.AddDays(-29), now),
            "THIS_QUARTER" =>
            (
                new DateTime(now.Year, ((now.Month - 1) / 3) * 3 + 1, 1),
                new DateTime(now.Year, ((now.Month - 1) / 3) * 3 + 1, 1).AddMonths(3).AddTicks(-1)
            ),
            "THIS_YEAR" => (new DateTime(now.Year, 1, 1), new DateTime(now.Year, 12, 31, 23, 59, 59)),
            "CUSTOM" =>
            (
                customFrom ?? new DateTime(now.Year, now.Month, 1),
                customTo.HasValue ? customTo.Value.Date.AddDays(1).AddTicks(-1) : now
            ),
            _ => (new DateTime(now.Year, now.Month, 1), new DateTime(now.Year, now.Month, 1).AddMonths(1).AddTicks(-1))
        };
    }

    // GET: PhieuKiemKe/Index
    public async Task<IActionResult> Index(PhieuKiemKeFilterVM filter)
    {
        var model = await BuildIndexViewModel(filter);
        return View(model);
    }

    // GET: PhieuKiemKe/Filter (AJAX partial)
    public async Task<IActionResult> Filter(PhieuKiemKeFilterVM filter)
    {
        var model = await BuildIndexViewModel(filter);
        return PartialView("_PhieuKiemKeTable", model);
    }

    private async Task<PhieuKiemKeIndexVM> BuildIndexViewModel(PhieuKiemKeFilterVM filter)
    {
        int currentWhId = GetCurrentWarehouseId();
        if (!filter.WarehouseId.HasValue || filter.WarehouseId.Value == 0)
        {
            filter.WarehouseId = currentWhId;
        }

        var (fromDate, toDate) = ResolveDateRange(filter.DateFilterType, filter.FromDate, filter.ToDate);
        filter.FromDate = fromDate;
        filter.ToDate = toDate;

        var query = _context.PhieuKiemKes
            .AsNoTracking()
            .Include(p => p.MaKhoNavigation)
            .Include(p => p.MaNvlapNavigation)
            .Include(p => p.PhieuDieuChinh)
            .Include(p => p.ChiTietPhieuKiemKes)
                .ThenInclude(ct => ct.MaHangNavigation)
            .AsQueryable();

        // Lọc theo kho
        if (filter.WarehouseId.HasValue && filter.WarehouseId.Value > 0)
        {
            query = query.Where(p => p.MaKho == filter.WarehouseId.Value);
        }

        // Lọc theo ngày tạo
        query = query.Where(p => p.ThoiDiemChot >= fromDate && p.ThoiDiemChot <= toDate);

        // Lọc theo trạng thái
        if (filter.Statuses != null && filter.Statuses.Any())
        {
            query = query.Where(p => filter.Statuses.Contains(p.TrangThai));
        }

        // Lọc theo người tạo
        if (filter.CreatorId.HasValue && filter.CreatorId.Value > 0)
        {
            query = query.Where(p => p.MaNvlap == filter.CreatorId.Value);
        }

        // Tìm kiếm mã hoặc ghi chú
        if (!string.IsNullOrWhiteSpace(filter.Q))
        {
            var q = filter.Q.Trim();
            // Cho phép tìm theo số ID (ví dụ 1, 2) hoặc mã hiển thị PKK000001
            if (int.TryParse(q.Replace("PKK", "").TrimStart('0'), out int searchId))
            {
                query = query.Where(p => p.MaPhieuKiemKe == searchId || (p.GhiChu != null && p.GhiChu.Contains(q)));
            }
            else
            {
                query = query.Where(p => p.GhiChu != null && p.GhiChu.Contains(q));
            }
        }

        int totalCount = await query.CountAsync();

        var pagedItems = await query
            .OrderByDescending(p => p.ThoiDiemChot)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        var listItems = pagedItems.Select(p =>
        {
            var details = p.ChiTietPhieuKiemKes.ToList();
            var tongThucTe = details.Where(d => d.SoLuongThucTe.HasValue).Sum(d => d.SoLuongThucTe!.Value);
            var tongSoLuongSo = details.Sum(d => d.SoLuongTheoSo);
            var slLechTang = details.Where(d => d.SoLuongThucTe.HasValue && d.SoLuongThucTe.Value > d.SoLuongTheoSo)
                                    .Sum(d => d.SoLuongThucTe!.Value - d.SoLuongTheoSo);
            var slLechGiam = details.Where(d => d.SoLuongThucTe.HasValue && d.SoLuongThucTe.Value < d.SoLuongTheoSo)
                                    .Sum(d => d.SoLuongTheoSo - d.SoLuongThucTe!.Value);

            DateTime? ngayCanBang = p.PhieuDieuChinh?.NgayDuyet ?? (p.TrangThai == "DA_DIEU_CHINH" ? p.ThoiDiemChot : null);

            return new PhieuKiemKeListItemVM
            {
                MaPhieuKiemKe = p.MaPhieuKiemKe,
                ThoiDiemChot = p.ThoiDiemChot,
                NgayCanBang = ngayCanBang,
                TrangThai = p.TrangThai,
                MaKho = p.MaKho,
                TenKho = p.MaKhoNavigation?.TenKho ?? $"Kho {p.MaKho}",
                MaNvlap = p.MaNvlap,
                TenNguoiLap = p.MaNvlapNavigation?.HoTen ?? $"NV {p.MaNvlap}",
                GhiChu = p.GhiChu,
                TongThucTe = tongThucTe,
                TongSoLuongSo = tongSoLuongSo,
                SlLechTang = slLechTang,
                SlLechGiam = slLechGiam
            };
        }).ToList();

        var warehouses = await _context.Khos
            .Where(k => k.TrangThai == "HOAT_DONG")
            .OrderBy(k => k.MaKho)
            .Select(k => new WarehouseItemVM { MaKho = k.MaKho, TenKho = k.TenKho })
            .ToListAsync();

        var creators = await _context.NhanViens
            .Where(nv => nv.TrangThai == "DANG_LAM")
            .OrderBy(nv => nv.HoTen)
            .Select(nv => new CreatorItemVM { MaNv = nv.MaNv, TenNv = nv.HoTen })
            .ToListAsync();

        var currentWh = warehouses.FirstOrDefault(w => w.MaKho == currentWhId);

        return new PhieuKiemKeIndexVM
        {
            Filter = filter,
            Items = listItems,
            TotalCount = totalCount,
            CurrentWarehouseId = currentWhId,
            CurrentWarehouseName = currentWh?.TenKho ?? "Kho trung tâm",
            Warehouses = warehouses,
            Creators = creators
        };
    }

    // GET: PhieuKiemKe/Create
    public async Task<IActionResult> Create(int? warehouseId)
    {
        int whId = warehouseId ?? GetCurrentWarehouseId();
        var kho = await _context.Khos.FindAsync(whId);
        int userId = GetCurrentUserId();
        var user = await _context.NhanViens.FindAsync(userId);

        var model = new PhieuKiemKeFormVM
        {
            MaPhieuKiemKe = 0,
            MaKho = whId,
            TenKho = kho?.TenKho ?? $"Kho {whId}",
            MaNvlap = userId,
            TenNguoiLap = user?.HoTen ?? "Người dùng hiện tại",
            ThoiDiemChot = DateTime.Now,
            TrangThai = "NHAP",
            IsReadOnly = false,
            Lines = new List<PhieuKiemKeLineVM>()
        };

        ViewBag.NhomHangs = await _context.NhomHangs.OrderBy(n => n.TenNhom).ToListAsync();
        return View(model);
    }

    // GET: PhieuKiemKe/Edit/5
    public async Task<IActionResult> Edit(int id)
    {
        var pkk = await _context.PhieuKiemKes
            .Include(p => p.MaKhoNavigation)
            .Include(p => p.MaNvlapNavigation)
            .Include(p => p.PhieuDieuChinh)
                .ThenInclude(pdc => pdc.MaNvduyetNavigation)
            .Include(p => p.ChiTietPhieuKiemKes)
                .ThenInclude(ct => ct.MaHangNavigation)
                    .ThenInclude(h => h.MaDvtNavigation)
            .Include(p => p.ChiTietPhieuKiemKes)
                .ThenInclude(ct => ct.MaHangNavigation)
                    .ThenInclude(h => h.MaNhomNavigation)
            .FirstOrDefaultAsync(p => p.MaPhieuKiemKe == id);

        if (pkk == null) return NotFound();

        // Nếu phiếu đã cân bằng hoặc đã hủy -> chuyển sang trang Details chỉ đọc
        if (pkk.TrangThai != "NHAP")
        {
            return RedirectToAction(nameof(Details), new { id });
        }

        // Lấy tồn kho hiện tại của kho
        var stockMap = await _context.VwTonKhoHienTais
            .Where(s => s.MaKho == pkk.MaKho)
            .ToDictionaryAsync(s => s.MaHang, s => s.SoLuongTon ?? 0);

        var lines = pkk.ChiTietPhieuKiemKes.Select(ct =>
        {
            var currentStock = stockMap.TryGetValue(ct.MaHang, out var ton) ? ton : ct.SoLuongTheoSo;
            return new PhieuKiemKeLineVM
            {
                MaHang = ct.MaHang,
                MaHangNoiBo = ct.MaHangNavigation?.MaHangNoiBo ?? "",
                TenHang = ct.MaHangNavigation?.TenHang ?? "",
                TenDvt = ct.MaHangNavigation?.MaDvtNavigation?.TenDvt ?? "",
                TenNhom = ct.MaHangNavigation?.MaNhomNavigation?.TenNhom ?? "",
                SoLuongTheoSo = ct.SoLuongTheoSo,
                SoLuongThucTe = ct.SoLuongThucTe,
                DonGia = (ct.MaHangNavigation != null && ct.MaHangNavigation.GiaVon > 0) ? ct.MaHangNavigation.GiaVon : (ct.MaHangNavigation?.GiaBanThamKhao ?? 0)
            };
        }).ToList();

        var model = new PhieuKiemKeFormVM
        {
            MaPhieuKiemKe = pkk.MaPhieuKiemKe,
            MaKho = pkk.MaKho,
            TenKho = pkk.MaKhoNavigation?.TenKho ?? $"Kho {pkk.MaKho}",
            MaNvlap = pkk.MaNvlap,
            TenNguoiLap = pkk.MaNvlapNavigation?.HoTen ?? $"NV {pkk.MaNvlap}",
            ThoiDiemChot = pkk.ThoiDiemChot,
            TrangThai = pkk.TrangThai,
            GhiChu = pkk.GhiChu,
            IsReadOnly = false,
            Lines = lines
        };

        ViewBag.NhomHangs = await _context.NhomHangs.OrderBy(n => n.TenNhom).ToListAsync();
        return View("Create", model);
    }

    // GET: PhieuKiemKe/Details/5
    public async Task<IActionResult> Details(int id)
    {
        var pkk = await _context.PhieuKiemKes
            .Include(p => p.MaKhoNavigation)
            .Include(p => p.MaNvlapNavigation)
            .Include(p => p.PhieuDieuChinh)
                .ThenInclude(pdc => pdc.MaNvduyetNavigation)
            .Include(p => p.ChiTietPhieuKiemKes)
                .ThenInclude(ct => ct.MaHangNavigation)
                    .ThenInclude(h => h.MaDvtNavigation)
            .Include(p => p.ChiTietPhieuKiemKes)
                .ThenInclude(ct => ct.MaHangNavigation)
                    .ThenInclude(h => h.MaNhomNavigation)
            .FirstOrDefaultAsync(p => p.MaPhieuKiemKe == id);

        if (pkk == null) return NotFound();

        var lines = pkk.ChiTietPhieuKiemKes.Select(ct => new PhieuKiemKeLineVM
        {
            MaHang = ct.MaHang,
            MaHangNoiBo = ct.MaHangNavigation?.MaHangNoiBo ?? "",
            TenHang = ct.MaHangNavigation?.TenHang ?? "",
            TenDvt = ct.MaHangNavigation?.MaDvtNavigation?.TenDvt ?? "",
            TenNhom = ct.MaHangNavigation?.MaNhomNavigation?.TenNhom ?? "",
            SoLuongTheoSo = ct.SoLuongTheoSo,
            SoLuongThucTe = ct.SoLuongThucTe,
            DonGia = (ct.MaHangNavigation != null && ct.MaHangNavigation.GiaVon > 0) ? ct.MaHangNavigation.GiaVon : (ct.MaHangNavigation?.GiaBanThamKhao ?? 0)
        }).ToList();

        var model = new PhieuKiemKeFormVM
        {
            MaPhieuKiemKe = pkk.MaPhieuKiemKe,
            MaKho = pkk.MaKho,
            TenKho = pkk.MaKhoNavigation?.TenKho ?? $"Kho {pkk.MaKho}",
            MaNvlap = pkk.MaNvlap,
            TenNguoiLap = pkk.MaNvlapNavigation?.HoTen ?? $"NV {pkk.MaNvlap}",
            ThoiDiemChot = pkk.ThoiDiemChot,
            TrangThai = pkk.TrangThai,
            GhiChu = pkk.GhiChu,
            IsReadOnly = true,
            NgayCanBang = pkk.PhieuDieuChinh?.NgayDuyet ?? (pkk.TrangThai == "DA_DIEU_CHINH" ? pkk.ThoiDiemChot : null),
            TenNguoiCanBang = pkk.PhieuDieuChinh?.MaNvduyetNavigation?.HoTen ?? pkk.MaNvlapNavigation?.HoTen,
            Lines = lines
        };

        return View(model);
    }

    // POST: PhieuKiemKe/SaveDraft (Lưu tạm)
    [HttpPost]
    public async Task<IActionResult> SaveDraft([FromBody] SaveStockTakeRequest req)
    {
        if (req == null)
        {
            return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ." });
        }

        if (req.MaKho <= 0)
        {
            req.MaKho = GetCurrentWarehouseId();
        }

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            PhieuKiemKe pkk;
            if (req.MaPhieuKiemKe > 0)
            {
                pkk = await _context.PhieuKiemKes
                    .Include(p => p.ChiTietPhieuKiemKes)
                    .FirstOrDefaultAsync(p => p.MaPhieuKiemKe == req.MaPhieuKiemKe);

                if (pkk == null) return NotFound(new { success = false, message = "Không tìm thấy phiếu kiểm." });
                if (pkk.TrangThai != "NHAP")
                {
                    return BadRequest(new { success = false, message = "Phiếu này đã hoàn thành hoặc đã hủy, không thể sửa." });
                }

                pkk.ThoiDiemChot = req.ThoiDiemChot;
                pkk.GhiChu = req.GhiChu;

                // Xóa chi tiết cũ và thêm lại
                _context.ChiTietPhieuKiemKes.RemoveRange(pkk.ChiTietPhieuKiemKes);
            }
            else
            {
                pkk = new PhieuKiemKe
                {
                    MaKho = req.MaKho,
                    MaNvlap = req.MaNvlap > 0 ? req.MaNvlap : GetCurrentUserId(),
                    ThoiDiemChot = req.ThoiDiemChot,
                    TrangThai = "NHAP",
                    GhiChu = req.GhiChu
                };
                _context.PhieuKiemKes.Add(pkk);
                await _context.SaveChangesAsync();
            }

            // Thêm chi tiết
            foreach (var line in req.Lines)
            {
                var ct = new ChiTietPhieuKiemKe
                {
                    MaPhieuKiemKe = pkk.MaPhieuKiemKe,
                    MaHang = line.MaHang,
                    SoLuongTheoSo = line.SoLuongTheoSo,
                    SoLuongThucTe = line.SoLuongThucTe
                };
                _context.ChiTietPhieuKiemKes.Add(ct);
            }

            await _context.SaveChangesAsync();
            await trans.CommitAsync();

            return Ok(new
            {
                success = true,
                id = pkk.MaPhieuKiemKe,
                code = $"PKK{pkk.MaPhieuKiemKe:D6}",
                message = "Lưu tạm phiếu kiểm kho thành công!"
            });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return StatusCode(500, new { success = false, message = "Lỗi khi lưu phiếu: " + ex.Message });
        }
    }

    // POST: PhieuKiemKe/Complete (Hoàn thành - Cân bằng kho)
    [HttpPost]
    public async Task<IActionResult> Complete([FromBody] SaveStockTakeRequest req)
    {
        if (req == null || req.Lines == null || !req.Lines.Any())
        {
            return BadRequest(new { success = false, message = "Phiếu kiểm phải có ít nhất một mặt hàng." });
        }

        if (req.MaKho <= 0)
        {
            req.MaKho = GetCurrentWarehouseId();
        }

        // Chặn tồn âm nghiệp vụ kiểm kho ([ISSUE-02])
        var kiemTra = await _tonKhoService.KiemTraKiemKeAsync(req.MaKho, req.Lines.Select(l => (l.MaHang, l.SoLuongThucTe)));
        if (!kiemTra.HopLe)
        {
            return BadRequest(new { success = false, message = kiemTra.ThongBaoLoi });
        }

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            PhieuKiemKe pkk;
            if (req.MaPhieuKiemKe > 0)
            {
                pkk = await _context.PhieuKiemKes
                    .Include(p => p.ChiTietPhieuKiemKes)
                    .FirstOrDefaultAsync(p => p.MaPhieuKiemKe == req.MaPhieuKiemKe);

                if (pkk == null) return NotFound(new { success = false, message = "Không tìm thấy phiếu kiểm." });
                if (pkk.TrangThai != "NHAP")
                {
                    return BadRequest(new { success = false, message = "Phiếu kiểm này đã được cân bằng trước đó." });
                }

                pkk.ThoiDiemChot = req.ThoiDiemChot;
                pkk.GhiChu = req.GhiChu;
                pkk.TrangThai = "DA_DIEU_CHINH";

                _context.ChiTietPhieuKiemKes.RemoveRange(pkk.ChiTietPhieuKiemKes);
            }
            else
            {
                pkk = new PhieuKiemKe
                {
                    MaKho = req.MaKho,
                    MaNvlap = req.MaNvlap > 0 ? req.MaNvlap : GetCurrentUserId(),
                    ThoiDiemChot = req.ThoiDiemChot,
                    TrangThai = "DA_DIEU_CHINH",
                    GhiChu = req.GhiChu
                };
                _context.PhieuKiemKes.Add(pkk);
                await _context.SaveChangesAsync();
            }

            // Đọc lại tồn kho thực tế hiện tại từ vw_TonKhoHienTai
            var stockMap = await _context.VwTonKhoHienTais
                .Where(s => s.MaKho == pkk.MaKho)
                .ToDictionaryAsync(s => s.MaHang, s => s.SoLuongTon ?? 0);

            var createdDetails = new List<ChiTietPhieuKiemKe>();

            foreach (var line in req.Lines)
            {
                // Tồn kho sổ sách được chốt lại tại thời điểm cân bằng
                var currentSystemStock = stockMap.TryGetValue(line.MaHang, out var stock) ? stock : line.SoLuongTheoSo;

                var ct = new ChiTietPhieuKiemKe
                {
                    MaPhieuKiemKe = pkk.MaPhieuKiemKe,
                    MaHang = line.MaHang,
                    SoLuongTheoSo = currentSystemStock,
                    SoLuongThucTe = line.SoLuongThucTe
                };
                _context.ChiTietPhieuKiemKes.Add(ct);
                createdDetails.Add(ct);
            }

            await _context.SaveChangesAsync();

            // Lọc các dòng đã kiểm (Thực tế != null) và có chênh lệch (Thực tế != Tồn sổ sách)
            var diffDetails = createdDetails
                .Where(d => d.SoLuongThucTe.HasValue && (d.SoLuongThucTe.Value - d.SoLuongTheoSo) != 0)
                .ToList();

            if (diffDetails.Any())
            {
                var pdc = new PhieuDieuChinh
                {
                    MaPhieuKiemKe = pkk.MaPhieuKiemKe,
                    MaNvlap = pkk.MaNvlap,
                    MaNvduyet = pkk.MaNvlap,
                    NgayLap = pkk.ThoiDiemChot,
                    NgayDuyet = DateTime.Now,
                    TrangThai = "DA_DUYET",
                    GhiChu = $"Cân bằng kho từ phiếu kiểm PKK{pkk.MaPhieuKiemKe:D6}"
                };
                _context.PhieuDieuChinhs.Add(pdc);
                await _context.SaveChangesAsync();

                foreach (var diff in diffDetails)
                {
                    var ctpdc = new ChiTietPhieuDieuChinh
                    {
                        MaPhieuDieuChinh = pdc.MaPhieuDieuChinh,
                        MaCtkiemKe = diff.MaCtkiemKe,
                        SoLuongDieuChinh = diff.SoLuongThucTe!.Value - diff.SoLuongTheoSo
                    };
                    _context.ChiTietPhieuDieuChinhs.Add(ctpdc);
                }

                await _context.SaveChangesAsync();
            }

            // Ghi nhật ký thao tác
            try
            {
                var audit = new NhatKyThaoTac
                {
                    MaTaiKhoan = 1, // Quản lý
                    ThoiDiem = DateTime.Now,
                    ThaoTac = "Cân bằng kho",
                    LoaiDoiTuong = "PhieuKiemKe",
                    MaDoiTuong = pkk.MaPhieuKiemKe.ToString(),
                    NoiDung = $"Cân bằng kho #{pkk.MaPhieuKiemKe} tại Kho {pkk.MaKho}, số dòng: {createdDetails.Count}, dòng chênh lệch: {diffDetails.Count}"
                };
                _context.NhatKyThaoTacs.Add(audit);
                await _context.SaveChangesAsync();
            }
            catch
            {
                // Không chặn thao tác chính nếu log gặp lỗi
            }

            await trans.CommitAsync();

            return Ok(new
            {
                success = true,
                id = pkk.MaPhieuKiemKe,
                code = $"PKK{pkk.MaPhieuKiemKe:D6}",
                message = "Cân bằng kho thành công! Số lượng tồn kho đã được cập nhật chính xác."
            });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return StatusCode(500, new { success = false, message = "Lỗi khi cân bằng kho: " + ex.Message });
        }
    }

    // POST: PhieuKiemKe/Delete/5 (Chỉ xóa phiếu tạm)
    [HttpPost]
    public async Task<IActionResult> Delete(int id)
    {
        var pkk = await _context.PhieuKiemKes
            .Include(p => p.ChiTietPhieuKiemKes)
            .FirstOrDefaultAsync(p => p.MaPhieuKiemKe == id);

        if (pkk == null) return NotFound(new { success = false, message = "Không tìm thấy phiếu kiểm." });

        if (pkk.TrangThai != "NHAP")
        {
            return BadRequest(new { success = false, message = "Chỉ có thể xóa phiếu kiểm ở trạng thái Phiếu tạm." });
        }

        _context.ChiTietPhieuKiemKes.RemoveRange(pkk.ChiTietPhieuKiemKes);
        _context.PhieuKiemKes.Remove(pkk);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Đã xóa phiếu tạm thành công." });
    }

    // GET: PhieuKiemKe/SearchProducts (Autocomplete F3)
    [HttpGet]
    public async Task<IActionResult> SearchProducts(string? q, int warehouseId)
    {
        warehouseId = warehouseId > 0 ? warehouseId : GetCurrentWarehouseId();
        q = (q ?? "").Trim();

        var stockMap = await _context.VwTonKhoHienTais
            .Where(s => s.MaKho == warehouseId)
            .ToDictionaryAsync(s => s.MaHang, s => s.SoLuongTon ?? 0);

        var query = _context.HangHoas
            .AsNoTracking()
            .Include(h => h.MaDvtNavigation)
            .Include(h => h.MaNhomNavigation)
            .Where(h => h.TrangThai == "DANG_BAN");

        if (!string.IsNullOrEmpty(q))
        {
            query = query.Where(h => h.TenHang.Contains(q) || h.MaHangNoiBo.Contains(q));
        }

        var products = await query.Take(20).ToListAsync();

        var result = products.Select(h => new ProductSearchItemVM
        {
            MaHang = h.MaHang,
            MaHangNoiBo = h.MaHangNoiBo,
            TenHang = h.TenHang,
            TenDvt = h.MaDvtNavigation?.TenDvt ?? "",
            TenNhom = h.MaNhomNavigation?.TenNhom ?? "",
            Gia = h.GiaVon > 0 ? h.GiaVon : h.GiaBanThamKhao,
            TonKho = stockMap.TryGetValue(h.MaHang, out var ton) ? ton : 0
        }).ToList();

        return Json(result);
    }

    // GET: PhieuKiemKe/GetProductsByGroup (Nạp hàng theo nhóm bằng nút Lưới)
    [HttpGet]
    public async Task<IActionResult> GetProductsByGroup(int groupId, int warehouseId)
    {
        warehouseId = warehouseId > 0 ? warehouseId : GetCurrentWarehouseId();

        var stockMap = await _context.VwTonKhoHienTais
            .Where(s => s.MaKho == warehouseId)
            .ToDictionaryAsync(s => s.MaHang, s => s.SoLuongTon ?? 0);

        var query = _context.HangHoas
            .AsNoTracking()
            .Include(h => h.MaDvtNavigation)
            .Include(h => h.MaNhomNavigation)
            .Where(h => h.TrangThai == "DANG_BAN");

        if (groupId > 0)
        {
            query = query.Where(h => h.MaNhom == groupId);
        }

        var products = await query.ToListAsync();

        var result = products.Select(h => new ProductSearchItemVM
        {
            MaHang = h.MaHang,
            MaHangNoiBo = h.MaHangNoiBo,
            TenHang = h.TenHang,
            TenDvt = h.MaDvtNavigation?.TenDvt ?? "",
            TenNhom = h.MaNhomNavigation?.TenNhom ?? "",
            Gia = h.GiaVon > 0 ? h.GiaVon : h.GiaBanThamKhao,
            TonKho = stockMap.TryGetValue(h.MaHang, out var ton) ? ton : 0
        }).ToList();

        return Json(result);
    }

    // POST: PhieuKiemKe/SwitchWarehouse
    [HttpPost]
    public IActionResult SwitchWarehouse(int warehouseId)
    {
        if (warehouseId > 0)
        {
            HttpContext.Session.SetInt32("CurrentWarehouseId", warehouseId);
        }
        return Ok(new { success = true, warehouseId });
    }
}
