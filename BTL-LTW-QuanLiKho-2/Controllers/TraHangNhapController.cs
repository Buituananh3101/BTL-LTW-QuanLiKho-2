using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using BTL_LTW_QuanLiKho_2.Models;
using BTL_LTW_QuanLiKho_2.Services;
using BTL_LTW_QuanLiKho_2.Helpers;
using BTL_LTW_QuanLiKho_2.ViewModels;
using BTL_LTW_QuanLiKho_2.ViewModels.Common;
using BTL_LTW_QuanLiKho_2.ViewModels.TraHangNhap;
using ClosedXML.Excel;

namespace BTL_LTW_QuanLiKho_2.Controllers;

[Authorize]
public class TraHangNhapController : BaseKhoController
{
    private readonly INhatKyThaoTacService _nhatKyService;
    private readonly ITonKhoService _tonKhoService;
    private readonly ILogger<TraHangNhapController> _logger;

    public TraHangNhapController(
        QuanLyKhoPhuQuocLtwContext context,
        INhatKyThaoTacService nhatKyService,
        ITonKhoService tonKhoService,
        ILogger<TraHangNhapController> logger) : base(context)
    {
        _nhatKyService = nhatKyService;
        _tonKhoService = tonKhoService;
        _logger = logger;
    }

    // 1. Màn hình danh sách Phiếu Trả Hàng Nhập
    [HttpGet]
    public async Task<IActionResult> Index(TraHangNhapFilterVM filter)
    {
        var model = await BuildIndexViewModel(filter);
        return View(model);
    }

    // 2. Lọc danh sách AJAX trả về PartialView bảng dữ liệu
    [HttpGet]
    public async Task<IActionResult> Filter(TraHangNhapFilterVM filter)
    {
        var model = await BuildIndexViewModel(filter);
        return PartialView("_TraHangNhapTable", model);
    }

    // 3. Đánh dấu sao yêu thích phiếu trả (toggle favorite)
    [AcceptVerbs("GET", "POST")]
    public async Task<IActionResult> ToggleFavorite(int id)
    {
        var item = await _context.PhieuTraHangNhaps.FindAsync(id);
        if (item == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy phiếu trả hàng nhập." });
        }

        item.DaDanhDau = !item.DaDanhDau;
        await _context.SaveChangesAsync();

        return Json(new { success = true, isFavorite = item.DaDanhDau, id = item.MaPhieuTraHang });
    }

    // 4. Sinh mã phiếu trả tự động (THN000001, THN000002...)
    [HttpGet]
    public async Task<IActionResult> GetNextCode()
    {
        var code = await SinhMaPhieuTuDongAsync();
        return Json(new { success = true, code });
    }

    // 5. Màn hình Tạo mới phiếu trả hàng nhập
    [HttpGet]
    public async Task<IActionResult> Create(int? copyId)
    {
        int whId = GetCurrentWarehouseId();
        var kho = await _context.Khos.FindAsync(whId);
        int currentNvId = CurrentNhanVienId;
        var nv = await _context.NhanViens.FindAsync(currentNvId);

        var vm = new TraHangNhapFormVM
        {
            MaKho = whId,
            TenKho = kho?.TenKho ?? "Kho chính",
            MaNvlap = currentNvId,
            TenNguoiLap = nv?.HoTen ?? User.Identity?.Name ?? "Nhân viên",
            MaNvtra = currentNvId,
            TenNguoiTra = nv?.HoTen ?? User.Identity?.Name ?? "Nhân viên",
            NgayLap = DateTime.Now,
            NgayTra = DateTime.Now,
            TrangThai = "NHAP"
        };

        if (copyId.HasValue && copyId.Value > 0)
        {
            var source = await _context.PhieuTraHangNhaps
                .Include(p => p.MaDonViCapHangNavigation)
                .Include(p => p.ChiTietPhieuTraHangNhaps)
                    .ThenInclude(ct => ct.MaHangNavigation)
                        .ThenInclude(h => h.MaDvtNavigation)
                .FirstOrDefaultAsync(p => p.MaPhieuTraHang == copyId.Value);

            if (source != null)
            {
                vm.MaDonViCapHang = source.MaDonViCapHang;
                vm.TenDonViCapHang = source.MaDonViCapHangNavigation?.TenDonVi;
                vm.MaNcc = source.MaDonViCapHangNavigation?.MaNcc;
                vm.DienThoaiNcc = source.MaDonViCapHangNavigation?.DienThoai;
                vm.GhiChu = source.GhiChu;
                vm.GiamGia = source.GiamGia;
                vm.DaThuNcc = source.DaThuNcc;

                var stockMap = await _context.VwTonKhoHienTais
                    .Where(s => s.MaKho == whId)
                    .ToDictionaryAsync(s => s.MaHang, s => s.SoLuongTon ?? 0);

                vm.Lines = source.ChiTietPhieuTraHangNhaps.Select(ct => new TraHangNhapLineVM
                {
                    MaHang = ct.MaHang,
                    MaHangNoiBo = ct.MaHangNavigation?.MaHangNoiBo ?? "",
                    TenHang = ct.MaHangNavigation?.TenHang ?? "",
                    TenDvt = ct.MaHangNavigation?.MaDvtNavigation?.TenDvt ?? "",
                    SoLuong = ct.SoLuong,
                    GiaVon = ct.GiaVon,
                    DonGiaTra = ct.DonGiaTra,
                    TonKho = stockMap.TryGetValue(ct.MaHang, out var ton) ? ton : 0,
                    GhiChu = ct.GhiChu
                }).ToList();

                vm.TongTienHang = vm.Lines.Sum(l => l.ThanhTien);
                vm.CanThuNcc = Math.Max(0, vm.TongTienHang - vm.GiamGia);
            }
        }

        await PopulateFormSelectLists(vm);
        return View(vm);
    }

