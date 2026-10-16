using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BTL_LTW_QuanLiKho_2.Models;
using BTL_LTW_QuanLiKho_2.ViewModels;
using BTL_LTW_QuanLiKho_2.Services;

namespace BTL_LTW_QuanLiKho_2.Controllers;

[Authorize]
public class PhieuKiemKeController : BaseKhoController
{
    private readonly ITonKhoService _tonKhoService;
    private readonly INhatKyThaoTacService _nhatKyService;

    public PhieuKiemKeController(
        QuanLyKhoPhuQuocLtwContext context, 
        ITonKhoService tonKhoService,
        INhatKyThaoTacService nhatKyService) : base(context)
    {
        _tonKhoService = tonKhoService;
        _nhatKyService = nhatKyService;
    }


    private (DateTime fromDate, DateTime toDate) ResolveDateRange(string? filterType, DateTime? customFrom, DateTime? customTo)
    {
        var now = DateTime.Now;
        var today = now.Date;

        return (filterType ?? "").ToUpper() switch
        {
            "ALL" or "TOANTHOIGIAN" => (new DateTime(2000, 1, 1), now.AddYears(10)),
            "TODAY" or "HOMNAY" or "HOM_NAY" => (today, today.AddDays(1).AddTicks(-1)),
            "YESTERDAY" or "HOMQUA" or "HOM_QUA" => (today.AddDays(-1), today.AddTicks(-1)),
            "THIS_WEEK" or "TUANNAY" or "TUAN_NAY" =>
                (today.AddDays(-(int)(today.DayOfWeek == DayOfWeek.Sunday ? 6 : (int)today.DayOfWeek - 1)),
                 today.AddDays(7 - (today.DayOfWeek == DayOfWeek.Sunday ? 7 : (int)today.DayOfWeek)).AddDays(1).AddTicks(-1)),
            "LAST_WEEK" or "TUANTRUOC" or "TUAN_TRUOC" =>
                (today.AddDays(-(int)(today.DayOfWeek == DayOfWeek.Sunday ? 6 : (int)today.DayOfWeek - 1) - 7),
                 today.AddDays(-(int)(today.DayOfWeek == DayOfWeek.Sunday ? 6 : (int)today.DayOfWeek - 1)).AddTicks(-1)),
            "LAST_7_DAYS" or "7NGAY" or "7_NGAY" => (today.AddDays(-6), now),
            "THIS_MONTH" or "THANGNAY" or "THANG_NAY" => (new DateTime(now.Year, now.Month, 1), new DateTime(now.Year, now.Month, 1).AddMonths(1).AddTicks(-1)),
            "LAST_MONTH" or "THANGTRUOC" or "THANG_TRUOC" =>
                (new DateTime(now.Year, now.Month, 1).AddMonths(-1),
                 new DateTime(now.Year, now.Month, 1).AddTicks(-1)),
            "LAST_30_DAYS" or "30NGAY" or "30_NGAY" => (today.AddDays(-29), now),
            "THIS_QUARTER" or "QUYNAY" or "QUY_NAY" =>
            (
                new DateTime(now.Year, ((now.Month - 1) / 3) * 3 + 1, 1),
                new DateTime(now.Year, ((now.Month - 1) / 3) * 3 + 1, 1).AddMonths(3).AddTicks(-1)
            ),
            "LAST_QUARTER" or "QUYTRUOC" or "QUY_TRUOC" =>
            (
                new DateTime(now.Year, ((now.Month - 1) / 3) * 3 + 1, 1).AddMonths(-3),
                new DateTime(now.Year, ((now.Month - 1) / 3) * 3 + 1, 1).AddTicks(-1)
            ),
            "THIS_YEAR" or "NAMNAY" or "NAM_NAY" => (new DateTime(now.Year, 1, 1), new DateTime(now.Year, 12, 31, 23, 59, 59)),
            "LAST_YEAR" or "NAMTRUOC" or "NAM_TRUOC" => (new DateTime(now.Year - 1, 1, 1), new DateTime(now.Year - 1, 12, 31, 23, 59, 59)),
            "CUSTOM" =>
            (
                customFrom.HasValue ? customFrom.Value.ToLocalTime().Date : new DateTime(now.Year, now.Month, 1),
                customTo.HasValue ? customTo.Value.ToLocalTime().Date.AddDays(1).AddTicks(-1) : now
            ),
            _ => (
                customFrom.HasValue && customTo.HasValue
                    ? (customFrom.Value.ToLocalTime().Date, customTo.Value.ToLocalTime().Date.AddDays(1).AddTicks(-1))
                    : (new DateTime(now.Year, now.Month, 1), new DateTime(now.Year, now.Month, 1).AddMonths(1).AddTicks(-1))
            )
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
                    .ThenInclude(h => h.MaDvtNavigation)
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

        // Lọc theo người tạo (hỗ trợ nhiều người tạo hoặc 1 người tạo)
        if (filter.CreatorIds != null && filter.CreatorIds.Any())
        {
            query = query.Where(p => filter.CreatorIds.Contains(p.MaNvlap));
        }
        else if (filter.CreatorId.HasValue && filter.CreatorId.Value > 0)
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
            var tongGiaTriLech = details.Where(d => d.SoLuongThucTe.HasValue)
                                    .Sum(d => (d.SoLuongThucTe!.Value - d.SoLuongTheoSo) * (d.DonGia > 0 ? d.DonGia : ((d.MaHangNavigation != null && d.MaHangNavigation.GiaVon > 0) ? d.MaHangNavigation.GiaVon : (d.MaHangNavigation?.GiaBanThamKhao ?? 0))));

            DateTime? ngayCanBang = p.PhieuDieuChinh?.NgayDuyet ?? (p.TrangThai == "DA_DIEU_CHINH" ? p.ThoiDiemChot : null);

            var lines = details.Select(ct => new PhieuKiemKeLineVM
            {
                MaHang = ct.MaHang,
                MaHangNoiBo = ct.MaHangNavigation?.MaHangNoiBo ?? "",
                TenHang = ct.MaHangNavigation?.TenHang ?? "",
                TenDvt = ct.MaHangNavigation?.MaDvtNavigation?.TenDvt ?? "",
                SoLuongTheoSo = ct.SoLuongTheoSo,
                SoLuongThucTe = ct.SoLuongThucTe,
                DonGia = ct.DonGia > 0 ? ct.DonGia : ((ct.MaHangNavigation != null && ct.MaHangNavigation.GiaVon > 0) ? ct.MaHangNavigation.GiaVon : (ct.MaHangNavigation?.GiaBanThamKhao ?? 0))
            }).ToList();

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
                SlLechGiam = slLechGiam,
                TongGiaTriLech = tongGiaTriLech,
                Lines = lines
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
    public async Task<IActionResult> Create(int? warehouseId, int? copyId)
    {
        int whId = warehouseId ?? GetCurrentWarehouseId();
        var kho = await _context.Khos.FindAsync(whId);
        int userId = CurrentNhanVienId;
        var user = await _context.NhanViens.FindAsync(userId);

        var lines = new List<PhieuKiemKeLineVM>();
        string? note = null;

        if (copyId.HasValue && copyId.Value > 0)
        {
            var src = await _context.PhieuKiemKes
                .AsNoTracking()
                .Include(p => p.ChiTietPhieuKiemKes)
                    .ThenInclude(ct => ct.MaHangNavigation)
                        .ThenInclude(h => h.MaDvtNavigation)
                .Include(p => p.ChiTietPhieuKiemKes)
                    .ThenInclude(ct => ct.MaHangNavigation)
                        .ThenInclude(h => h.MaNhomNavigation)
                .FirstOrDefaultAsync(p => p.MaPhieuKiemKe == copyId.Value);

            if (src != null)
            {
                whId = src.MaKho;
                kho = await _context.Khos.FindAsync(whId);
                note = src.GhiChu;

                // Lấy tồn kho hiện tại cho các mặt hàng sao chép
                var stockMap = await _context.VwTonKhoHienTais
                    .Where(s => s.MaKho == whId)
                    .ToDictionaryAsync(s => s.MaHang, s => s.SoLuongTon ?? 0);

                lines = src.ChiTietPhieuKiemKes.Select(ct => new PhieuKiemKeLineVM
                {
                    MaHang = ct.MaHang,
                    MaHangNoiBo = ct.MaHangNavigation?.MaHangNoiBo ?? "",
                    TenHang = ct.MaHangNavigation?.TenHang ?? "",
                    TenDvt = ct.MaHangNavigation?.MaDvtNavigation?.TenDvt ?? "",
                    TenNhom = ct.MaHangNavigation?.MaNhomNavigation?.TenNhom ?? "",
                    SoLuongTheoSo = stockMap.TryGetValue(ct.MaHang, out var ton) ? ton : ct.SoLuongTheoSo,
                    SoLuongThucTe = null, // Sao chép thì thực tế để trống (chưa kiểm)
                    DonGia = ct.DonGia > 0 ? ct.DonGia : ((ct.MaHangNavigation != null && ct.MaHangNavigation.GiaVon > 0) ? ct.MaHangNavigation.GiaVon : (ct.MaHangNavigation?.GiaBanThamKhao ?? 0))
                }).ToList();
            }
        }

        var model = new PhieuKiemKeFormVM
        {
            MaPhieuKiemKe = 0,
            MaKho = whId,
            TenKho = kho?.TenKho ?? $"Kho {whId}",
            MaNvlap = userId,
            TenNguoiLap = user?.HoTen ?? "Người dùng hiện tại",
            ThoiDiemChot = DateTime.Now,
            TrangThai = "NHAP",
            GhiChu = note,
            IsReadOnly = false,
            Lines = lines
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
                .ThenInclude(pdc => pdc!.MaNvduyetNavigation)
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
                DonGia = ct.DonGia > 0 ? ct.DonGia : ((ct.MaHangNavigation != null && ct.MaHangNavigation.GiaVon > 0) ? ct.MaHangNavigation.GiaVon : (ct.MaHangNavigation?.GiaBanThamKhao ?? 0))
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
        return View("Edit", model);
    }

    // GET: PhieuKiemKe/Details/5
    public async Task<IActionResult> Details(int id)
    {
        var pkk = await _context.PhieuKiemKes
            .Include(p => p.MaKhoNavigation)
            .Include(p => p.MaNvlapNavigation)
            .Include(p => p.PhieuDieuChinh)
                .ThenInclude(pdc => pdc!.MaNvduyetNavigation)
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
            DonGia = ct.DonGia > 0 ? ct.DonGia : ((ct.MaHangNavigation != null && ct.MaHangNavigation.GiaVon > 0) ? ct.MaHangNavigation.GiaVon : (ct.MaHangNavigation?.GiaBanThamKhao ?? 0))
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
            PhieuKiemKe? pkk;
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

                pkk.ThoiDiemChot = req.ThoiDiemChot == default ? DateTime.Now : (req.ThoiDiemChot.Kind == DateTimeKind.Utc ? req.ThoiDiemChot.ToLocalTime() : req.ThoiDiemChot);
                pkk.GhiChu = req.GhiChu;

                // Xóa chi tiết cũ và thêm lại
                _context.ChiTietPhieuKiemKes.RemoveRange(pkk.ChiTietPhieuKiemKes);
            }
            else
            {
                pkk = new PhieuKiemKe
                {
                    MaKho = req.MaKho,
                    MaNvlap = req.MaNvlap > 0 ? req.MaNvlap : CurrentNhanVienId,
                    ThoiDiemChot = req.ThoiDiemChot == default ? DateTime.Now : (req.ThoiDiemChot.Kind == DateTimeKind.Utc ? req.ThoiDiemChot.ToLocalTime() : req.ThoiDiemChot),
                    TrangThai = "NHAP",
                    GhiChu = req.GhiChu
                };
                _context.PhieuKiemKes.Add(pkk);
                await _context.SaveChangesAsync();
            }

            // Thêm chi tiết và đóng băng đơn giá chốt
            var hangIds = req.Lines.Select(l => l.MaHang).Distinct().ToList();
            var hangMap = await _context.HangHoas
                .Where(h => hangIds.Contains(h.MaHang))
                .ToDictionaryAsync(h => h.MaHang, h => h.GiaVon > 0 ? h.GiaVon : h.GiaBanThamKhao);

            foreach (var line in req.Lines)
            {
                decimal donGia = line.DonGia > 0 ? line.DonGia : (hangMap.TryGetValue(line.MaHang, out var g) ? g : 0m);
                var ct = new ChiTietPhieuKiemKe
                {
                    MaPhieuKiemKe = pkk.MaPhieuKiemKe,
                    MaHang = line.MaHang,
                    SoLuongTheoSo = line.SoLuongTheoSo,
                    SoLuongThucTe = line.SoLuongThucTe,
                    DonGia = donGia
                };
                _context.ChiTietPhieuKiemKes.Add(ct);
            }

            await _context.SaveChangesAsync();
            await trans.CommitAsync();

            return Ok(new
            {
                success = true,
                id = pkk.MaPhieuKiemKe,
                code = MaChungTuHelper.FormatMaKiemKe(pkk.MaPhieuKiemKe),
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
            PhieuKiemKe? pkk;
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

                pkk.ThoiDiemChot = req.ThoiDiemChot == default ? DateTime.Now : (req.ThoiDiemChot.Kind == DateTimeKind.Utc ? req.ThoiDiemChot.ToLocalTime() : req.ThoiDiemChot);
                pkk.GhiChu = req.GhiChu;
                pkk.TrangThai = "DA_DIEU_CHINH";

                _context.ChiTietPhieuKiemKes.RemoveRange(pkk.ChiTietPhieuKiemKes);
            }
            else
            {
                pkk = new PhieuKiemKe
                {
                    MaKho = req.MaKho,
                    MaNvlap = req.MaNvlap > 0 ? req.MaNvlap : CurrentNhanVienId,
                    ThoiDiemChot = req.ThoiDiemChot == default ? DateTime.Now : (req.ThoiDiemChot.Kind == DateTimeKind.Utc ? req.ThoiDiemChot.ToLocalTime() : req.ThoiDiemChot),
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

            var hangIds = req.Lines.Select(l => l.MaHang).Distinct().ToList();
            var hangMap = await _context.HangHoas
                .Where(h => hangIds.Contains(h.MaHang))
                .ToDictionaryAsync(h => h.MaHang, h => h.GiaVon > 0 ? h.GiaVon : h.GiaBanThamKhao);

            var createdDetails = new List<ChiTietPhieuKiemKe>();

            foreach (var line in req.Lines)
            {
                // Tồn kho sổ sách được chốt lại tại thời điểm cân bằng
                var currentSystemStock = stockMap.TryGetValue(line.MaHang, out var stock) ? stock : line.SoLuongTheoSo;
                decimal donGia = line.DonGia > 0 ? line.DonGia : (hangMap.TryGetValue(line.MaHang, out var g) ? g : 0m);

                var ct = new ChiTietPhieuKiemKe
                {
                    MaPhieuKiemKe = pkk.MaPhieuKiemKe,
                    MaHang = line.MaHang,
                    SoLuongTheoSo = currentSystemStock,
                    SoLuongThucTe = line.SoLuongThucTe,
                    DonGia = donGia
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
                    GhiChu = $"Cân bằng kho từ phiếu kiểm {MaChungTuHelper.FormatMaKiemKe(pkk.MaPhieuKiemKe)}"
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

            // Ghi nhật ký thao tác qua Service
            await _nhatKyService.GhiNhatKyAsync(
                CurrentUserId,
                "Cân bằng kho",
                "PhieuKiemKe",
                pkk.MaPhieuKiemKe.ToString(),
                $"Cân bằng kho #{pkk.MaPhieuKiemKe} tại Kho {pkk.MaKho}, số dòng: {createdDetails.Count}, dòng chênh lệch: {diffDetails.Count}");

            await trans.CommitAsync();

            return Ok(new
            {
                success = true,
                id = pkk.MaPhieuKiemKe,
                code = MaChungTuHelper.FormatMaKiemKe(pkk.MaPhieuKiemKe),
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

    // POST: PhieuKiemKe/HuyPhieu/5
    [HttpPost]
    public async Task<IActionResult> HuyPhieu(int id)
    {
        var pkk = await _context.PhieuKiemKes.FindAsync(id);
        if (pkk == null) return NotFound(new { success = false, message = "Không tìm thấy phiếu kiểm." });

        if (pkk.TrangThai == "DA_DIEU_CHINH")
        {
            return BadRequest(new { success = false, message = "Phiếu kiểm đã cân bằng kho không được phép hủy." });
        }

        if (pkk.TrangThai == "HUY")
        {
            return BadRequest(new { success = false, message = "Phiếu này đã được hủy trước đó." });
        }

        pkk.TrangThai = "HUY";
        await _context.SaveChangesAsync();

        await _nhatKyService.GhiNhatKyAsync(
            CurrentUserId,
            "Hủy phiếu kiểm",
            "PhieuKiemKe",
            id.ToString(),
            $"Hủy phiếu kiểm kho #{id}");

        return Ok(new { success = true, message = $"Đã hủy phiếu {MaChungTuHelper.FormatMaKiemKe(id)} thành công!" });
    }

    // POST: PhieuKiemKe/SaveNote
    [HttpPost]
    public async Task<IActionResult> SaveNote([FromBody] UpdateNoteRequest req)
    {
        if (req == null || req.MaPhieuKiemKe <= 0)
            return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ." });

        var pkk = await _context.PhieuKiemKes.FindAsync(req.MaPhieuKiemKe);
        if (pkk == null) return NotFound(new { success = false, message = "Không tìm thấy phiếu kiểm." });

        pkk.GhiChu = req.GhiChu?.Trim();
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Đã lưu ghi chú thành công." });
    }

    // GET: PhieuKiemKe/GetItemDetails/5
    [HttpGet]
    public async Task<IActionResult> GetItemDetails(int id)
    {
        var pkk = await _context.PhieuKiemKes
            .AsNoTracking()
            .Include(p => p.MaKhoNavigation)
            .Include(p => p.MaNvlapNavigation)
            .Include(p => p.PhieuDieuChinh)
                .ThenInclude(pdc => pdc!.MaNvduyetNavigation)
            .Include(p => p.ChiTietPhieuKiemKes)
                .ThenInclude(ct => ct.MaHangNavigation)
                    .ThenInclude(h => h.MaDvtNavigation)
            .FirstOrDefaultAsync(p => p.MaPhieuKiemKe == id);

        if (pkk == null) return NotFound(new { success = false, message = "Không tìm thấy phiếu kiểm." });

        var lines = pkk.ChiTietPhieuKiemKes.Select(ct => new
        {
            maHang = ct.MaHang,
            maHangNoiBo = ct.MaHangNavigation?.MaHangNoiBo ?? "",
            tenHang = ct.MaHangNavigation?.TenHang ?? "",
            tenDvt = ct.MaHangNavigation?.MaDvtNavigation?.TenDvt ?? "",
            soLuongTheoSo = ct.SoLuongTheoSo,
            soLuongThucTe = ct.SoLuongThucTe,
            donGia = ct.DonGia > 0 ? ct.DonGia : ((ct.MaHangNavigation != null && ct.MaHangNavigation.GiaVon > 0) ? ct.MaHangNavigation.GiaVon : (ct.MaHangNavigation?.GiaBanThamKhao ?? 0)),
            slChenhLech = ct.SoLuongThucTe.HasValue ? ct.SoLuongThucTe.Value - ct.SoLuongTheoSo : (decimal?)null,
            giaTriLech = ct.SoLuongThucTe.HasValue ? (ct.SoLuongThucTe.Value - ct.SoLuongTheoSo) * (ct.DonGia > 0 ? ct.DonGia : ((ct.MaHangNavigation != null && ct.MaHangNavigation.GiaVon > 0) ? ct.MaHangNavigation.GiaVon : (ct.MaHangNavigation?.GiaBanThamKhao ?? 0))) : (decimal?)null
        }).ToList();

        var tongThucTe = lines.Where(x => x.soLuongThucTe.HasValue).Sum(x => x.soLuongThucTe!.Value);
        var slLechTang = lines.Where(x => x.slChenhLech.HasValue && x.slChenhLech.Value > 0).Sum(x => x.slChenhLech!.Value);
        var slLechGiam = lines.Where(x => x.slChenhLech.HasValue && x.slChenhLech.Value < 0).Sum(x => -x.slChenhLech!.Value);
        var tongChenhLech = lines.Where(x => x.slChenhLech.HasValue).Sum(x => x.slChenhLech!.Value);
        var tongGiaTriLech = lines.Where(x => x.giaTriLech.HasValue).Sum(x => x.giaTriLech!.Value);

        return Ok(new
        {
            success = true,
            data = new
            {
                maPhieuKiemKe = pkk.MaPhieuKiemKe,
                maPhieuHienThi = MaChungTuHelper.FormatMaKiemKe(pkk.MaPhieuKiemKe),
                thoiDiemChot = pkk.ThoiDiemChot.ToString("dd/MM/yyyy HH:mm"),
                trangThai = pkk.TrangThai,
                tenTrangThai = pkk.TrangThai switch { "NHAP" => "Phiếu tạm", "DA_DIEU_CHINH" => "Đã cân bằng kho", "HUY" => "Đã hủy", _ => pkk.TrangThai },
                tenKho = pkk.MaKhoNavigation?.TenKho ?? $"Kho {pkk.MaKho}",
                tenNguoiLap = pkk.MaNvlapNavigation?.HoTen ?? $"NV {pkk.MaNvlap}",
                ngayCanBang = pkk.PhieuDieuChinh?.NgayDuyet?.ToString("dd/MM/yyyy HH:mm"),
                tenNguoiCanBang = pkk.PhieuDieuChinh?.MaNvduyetNavigation?.HoTen,
                ghiChu = pkk.GhiChu ?? "",
                tongThucTe,
                slLechTang,
                slLechGiam,
                tongChenhLech,
                tongGiaTriLech,
                lines
            }
        });
    }

    // GET: PhieuKiemKe/Export?type=list|detail
    [HttpGet]
    public async Task<IActionResult> Export(string type, PhieuKiemKeFilterVM filter)
    {
        filter.PageSize = 10000;
        var model = await BuildIndexViewModel(filter);

        var csv = new System.Text.StringBuilder();
        csv.AppendLine("\uFEFF"); // UTF-8 BOM

        if (type == "detail")
        {
            csv.AppendLine("Mã kiểm kho,Mã hàng,Tên hàng,Tồn kho,Thực tế,SL lệch,Giá trị lệch");
            foreach (var item in model.Items)
            {
                foreach (var line in item.Lines)
                {
                    var diff = line.SlChenhLech;
                    var valDiff = line.GiaTriLech;
                    csv.AppendLine($"\"{item.MaPhieuHienThi}\",\"{line.MaHangNoiBo}\",\"{line.TenHang.Replace("\"", "\"\"")}\",{line.SoLuongTheoSo},{(line.SoLuongThucTe.HasValue ? line.SoLuongThucTe.Value.ToString() : "")},{(diff.HasValue ? diff.Value.ToString() : "")},{(valDiff.HasValue ? valDiff.Value.ToString() : "")}");
                }
            }
            return File(System.Text.Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"ChiTietKiemKho_{DateTime.Now:yyyyMMdd_HHmm}.csv");
        }
        else
        {
            csv.AppendLine("Mã kiểm kho,Thời gian,Tổng thực tế,Tổng chênh lệch,SL lệch tăng,SL lệch giảm,Ngày cân bằng,SL thực tế,Ghi chú,Trạng thái,Kho");
            foreach (var item in model.Items)
            {
                csv.AppendLine($"\"{item.MaPhieuHienThi}\",\"{item.ThoiDiemChot:dd/MM/yyyy HH:mm}\",{item.TongThucTe},{item.TongChenhLech},{item.SlLechTang},{item.SlLechGiam},\"{(item.NgayCanBang.HasValue ? item.NgayCanBang.Value.ToString("dd/MM/yyyy HH:mm") : "")}\",{item.TongThucTe},\"{item.GhiChu?.Replace("\"", "\"\"")}\",\"{item.TenTrangThai}\",\"{item.TenKho}\"");
            }
            return File(System.Text.Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"DanhSachKiemKho_{DateTime.Now:yyyyMMdd_HHmm}.csv");
        }
    }
}

