using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using BTL_LTW_QuanLiKho_2.Models;
using BTL_LTW_QuanLiKho_2.ViewModels;

namespace BTL_LTW_QuanLiKho_2.Controllers;

public class HangHoasController : Controller
{
    private readonly QuanLyKhoPhuQuocLtwContext _context;

    public HangHoasController(QuanLyKhoPhuQuocLtwContext context)
    {
        _context = context;
    }

    private int GetCurrentWarehouseId()
    {
        var whId = HttpContext.Session.GetInt32("CurrentWarehouseId");
        if (whId.HasValue && whId.Value > 0) return whId.Value;

        var firstWh = _context.Khos.FirstOrDefault(k => k.TrangThai == "HOAT_DONG");
        int defaultId = firstWh?.MaKho ?? 1;
        HttpContext.Session.SetInt32("CurrentWarehouseId", defaultId);
        return defaultId;
    }

    public async Task<IActionResult> Index(string? q, int? nhom, string? trangThai, string tonKhoFilter = "ALL", int page = 1)
    {
        var vm = await BuildIndexVM(q, nhom, trangThai, tonKhoFilter, page);
        return View(vm);
    }

    // AJAX Action trả về Partial View danh sách bảng
    public async Task<IActionResult> Filter(string? q, int? nhom, string? trangThai, string tonKhoFilter = "ALL", int page = 1)
    {
        var vm = await BuildIndexVM(q, nhom, trangThai, tonKhoFilter, page);
        return PartialView("_HangHoaTable", vm);
    }

    private async Task<HangHoaIndexVM> BuildIndexVM(string? q, int? nhom, string? trangThai, string tonKhoFilter, int page)
    {
        int whId = GetCurrentWarehouseId();
        var wh = await _context.Khos.FindAsync(whId);

        var query = _context.HangHoas.AsNoTracking()
            .Include(x => x.MaNhomNavigation)
            .Include(x => x.MaDvtNavigation)
            .Include(x => x.NguongTonKhos.Where(n => n.MaKho == whId))
            .AsQueryable();

        q = q?.Trim();
        if (!string.IsNullOrEmpty(q))
        {
            query = query.Where(x => x.TenHang.Contains(q) || x.MaHangNoiBo.Contains(q) || (x.QuyCach != null && x.QuyCach.Contains(q)));
        }

        if (nhom.HasValue && nhom.Value > 0)
        {
            query = query.Where(x => x.MaNhom == nhom.Value);
        }

        if (!string.IsNullOrEmpty(trangThai))
        {
            query = query.Where(x => x.TrangThai == trangThai);
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

        var rawList = await query.OrderBy(x => x.MaHangNoiBo).ToListAsync();

        var allItems = rawList.Select(x =>
        {
            decimal stock = tonKhoDict.TryGetValue(x.MaHang, out var s) ? s : 0;
            decimal cost = latestCosts.TryGetValue(x.MaHang, out var c) && c > 0 ? c : x.GiaBanThamKhao;
            var nguong = x.NguongTonKhos.FirstOrDefault();

            return new HangHoaItemVM
            {
                MaHang = x.MaHang,
                MaHangNoiBo = x.MaHangNoiBo,
                TenHang = x.TenHang,
                MaNhom = x.MaNhom,
                TenNhom = x.MaNhomNavigation?.TenNhom ?? "---",
                MaDvt = x.MaDvt,
                TenDvt = x.MaDvtNavigation?.TenDvt ?? "---",
                GiaBan = x.GiaBanThamKhao,
                GiaVon = cost,
                TonKho = stock,
                TonToiThieu = nguong?.TonToiThieu,
                QuyCach = x.QuyCach,
                TrangThai = x.TrangThai
            };
        }).ToList();

        // Lọc theo tồn kho
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

        const int pageSize = 15;
        int totalCount = allItems.Count;
        int totalPages = Math.Max(1, (int)Math.Ceiling(totalCount / (double)pageSize));
        page = Math.Clamp(page, 1, totalPages);

        var pagedItems = allItems.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        var nhomList = await _context.NhomHangs.AsNoTracking().OrderBy(x => x.TenNhom).ToListAsync();
        var dvtList = await _context.DonViTinhs.AsNoTracking().OrderBy(x => x.TenDvt).ToListAsync();

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
            NhomHangs = nhomList,
            DonViTinhs = dvtList
        };
    }