    // 6. Màn hình Chỉnh sửa phiếu trả (Chỉ cho phép sửa phiếu tạm)
    [HttpGet]
    public async Task<IActionResult> Edit(int id)
    {
        var phieu = await _context.PhieuTraHangNhaps
            .Include(p => p.MaKhoNavigation)
            .Include(p => p.MaNvlapNavigation)
            .Include(p => p.MaNvtraNavigation)
            .Include(p => p.MaDonViCapHangNavigation)
            .Include(p => p.ChiTietPhieuTraHangNhaps)
                .ThenInclude(ct => ct.MaHangNavigation)
                    .ThenInclude(h => h.MaDvtNavigation)
            .FirstOrDefaultAsync(p => p.MaPhieuTraHang == id);

        if (phieu == null)
        {
            return NotFound();
        }

        if (phieu.TrangThai == "DA_TRA_HANG" || phieu.TrangThai == "HOAN_THANH" || phieu.TrangThai == "DA_HUY" || phieu.TrangThai == "HUY")
        {
            return RedirectToAction(nameof(Details), new { id });
        }

        var stockMap = await _context.VwTonKhoHienTais
            .Where(s => s.MaKho == phieu.MaKho)
            .ToDictionaryAsync(s => s.MaHang, s => s.SoLuongTon ?? 0);

        var vm = new TraHangNhapFormVM
        {
            MaPhieuTraHang = phieu.MaPhieuTraHang,
            MaPhieu = phieu.MaPhieu,
            MaKho = phieu.MaKho,
            TenKho = phieu.MaKhoNavigation?.TenKho ?? "",
            NgayLap = phieu.NgayLap,
            NgayTra = phieu.NgayTra,
            MaNvlap = phieu.MaNvlap,
            TenNguoiLap = phieu.MaNvlapNavigation?.HoTen ?? "",
            MaNvtra = phieu.MaNvtra,
            TenNguoiTra = phieu.MaNvtraNavigation?.HoTen ?? "",
            MaDonViCapHang = phieu.MaDonViCapHang,
            TenDonViCapHang = phieu.MaDonViCapHangNavigation?.TenDonVi,
            MaNcc = phieu.MaDonViCapHangNavigation?.MaNcc,
            DienThoaiNcc = phieu.MaDonViCapHangNavigation?.DienThoai,
            GhiChu = phieu.GhiChu,
            GiamGia = phieu.GiamGia,
            TongTienHang = phieu.TongTienHang,
            CanThuNcc = phieu.CanThuNcc,
            DaThuNcc = phieu.DaThuNcc,
            TrangThai = phieu.TrangThai,
            IsReadOnly = false,
            Lines = phieu.ChiTietPhieuTraHangNhaps.Select(ct => new TraHangNhapLineVM
            {
                MaHang = ct.MaHang,
                MaHangNoiBo = ct.MaHangNavigation?.MaHangNoiBo ?? "",
                TenHang = ct.MaHangNavigation?.TenHang ?? "",
                TenDvt = ct.MaHangNavigation?.MaDvtNavigation?.TenDvt ?? "",
                SoLuong = ct.SoLuong,
                GiaVon = ct.GiaVon,
                DonGiaTra = ct.DonGiaTra,
                TonKho = stockMap.TryGetValue(ct.MaHang, out var ton) ? ton : 0,
                GhiChu = ct.GhiChu
            }).ToList()
        };

        await PopulateFormSelectLists(vm);
        return View(vm);
    }

