using System;
using System.Collections.Generic;
using System.Linq;
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
using BTL_LTW_QuanLiKho_2.ViewModels.NhapHang;
using ClosedXML.Excel;

namespace BTL_LTW_QuanLiKho_2.Controllers;

[Authorize]
public class NhapHangController : BaseKhoController
{
    private readonly INhatKyThaoTacService _nhatKyService;
    private readonly ILogger<NhapHangController> _logger;

    public NhapHangController(
        QuanLyKhoPhuQuocLtwContext context,
        INhatKyThaoTacService nhatKyService,
        ILogger<NhapHangController> logger) : base(context)
    {
        _nhatKyService = nhatKyService;
        _logger = logger;
    }

    // 1. Màn hình danh sách Phiếu Nhập Hàng
    [HttpGet]
    public async Task<IActionResult> Index(NhapHangFilterVM filter)
    {
        var model = await BuildIndexViewModel(filter);
        return View(model);
    }

    // 2. Lọc danh sách AJAX trả về PartialView bảng dữ liệu
    [HttpGet]
    public async Task<IActionResult> Filter(NhapHangFilterVM filter)
    {
        var model = await BuildIndexViewModel(filter);
        return PartialView("_NhapHangTable", model);
    }

    // 3. Đánh dấu sao yêu thích phiếu nhập (silent toggle)
    [AcceptVerbs("GET", "POST")]
    public async Task<IActionResult> ToggleFavorite(int id)
    {
        var item = await _context.PhieuNhaps.FindAsync(id);
        if (item == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy phiếu nhập hàng." });
        }

        item.DaDanhDau = !item.DaDanhDau;
        await _context.SaveChangesAsync();

        return Json(new { success = true, isFavorite = item.DaDanhDau, id = item.MaPhieuNhap });
    }

    // 4. Sinh mã phiếu nhập tự động (PN000001, PN000002...)
    [HttpGet]
    public async Task<IActionResult> GetNextCode()
    {
        var code = await SinhMaPhieuTuDongAsync();
        return Json(new { success = true, code });
    }

    // 5. Màn hình Tạo mới phiếu nhập
    [HttpGet]
    public async Task<IActionResult> Create(int? copyId)
    {
        int whId = GetCurrentWarehouseId();
        var kho = await _context.Khos.FindAsync(whId);
        int currentNvId = CurrentNhanVienId;
        var nv = await _context.NhanViens.FindAsync(currentNvId);

        var vm = new NhapHangFormVM
        {
            MaKho = whId,
            TenKho = kho?.TenKho ?? "Kho chính",
            MaNvlap = currentNvId,
            TenNguoiLap = nv?.HoTen ?? User.Identity?.Name ?? "Nhân viên",
            NgayLap = DateTime.Now,
            TrangThai = "NHAP"
        };

        if (copyId.HasValue && copyId.Value > 0)
        {
            var source = await _context.PhieuNhaps
                .Include(p => p.MaDonViCapHangNavigation)
                .Include(p => p.ChiTietPhieuNhaps)
                    .ThenInclude(ct => ct.MaHangNavigation)
                        .ThenInclude(h => h.MaDvtNavigation)
                .FirstOrDefaultAsync(p => p.MaPhieuNhap == copyId.Value);

            if (source != null)
            {
                vm.MaDonViCapHang = source.MaDonViCapHang;
                vm.TenDonViCapHang = source.MaDonViCapHangNavigation?.TenDonVi;
                vm.MaNcc = source.MaDonViCapHangNavigation?.MaNcc;
                vm.GhiChu = source.GhiChu;
                vm.GiamGia = source.GiamGia;

                var stockMap = await _context.VwTonKhoHienTais
                    .Where(s => s.MaKho == whId)
                    .ToDictionaryAsync(s => s.MaHang, s => s.SoLuongTon ?? 0);

                vm.Lines = source.ChiTietPhieuNhaps.Select(ct => new NhapHangLineVM
                {
                    MaHang = ct.MaHang,
                    MaHangNoiBo = ct.MaHangNavigation?.MaHangNoiBo ?? "",
                    TenHang = ct.MaHangNavigation?.TenHang ?? "",
                    TenDvt = ct.MaHangNavigation?.MaDvtNavigation?.TenDvt ?? "",
                    SoLuong = ct.SoLuong,
                    DonGiaNhap = ct.DonGiaNhap,
                    GiamGia = ct.GiamGia,
                    TonKho = stockMap.TryGetValue(ct.MaHang, out var ton) ? ton : 0
                }).ToList();

                vm.TongTien = vm.Lines.Sum(l => l.ThanhTien);
                vm.CanTraNcc = Math.Max(0, vm.TongTien - vm.GiamGia);
            }
        }

        await PopulateFormSelectLists(vm);
        return View(vm);
    }