    // Lấy thông tin 1 hàng hóa qua JSON cho Modal Sửa
    [HttpGet]
    public async Task<IActionResult> GetItem(int id)
    {
        int whId = GetCurrentWarehouseId();
        var item = await _context.HangHoas
            .Include(x => x.NguongTonKhos.Where(n => n.MaKho == whId))
            .FirstOrDefaultAsync(x => x.MaHang == id);

        if (item == null) return NotFound(new { message = "Không tìm thấy hàng hóa." });

        decimal stock = await _context.VwTonKhoHienTais
            .Where(t => t.MaKho == whId && t.MaHang == id)
            .Select(t => t.SoLuongTon ?? 0)
            .FirstOrDefaultAsync();

        decimal cost = await _context.ChiTietPhieuNhaps
            .Where(c => c.MaHang == id)
            .OrderByDescending(c => c.MaCtphieuNhap)
            .Select(c => c.DonGiaNhap)
            .FirstOrDefaultAsync();

        if (cost == 0) cost = item.GiaBanThamKhao;

        var nguong = item.NguongTonKhos.FirstOrDefault();

        return Json(new
        {
            maHang = item.MaHang,
            maHangNoiBo = item.MaHangNoiBo,
            tenHang = item.TenHang,
            maNhom = item.MaNhom,
            maDvt = item.MaDvt,
            quyCach = item.QuyCach,
            giaBanThamKhao = item.GiaBanThamKhao,
            giaVon = cost,
            tonKhoBanDau = stock,
            tonToiThieu = nguong?.TonToiThieu ?? 0,
            trangThai = item.TrangThai
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
        _context.HangHoas.Add(item);
        await _context.SaveChangesAsync();

        int whId = GetCurrentWarehouseId();

        // Lưu ngưỡng tồn kho
        if (model.TonToiThieu.HasValue && model.TonToiThieu.Value > 0)
        {
            var nguong = new NguongTonKho
            {
                MaHang = item.MaHang,
                MaKho = whId,
                TonToiThieu = model.TonToiThieu.Value
            };
            _context.NguongTonKhos.Add(nguong);
            await _context.SaveChangesAsync();
        }

        // Tạo tồn kho ban đầu nếu có nhập số lượng > 0
        if (model.TonKhoBanDau.HasValue && model.TonKhoBanDau.Value > 0)
        {
            var firstNv = await _context.NhanViens.FirstOrDefaultAsync();
            int nvId = firstNv?.MaNv ?? 1;

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

        return Json(new { success = true, id = item.MaHang, message = $"Đã thêm hàng hóa {item.TenHang} thành công." });
    }

    [HttpPost]
    public async Task<IActionResult> Edit(int id, [FromBody] HangHoaForm model)
    {
        if (model == null || id != model.MaHang) return BadRequest(new { message = "Dữ liệu không khớp." });

        var item = await _context.HangHoas.FindAsync(id);
        if (item == null) return NotFound(new { message = "Không tìm thấy hàng hóa." });

        await ValidateAndPrepareForm(model);

        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(new { message = string.Join("; ", errors) });
        }

        Copy(model, item);
        await _context.SaveChangesAsync();

        int whId = GetCurrentWarehouseId();

        // Cập nhật ngưỡng tồn
        var nguong = await _context.NguongTonKhos.FirstOrDefaultAsync(n => n.MaHang == id && n.MaKho == whId);
        if (model.TonToiThieu.HasValue && model.TonToiThieu.Value > 0)
        {
            if (nguong == null)
            {
                nguong = new NguongTonKho { MaHang = id, MaKho = whId, TonToiThieu = model.TonToiThieu.Value };
                _context.NguongTonKhos.Add(nguong);
            }
            else
            {
                nguong.TonToiThieu = model.TonToiThieu.Value;
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

        // Xóa ngưỡng tồn nếu có
        var nguongs = await _context.NguongTonKhos.Where(x => x.MaHang == id).ToListAsync();
        _context.NguongTonKhos.RemoveRange(nguongs);

        _context.HangHoas.Remove(item);
        await _context.SaveChangesAsync();

        return Json(new { success = true, message = $"Đã xóa hàng hóa {item.TenHang} thành công." });
    }

    private async Task ValidateAndPrepareForm(HangHoaForm m)
    {
        m.TenHang = m.TenHang?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(m.TenHang))
        {
            ModelState.AddModelError("TenHang", "Tên hàng hóa không được để trống.");
        }

        // Tự động sinh mã hàng nếu chưa nhập
        if (string.IsNullOrWhiteSpace(m.MaHangNoiBo))
        {
            int maxId = await _context.HangHoas.MaxAsync(x => (int?)x.MaHang) ?? 0;
            m.MaHangNoiBo = "HH" + (maxId + 1).ToString("D6");
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
        x.TrangThai = m.TrangThai;
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