    // 7. Màn hình Chi tiết phiếu trả (Read-only)
    [HttpGet]
    public async Task<IActionResult> Details(int id)
    {
        var phieu = await _context.PhieuTraHangNhaps
            .Include(p => p.MaKhoNavigation)
            .Include(p => p.MaNvlapNavigation)
            .Include(p => p.MaNvtraNavigation)
            .Include(p => p.MaDonViCapHangNavigation)
            .Include(p => p.ChiTietPhieuTraHangNhaps)
                .ThenInclude(ct => ct.MaHangNavigation)
                    .ThenInclude(h => h.MaDvtNavigation)
            .FirstOrDefaultAsync(p => p.MaPhieuTraHang == id);

        if (phieu == null)
        {
            return NotFound();
        }

        var stockMap = await _context.VwTonKhoHienTais
            .Where(s => s.MaKho == phieu.MaKho)
            .ToDictionaryAsync(s => s.MaHang, s => s.SoLuongTon ?? 0);

        var vm = new TraHangNhapFormVM
        {
            MaPhieuTraHang = phieu.MaPhieuTraHang,
            MaPhieu = phieu.MaPhieu,
            MaKho = phieu.MaKho,
            TenKho = phieu.MaKhoNavigation?.TenKho ?? "",
            NgayLap = phieu.NgayLap,
            NgayTra = phieu.NgayTra,
            MaNvlap = phieu.MaNvlap,
            TenNguoiLap = phieu.MaNvlapNavigation?.HoTen ?? "",
            MaNvtra = phieu.MaNvtra,
            TenNguoiTra = phieu.MaNvtraNavigation?.HoTen ?? "",
            MaDonViCapHang = phieu.MaDonViCapHang,
            TenDonViCapHang = phieu.MaDonViCapHangNavigation?.TenDonVi,
            MaNcc = phieu.MaDonViCapHangNavigation?.MaNcc,
            DienThoaiNcc = phieu.MaDonViCapHangNavigation?.DienThoai,
            GhiChu = phieu.GhiChu,
            GiamGia = phieu.GiamGia,
            TongTienHang = phieu.TongTienHang,
            CanThuNcc = phieu.CanThuNcc,
            DaThuNcc = phieu.DaThuNcc,
            TrangThai = phieu.TrangThai,
            IsReadOnly = true,
            Lines = phieu.ChiTietPhieuTraHangNhaps.Select(ct => new TraHangNhapLineVM
            {
                MaHang = ct.MaHang,
                MaHangNoiBo = ct.MaHangNavigation?.MaHangNoiBo ?? "",
                TenHang = ct.MaHangNavigation?.TenHang ?? "",
                TenDvt = ct.MaHangNavigation?.MaDvtNavigation?.TenDvt ?? "",
                SoLuong = ct.SoLuong,
                GiaVon = ct.GiaVon,
                DonGiaTra = ct.DonGiaTra,
                TonKho = stockMap.TryGetValue(ct.MaHang, out var ton) ? ton : 0,
                GhiChu = ct.GhiChu
            }).ToList()
        };

        await PopulateFormSelectLists(vm);
        return View(vm);
    }

