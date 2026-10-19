using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BTL_LTW_QuanLiKho_2.Models;
using BTL_LTW_QuanLiKho_2.ViewModels;
using BTL_LTW_QuanLiKho_2.Services;
using BTL_LTW_QuanLiKho_2.Helpers;
using ClosedXML.Excel;

namespace BTL_LTW_QuanLiKho_2.Controllers;

[Authorize]
public class XuatHuyController : BaseKhoController
{
    private readonly ITonKhoService _tonKhoService;
    private readonly INhatKyThaoTacService _nhatKyService;

    public XuatHuyController(
        QuanLyKhoPhuQuocLtwContext context,
        ITonKhoService tonKhoService,
        INhatKyThaoTacService nhatKyService) : base(context)
    {
        _tonKhoService = tonKhoService;
        _nhatKyService = nhatKyService;
    }

    private (DateTime fromDate, DateTime toDate) ResolveDateRange(string? filterType, DateTime? customFrom, DateTime? customTo)
    {
        return DateRangeHelper.Resolve(filterType, customFrom, customTo);
    }

    // GET: XuatHuy/Index
    public async Task<IActionResult> Index(XuatHuyFilterVM filter)
    {
        var model = await BuildIndexViewModel(filter);
        return View(model);
    }

    // GET: XuatHuy/Filter (AJAX Partial)
    public async Task<IActionResult> Filter(XuatHuyFilterVM filter)
    {
        var model = await BuildIndexViewModel(filter);
        return PartialView("_XuatHuyTable", model);
    }

    // GET: XuatHuy/GetNextCode
    [HttpGet]
    public async Task<IActionResult> GetNextCode()
    {
        var code = await SinhMaPhieuTuDongAsync();
        return Json(new { success = true, code });
    }

    private async Task<string> SinhMaPhieuTuDongAsync()
    {
        var existingCodes = await _context.PhieuXuats
            .Where(p => p.LoaiPhieuXuat == "XUAT_HUY" && p.MaPhieu != null && p.MaPhieu.StartsWith("XH"))
            .Select(p => p.MaPhieu!)
            .ToListAsync();

        int maxNum = 0;
        foreach (var code in existingCodes)
        {
            if (code.Length > 2 && int.TryParse(code[2..], out int num))
            {
                if (num > maxNum) maxNum = num;
            }
        }

        int maxId = await _context.PhieuXuats
            .Where(p => p.LoaiPhieuXuat == "XUAT_HUY")
            .MaxAsync(p => (int?)p.MaPhieuXuat) ?? 0;

        int nextNum = Math.Max(maxNum, maxId) + 1;
        return MaChungTuHelper.FormatMaXuatHuy(nextNum);
    }

    // AJAX Action Toggle Star / Favorite
    [AcceptVerbs("GET", "POST")]
    public async Task<IActionResult> ToggleFavorite(int id)
    {
        var item = await _context.PhieuXuats.FindAsync(id);
        if (item == null || item.LoaiPhieuXuat != "XUAT_HUY")
        {
            return NotFound(new { success = false, message = "Không tìm thấy phiếu xuất hủy." });
        }

        item.DaDanhDau = !item.DaDanhDau;
        await _context.SaveChangesAsync();

        return Json(new { success = true, isFavorite = item.DaDanhDau, maPhieuXuat = item.MaPhieuXuat });
    }