    // 6. Màn hình Sửa phiếu nhập (Chỉ cho phép phiếu tạm)
    [HttpGet]
    public async Task<IActionResult> Edit(int id)
    {
        var phieu = await _context.PhieuNhaps
            .Include(p => p.MaKhoNavigation)
            .Include(p => p.MaNvlapNavigation)
            .Include(p => p.MaDonViCapHangNavigation)
            .Include(p => p.ChiTietPhieuNhaps)
                .ThenInclude(ct => ct.MaHangNavigation)
                    .ThenInclude(h => h.MaDvtNavigation)
            .FirstOrDefaultAsync(p => p.MaPhieuNhap == id);

        if (phieu == null)
        {
            return NotFound();
        }

        // Nếu phiếu đã xác nhận hoặc đã hủy thì chuyển sang trang Xem chi tiết
        if (phieu.TrangThai == "DA_XAC_NHAN" || phieu.TrangThai == "HOAN_THANH" || phieu.TrangThai == "DA_HUY" || phieu.TrangThai == "HUY")
        {
            return RedirectToAction(nameof(Details), new { id });
        }

        var stockMap = await _context.VwTonKhoHienTais
            .Where(s => s.MaKho == phieu.MaKho)
            .ToDictionaryAsync(s => s.MaHang, s => s.SoLuongTon ?? 0);

        var vm = new NhapHangFormVM
        {
            MaPhieuNhap = phieu.MaPhieuNhap,
            MaPhieu = phieu.MaPhieu,
            MaKho = phieu.MaKho,
            TenKho = phieu.MaKhoNavigation?.TenKho ?? "",
            NgayLap = phieu.NgayLap,
            MaNvlap = phieu.MaNvlap,
            TenNguoiLap = phieu.MaNvlapNavigation?.HoTen ?? "",
            MaDonViCapHang = phieu.MaDonViCapHang,
            TenDonViCapHang = phieu.MaDonViCapHangNavigation?.TenDonVi,
            MaNcc = phieu.MaDonViCapHangNavigation?.MaNcc,
            SoHoaDon = phieu.SoHoaDon,
            MaDatHangNhap = phieu.MaDatHangNhap,
            GhiChu = phieu.GhiChu,
            GiamGia = phieu.GiamGia,
            TongTien = phieu.TongTien,
            CanTraNcc = phieu.CanTraNcc,
            TrangThai = phieu.TrangThai,
            IsReadOnly = false,
            Lines = phieu.ChiTietPhieuNhaps.Select(ct => new NhapHangLineVM
            {
                MaHang = ct.MaHang,
                MaHangNoiBo = ct.MaHangNavigation?.MaHangNoiBo ?? "",
                TenHang = ct.MaHangNavigation?.TenHang ?? "",
                TenDvt = ct.MaHangNavigation?.MaDvtNavigation?.TenDvt ?? "",
                SoLuong = ct.SoLuong,
                DonGiaNhap = ct.DonGiaNhap,
                GiamGia = ct.GiamGia,
                TonKho = stockMap.TryGetValue(ct.MaHang, out var ton) ? ton : 0
            }).ToList()
        };

        await PopulateFormSelectLists(vm);
        return View(vm);
    }

    // 7. Màn hình Chi tiết phiếu nhập (Read-only)
    [HttpGet]
    public async Task<IActionResult> Details(int id)
    {
        var phieu = await _context.PhieuNhaps
            .Include(p => p.MaKhoNavigation)
            .Include(p => p.MaNvlapNavigation)
            .Include(p => p.MaNvxacNhanNavigation)
            .Include(p => p.MaDonViCapHangNavigation)
            .Include(p => p.ChiTietPhieuNhaps)
                .ThenInclude(ct => ct.MaHangNavigation)
                    .ThenInclude(h => h.MaDvtNavigation)
            .FirstOrDefaultAsync(p => p.MaPhieuNhap == id);

        if (phieu == null)
        {
            return NotFound();
        }

        var stockMap = await _context.VwTonKhoHienTais
            .Where(s => s.MaKho == phieu.MaKho)
            .ToDictionaryAsync(s => s.MaHang, s => s.SoLuongTon ?? 0);

        var vm = new NhapHangFormVM
        {
            MaPhieuNhap = phieu.MaPhieuNhap,
            MaPhieu = phieu.MaPhieu,
            MaKho = phieu.MaKho,
            TenKho = phieu.MaKhoNavigation?.TenKho ?? "",
            NgayLap = phieu.NgayLap,
            MaNvlap = phieu.MaNvlap,
            TenNguoiLap = phieu.MaNvlapNavigation?.HoTen ?? "",
            MaDonViCapHang = phieu.MaDonViCapHang,
            TenDonViCapHang = phieu.MaDonViCapHangNavigation?.TenDonVi,
            MaNcc = phieu.MaDonViCapHangNavigation?.MaNcc,
            SoHoaDon = phieu.SoHoaDon,
            MaDatHangNhap = phieu.MaDatHangNhap,
            GhiChu = phieu.GhiChu,
            GiamGia = phieu.GiamGia,
            TongTien = phieu.TongTien,
            CanTraNcc = phieu.CanTraNcc,
            TrangThai = phieu.TrangThai,
            IsReadOnly = true,
            Lines = phieu.ChiTietPhieuNhaps.Select(ct => new NhapHangLineVM
            {
                MaHang = ct.MaHang,
                MaHangNoiBo = ct.MaHangNavigation?.MaHangNoiBo ?? "",
                TenHang = ct.MaHangNavigation?.TenHang ?? "",
                TenDvt = ct.MaHangNavigation?.MaDvtNavigation?.TenDvt ?? "",
                SoLuong = ct.SoLuong,
                DonGiaNhap = ct.DonGiaNhap,
                GiamGia = ct.GiamGia,
                TonKho = stockMap.TryGetValue(ct.MaHang, out var ton) ? ton : 0
            }).ToList()
        };

        await PopulateFormSelectLists(vm);
        return View(vm);
    }