    // 8. Lưu phiếu trả hàng (POST JSON: "Lưu tạm" hoặc "Hoàn thành")
    [HttpPost]
    public async Task<IActionResult> Save([FromBody] SaveTraHangNhapRequest req)
    {
        if (req == null || req.Lines == null || req.Lines.Count == 0)
        {
            return BadRequest(new { success = false, message = "Vui lòng chọn ít nhất một mặt hàng cần trả!" });
        }

        if (req.Lines.Any(l => l.SoLuong <= 0))
        {
            return BadRequest(new { success = false, message = "Số lượng trả của từng mặt hàng phải lớn hơn 0!" });
        }

        int whId = req.MaKho.HasValue && req.MaKho.Value > 0 ? req.MaKho.Value : GetCurrentWarehouseId();
        int currentNvId = CurrentNhanVienId;
        bool isHoanThanh = string.Equals(req.ActionType, "HOAN_THANH", StringComparison.OrdinalIgnoreCase);

        // Quy tắc kiểm tra tồn kho khi Hoàn thành (Chặn âm kho)
        if (isHoanThanh)
        {
            var danhSachTra = req.Lines.Select(l => (l.MaHang, l.SoLuong));
            var (hopLeTon, thongBaoTon) = await _tonKhoService.KiemTraXuatKhoAsync(whId, danhSachTra);
            if (!hopLeTon)
            {
                return BadRequest(new { success = false, message = thongBaoTon });
            }
        }

        decimal tongTienHang = req.Lines.Sum(l => l.SoLuong * l.DonGiaTra);
        decimal giamGiaPhieu = Math.Max(0, req.GiamGia);
        decimal canThuNcc = Math.Max(0, tongTienHang - giamGiaPhieu);
        decimal daThuNcc = Math.Max(0, req.DaThuNcc);

        if (daThuNcc > canThuNcc)
        {
            return BadRequest(new { success = false, message = "Tiền NCC đã trả không được lớn hơn số tiền NCC cần trả!" });
        }

        // Nếu không chọn NCC thì bắt buộc NCC phải trả đủ (không có công nợ để bù trừ)
        if (!req.MaDonViCapHang.HasValue || req.MaDonViCapHang.Value <= 0)
        {
            if (daThuNcc < canThuNcc)
            {
                return BadRequest(new { success = false, message = "Chưa chọn nhà cung cấp thì NCC phải thanh toán đủ (không thể ghi nhận công nợ bù trừ)." });
            }
        }

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            PhieuTraHangNhap? phieu = null;

            if (req.MaPhieuTraHang > 0)
            {
                phieu = await _context.PhieuTraHangNhaps
                    .Include(p => p.ChiTietPhieuTraHangNhaps)
                    .FirstOrDefaultAsync(p => p.MaPhieuTraHang == req.MaPhieuTraHang);

                if (phieu == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy phiếu trả hàng cần sửa." });
                }

                if (phieu.TrangThai == "DA_TRA_HANG" || phieu.TrangThai == "HOAN_THANH" || phieu.TrangThai == "DA_HUY" || phieu.TrangThai == "HUY")
                {
                    return BadRequest(new { success = false, message = "Không thể chỉnh sửa phiếu trả hàng đã hoàn thành hoặc đã hủy." });
                }

                _context.ChiTietPhieuTraHangNhaps.RemoveRange(phieu.ChiTietPhieuTraHangNhaps);
            }
            else
            {
                phieu = new PhieuTraHangNhap();
                phieu.NgayLap = DateTime.Now;
                phieu.MaNvlap = currentNvId;
                _context.PhieuTraHangNhaps.Add(phieu);
            }

            string maPhieu = (req.MaPhieu ?? "").Trim().ToUpper();
            if (string.IsNullOrEmpty(maPhieu))
            {
                maPhieu = await SinhMaPhieuTuDongAsync();
            }
            else
            {
                bool isTrungMa = await _context.PhieuTraHangNhaps.AnyAsync(p => p.MaPhieu == maPhieu && p.MaPhieuTraHang != req.MaPhieuTraHang);
                if (isTrungMa)
                {
                    return BadRequest(new { success = false, message = $"Mã phiếu trả \"{maPhieu}\" đã tồn tại trên hệ thống!" });
                }
            }

            phieu.MaPhieu = maPhieu;
            phieu.MaKho = whId;
            phieu.NgayTra = req.NgayTra.HasValue
                ? (req.NgayTra.Value.Kind == DateTimeKind.Utc ? req.NgayTra.Value.ToLocalTime() : req.NgayTra.Value)
                : DateTime.Now;
            phieu.MaNvtra = req.MaNvtra.HasValue && req.MaNvtra.Value > 0 ? req.MaNvtra.Value : currentNvId;
            phieu.MaDonViCapHang = req.MaDonViCapHang > 0 ? req.MaDonViCapHang : null;
            phieu.GhiChu = string.IsNullOrWhiteSpace(req.GhiChu) ? null : req.GhiChu.Trim();
            phieu.TongSoLuong = req.Lines.Sum(l => l.SoLuong);
            phieu.TongTienHang = tongTienHang;
            phieu.GiamGia = giamGiaPhieu;
            phieu.CanThuNcc = canThuNcc;
            phieu.DaThuNcc = daThuNcc;
            phieu.TrangThai = isHoanThanh ? "DA_TRA_HANG" : "NHAP";

            await _context.SaveChangesAsync();

            // Thêm chi tiết
            foreach (var l in req.Lines)
            {
                var ct = new ChiTietPhieuTraHangNhap
                {
                    MaPhieuTraHang = phieu.MaPhieuTraHang,
                    MaHang = l.MaHang,
                    SoLuong = l.SoLuong,
                    GiaVon = l.GiaVon,
                    DonGiaTra = l.DonGiaTra,
                    ThanhTien = l.SoLuong * l.DonGiaTra,
                    GhiChu = l.GhiChu
                };
                _context.ChiTietPhieuTraHangNhaps.Add(ct);
            }

            await _context.SaveChangesAsync();

            // Ghi nhật ký thao tác
            string hanhDong = isHoanThanh ? "HOAN_THANH_PHIEU_TRA_HANG" : (req.MaPhieuTraHang > 0 ? "CAP_NHAT_PHIEU_TRA_HANG" : "TAO_PHIEU_TRA_HANG");
            string noiDungLog = $"{(isHoanThanh ? "Hoàn thành" : "Lưu")} phiếu trả hàng nhập #{phieu.MaPhieu} ({phieu.TongSoLuong} SP, {canThuNcc:N0} đ)";
            await _nhatKyService.GhiNhatKyAsync(CurrentUserId, hanhDong, "PhieuTraHangNhap", phieu.MaPhieuTraHang.ToString(), noiDungLog);

            await trans.CommitAsync();

            return Ok(new
            {
                success = true,
                message = isHoanThanh ? $"Hoàn thành phiếu trả {phieu.MaPhieu} thành công!" : $"Đã lưu tạm phiếu {phieu.MaPhieu}.",
                id = phieu.MaPhieuTraHang,
                code = phieu.MaPhieu,
                isCompleted = isHoanThanh
            });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            _logger.LogError(ex, "Lỗi khi lưu phiếu trả hàng nhập: {Message}", ex.Message);
            return StatusCode(500, new { success = false, message = "Có lỗi xảy ra trong quá trình lưu phiếu: " + ex.Message });
        }
    }

    // 9. Cập nhật nhanh Ghi chú, Người trả, Ngày trả từ Drawer chi tiết
    [HttpPost]
    public async Task<IActionResult> QuickUpdateNote([FromBody] QuickUpdateTraHangNoteRequest req)
    {
        if (req == null || req.MaPhieuTraHang <= 0)
        {
            return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ." });
        }

        var phieu = await _context.PhieuTraHangNhaps.FindAsync(req.MaPhieuTraHang);
        if (phieu == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy phiếu trả hàng." });
        }

        if (phieu.TrangThai == "DA_HUY" || phieu.TrangThai == "HUY")
        {
            return BadRequest(new { success = false, message = "Không thể chỉnh sửa phiếu đã hủy." });
        }

        phieu.GhiChu = string.IsNullOrWhiteSpace(req.GhiChu) ? null : req.GhiChu.Trim();
        if (req.MaNvtra.HasValue && req.MaNvtra.Value > 0)
        {
            phieu.MaNvtra = req.MaNvtra.Value;
        }
        if (req.NgayTra.HasValue)
        {
            phieu.NgayTra = req.NgayTra.Value.Kind == DateTimeKind.Utc ? req.NgayTra.Value.ToLocalTime() : req.NgayTra.Value;
        }

        await _context.SaveChangesAsync();
        await _nhatKyService.GhiNhatKyAsync(CurrentUserId, "CAP_NHAT_GHI_CHU", "PhieuTraHangNhap", phieu.MaPhieuTraHang.ToString(), $"Cập nhật thông tin phiếu #{phieu.MaPhieu}");

        return Json(new { success = true, message = $"Đã cập nhật thông tin phiếu {phieu.MaPhieu}." });
    }

    // 10. Hủy phiếu trả hàng (Phiếu tạm hoặc Phiếu đã hoàn thành)
    [HttpPost]
    public async Task<IActionResult> Cancel(int id)
    {
        var phieu = await _context.PhieuTraHangNhaps
            .Include(p => p.ChiTietPhieuTraHangNhaps)
            .FirstOrDefaultAsync(p => p.MaPhieuTraHang == id);

        if (phieu == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy phiếu trả hàng cần hủy." });
        }

        if (phieu.TrangThai == "DA_HUY" || phieu.TrangThai == "HUY")
        {
            return BadRequest(new { success = false, message = "Phiếu trả hàng này đã ở trạng thái hủy." });
        }

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            string trangThaiCu = phieu.TrangThai;
            phieu.TrangThai = "HUY";
            await _context.SaveChangesAsync();

            string noiDungLog = $"Hủy phiếu trả hàng #{phieu.MaPhieu} (Trạng thái cũ: {trangThaiCu})";
            await _nhatKyService.GhiNhatKyAsync(CurrentUserId, "HUY_PHIEU_TRA_HANG", "PhieuTraHangNhap", phieu.MaPhieuTraHang.ToString(), noiDungLog);

            await trans.CommitAsync();

            return Json(new { success = true, message = $"Đã hủy phiếu {phieu.MaPhieu} thành công. Tồn kho và công nợ đã được hoàn lại." });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            _logger.LogError(ex, "Lỗi khi hủy phiếu trả hàng #{Id}: {Message}", id, ex.Message);
            return StatusCode(500, new { success = false, message = "Lỗi khi hủy phiếu: " + ex.Message });
        }
    }

    // 11. API Tìm kiếm hàng hóa phục vụ F3 Autocomplete
    [HttpGet]
    public async Task<IActionResult> SearchProduct(string q, int? warehouseId)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return Json(new List<object>());
        }

        q = q.Trim().ToLower();
        int whId = warehouseId.HasValue && warehouseId.Value > 0 ? warehouseId.Value : GetCurrentWarehouseId();

        var query = _context.HangHoas
            .AsNoTracking()
            .Include(h => h.MaDvtNavigation)
            .Where(h => h.TrangThai == "DANG_BAN" &&
                       (h.TenHang.ToLower().Contains(q) ||
                        h.MaHangNoiBo.ToLower().Contains(q)));

        var products = await query.Take(10).ToListAsync();
        var productIds = products.Select(p => p.MaHang).ToList();

        var stockMap = await _context.VwTonKhoHienTais
            .Where(s => s.MaKho == whId && productIds.Contains(s.MaHang))
            .ToDictionaryAsync(s => s.MaHang, s => s.SoLuongTon ?? 0);

        var result = products.Select(p => new
        {
            id = p.MaHang,
            code = p.MaHangNoiBo,
            name = p.TenHang,
            unit = p.MaDvtNavigation?.TenDvt ?? "Cái",
            cost = p.GiaVon,
            price = p.GiaBanThamKhao,
            stock = stockMap.TryGetValue(p.MaHang, out var ton) ? ton : 0
        });

        return Json(result);
    }

    // 12. API Tìm kiếm Nhà cung cấp phục vụ autocomplete
    [HttpGet]
    public async Task<IActionResult> SearchSupplier(string q)
    {
        var query = _context.DonViCapHangs
            .AsNoTracking()
            .Where(d => d.TrangThai == "HOAT_DONG");

        if (!string.IsNullOrWhiteSpace(q))
        {
            q = q.Trim().ToLower();
            query = query.Where(d => d.TenDonVi.ToLower().Contains(q) ||
                                    (d.MaNcc != null && d.MaNcc.ToLower().Contains(q)) ||
                                    (d.DienThoai != null && d.DienThoai.Contains(q)));
        }

        var suppliers = await query.Take(8).ToListAsync();

        var result = suppliers.Select(s => new
        {
            id = s.MaDonViCapHang,
            code = s.MaNcc ?? $"NCC{s.MaDonViCapHang:D4}",
            name = s.TenDonVi,
            phone = s.DienThoai ?? "",
            debt = 0m // Hệ thống tính động
        });

        return Json(result);
    }

    // 13. Tải file CSV mẫu (MauTraHangNhap.csv)
    [HttpGet]
    public IActionResult DownloadTemplate()
    {
        var csv = "\uFEFFMã hàng,Số lượng,Giá trả lại\r\nSP000001,2,53000\r\nSP000002,1,44000\r\n";
        byte[] bytes = Encoding.UTF8.GetBytes(csv);
        return File(bytes, "text/csv;charset=utf-8", "MauTraHangNhap.csv");
    }

    // 14. Xuất file Excel danh sách phiếu trả
    [HttpGet]
    public async Task<IActionResult> ExportExcel(TraHangNhapFilterVM filter)
    {
        filter.Page = 1;
        filter.PageSize = 10000;
        var model = await BuildIndexViewModel(filter);

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("TraHangNhap");

        // Headers
        var headers = new[]
        {
            "Mã trả hàng nhập", "Thời gian", "Nhà cung cấp", "Chi nhánh", "Người trả",
            "Người tạo", "Tổng số lượng", "Tổng tiền hàng", "Giảm giá", "NCC cần trả",
            "NCC đã trả", "Ghi chú", "Trạng thái"
        };

        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
            worksheet.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#E9F1FD");
        }

        int row = 2;
        foreach (var item in model.PagedData.Items)
        {
            worksheet.Cell(row, 1).Value = item.MaPhieuHienThi;
            worksheet.Cell(row, 2).Value = item.NgayTra.ToString("dd/MM/yyyy HH:mm");
            worksheet.Cell(row, 3).Value = item.TenNcc ?? "";
            worksheet.Cell(row, 4).Value = item.TenKho;
            worksheet.Cell(row, 5).Value = item.TenNguoiTra ?? "";
            worksheet.Cell(row, 6).Value = item.TenNguoiLap;
            worksheet.Cell(row, 7).Value = (double)item.TongSoLuong;
            worksheet.Cell(row, 8).Value = (double)item.TongTienHang;
            worksheet.Cell(row, 9).Value = (double)item.GiamGia;
            worksheet.Cell(row, 10).Value = (double)item.CanThuNcc;
            worksheet.Cell(row, 11).Value = (double)item.DaThuNcc;
            worksheet.Cell(row, 12).Value = item.GhiChu ?? "";
            worksheet.Cell(row, 13).Value = item.TenTrangThai;
            row++;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new System.IO.MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;

        string fileName = $"DanhSachTraHangNhap_{DateTime.Now:yyyyMMddHHmmss}.xlsx";
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    #region Private Helper Methods

    private async Task<TraHangNhapIndexVM> BuildIndexViewModel(TraHangNhapFilterVM filter)
    {
        int whId = GetCurrentWarehouseId();

        var query = _context.PhieuTraHangNhaps
            .AsNoTracking()
            .Include(p => p.MaKhoNavigation)
            .Include(p => p.MaNvlapNavigation)
            .Include(p => p.MaNvtraNavigation)
            .Include(p => p.MaDonViCapHangNavigation)
            .Include(p => p.ChiTietPhieuTraHangNhaps)
                .ThenInclude(ct => ct.MaHangNavigation)
                    .ThenInclude(h => h.MaDvtNavigation)
            .AsQueryable();

        // Lọc theo kho (Nếu chọn kho cụ thể khác 0)
        if (whId > 0)
        {
            query = query.Where(p => p.MaKho == whId);
        }

        // Lọc theo thời gian
        var (fromDate, toDate) = DateRangeHelper.Resolve(filter.DateFilterType, filter.FromDate, filter.ToDate);
        query = query.Where(p => p.NgayTra >= fromDate && p.NgayTra <= toDate);

        // Lọc theo trạng thái
        if (filter.Statuses != null && filter.Statuses.Count > 0)
        {
            query = query.Where(p => filter.Statuses.Contains(p.TrangThai));
        }

        // Lọc theo Nhà cung cấp
        if (filter.NccIds != null && filter.NccIds.Count > 0)
        {
            query = query.Where(p => p.MaDonViCapHang.HasValue && filter.NccIds.Contains(p.MaDonViCapHang.Value));
        }
        else if (filter.NccId.HasValue && filter.NccId.Value > 0)
        {
            query = query.Where(p => p.MaDonViCapHang == filter.NccId.Value);
        }

        // Lọc theo Người tạo
        if (filter.CreatorIds != null && filter.CreatorIds.Count > 0)
        {
            query = query.Where(p => filter.CreatorIds.Contains(p.MaNvlap));
        }
        else if (filter.CreatorId.HasValue && filter.CreatorId.Value > 0)
        {
            query = query.Where(p => p.MaNvlap == filter.CreatorId.Value);
        }

        // Lọc theo Người trả
        if (filter.PayerIds != null && filter.PayerIds.Count > 0)
        {
            query = query.Where(p => p.MaNvtra.HasValue && filter.PayerIds.Contains(p.MaNvtra.Value));
        }
        else if (filter.PayerId.HasValue && filter.PayerId.Value > 0)
        {
            query = query.Where(p => p.MaNvtra == filter.PayerId.Value);
        }

        // Lọc theo sao yêu thích
        if (filter.DaDanhDau)
        {
            query = query.Where(p => p.DaDanhDau);
        }

        // Tìm kiếm mã phiếu
        if (!string.IsNullOrWhiteSpace(filter.Q))
        {
            string q = filter.Q.Trim().ToLower();
            int searchId = 0;
            bool isNumber = int.TryParse(q, out searchId);

            int thnId = 0;
            bool isThnNumber = q.StartsWith("thn") && int.TryParse(q.Substring(3).TrimStart('0'), out thnId);

            query = query.Where(p => (p.MaPhieu != null && p.MaPhieu.ToLower().Contains(q)) ||
                                     (isNumber && p.MaPhieuTraHang == searchId) ||
                                     (isThnNumber && p.MaPhieuTraHang == thnId));
        }

        // Tìm kiếm nâng cao NCC
        if (!string.IsNullOrWhiteSpace(filter.AdvSup))
        {
            string qs = filter.AdvSup.Trim().ToLower();
            query = query.Where(p => p.MaDonViCapHangNavigation != null &&
                                    (p.MaDonViCapHangNavigation.TenDonVi.ToLower().Contains(qs) ||
                                     (p.MaDonViCapHangNavigation.MaNcc != null && p.MaDonViCapHangNavigation.MaNcc.ToLower().Contains(qs))));
        }

        // Tìm kiếm nâng cao Hàng hóa
        if (!string.IsNullOrWhiteSpace(filter.AdvProd))
        {
            string qp = filter.AdvProd.Trim().ToLower();
            query = query.Where(p => p.ChiTietPhieuTraHangNhaps.Any(ct =>
                (ct.MaHangNavigation != null && ct.MaHangNavigation.TenHang.ToLower().Contains(qp)) ||
                (ct.MaHangNavigation != null && ct.MaHangNavigation.MaHangNoiBo.ToLower().Contains(qp))));
        }

        // Thống kê tổng hợp (loại bỏ phiếu hủy để số liệu khớp thực tế)
        var liveQuery = query.Where(p => p.TrangThai != "HUY" && p.TrangThai != "DA_HUY");
        decimal tongSoLuong = await liveQuery.SumAsync(p => (decimal?)p.TongSoLuong) ?? 0m;
        decimal tongTienHang = await liveQuery.SumAsync(p => (decimal?)p.TongTienHang) ?? 0m;
        decimal tongGiamGia = await liveQuery.SumAsync(p => (decimal?)p.GiamGia) ?? 0m;
        decimal tongCanThu = await liveQuery.SumAsync(p => (decimal?)p.CanThuNcc) ?? 0m;
        decimal tongDaThu = await liveQuery.SumAsync(p => (decimal?)p.DaThuNcc) ?? 0m;

        // Sắp xếp
        query = (filter.SortBy?.ToLower(), filter.SortDir?.ToLower()) switch
        {
            ("ma", "asc") or ("maphieu", "asc") => query.OrderBy(p => p.MaPhieu ?? p.MaPhieuTraHang.ToString()),
            ("ma", "desc") or ("maphieu", "desc") => query.OrderByDescending(p => p.MaPhieu ?? p.MaPhieuTraHang.ToString()),

            ("tg", "asc") or ("ngaytra", "asc") => query.OrderBy(p => p.NgayTra),
            ("tg", "desc") or ("ngaytra", "desc") => query.OrderByDescending(p => p.NgayTra),

            ("tgtao", "asc") => query.OrderBy(p => p.NgayLap),
            ("tgtao", "desc") => query.OrderByDescending(p => p.NgayLap),

            ("ncc", "asc") or ("tenncc", "asc") => query.OrderBy(p => p.MaDonViCapHangNavigation != null ? p.MaDonViCapHangNavigation.TenDonVi : ""),
            ("ncc", "desc") or ("tenncc", "desc") => query.OrderByDescending(p => p.MaDonViCapHangNavigation != null ? p.MaDonViCapHangNavigation.TenDonVi : ""),

            ("chinhanh", "asc") => query.OrderBy(p => p.MaKhoNavigation.TenKho),
            ("chinhanh", "desc") => query.OrderByDescending(p => p.MaKhoNavigation.TenKho),

            ("nguoitra", "asc") => query.OrderBy(p => p.MaNvtraNavigation != null ? p.MaNvtraNavigation.HoTen : ""),
            ("nguoitra", "desc") => query.OrderByDescending(p => p.MaNvtraNavigation != null ? p.MaNvtraNavigation.HoTen : ""),

            ("nguoitao", "asc") => query.OrderBy(p => p.MaNvlapNavigation.HoTen),
            ("nguoitao", "desc") => query.OrderByDescending(p => p.MaNvlapNavigation.HoTen),

            ("tongsl", "asc") or ("tongsoluong", "asc") => query.OrderBy(p => p.TongSoLuong),
            ("tongsl", "desc") or ("tongsoluong", "desc") => query.OrderByDescending(p => p.TongSoLuong),

            ("slmathang", "asc") => query.OrderBy(p => p.ChiTietPhieuTraHangNhaps.Count),
            ("slmathang", "desc") => query.OrderByDescending(p => p.ChiTietPhieuTraHangNhaps.Count),

            ("tongtien", "asc") or ("tongtienhang", "asc") => query.OrderBy(p => p.TongTienHang),
            ("tongtien", "desc") or ("tongtienhang", "desc") => query.OrderByDescending(p => p.TongTienHang),

            ("giamgia", "asc") => query.OrderBy(p => p.GiamGia),
            ("giamgia", "desc") => query.OrderByDescending(p => p.GiamGia),

            ("canthu", "asc") or ("canthuncc", "asc") => query.OrderBy(p => p.CanThuNcc),
            ("canthu", "desc") or ("canthuncc", "desc") => query.OrderByDescending(p => p.CanThuNcc),

            ("dathu", "asc") or ("dathuncc", "asc") => query.OrderBy(p => p.DaThuNcc),
            ("dathu", "desc") or ("dathuncc", "desc") => query.OrderByDescending(p => p.DaThuNcc),

            ("ghi", "asc") => query.OrderBy(p => p.GhiChu ?? ""),
            ("ghi", "desc") => query.OrderByDescending(p => p.GhiChu ?? ""),

            ("st", "asc") or ("trangthai", "asc") => query.OrderBy(p => p.TrangThai),
            ("st", "desc") or ("trangthai", "desc") => query.OrderByDescending(p => p.TrangThai),

            _ => query.OrderByDescending(p => p.NgayTra).ThenByDescending(p => p.MaPhieuTraHang)
        };

        int totalItems = await query.CountAsync();
        int page = filter.Page < 1 ? 1 : filter.Page;
        int pageSize = filter.PageSize < 1 ? 15 : filter.PageSize;

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new TraHangNhapListItemVM
            {
                MaPhieuTraHang = p.MaPhieuTraHang,
                MaPhieu = p.MaPhieu,
                NgayLap = p.NgayLap,
                NgayTra = p.NgayTra,
                TrangThai = p.TrangThai,
                MaDonViCapHang = p.MaDonViCapHang,
                MaNcc = p.MaDonViCapHangNavigation != null ? p.MaDonViCapHangNavigation.MaNcc : null,
                TenNcc = p.MaDonViCapHangNavigation != null ? p.MaDonViCapHangNavigation.TenDonVi : null,
                MaKho = p.MaKho,
                TenKho = p.MaKhoNavigation.TenKho,
                MaNvlap = p.MaNvlap,
                TenNguoiLap = p.MaNvlapNavigation.HoTen,
                MaNvtra = p.MaNvtra,
                TenNguoiTra = p.MaNvtraNavigation != null ? p.MaNvtraNavigation.HoTen : null,
                GhiChu = p.GhiChu,
                TongSoLuong = p.TongSoLuong,
                TongTienHang = p.TongTienHang,
                GiamGia = p.GiamGia,
                CanThuNcc = p.CanThuNcc,
                DaThuNcc = p.DaThuNcc,
                DaDanhDau = p.DaDanhDau,
                Lines = p.ChiTietPhieuTraHangNhaps.Select(ct => new TraHangNhapLineVM
                {
                    MaHang = ct.MaHang,
                    MaHangNoiBo = ct.MaHangNavigation.MaHangNoiBo,
                    TenHang = ct.MaHangNavigation.TenHang,
                    TenDvt = ct.MaHangNavigation.MaDvtNavigation.TenDvt,
                    SoLuong = ct.SoLuong,
                    GiaVon = ct.GiaVon,
                    DonGiaTra = ct.DonGiaTra,
                    GhiChu = ct.GhiChu
                }).ToList()
            })
            .ToListAsync();

        var nhanViens = await _context.NhanViens
            .AsNoTracking()
            .OrderBy(nv => nv.HoTen)
            .Select(nv => new SelectListItem(nv.HoTen, nv.MaNv.ToString()))
            .ToListAsync();

        var nhaCungCaps = await _context.DonViCapHangs
            .AsNoTracking()
            .Where(ncc => ncc.TrangThai == "HOAT_DONG")
            .OrderBy(ncc => ncc.TenDonVi)
            .Select(ncc => new SelectListItem(ncc.TenDonVi, ncc.MaDonViCapHang.ToString()))
            .ToListAsync();

        return new TraHangNhapIndexVM
        {
            PagedData = new PagedResult<TraHangNhapListItemVM>
            {
                Items = items,
                PageIndex = page,
                PageSize = pageSize,
                TotalItems = totalItems
            },
            Filter = filter,
            TongSoLuong = tongSoLuong,
            TongTienHang = tongTienHang,
            TongGiamGia = tongGiamGia,
            TongCanThuNcc = tongCanThu,
            TongDaThuNcc = tongDaThu,
            NhanViens = nhanViens,
            NhaCungCaps = nhaCungCaps
        };
    }

    private async Task PopulateFormSelectLists(TraHangNhapFormVM vm)
    {
        vm.NhanViens = await _context.NhanViens
            .AsNoTracking()
            .OrderBy(nv => nv.HoTen)
            .Select(nv => new SelectListItem(nv.HoTen, nv.MaNv.ToString()))
            .ToListAsync();

        vm.NhaCungCaps = await _context.DonViCapHangs
            .AsNoTracking()
            .Where(ncc => ncc.TrangThai == "HOAT_DONG")
            .OrderBy(ncc => ncc.TenDonVi)
            .Select(ncc => new SelectListItem(ncc.TenDonVi, ncc.MaDonViCapHang.ToString()))
            .ToListAsync();

        vm.NhomNccList = await _context.NhomNhaCungCaps
            .AsNoTracking()
            .OrderBy(n => n.TenNhom)
            .ToListAsync();
    }

    private async Task<string> SinhMaPhieuTuDongAsync()
    {
        int maxId = 0;
        if (await _context.PhieuTraHangNhaps.AnyAsync())
        {
            maxId = await _context.PhieuTraHangNhaps.MaxAsync(p => p.MaPhieuTraHang);
        }

        string maMoi;
        int nextId = maxId + 1;
        do
        {
            maMoi = MaChungTuHelper.FormatMaTraHangNhap(nextId);
            nextId++;
        } while (await _context.PhieuTraHangNhaps.AnyAsync(p => p.MaPhieu == maMoi));

        return maMoi;
    }

    #endregion
}