    private async Task<XuatHuyIndexVM> BuildIndexViewModel(XuatHuyFilterVM filter)
    {
        int currentWhId = GetCurrentWarehouseId();
        if (!filter.WarehouseId.HasValue || filter.WarehouseId.Value == 0)
        {
            filter.WarehouseId = currentWhId;
        }

        var (fromDate, toDate) = ResolveDateRange(filter.DateFilterType, filter.FromDate, filter.ToDate);
        filter.FromDate = fromDate;
        filter.ToDate = toDate;

        var query = _context.PhieuXuats
            .AsNoTracking()
            .Include(p => p.MaKhoNavigation)
            .Include(p => p.MaNvlapNavigation)
            .Include(p => p.MaNvxacNhanNavigation)
            .Include(p => p.ChiTietPhieuXuats)
                .ThenInclude(ct => ct.MaHangNavigation!)
                    .ThenInclude(h => h.MaDvtNavigation)
            .Where(p => p.LoaiPhieuXuat == "XUAT_HUY")
            .AsQueryable();

        // Lọc theo kho
        if (filter.WarehouseId.HasValue && filter.WarehouseId.Value > 0)
        {
            query = query.Where(p => p.MaKho == filter.WarehouseId.Value);
        }

        // Lọc theo ngày tạo
        query = query.Where(p => p.NgayLap >= fromDate && p.NgayLap <= toDate);

        // Lọc theo trạng thái
        if (filter.Statuses != null && filter.Statuses.Any())
        {
            query = query.Where(p => filter.Statuses.Contains(p.TrangThai));
        }

        // Lọc theo người tạo
        if (filter.CreatorIds != null && filter.CreatorIds.Any())
        {
            query = query.Where(p => filter.CreatorIds.Contains(p.MaNvlap));
        }

        // Lọc theo người xuất hủy (người xác nhận)
        if (filter.ConfirmerIds != null && filter.ConfirmerIds.Any())
        {
            query = query.Where(p => p.MaNvxacNhan.HasValue && filter.ConfirmerIds.Contains(p.MaNvxacNhan.Value));
        }

        // Lọc theo đánh dấu sao
        if (filter.DaDanhDau)
        {
            query = query.Where(p => p.DaDanhDau);
        }

        // Tìm kiếm mã hoặc ghi chú
        if (!string.IsNullOrWhiteSpace(filter.Q))
        {
            var q = filter.Q.Trim();
            if (int.TryParse(q.Replace("XH", "", StringComparison.OrdinalIgnoreCase).TrimStart('0'), out int searchId))
            {
                query = query.Where(p => p.MaPhieuXuat == searchId || (p.MaPhieu != null && p.MaPhieu.Contains(q)) || (p.GhiChu != null && p.GhiChu.Contains(q)));
            }
            else
            {
                query = query.Where(p => (p.MaPhieu != null && p.MaPhieu.Contains(q)) || (p.GhiChu != null && p.GhiChu.Contains(q)));
            }
        }

        var rawEntities = await query.ToListAsync();

        var allListItems = rawEntities.Select(p =>
        {
            var details = p.ChiTietPhieuXuats.ToList();
            var tongSoLuong = details.Sum(d => d.SoLuongXuat);
            var tongGiaTriHuy = details.Sum(d => d.SoLuongXuat * (d.DonGiaXuat > 0 ? d.DonGiaXuat : (d.MaHangNavigation?.GiaVon ?? 0)));

            var lines = details.Select(ct => new XuatHuyLineVM
            {
                MaHang = ct.MaHang,
                MaHangNoiBo = ct.MaHangNavigation?.MaHangNoiBo ?? "",
                TenHang = ct.MaHangNavigation?.TenHang ?? "",
                TenDvt = ct.MaHangNavigation?.MaDvtNavigation?.TenDvt ?? "",
                SoLuongXuat = ct.SoLuongXuat,
                DonGiaXuat = ct.DonGiaXuat > 0 ? ct.DonGiaXuat : (ct.MaHangNavigation?.GiaVon ?? 0)
            }).ToList();

            return new XuatHuyListItemVM
            {
                MaPhieuXuat = p.MaPhieuXuat,
                MaPhieu = p.MaPhieu,
                NgayLap = p.NgayLap,
                NgayXacNhan = p.NgayXacNhan,
                TrangThai = p.TrangThai,
                MaKho = p.MaKho,
                TenKho = p.MaKhoNavigation?.TenKho ?? $"Kho {p.MaKho}",
                MaNvlap = p.MaNvlap,
                TenNguoiLap = p.MaNvlapNavigation?.HoTen ?? $"NV {p.MaNvlap}",
                MaNvxacNhan = p.MaNvxacNhan,
                TenNguoiXacNhan = p.MaNvxacNhanNavigation?.HoTen ?? (p.MaNvxacNhan.HasValue ? $"NV {p.MaNvxacNhan}" : ""),
                GhiChu = p.GhiChu,
                TongSoLuong = tongSoLuong,
                TongGiaTriHuy = tongGiaTriHuy,
                DaDanhDau = p.DaDanhDau,
                Lines = lines
            };
        }).ToList();

        // Sắp xếp
        if (!string.IsNullOrWhiteSpace(filter.SortBy) && !string.IsNullOrWhiteSpace(filter.SortDir))
        {
            bool isAsc = string.Equals(filter.SortDir, "asc", StringComparison.OrdinalIgnoreCase);
            switch (filter.SortBy.Trim().ToLower())
            {
                case "ma":
                    allListItems = isAsc
                        ? allListItems.OrderBy(x => x.MaPhieuHienThi).ToList()
                        : allListItems.OrderByDescending(x => x.MaPhieuHienThi).ToList();
                    break;
                case "tg":
                    allListItems = isAsc
                        ? allListItems.OrderBy(x => x.NgayLap).ToList()
                        : allListItems.OrderByDescending(x => x.NgayLap).ToList();
                    break;
                case "kho":
                    allListItems = isAsc
                        ? allListItems.OrderBy(x => x.TenKho).ToList()
                        : allListItems.OrderByDescending(x => x.TenKho).ToList();
                    break;
                case "gt":
                    allListItems = isAsc
                        ? allListItems.OrderBy(x => x.TongGiaTriHuy).ToList()
                        : allListItems.OrderByDescending(x => x.TongGiaTriHuy).ToList();
                    break;
                case "sl":
                    allListItems = isAsc
                        ? allListItems.OrderBy(x => x.TongSoLuong).ToList()
                        : allListItems.OrderByDescending(x => x.TongSoLuong).ToList();
                    break;
                case "ghi":
                    allListItems = isAsc
                        ? allListItems.OrderBy(x => x.GhiChu ?? "").ToList()
                        : allListItems.OrderByDescending(x => x.GhiChu ?? "").ToList();
                    break;
                default:
                    allListItems = allListItems.OrderByDescending(x => x.NgayLap).ToList();
                    break;
            }
        }
        else
        {
            allListItems = allListItems.OrderByDescending(x => x.NgayLap).ToList();
        }

        int totalCount = allListItems.Count;
        int pageSize = filter.PageSize > 0 ? filter.PageSize : 15;
        int page = filter.Page > 0 ? filter.Page : 1;
        var pagedItems = allListItems.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        var warehouses = await _context.Khos
            .Where(k => k.TrangThai == "HOAT_DONG")
            .Select(k => new WarehouseItemVM { MaKho = k.MaKho, TenKho = k.TenKho })
            .ToListAsync();

        var currentWh = warehouses.FirstOrDefault(w => w.MaKho == filter.WarehouseId.Value);

        var creators = await _context.NhanViens
            .Select(nv => new CreatorItemVM { MaNv = nv.MaNv, TenNv = nv.HoTen })
            .ToListAsync();

        return new XuatHuyIndexVM
        {
            Filter = filter,
            Items = pagedItems,
            TotalCount = totalCount,
            CurrentWarehouseId = filter.WarehouseId.Value,
            CurrentWarehouseName = currentWh?.TenKho ?? $"Kho {filter.WarehouseId.Value}",
            Warehouses = warehouses,
            Creators = creators,
            Confirmers = creators,
            SortBy = filter.SortBy,
            SortDir = filter.SortDir
        };
    }