    // 8. Lưu phiếu nhập (Lưu tạm hoặc Hoàn thành)
    [HttpPost]
    public async Task<IActionResult> Save([FromBody] SaveNhapHangRequest req)
    {
        if (req == null)
        {
            return BadRequest(new { success = false, message = "Dữ liệu yêu cầu không hợp lệ." });
        }

        if (req.Lines == null || !req.Lines.Any())
        {
            return BadRequest(new { success = false, message = "Phiếu nhập phải có ít nhất 1 mặt hàng." });
        }

        if (req.Lines.Any(l => l.SoLuong <= 0))
        {
            return BadRequest(new { success = false, message = "Số lượng hàng nhập phải lớn hơn 0." });
        }

        int whId = req.MaKho.HasValue && req.MaKho.Value > 0 ? req.MaKho.Value : GetCurrentWarehouseId();
        int currentNvId = CurrentNhanVienId;
        bool isHoanThanh = string.Equals(req.ActionType, "HOAN_THANH", StringComparison.OrdinalIgnoreCase);

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            PhieuNhap? phieu = null;

            if (req.MaPhieuNhap > 0)
            {
                phieu = await _context.PhieuNhaps
                    .Include(p => p.ChiTietPhieuNhaps)
                    .FirstOrDefaultAsync(p => p.MaPhieuNhap == req.MaPhieuNhap);

                if (phieu == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy phiếu nhập cần sửa." });
                }

                if (phieu.TrangThai == "DA_XAC_NHAN" || phieu.TrangThai == "HOAN_THANH" || phieu.TrangThai == "DA_HUY" || phieu.TrangThai == "HUY")
                {
                    return BadRequest(new { success = false, message = "Không thể chỉnh sửa phiếu nhập đã hoàn thành hoặc đã hủy." });
                }

                // Xóa chi tiết cũ để ghi lại chi tiết mới
                _context.ChiTietPhieuNhaps.RemoveRange(phieu.ChiTietPhieuNhaps);
            }
            else
            {
                phieu = new PhieuNhap();
                phieu.LoaiPhieuNhap = "NHAP_KHO";
                _context.PhieuNhaps.Add(phieu);
            }

            // Xử lý mã phiếu
            string maPhieu = (req.MaPhieu ?? "").Trim().ToUpper();
            if (string.IsNullOrEmpty(maPhieu))
            {
                maPhieu = await SinhMaPhieuTuDongAsync();
            }
            else
            {
                // Kiểm tra trùng mã
                bool isTrungMa = await _context.PhieuNhaps.AnyAsync(p => p.MaPhieu == maPhieu && p.MaPhieuNhap != req.MaPhieuNhap);
                if (isTrungMa)
                {
                    return BadRequest(new { success = false, message = $"Mã phiếu nhập \"{maPhieu}\" đã tồn tại trên hệ thống!" });
                }
            }

            decimal tongTienHang = req.Lines.Sum(l => (l.SoLuong * l.DonGiaNhap) - l.GiamGia);
            decimal giamGiaPhieu = Math.Max(0, req.GiamGia);
            decimal canTraNcc = Math.Max(0, tongTienHang - giamGiaPhieu);

            phieu.MaPhieu = maPhieu;
            phieu.LoaiPhieuNhap = "NHAP_KHO";
            phieu.MaKho = whId;
            phieu.NgayLap = req.NgayLap.HasValue 
                ? (req.NgayLap.Value.Kind == DateTimeKind.Utc ? req.NgayLap.Value.ToLocalTime() : req.NgayLap.Value) 
                : DateTime.Now;
            phieu.MaNvlap = req.MaNvlap.HasValue && req.MaNvlap.Value > 0 ? req.MaNvlap.Value : currentNvId;
            phieu.MaDonViCapHang = req.MaDonViCapHang > 0 ? req.MaDonViCapHang : null;
            phieu.SoHoaDon = string.IsNullOrWhiteSpace(req.SoHoaDon) ? null : req.SoHoaDon.Trim();
            phieu.MaDatHangNhap = string.IsNullOrWhiteSpace(req.MaDatHangNhap) ? null : req.MaDatHangNhap.Trim();
            phieu.GhiChu = string.IsNullOrWhiteSpace(req.GhiChu) ? null : req.GhiChu.Trim();
            phieu.TongTien = tongTienHang;
            phieu.GiamGia = giamGiaPhieu;
            phieu.CanTraNcc = canTraNcc;

            if (isHoanThanh)
            {
                phieu.TrangThai = "DA_XAC_NHAN";
                phieu.NgayXacNhan = DateTime.Now;
                phieu.MaNvxacNhan = currentNvId;
            }
            else
            {
                phieu.TrangThai = "NHAP";
            }

            await _context.SaveChangesAsync();

            // Lưu các dòng chi tiết
            foreach (var l in req.Lines)
            {
                decimal thanhTienLine = (l.SoLuong * l.DonGiaNhap) - l.GiamGia;
                var ct = new ChiTietPhieuNhap
                {
                    MaPhieuNhap = phieu.MaPhieuNhap,
                    MaHang = l.MaHang,
                    SoLuong = l.SoLuong,
                    DonGiaNhap = l.DonGiaNhap,
                    GiamGia = l.GiamGia,
                    ThanhTien = thanhTienLine
                };
                _context.ChiTietPhieuNhaps.Add(ct);
            }

            await _context.SaveChangesAsync();

            // Ghi nhật ký thao tác
            string actionDesc = isHoanThanh
                ? $"Hoàn thành phiếu nhập hàng {phieu.MaPhieu} ({phieu.CanTraNcc:N0} đ)"
                : $"Lưu tạm phiếu nhập hàng {phieu.MaPhieu}";
            await _nhatKyService.GhiNhatKyAsync(CurrentUserId, isHoanThanh ? "HOAN_THANH_PHIEU_NHAP" : "LUU_TAM_PHIEU_NHAP", "PhieuNhap", phieu.MaPhieuNhap.ToString(), actionDesc);

            await trans.CommitAsync();

            return Json(new
            {
                success = true,
                id = phieu.MaPhieuNhap,
                code = phieu.MaPhieu,
                isCompleted = isHoanThanh,
                message = isHoanThanh ? "Nhập hàng thành công! Tồn kho đã được cập nhật." : "Lưu tạm phiếu nhập thành công."
            });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            _logger.LogError(ex, "Lỗi khi lưu phiếu nhập hàng");
            return StatusCode(500, new { success = false, message = "Đã xảy ra lỗi khi lưu phiếu nhập: " + ex.Message });
        }
    }

    // 9. Hủy phiếu nhập hàng
    [HttpPost]
    public async Task<IActionResult> Cancel(int id, string? reason)
    {
        var phieu = await _context.PhieuNhaps
            .Include(p => p.ChiTietPhieuNhaps)
            .FirstOrDefaultAsync(p => p.MaPhieuNhap == id);

        if (phieu == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy phiếu nhập hàng." });
        }

        if (phieu.TrangThai == "DA_HUY" || phieu.TrangThai == "HUY")
        {
            return BadRequest(new { success = false, message = "Phiếu nhập hàng này đã bị hủy trước đó." });
        }

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            // Nếu phiếu đã hoàn thành, kiểm tra an toàn tồn kho trước khi đảo ngược
            if (phieu.TrangThai == "DA_XAC_NHAN" || phieu.TrangThai == "HOAN_THANH")
            {
                var stockMap = await _context.VwTonKhoHienTais
                    .Where(s => s.MaKho == phieu.MaKho)
                    .ToDictionaryAsync(s => s.MaHang, s => s.SoLuongTon ?? 0);

                foreach (var line in phieu.ChiTietPhieuNhaps)
                {
                    decimal currentStock = stockMap.TryGetValue(line.MaHang, out var ton) ? ton : 0;
                    if (currentStock < line.SoLuong)
                    {
                        var hang = await _context.HangHoas.FindAsync(line.MaHang);
                        return BadRequest(new
                        {
                            success = false,
                            message = $"Không thể hủy phiếu nhập vì mặt hàng \"{hang?.TenHang ?? line.MaHang.ToString()}\" có tồn kho hiện tại ({currentStock:N0}) không đủ để hoàn tác số lượng đã nhập ({line.SoLuong:N0})!"
                        });
                    }
                }
            }

            phieu.TrangThai = "DA_HUY";
            if (!string.IsNullOrWhiteSpace(reason))
            {
                phieu.GhiChu = string.IsNullOrEmpty(phieu.GhiChu)
                    ? $"[Lý do hủy: {reason.Trim()}]"
                    : $"{phieu.GhiChu} [Lý do hủy: {reason.Trim()}]";
            }

            await _context.SaveChangesAsync();
            await _nhatKyService.GhiNhatKyAsync(CurrentUserId, "HUY_PHIEU_NHAP", "PhieuNhap", phieu.MaPhieuNhap.ToString(), $"Hủy phiếu nhập hàng {phieu.MaPhieu}. {reason}");
            await trans.CommitAsync();

            return Json(new { success = true, message = "Đã hủy phiếu nhập hàng thành công." });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            _logger.LogError(ex, "Lỗi khi hủy phiếu nhập hàng");
            return StatusCode(500, new { success = false, message = "Lỗi khi hủy phiếu nhập: " + ex.Message });
        }
    }

    // 10. Lưu nhanh ghi chú từ Drawer xem chi tiết
    [HttpPost]
    public async Task<IActionResult> SaveNote(int? id, [FromBody] SaveNoteRequest? req)
    {
        int targetId = (id.HasValue && id.Value > 0) ? id.Value : (req?.MaPhieuNhap ?? 0);
        var phieu = await _context.PhieuNhaps.FindAsync(targetId);
        if (phieu == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy phiếu nhập." });
        }

        phieu.GhiChu = req?.GhiChu?.Trim();
        await _context.SaveChangesAsync();

        return Json(new { success = true, message = "Đã cập nhật ghi chú." });
    }

    // 11. Tìm kiếm sản phẩm Autocomplete F3
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

        var result = products.Select(h => new
        {
            maHang = h.MaHang,
            maHangNoiBo = h.MaHangNoiBo,
            tenHang = h.TenHang,
            tenDvt = h.MaDvtNavigation?.TenDvt ?? "",
            tenNhom = h.MaNhomNavigation?.TenNhom ?? "",
            gia = h.GiaVon > 0 ? h.GiaVon : (h.GiaBanThamKhao > 0 ? h.GiaBanThamKhao : 0),
            tonKho = stockMap.TryGetValue(h.MaHang, out var ton) ? ton : 0
        }).ToList();

        return Json(result);
    }

    // 12. Tìm kiếm Nhà cung cấp Autocomplete
    [HttpGet]
    public async Task<IActionResult> SearchSuppliers(string? q)
    {
        q = (q ?? "").Trim();
        var query = _context.DonViCapHangs
            .AsNoTracking()
            .Where(d => d.TrangThai == "HOAT_DONG");

        if (!string.IsNullOrEmpty(q))
        {
            query = query.Where(d => d.TenDonVi.Contains(q) || (d.MaNcc != null && d.MaNcc.Contains(q)) || (d.DienThoai != null && d.DienThoai.Contains(q)));
        }

        var list = await query.Take(15).Select(d => new
        {
            maDonViCapHang = d.MaDonViCapHang,
            maNcc = d.MaNcc ?? ("NCC" + d.MaDonViCapHang.ToString("D5")),
            tenDonVi = d.TenDonVi,
            dienThoai = d.DienThoai ?? "",
            noCanTra = d.PhieuNhaps
                .Where(p => p.TrangThai == "DA_XAC_NHAN" || p.TrangThai == "HOAN_THANH")
                .Sum(p => (decimal?)p.CanTraNcc) ?? 0m
        }).ToListAsync();

        return Json(list);
    }

    // 13. Thêm nhanh Nhà cung cấp ngay tại form nhập hàng
    [HttpPost]
    public async Task<IActionResult> QuickCreateSupplier([FromBody] QuickSupplierVM req)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.TenDonVi))
        {
            return BadRequest(new { success = false, message = "Vui lòng nhập tên nhà cung cấp." });
        }

        string tenTrim = req.TenDonVi.Trim();
        bool isTenTrung = await _context.DonViCapHangs.AnyAsync(d => d.TenDonVi.ToLower() == tenTrim.ToLower());
        if (isTenTrung)
        {
            return BadRequest(new { success = false, message = $"Tên nhà cung cấp \"{tenTrim}\" đã tồn tại!" });
        }

        string? maNcc = !string.IsNullOrWhiteSpace(req.MaNcc) ? req.MaNcc.Trim() : null;
        if (!string.IsNullOrEmpty(maNcc))
        {
            bool isMaTrung = await _context.DonViCapHangs.AnyAsync(d => d.MaNcc != null && d.MaNcc.ToLower() == maNcc.ToLower());
            if (isMaTrung)
            {
                return BadRequest(new { success = false, message = $"Mã NCC \"{maNcc}\" đã tồn tại!" });
            }
        }

        var ncc = new DonViCapHang
        {
            TenDonVi = tenTrim,
            MaNcc = maNcc,
            DienThoai = string.IsNullOrWhiteSpace(req.DienThoai) ? null : req.DienThoai.Trim(),
            DiaChi = string.IsNullOrWhiteSpace(req.DiaChi) ? null : req.DiaChi.Trim(),
            TrangThai = "HOAT_DONG",
            NgayTao = DateTime.Now,
            NguoiTao = User.Identity?.Name ?? "Nhân viên"
        };

        _context.DonViCapHangs.Add(ncc);
        await _context.SaveChangesAsync();

        if (string.IsNullOrEmpty(ncc.MaNcc))
        {
            ncc.MaNcc = "NCC" + ncc.MaDonViCapHang.ToString("D5");
            await _context.SaveChangesAsync();
        }

        return Json(new
        {
            success = true,
            supplier = new
            {
                maDonViCapHang = ncc.MaDonViCapHang,
                maNcc = ncc.MaNcc,
                tenDonVi = ncc.TenDonVi,
                dienThoai = ncc.DienThoai ?? "",
                noCanTra = 0
            },
            message = "Thêm nhà cung cấp thành công!"
        });
    }

    // 14. Xuất file Excel danh sách hoặc chi tiết phiếu nhập
    [HttpGet]
    public async Task<IActionResult> Export(string? type, NhapHangFilterVM filter, int? id = null)
    {
        filter.Page = 1;
        filter.PageSize = 10000;
        var model = await BuildIndexViewModel(filter);

        if (id.HasValue && id.Value > 0)
        {
            model.PagedData.Items = model.PagedData.Items.Where(p => p.MaPhieuNhap == id.Value).ToList();
        }

        bool isDetail = string.Equals(type, "detail", StringComparison.OrdinalIgnoreCase);

        // Mặc định xuất file Excel (.xlsx) chuẩn KiotViet bằng ClosedXML qua Lego ExcelHelper
        if (isDetail)
        {
            var detailRows = new List<(int Stt, NhapHangListItemVM Item, NhapHangLineVM? Line)>();
            int stt = 1;
            foreach (var p in model.PagedData.Items)
            {
                if (p.Lines.Any())
                {
                    foreach (var line in p.Lines)
                    {
                        detailRows.Add((stt++, p, line));
                    }
                }
                else
                {
                    detailRows.Add((stt++, p, null));
                }
            }

            var bytes = ExcelHelper.Export("ChiTietNhapHang", detailRows, col => col
                .AddCenter("STT", x => x.Stt)
                .AddCenter("Mã nhập hàng", x => x.Item.MaPhieuHienThi)
                .AddDateTime("Thời gian", x => x.Item.NgayLap)
                .AddText("Kho nhập", x => x.Item.TenKho)
                .AddText("Nhà cung cấp", x => x.Item.TenNcc ?? "")
                .AddText("Người tạo", x => x.Item.TenNguoiLap)
                .AddCenter("Số hóa đơn", x => x.Item.SoHoaDon ?? "")
                .AddCenter("Mã hàng", x => x.Line?.MaHangNoiBo ?? "")
                .AddText("Tên hàng", x => x.Line?.TenHang ?? "(Phiếu chưa có danh sách hàng)")
                .AddCenter("ĐVT", x => x.Line?.TenDvt ?? "")
                .AddNumber("Số lượng", x => x.Line?.SoLuong ?? 0)
                .AddCurrency("Đơn giá", x => x.Line?.DonGiaNhap ?? 0)
                .AddCurrency("Giảm giá", x => x.Line?.GiamGia ?? 0)
                .AddCurrency("Thành tiền", x => x.Line?.ThanhTien ?? 0)
                .AddCenter("Trạng thái", x => x.Item.TenTrangThai)
                .AddText("Ghi chú", x => x.Item.GhiChu ?? "")
            );

            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"ChiTietNhapHang_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
        }
        else
        {
            var summaryRows = model.PagedData.Items.Select((p, idx) => (Stt: idx + 1, Item: p));
            var bytes = ExcelHelper.Export("DanhSachNhapHang", summaryRows, col => col
                .AddCenter("STT", x => x.Stt)
                .AddCenter("Mã nhập hàng", x => x.Item.MaPhieuHienThi)
                .AddDateTime("Thời gian", x => x.Item.NgayLap)
                .AddText("Kho nhập", x => x.Item.TenKho)
                .AddCenter("Mã NCC", x => x.Item.MaNcc ?? "")
                .AddText("Nhà cung cấp", x => x.Item.TenNcc ?? "")
                .AddText("Người tạo", x => x.Item.TenNguoiLap)
                .AddText("Người nhập", x => x.Item.TenNguoiXacNhan ?? "")
                .AddCenter("Số hóa đơn", x => x.Item.SoHoaDon ?? "")
                .AddCurrency("Tổng tiền hàng", x => x.Item.TongTien)
                .AddCurrency("Giảm giá", x => x.Item.GiamGia)
                .AddCurrency("Cần trả NCC", x => x.Item.CanTraNcc)
                .AddCenter("Trạng thái", x => x.Item.TenTrangThai)
                .AddText("Ghi chú", x => x.Item.GhiChu ?? "")
            );

            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"DanhSachNhapHang_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
        }
    }

    #region Private Helpers

    private async Task<NhapHangIndexVM> BuildIndexViewModel(NhapHangFilterVM filter)
    {
        int whId = GetCurrentWarehouseId();
        var (fromDate, toDate) = DateRangeHelper.Resolve(filter.DateFilterType, filter.FromDate, filter.ToDate);
        filter.FromDate = fromDate;
        filter.ToDate = toDate;

        var query = _context.PhieuNhaps
            .AsNoTracking()
            .Include(p => p.MaKhoNavigation)
            .Include(p => p.MaNvlapNavigation)
            .Include(p => p.MaNvxacNhanNavigation)
            .Include(p => p.MaDonViCapHangNavigation)
            .Include(p => p.ChiTietPhieuNhaps)
                .ThenInclude(ct => ct.MaHangNavigation)
                    .ThenInclude(h => h.MaDvtNavigation)
            .Where(p => p.MaKho == whId);

        // 1. Lọc theo từ khóa tìm kiếm
        if (!string.IsNullOrWhiteSpace(filter.Q))
        {
            string q = filter.Q.Trim().ToLower();
            query = query.Where(p =>
                (p.MaPhieu != null && p.MaPhieu.ToLower().Contains(q)) ||
                (p.SoHoaDon != null && p.SoHoaDon.ToLower().Contains(q)) ||
                (p.MaDonViCapHangNavigation != null && p.MaDonViCapHangNavigation.TenDonVi.ToLower().Contains(q)) ||
                p.ChiTietPhieuNhaps.Any(ct =>
                    ct.MaHangNavigation.TenHang.ToLower().Contains(q) ||
                    ct.MaHangNavigation.MaHangNoiBo.ToLower().Contains(q)));
        }

        // 2. Lọc thời gian
        query = query.Where(p => p.NgayLap >= fromDate && p.NgayLap <= toDate);

        // 3. Lọc trạng thái
        if (filter.Statuses != null && filter.Statuses.Any())
        {
            var stList = new List<string>();
            foreach (var st in filter.Statuses)
            {
                if (st == "NHAP" || st == "PHIEU_TAM")
                {
                    stList.Add("NHAP");
                    stList.Add("PHIEU_TAM");
                }
                else if (st == "DA_XAC_NHAN" || st == "HOAN_THANH")
                {
                    stList.Add("DA_XAC_NHAN");
                    stList.Add("HOAN_THANH");
                }
                else if (st == "HUY" || st == "DA_HUY")
                {
                    stList.Add("HUY");
                    stList.Add("DA_HUY");
                }
            }
            query = query.Where(p => stList.Contains(p.TrangThai));
        }

        // 4. Lọc Nhà cung cấp
        var nccIds = filter.NccIds?.Where(x => x > 0).ToList() ?? new List<int>();
        if (filter.NccId.HasValue && filter.NccId.Value > 0 && !nccIds.Contains(filter.NccId.Value))
        {
            nccIds.Add(filter.NccId.Value);
        }
        if (nccIds.Any())
        {
            query = query.Where(p => p.MaDonViCapHang.HasValue && nccIds.Contains(p.MaDonViCapHang.Value));
        }

        // 5. Lọc Người tạo
        var creatorIds = filter.CreatorIds?.Where(x => x > 0).ToList() ?? new List<int>();
        if (filter.CreatorId.HasValue && filter.CreatorId.Value > 0 && !creatorIds.Contains(filter.CreatorId.Value))
        {
            creatorIds.Add(filter.CreatorId.Value);
        }
        if (creatorIds.Any())
        {
            query = query.Where(p => creatorIds.Contains(p.MaNvlap));
        }

        // 6. Lọc Người nhập
        var confirmerIds = filter.ConfirmerIds?.Where(x => x > 0).ToList() ?? new List<int>();
        if (filter.ConfirmerId.HasValue && filter.ConfirmerId.Value > 0 && !confirmerIds.Contains(filter.ConfirmerId.Value))
        {
            confirmerIds.Add(filter.ConfirmerId.Value);
        }
        if (confirmerIds.Any())
        {
            query = query.Where(p => p.MaNvxacNhan.HasValue && confirmerIds.Contains(p.MaNvxacNhan.Value));
        }

        // 7. Lọc Số hóa đơn
        if (!string.IsNullOrWhiteSpace(filter.SoHoaDon))
        {
            string shd = filter.SoHoaDon.Trim().ToLower();
            query = query.Where(p => p.SoHoaDon != null && p.SoHoaDon.ToLower().Contains(shd));
        }

        // 8. Lọc Đã đánh dấu sao
        if (filter.DaDanhDau)
        {
            query = query.Where(p => p.DaDanhDau);
        }

        // Tổng tiền cần trả NCC
        decimal tongCanTra = await query.SumAsync(p => (decimal?)p.CanTraNcc) ?? 0m;
        int totalItems = await query.CountAsync();

        // Sắp xếp
        query = (filter.SortBy?.ToLower(), filter.SortDir?.ToLower()) switch
        {
            ("ma", "asc") => query.OrderBy(p => p.MaPhieu),
            ("ma", "desc") => query.OrderByDescending(p => p.MaPhieu),
            ("matra", "asc") => query.OrderBy(p => p.MaDatHangNhap ?? ""),
            ("matra", "desc") => query.OrderByDescending(p => p.MaDatHangNhap ?? ""),
            ("tg", "asc") => query.OrderBy(p => p.NgayLap),
            ("tg", "desc") => query.OrderByDescending(p => p.NgayLap),
            ("tgtao", "asc") => query.OrderBy(p => p.NgayLap),
            ("tgtao", "desc") => query.OrderByDescending(p => p.NgayLap),
            ("ngaycapnhat", "asc") => query.OrderBy(p => p.NgayXacNhan ?? p.NgayLap),
            ("ngaycapnhat", "desc") => query.OrderByDescending(p => p.NgayXacNhan ?? p.NgayLap),
            ("mancc", "asc") => query.OrderBy(p => p.MaDonViCapHangNavigation != null ? p.MaDonViCapHangNavigation.MaNcc : ""),
            ("mancc", "desc") => query.OrderByDescending(p => p.MaDonViCapHangNavigation != null ? p.MaDonViCapHangNavigation.MaNcc : ""),
            ("ncc", "asc") => query.OrderBy(p => p.MaDonViCapHangNavigation != null ? p.MaDonViCapHangNavigation.TenDonVi : ""),
            ("ncc", "desc") => query.OrderByDescending(p => p.MaDonViCapHangNavigation != null ? p.MaDonViCapHangNavigation.TenDonVi : ""),
            ("chinhanh", "asc") => query.OrderBy(p => p.MaKhoNavigation.TenKho),
            ("chinhanh", "desc") => query.OrderByDescending(p => p.MaKhoNavigation.TenKho),
            ("nguoitao", "asc") => query.OrderBy(p => p.MaNvlapNavigation.HoTen),
            ("nguoitao", "desc") => query.OrderByDescending(p => p.MaNvlapNavigation.HoTen),
            ("nguoinhap", "asc") => query.OrderBy(p => p.MaNvxacNhanNavigation != null ? p.MaNvxacNhanNavigation.HoTen : ""),
            ("nguoinhap", "desc") => query.OrderByDescending(p => p.MaNvxacNhanNavigation != null ? p.MaNvxacNhanNavigation.HoTen : ""),
            ("tongsl", "asc") => query.OrderBy(p => p.ChiTietPhieuNhaps.Sum(ct => (decimal?)ct.SoLuong) ?? 0),
            ("tongsl", "desc") => query.OrderByDescending(p => p.ChiTietPhieuNhaps.Sum(ct => (decimal?)ct.SoLuong) ?? 0),
            ("slmathang", "asc") => query.OrderBy(p => p.ChiTietPhieuNhaps.Count),
            ("slmathang", "desc") => query.OrderByDescending(p => p.ChiTietPhieuNhaps.Count),
            ("tongtien", "asc") => query.OrderBy(p => p.TongTien),
            ("tongtien", "desc") => query.OrderByDescending(p => p.TongTien),
            ("giamgia", "asc") => query.OrderBy(p => p.GiamGia),
            ("giamgia", "desc") => query.OrderByDescending(p => p.GiamGia),
            ("cantra", "asc") => query.OrderBy(p => p.CanTraNcc),
            ("cantra", "desc") => query.OrderByDescending(p => p.CanTraNcc),
            ("st", "asc") => query.OrderBy(p => p.TrangThai),
            ("st", "desc") => query.OrderByDescending(p => p.TrangThai),
            ("sohoadon", "asc") => query.OrderBy(p => p.SoHoaDon),
            ("sohoadon", "desc") => query.OrderByDescending(p => p.SoHoaDon),
            _ => query.OrderByDescending(p => p.NgayLap).ThenByDescending(p => p.MaPhieuNhap)
        };

        int page = filter.Page < 1 ? 1 : filter.Page;
        int pageSize = filter.PageSize < 1 ? 15 : filter.PageSize;

        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        var listVM = items.Select(p => new NhapHangListItemVM
        {
            MaPhieuNhap = p.MaPhieuNhap,
            MaPhieu = p.MaPhieu,
            NgayLap = p.NgayLap,
            NgayXacNhan = p.NgayXacNhan,
            TrangThai = p.TrangThai,
            MaDonViCapHang = p.MaDonViCapHang,
            MaNcc = p.MaDonViCapHangNavigation?.MaNcc,
            TenNcc = p.MaDonViCapHangNavigation?.TenDonVi,
            MaKho = p.MaKho,
            TenKho = p.MaKhoNavigation?.TenKho ?? "",
            MaNvlap = p.MaNvlap,
            TenNguoiLap = p.MaNvlapNavigation?.HoTen ?? "",
            MaNvxacNhan = p.MaNvxacNhan,
            TenNguoiXacNhan = p.MaNvxacNhanNavigation?.HoTen,
            SoHoaDon = p.SoHoaDon,
            MaDatHangNhap = p.MaDatHangNhap,
            GhiChu = p.GhiChu,
            TongTien = p.TongTien,
            GiamGia = p.GiamGia,
            CanTraNcc = p.CanTraNcc,
            DaDanhDau = p.DaDanhDau,
            Lines = p.ChiTietPhieuNhaps.Select(ct => new NhapHangLineVM
            {
                MaHang = ct.MaHang,
                MaHangNoiBo = ct.MaHangNavigation?.MaHangNoiBo ?? "",
                TenHang = ct.MaHangNavigation?.TenHang ?? "",
                TenDvt = ct.MaHangNavigation?.MaDvtNavigation?.TenDvt ?? "",
                SoLuong = ct.SoLuong,
                DonGiaNhap = ct.DonGiaNhap,
                GiamGia = ct.GiamGia
            }).ToList()
        }).ToList();

        // Lấy danh sách dropdown nhân viên & nhà cung cấp
        var nhanViens = await _context.NhanViens
            .AsNoTracking()
            .Where(n => n.TrangThai == "DANG_LAM" || n.TrangThai == "HOAT_DONG")
            .OrderBy(n => n.HoTen)
            .Select(n => new SelectListItem { Value = n.MaNv.ToString(), Text = n.HoTen })
            .ToListAsync();

        var nccs = await _context.DonViCapHangs
            .AsNoTracking()
            .Where(d => d.TrangThai == "HOAT_DONG")
            .OrderBy(d => d.TenDonVi)
            .Select(d => new SelectListItem { Value = d.MaDonViCapHang.ToString(), Text = d.TenDonVi })
            .ToListAsync();

        return new NhapHangIndexVM
        {
            PagedData = new PagedResult<NhapHangListItemVM>
            {
                Items = listVM,
                PageIndex = page,
                PageSize = pageSize,
                TotalItems = totalItems
            },
            Filter = filter,
            TongCanTraNcc = tongCanTra,
            NhanViens = nhanViens,
            NhaCungCaps = nccs
        };
    }

    private async Task PopulateFormSelectLists(NhapHangFormVM vm)
    {
        vm.NhanViens = await _context.NhanViens
            .AsNoTracking()
            .Where(n => n.TrangThai == "DANG_LAM" || n.TrangThai == "HOAT_DONG")
            .OrderBy(n => n.HoTen)
            .Select(n => new SelectListItem { Value = n.MaNv.ToString(), Text = n.HoTen })
            .ToListAsync();

        vm.NhaCungCaps = await _context.DonViCapHangs
            .AsNoTracking()
            .Where(d => d.TrangThai == "HOAT_DONG")
            .OrderBy(d => d.TenDonVi)
            .Select(d => new SelectListItem { Value = d.MaDonViCapHang.ToString(), Text = d.TenDonVi })
            .ToListAsync();

        vm.NhomNccList = await _context.NhomNhaCungCaps
            .AsNoTracking()
            .OrderBy(g => g.TenNhom)
            .ToListAsync();
    }

    private async Task<string> SinhMaPhieuTuDongAsync()
    {
        var existingCodes = await _context.PhieuNhaps
            .Where(p => p.MaPhieu != null && p.MaPhieu.StartsWith("PN"))
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
        return $"PN{(maxNum + 1):D6}";
    }

    #endregion
}