    // GET: XuatHuy/Create
    public async Task<IActionResult> Create(int? copyFromId)
    {
        int currentWhId = CurrentWarehouseId;
        var currentWh = await _context.Khos.FindAsync(currentWhId);
        var currentNv = await _context.NhanViens.FindAsync(CurrentNhanVienId);

        var nhanViens = await _context.NhanViens
            .Where(n => n.TrangThai == "DANG_LAM")
            .Select(n => new CreatorItemVM { MaNv = n.MaNv, TenNv = n.HoTen })
            .ToListAsync();

        var form = new XuatHuyFormVM
        {
            MaKho = currentWhId,
            TenKho = currentWh?.TenKho ?? $"Kho {currentWhId}",
            MaNvlap = CurrentNhanVienId,
            TenNguoiLap = currentNv?.HoTen ?? $"NV {CurrentNhanVienId}",
            MaNvxacNhan = CurrentNhanVienId,
            TenNguoiXacNhan = currentNv?.HoTen ?? $"NV {CurrentNhanVienId}",
            NgayLap = DateTime.Now,
            TrangThai = "NHAP",
            NhanViens = nhanViens
        };

        if (copyFromId.HasValue && copyFromId.Value > 0)
        {
            var old = await _context.PhieuXuats
                .Include(p => p.ChiTietPhieuXuats)
                    .ThenInclude(ct => ct.MaHangNavigation!)
                        .ThenInclude(h => h.MaDvtNavigation)
                .FirstOrDefaultAsync(p => p.MaPhieuXuat == copyFromId.Value && p.LoaiPhieuXuat == "XUAT_HUY");

            if (old != null)
            {
                form.GhiChu = old.GhiChu;
                var stockMap = await _context.VwTonKhoHienTais
                    .Where(s => s.MaKho == currentWhId)
                    .ToDictionaryAsync(s => s.MaHang, s => s.SoLuongTon ?? 0);

                form.Lines = old.ChiTietPhieuXuats.Select(ct => new XuatHuyLineVM
                {
                    MaHang = ct.MaHang,
                    MaHangNoiBo = ct.MaHangNavigation?.MaHangNoiBo ?? "",
                    TenHang = ct.MaHangNavigation?.TenHang ?? "",
                    TenDvt = ct.MaHangNavigation?.MaDvtNavigation?.TenDvt ?? "",
                    SoLuongXuat = ct.SoLuongXuat,
                    DonGiaXuat = ct.DonGiaXuat > 0 ? ct.DonGiaXuat : (ct.MaHangNavigation?.GiaVon ?? 0),
                    TonKho = stockMap.TryGetValue(ct.MaHang, out var ton) ? ton : 0
                }).ToList();
            }
        }

        return View(form);
    }

    // GET: XuatHuy/Edit/5
    public async Task<IActionResult> Edit(int id)
    {
        var phieu = await _context.PhieuXuats
            .Include(p => p.MaKhoNavigation)
            .Include(p => p.MaNvlapNavigation)
            .Include(p => p.MaNvxacNhanNavigation)
            .Include(p => p.ChiTietPhieuXuats)
                .ThenInclude(ct => ct.MaHangNavigation!)
                    .ThenInclude(h => h.MaDvtNavigation)
            .FirstOrDefaultAsync(p => p.MaPhieuXuat == id && p.LoaiPhieuXuat == "XUAT_HUY");

        if (phieu == null)
        {
            return NotFound("Không tìm thấy phiếu xuất hủy.");
        }

        // Nếu phiếu đã hoàn thành hoặc đã hủy -> chuyển sang trang Details chỉ đọc
        if (phieu.TrangThai != "NHAP")
        {
            return RedirectToAction(nameof(Details), new { id });
        }

        var nhanViens = await _context.NhanViens
            .Where(n => n.TrangThai == "DANG_LAM")
            .Select(n => new CreatorItemVM { MaNv = n.MaNv, TenNv = n.HoTen })
            .ToListAsync();

        var stockMap = await _context.VwTonKhoHienTais
            .Where(s => s.MaKho == phieu.MaKho)
            .ToDictionaryAsync(s => s.MaHang, s => s.SoLuongTon ?? 0);

        var form = new XuatHuyFormVM
        {
            MaPhieuXuat = phieu.MaPhieuXuat,
            MaPhieu = phieu.MaPhieu,
            MaKho = phieu.MaKho,
            TenKho = phieu.MaKhoNavigation?.TenKho ?? $"Kho {phieu.MaKho}",
            MaNvlap = phieu.MaNvlap,
            TenNguoiLap = phieu.MaNvlapNavigation?.HoTen ?? $"NV {phieu.MaNvlap}",
            MaNvxacNhan = phieu.MaNvxacNhan,
            TenNguoiXacNhan = phieu.MaNvxacNhanNavigation?.HoTen,
            NgayLap = phieu.NgayLap,
            NgayXacNhan = phieu.NgayXacNhan,
            TrangThai = phieu.TrangThai,
            GhiChu = phieu.GhiChu,
            IsReadOnly = phieu.TrangThai != "NHAP",
            NhanViens = nhanViens,
            Lines = phieu.ChiTietPhieuXuats.Select(ct => new XuatHuyLineVM
            {
                MaHang = ct.MaHang,
                MaHangNoiBo = ct.MaHangNavigation?.MaHangNoiBo ?? "",
                TenHang = ct.MaHangNavigation?.TenHang ?? "",
                TenDvt = ct.MaHangNavigation?.MaDvtNavigation?.TenDvt ?? "",
                SoLuongXuat = ct.SoLuongXuat,
                DonGiaXuat = ct.DonGiaXuat > 0 ? ct.DonGiaXuat : (ct.MaHangNavigation?.GiaVon ?? 0),
                TonKho = stockMap.TryGetValue(ct.MaHang, out var ton) ? ton : 0
            }).ToList()
        };

        return View(form);
    }

    // GET: XuatHuy/Details/5
    public async Task<IActionResult> Details(int id)
    {
        var phieu = await _context.PhieuXuats
            .Include(p => p.MaKhoNavigation)
            .Include(p => p.MaNvlapNavigation)
            .Include(p => p.MaNvxacNhanNavigation)
            .Include(p => p.ChiTietPhieuXuats)
                .ThenInclude(ct => ct.MaHangNavigation!)
                    .ThenInclude(h => h.MaDvtNavigation)
            .FirstOrDefaultAsync(p => p.MaPhieuXuat == id && p.LoaiPhieuXuat == "XUAT_HUY");

        if (phieu == null)
        {
            return NotFound("Không tìm thấy phiếu xuất hủy.");
        }

        var nhanViens = await _context.NhanViens
            .Where(n => n.TrangThai == "DANG_LAM")
            .Select(n => new CreatorItemVM { MaNv = n.MaNv, TenNv = n.HoTen })
            .ToListAsync();

        var stockMap = await _context.VwTonKhoHienTais
            .Where(s => s.MaKho == phieu.MaKho)
            .ToDictionaryAsync(s => s.MaHang, s => s.SoLuongTon ?? 0);

        var form = new XuatHuyFormVM
        {
            MaPhieuXuat = phieu.MaPhieuXuat,
            MaPhieu = phieu.MaPhieu,
            MaKho = phieu.MaKho,
            TenKho = phieu.MaKhoNavigation?.TenKho ?? $"Kho {phieu.MaKho}",
            MaNvlap = phieu.MaNvlap,
            TenNguoiLap = phieu.MaNvlapNavigation?.HoTen ?? $"NV {phieu.MaNvlap}",
            MaNvxacNhan = phieu.MaNvxacNhan,
            TenNguoiXacNhan = phieu.MaNvxacNhanNavigation?.HoTen,
            NgayLap = phieu.NgayLap,
            NgayXacNhan = phieu.NgayXacNhan,
            TrangThai = phieu.TrangThai,
            GhiChu = phieu.GhiChu,
            IsReadOnly = true,
            NhanViens = nhanViens,
            Lines = phieu.ChiTietPhieuXuats.Select(ct => new XuatHuyLineVM
            {
                MaHang = ct.MaHang,
                MaHangNoiBo = ct.MaHangNavigation?.MaHangNoiBo ?? "",
                TenHang = ct.MaHangNavigation?.TenHang ?? "",
                TenDvt = ct.MaHangNavigation?.MaDvtNavigation?.TenDvt ?? "",
                SoLuongXuat = ct.SoLuongXuat,
                DonGiaXuat = ct.DonGiaXuat > 0 ? ct.DonGiaXuat : (ct.MaHangNavigation?.GiaVon ?? 0),
                TonKho = stockMap.TryGetValue(ct.MaHang, out var ton) ? ton : 0
            }).ToList()
        };

        return View("Details", form);
    }

    // POST: XuatHuy/SaveDraft
    [HttpPost]
    public async Task<IActionResult> SaveDraft([FromBody] SaveXuatHuyRequest req)
    {
        if (req == null || req.Lines == null || !req.Lines.Any())
        {
            return BadRequest(new { success = false, message = "Phiếu xuất hủy phải có ít nhất một mặt hàng." });
        }

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            string? maPhieu = req.MaPhieu?.Trim();
            if (!string.IsNullOrWhiteSpace(maPhieu))
            {
                bool exists = await _context.PhieuXuats
                    .AnyAsync(p => p.MaPhieu == maPhieu && p.MaPhieuXuat != req.MaPhieuXuat);
                if (exists)
                {
                    return BadRequest(new { success = false, message = $"Mã xuất hủy \"{maPhieu}\" đã tồn tại trong hệ thống." });
                }
            }

            PhieuXuat? phieu;
            if (req.MaPhieuXuat > 0)
            {
                phieu = await _context.PhieuXuats
                    .Include(p => p.ChiTietPhieuXuats)
                    .FirstOrDefaultAsync(p => p.MaPhieuXuat == req.MaPhieuXuat);

                if (phieu == null) return NotFound(new { success = false, message = "Không tìm thấy phiếu cần sửa." });
                if (phieu.TrangThai != "NHAP")
                {
                    return BadRequest(new { success = false, message = "Chỉ có thể chỉnh sửa phiếu tạm." });
                }

                DateTime ngayLap = req.NgayLap == default ? DateTime.Now : (req.NgayLap.Kind == DateTimeKind.Utc ? req.NgayLap.ToLocalTime() : req.NgayLap);
                phieu.GhiChu = req.GhiChu?.Trim();
                phieu.NgayLap = ngayLap;
                phieu.MaNvxacNhan = req.MaNvxacNhan ?? CurrentNhanVienId;
                if (!string.IsNullOrWhiteSpace(maPhieu)) phieu.MaPhieu = maPhieu;

                _context.ChiTietPhieuXuats.RemoveRange(phieu.ChiTietPhieuXuats);
            }
            else
            {
                DateTime ngayLap = req.NgayLap == default ? DateTime.Now : (req.NgayLap.Kind == DateTimeKind.Utc ? req.NgayLap.ToLocalTime() : req.NgayLap);
                phieu = new PhieuXuat
                {
                    LoaiPhieuXuat = "XUAT_HUY",
                    TrangThai = "NHAP",
                    MaKho = req.MaKho > 0 ? req.MaKho : CurrentWarehouseId,
                    MaNvlap = CurrentNhanVienId,
                    MaNvxacNhan = req.MaNvxacNhan ?? CurrentNhanVienId,
                    NgayLap = ngayLap,
                    GhiChu = req.GhiChu?.Trim(),
                    MaPhieu = maPhieu
                };
                _context.PhieuXuats.Add(phieu);
                await _context.SaveChangesAsync(); // Sinh ID nếu chưa có

                if (string.IsNullOrWhiteSpace(phieu.MaPhieu))
                {
                    phieu.MaPhieu = MaChungTuHelper.FormatMaXuatHuy(phieu.MaPhieuXuat);
                }
            }

            foreach (var l in req.Lines.Where(x => x.MaHang > 0 && x.SoLuongXuat > 0))
            {
                phieu.ChiTietPhieuXuats.Add(new ChiTietPhieuXuat
                {
                    MaHang = l.MaHang,
                    SoLuongXuat = l.SoLuongXuat,
                    DonGiaXuat = l.DonGiaXuat
                });
            }

            await _context.SaveChangesAsync();
            await trans.CommitAsync();

            await _nhatKyService.GhiNhatKyAsync(
                CurrentUserId,
                "Lưu tạm xuất hủy",
                "PhieuXuat",
                phieu.MaPhieuXuat.ToString(),
                $"Lưu tạm phiếu xuất hủy #{phieu.MaPhieu}");

            return Ok(new
            {
                success = true,
                id = phieu.MaPhieuXuat,
                maPhieu = phieu.MaPhieu,
                message = "Đã lưu bản tạm phiếu xuất hủy thành công!"
            });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return StatusCode(500, new { success = false, message = "Lỗi khi lưu phiếu: " + ex.Message });
        }
    }

    // POST: XuatHuy/Complete
    [HttpPost]
    public async Task<IActionResult> Complete([FromBody] SaveXuatHuyRequest req)
    {
        if (req == null || req.Lines == null || !req.Lines.Any(x => x.MaHang > 0 && x.SoLuongXuat > 0))
        {
            return BadRequest(new { success = false, message = "Phiếu xuất hủy phải có ít nhất một mặt hàng với số lượng > 0." });
        }

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            string? maPhieu = req.MaPhieu?.Trim();
            if (!string.IsNullOrWhiteSpace(maPhieu))
            {
                bool exists = await _context.PhieuXuats
                    .AnyAsync(p => p.MaPhieu == maPhieu && p.MaPhieuXuat != req.MaPhieuXuat);
                if (exists)
                {
                    return BadRequest(new { success = false, message = $"Mã xuất hủy \"{maPhieu}\" đã tồn tại trong hệ thống." });
                }
            }

            PhieuXuat? phieu;
            if (req.MaPhieuXuat > 0)
            {
                phieu = await _context.PhieuXuats
                    .Include(p => p.ChiTietPhieuXuats)
                    .FirstOrDefaultAsync(p => p.MaPhieuXuat == req.MaPhieuXuat);

                if (phieu == null) return NotFound(new { success = false, message = "Không tìm thấy phiếu cần hoàn thành." });
                if (phieu.TrangThai != "NHAP")
                {
                    return BadRequest(new { success = false, message = "Phiếu này đã hoàn thành hoặc đã bị hủy trước đó." });
                }

                DateTime ngayLap = req.NgayLap == default ? DateTime.Now : (req.NgayLap.Kind == DateTimeKind.Utc ? req.NgayLap.ToLocalTime() : req.NgayLap);
                phieu.GhiChu = req.GhiChu?.Trim();
                phieu.NgayLap = ngayLap;
                phieu.NgayXacNhan = DateTime.Now;
                phieu.MaNvxacNhan = req.MaNvxacNhan ?? CurrentNhanVienId;
                phieu.TrangThai = "DA_XAC_NHAN";
                if (!string.IsNullOrWhiteSpace(maPhieu)) phieu.MaPhieu = maPhieu;

                _context.ChiTietPhieuXuats.RemoveRange(phieu.ChiTietPhieuXuats);
            }
            else
            {
                DateTime ngayLap = req.NgayLap == default ? DateTime.Now : (req.NgayLap.Kind == DateTimeKind.Utc ? req.NgayLap.ToLocalTime() : req.NgayLap);
                phieu = new PhieuXuat
                {
                    LoaiPhieuXuat = "XUAT_HUY",
                    TrangThai = "DA_XAC_NHAN",
                    MaKho = req.MaKho > 0 ? req.MaKho : CurrentWarehouseId,
                    MaNvlap = CurrentNhanVienId,
                    MaNvxacNhan = req.MaNvxacNhan ?? CurrentNhanVienId,
                    NgayLap = ngayLap,
                    NgayXacNhan = DateTime.Now,
                    GhiChu = req.GhiChu?.Trim(),
                    MaPhieu = maPhieu
                };
                _context.PhieuXuats.Add(phieu);
                await _context.SaveChangesAsync();

                if (string.IsNullOrWhiteSpace(phieu.MaPhieu))
                {
                    phieu.MaPhieu = MaChungTuHelper.FormatMaXuatHuy(phieu.MaPhieuXuat);
                }
            }

            foreach (var l in req.Lines.Where(x => x.MaHang > 0 && x.SoLuongXuat > 0))
            {
                phieu.ChiTietPhieuXuats.Add(new ChiTietPhieuXuat
                {
                    MaHang = l.MaHang,
                    SoLuongXuat = l.SoLuongXuat,
                    DonGiaXuat = l.DonGiaXuat
                });
            }

            await _context.SaveChangesAsync();
            await trans.CommitAsync();

            await _nhatKyService.GhiNhatKyAsync(
                CurrentUserId,
                "Hoàn thành xuất hủy",
                "PhieuXuat",
                phieu.MaPhieuXuat.ToString(),
                $"Hoàn thành phiếu xuất hủy #{phieu.MaPhieu}");

            return Ok(new
            {
                success = true,
                id = phieu.MaPhieuXuat,
                maPhieu = phieu.MaPhieu,
                message = "Phiếu xuất hủy đã hoàn thành! Tồn kho đã được trừ tương ứng."
            });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return StatusCode(500, new { success = false, message = "Lỗi khi hoàn thành phiếu: " + ex.Message });
        }
    }

    // POST: XuatHuy/Cancel/5
    [HttpPost]
    public async Task<IActionResult> Cancel(int id)
    {
        var phieu = await _context.PhieuXuats.FindAsync(id);
        if (phieu == null || phieu.LoaiPhieuXuat != "XUAT_HUY")
        {
            return NotFound(new { success = false, message = "Không tìm thấy phiếu xuất hủy." });
        }

        if (phieu.TrangThai == "HUY")
        {
            return BadRequest(new { success = false, message = "Phiếu này đã được hủy trước đó." });
        }

        phieu.TrangThai = "HUY";
        await _context.SaveChangesAsync();

        await _nhatKyService.GhiNhatKyAsync(
            CurrentUserId,
            "Hủy phiếu xuất hủy",
            "PhieuXuat",
            id.ToString(),
            $"Hủy phiếu xuất hủy #{phieu.MaPhieu ?? phieu.MaPhieuXuat.ToString()}");

        return Ok(new
        {
            success = true,
            message = $"Đã hủy phiếu xuất hủy {phieu.MaPhieu ?? MaChungTuHelper.FormatMaXuatHuy(id)} thành công!"
        });
    }

    // POST: XuatHuy/UpdateNote
    [HttpPost]
    public async Task<IActionResult> UpdateNote([FromBody] UpdateXuatHuyNoteRequest req)
    {
        if (req == null || req.MaPhieuXuat <= 0)
        {
            return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ." });
        }

        var phieu = await _context.PhieuXuats.FindAsync(req.MaPhieuXuat);
        if (phieu == null || phieu.LoaiPhieuXuat != "XUAT_HUY")
        {
            return NotFound(new { success = false, message = "Không tìm thấy phiếu xuất hủy." });
        }

        phieu.GhiChu = req.GhiChu?.Trim();
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Đã cập nhật ghi chú thành công." });
    }

    // GET: XuatHuy/SearchProducts
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

        var products = await query.Take(25).ToListAsync();

        var result = products.Select(h => new
        {
            maHang = h.MaHang,
            maHangNoiBo = h.MaHangNoiBo,
            tenHang = h.TenHang,
            tenDvt = h.MaDvtNavigation?.TenDvt ?? "",
            tenNhom = h.MaNhomNavigation?.TenNhom ?? "",
            giaVon = h.GiaVon > 0 ? h.GiaVon : h.GiaBanThamKhao,
            tonKho = stockMap.TryGetValue(h.MaHang, out var ton) ? ton : 0
        }).ToList();

        return Json(result);
    }

    // GET: XuatHuy/DownloadTemplate
    [HttpGet]
    public IActionResult DownloadTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("MauXuatHuy");

        var headers = new[] { "Mã hàng (*)", "Số lượng hủy (*)", "Giá vốn", "Ghi chú" };
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(1, i + 1).Value = headers[i];
        }

        ExcelHelper.ApplyKiotVietHeaderStyle(ws.Range(1, 1, 1, headers.Length));
        ws.Row(1).Height = 26;

        // Dữ liệu mẫu gợi ý cho người dùng
        ws.Cell(2, 1).Value = "HH000001";
        ws.Cell(2, 2).Value = 5;
        ws.Cell(2, 3).Value = 25000;
        ws.Cell(2, 4).Value = "Hàng móp méo";

        ws.Cell(3, 1).Value = "HH000002";
        ws.Cell(3, 2).Value = 2;
        ws.Cell(3, 3).Value = 50000;
        ws.Cell(3, 4).Value = "Hết hạn sử dụng";

        ExcelHelper.ApplyTableBorders(ws.Range(1, 1, 3, headers.Length));
        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return File(ms.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Mau_Xuat_Huy.xlsx");
    }

    // POST: XuatHuy/ImportExcel
    [HttpPost]
    public async Task<IActionResult> ImportExcel(IFormFile file, int warehouseId)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { success = false, message = "Vui lòng chọn file Excel để nhập." });
        }

        warehouseId = warehouseId > 0 ? warehouseId : CurrentWarehouseId;

        try
        {
            using var stream = file.OpenReadStream();
            using var workbook = new XLWorkbook(stream);
            var ws = workbook.Worksheets.FirstOrDefault();
            if (ws == null)
            {
                return BadRequest(new { success = false, message = "File Excel không có dữ liệu." });
            }

            var stockMap = await _context.VwTonKhoHienTais
                .Where(s => s.MaKho == warehouseId)
                .ToDictionaryAsync(s => s.MaHang, s => s.SoLuongTon ?? 0);

            var allHangHoa = await _context.HangHoas
                .Include(h => h.MaDvtNavigation)
                .ToDictionaryAsync(h => h.MaHangNoiBo.Trim().ToUpper(), h => h);

            var items = new List<object>();
            int lastRow = ws.LastRowUsed()?.RowNumber() ?? 0;

            for (int r = 2; r <= lastRow; r++)
            {
                string code = ws.Cell(r, 1).GetString().Trim();
                if (string.IsNullOrEmpty(code)) continue;

                if (!allHangHoa.TryGetValue(code.ToUpper(), out var hang))
                {
                    // Thử tìm theo ID nếu code dạng số
                    if (int.TryParse(code.Replace("HH", "", StringComparison.OrdinalIgnoreCase), out int hhId))
                    {
                        hang = await _context.HangHoas.Include(h => h.MaDvtNavigation).FirstOrDefaultAsync(h => h.MaHang == hhId);
                    }
                }

                if (hang == null) continue;

                decimal sl = 1;
                if (decimal.TryParse(ws.Cell(r, 2).GetString().Trim(), out var parsedSl) && parsedSl > 0)
                {
                    sl = parsedSl;
                }

                decimal gia = hang.GiaVon > 0 ? hang.GiaVon : hang.GiaBanThamKhao;
                if (decimal.TryParse(ws.Cell(r, 3).GetString().Trim(), out var parsedGia) && parsedGia >= 0)
                {
                    gia = parsedGia;
                }

                decimal ton = stockMap.TryGetValue(hang.MaHang, out var currentTon) ? currentTon : 0;

                items.Add(new
                {
                    maHang = hang.MaHang,
                    maHangNoiBo = hang.MaHangNoiBo,
                    tenHang = hang.TenHang,
                    tenDvt = hang.MaDvtNavigation?.TenDvt ?? "",
                    soLuongXuat = sl,
                    donGiaXuat = gia,
                    thanhTien = sl * gia,
                    tonKho = ton
                });
            }

            return Ok(new { success = true, items, count = items.Count });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = "Lỗi đọc file Excel: " + ex.Message });
        }
    }

    // GET: XuatHuy/Export
    [HttpGet]
    public async Task<IActionResult> Export(string? type, XuatHuyFilterVM filter, int? id = null)
    {
        if (id.HasValue && id.Value > 0)
        {
            filter.Q = null;
            filter.Statuses = new();
            filter.DateFilterType = "ALL";
            filter.WarehouseId = null;
        }

        filter.Page = 1;
        filter.PageSize = 10000;
        var model = await BuildIndexViewModel(filter);

        if (id.HasValue && id.Value > 0)
        {
            model.Items = model.Items.Where(p => p.MaPhieuXuat == id.Value).ToList();
        }

        bool isDetail = string.Equals(type, "detail", StringComparison.OrdinalIgnoreCase);

        // Mặc định xuất file Excel (.xlsx) chuẩn KiotViet bằng ClosedXML qua Lego ExcelHelper
        if (isDetail)
        {
            var detailRows = new List<(int Stt, XuatHuyListItemVM Item, XuatHuyLineVM? Line)>();
            int stt = 1;
            foreach (var item in model.Items)
            {
                if (item.Lines.Any())
                {
                    foreach (var line in item.Lines)
                    {
                        detailRows.Add((stt++, item, line));
                    }
                }
                else
                {
                    detailRows.Add((stt++, item, null));
                }
            }

            var bytes = ExcelHelper.Export("ChiTietXuatHuy", detailRows, col => col
                .AddCenter("STT", x => x.Stt)
                .AddCenter("Mã xuất hủy", x => x.Item.MaPhieuHienThi)
                .AddDateTime("Thời gian", x => x.Item.NgayLap)
                .AddText("Chi nhánh", x => x.Item.TenKho)
                .AddText("Người tạo", x => x.Item.TenNguoiLap)
                .AddText("Người xuất hủy", x => x.Item.TenNguoiXacNhan ?? "")
                .AddCenter("Trạng thái", x => x.Item.TenTrangThai)
                .AddCenter("Mã hàng", x => x.Line?.MaHangNoiBo ?? "")
                .AddText("Tên hàng", x => x.Line?.TenHang ?? "(Phiếu chưa có danh sách hàng)")
                .AddCenter("ĐVT", x => x.Line?.TenDvt ?? "")
                .AddNumber("Số lượng hủy", x => x.Line?.SoLuongXuat ?? 0)
                .AddCurrency("Đơn giá (Giá vốn)", x => x.Line?.DonGiaXuat ?? 0)
                .AddCurrency("Thành tiền (Giá trị hủy)", x => x.Line?.ThanhTien ?? 0)
                .AddText("Ghi chú", x => x.Item.GhiChu ?? "")
            );

            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"ChiTietXuatHuy_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
        }
        else
        {
            var summaryRows = model.Items.Select((item, idx) => (Stt: idx + 1, Item: item));
            var bytes = ExcelHelper.Export("DanhSachXuatHuy", summaryRows, col => col
                .AddCenter("STT", x => x.Stt)
                .AddCenter("Mã xuất hủy", x => x.Item.MaPhieuHienThi)
                .AddDateTime("Thời gian", x => x.Item.NgayLap)
                .AddText("Chi nhánh", x => x.Item.TenKho)
                .AddText("Người tạo", x => x.Item.TenNguoiLap)
                .AddText("Người xuất hủy", x => x.Item.TenNguoiXacNhan ?? "")
                .AddNumber("Tổng số lượng", x => x.Item.TongSoLuong)
                .AddCurrency("Tổng giá trị hủy", x => x.Item.TongGiaTriHuy)
                .AddCenter("Trạng thái", x => x.Item.TenTrangThai)
                .AddText("Ghi chú", x => x.Item.GhiChu ?? "")
            );

            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"DanhSachXuatHuy_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
        }
    }
}
