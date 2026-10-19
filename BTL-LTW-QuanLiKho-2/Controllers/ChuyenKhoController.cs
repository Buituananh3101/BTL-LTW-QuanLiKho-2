using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using BTL_LTW_QuanLiKho_2.Models;
using BTL_LTW_QuanLiKho_2.Services;
using BTL_LTW_QuanLiKho_2.ViewModels;
using BTL_LTW_QuanLiKho_2.ViewModels.Common;
using BTL_LTW_QuanLiKho_2.ViewModels.ChuyenKho;
using BTL_LTW_QuanLiKho_2.Helpers;
using ClosedXML.Excel;

namespace BTL_LTW_QuanLiKho_2.Controllers;

[Authorize]
public class ChuyenKhoController : BaseKhoController
{
    private readonly ITonKhoService _tonKhoService;
    private readonly INhatKyThaoTacService _nhatKyService;
    private readonly ILogger<ChuyenKhoController> _logger;

    public ChuyenKhoController(
        QuanLyKhoPhuQuocLtwContext context,
        ITonKhoService tonKhoService,
        INhatKyThaoTacService nhatKyService,
        ILogger<ChuyenKhoController> logger) : base(context)
    {
        _tonKhoService = tonKhoService;
        _nhatKyService = nhatKyService;
        _logger = logger;
    }

    // 1. Màn hình danh sách Phiếu Chuyển Kho
    [HttpGet]
    public async Task<IActionResult> Index(ChuyenKhoFilterVM filter)
    {
        var model = await BuildIndexViewModelAsync(filter);
        return View(model);
    }

    // 2. Lọc danh sách AJAX trả về PartialView bảng dữ liệu
    [HttpGet]
    public async Task<IActionResult> Filter(ChuyenKhoFilterVM filter)
    {
        var model = await BuildIndexViewModelAsync(filter);
        return PartialView("_ChuyenKhoTable", model);
    }

    // 3. Đánh dấu sao yêu thích phiếu chuyển (silent toggle)
    [AcceptVerbs("GET", "POST")]
    public async Task<IActionResult> ToggleFavorite(int id)
    {
        var item = await _context.PhieuChuyenKhos.FindAsync(id);
        if (item == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy phiếu chuyển hàng." });
        }

        item.DaDanhDau = !item.DaDanhDau;
        await _context.SaveChangesAsync();

        return Json(new { success = true, isFavorite = item.DaDanhDau, id = item.MaPhieuChuyen });
    }

    // 4. Sinh mã phiếu chuyển tự động (CK000001, CK000002...)
    [HttpGet]
    public async Task<IActionResult> GetNextCode()
    {
        var code = await SinhMaPhieuTuDongAsync();
        return Json(new { success = true, code });
    }

    // 5. Màn hình Tạo mới phiếu chuyển
    [HttpGet]
    public async Task<IActionResult> Create(int? copyId)
    {
        int whId = GetCurrentWarehouseId();
        var khoNguon = await _context.Khos.FindAsync(whId);

        var vm = new ChuyenKhoFormVM
        {
            MaKhoNguon = whId,
            TenKhoNguon = khoNguon?.TenKho ?? "Kho chính",
            NgayLap = DateTime.Now,
            TrangThai = "NHAP",
            MaPhieu = ""
        };

        if (copyId.HasValue && copyId.Value > 0)
        {
            var source = await _context.PhieuChuyenKhos
                .Include(p => p.ChiTietPhieuChuyenKhos)
                    .ThenInclude(ct => ct.MaHangNavigation)
                        .ThenInclude(h => h.MaDvtNavigation)
                .FirstOrDefaultAsync(p => p.MaPhieuChuyen == copyId.Value);

            if (source != null)
            {
                vm.IsCopy = true;
                vm.MaKhoDich = source.MaKhoDich != whId ? source.MaKhoDich : 0;
                vm.GhiChu = source.GhiChu;

                var tonKhoDict = await _tonKhoService.LayTonKhoTheoKhoAsync(whId);

                vm.Lines = source.ChiTietPhieuChuyenKhos.Select(ct => new ChuyenKhoLineVM
                {
                    MaHang = ct.MaHang,
                    MaHangNoiBo = ct.MaHangNavigation?.MaHangNoiBo ?? "",
                    TenHang = ct.MaHangNavigation?.TenHang ?? "",
                    TenDvt = ct.MaHangNavigation?.MaDvtNavigation?.TenDvt ?? "",
                    SoLuong = ct.SoLuong,
                    DonGiaChuyen = ct.MaHangNavigation?.GiaVon ?? ct.DonGiaChuyen,
                    TonKho = tonKhoDict.TryGetValue(ct.MaHang, out var ton) ? ton : 0m
                }).ToList();
            }
        }

        await PopulateWarehouseOptionsAsync(vm, whId);
        return View(vm);
    }

    // 6. Màn hình Chỉnh sửa phiếu chuyển (Chỉ cho phép khi ở trạng thái Phiếu tạm)
    [HttpGet]
    public async Task<IActionResult> Edit(int id)
    {
        var phieu = await _context.PhieuChuyenKhos
            .Include(p => p.MaKhoNguonNavigation)
            .Include(p => p.ChiTietPhieuChuyenKhos)
                .ThenInclude(ct => ct.MaHangNavigation)
                    .ThenInclude(h => h.MaDvtNavigation)
            .FirstOrDefaultAsync(p => p.MaPhieuChuyen == id);

        if (phieu == null)
        {
            return NotFound("Không tìm thấy phiếu chuyển hàng.");
        }

        if (phieu.TrangThai != "NHAP")
        {
            TempData["ErrorMessage"] = "Chỉ có thể chỉnh sửa phiếu chuyển ở trạng thái 'Phiếu tạm'.";
            return RedirectToAction(nameof(Index));
        }

        int whId = GetCurrentWarehouseId();
        var tonKhoDict = await _tonKhoService.LayTonKhoTheoKhoAsync(phieu.MaKhoNguon);

        var vm = new ChuyenKhoFormVM
        {
            MaPhieuChuyen = phieu.MaPhieuChuyen,
            MaPhieu = phieu.MaPhieu,
            MaKhoNguon = phieu.MaKhoNguon,
            TenKhoNguon = phieu.MaKhoNguonNavigation?.TenKho ?? "Kho chính",
            MaKhoDich = phieu.MaKhoDich,
            NgayLap = phieu.NgayLap,
            GhiChu = phieu.GhiChu,
            TrangThai = phieu.TrangThai,
            Lines = phieu.ChiTietPhieuChuyenKhos.Select(ct => new ChuyenKhoLineVM
            {
                MaCtphieuChuyen = ct.MaCtphieuChuyen,
                MaHang = ct.MaHang,
                MaHangNoiBo = ct.MaHangNavigation?.MaHangNoiBo ?? "",
                TenHang = ct.MaHangNavigation?.TenHang ?? "",
                TenDvt = ct.MaHangNavigation?.MaDvtNavigation?.TenDvt ?? "",
                SoLuong = ct.SoLuong,
                DonGiaChuyen = ct.DonGiaChuyen,
                TonKho = tonKhoDict.TryGetValue(ct.MaHang, out var ton) ? ton : 0m
            }).ToList()
        };

        await PopulateWarehouseOptionsAsync(vm, phieu.MaKhoNguon);
        return View("Create", vm);
    }

    // 7. Lưu phiếu chuyển (Lưu tạm 'NHAP' hoặc Chuyển hàng 'DA_XUAT')
    [HttpPost]
    public async Task<IActionResult> Save([FromBody] SaveChuyenKhoRequest request)
    {
        if (request == null)
        {
            return BadRequest(new { success = false, message = "Dữ liệu gửi lên không hợp lệ." });
        }

        int whId = GetCurrentWarehouseId();
        if (request.MaKhoDich <= 0 || request.MaKhoDich == whId)
        {
            return BadRequest(new { success = false, message = "Vui lòng chọn kho nhận hợp lệ và khác kho gửi." });
        }

        if (request.Lines == null || !request.Lines.Any())
        {
            return BadRequest(new { success = false, message = "Vui lòng chọn ít nhất một mặt hàng để chuyển." });
        }

        if (request.Lines.Any(l => l.SoLuong <= 0))
        {
            return BadRequest(new { success = false, message = "Số lượng chuyển của tất cả các mặt hàng phải lớn hơn 0." });
        }

        bool isSend = string.Equals(request.ActionType, "SEND", StringComparison.OrdinalIgnoreCase);

        // Nếu xác nhận chuyển hàng ngay, kiểm tra chặn âm kho nguồn
        if (isSend)
        {
            var dsKiemTra = request.Lines.Select(l => (l.MaHang, l.SoLuong));
            var (hopLe, thongBaoLoi) = await _tonKhoService.KiemTraXuatKhoAsync(whId, dsKiemTra);
            if (!hopLe)
            {
                return BadRequest(new { success = false, message = thongBaoLoi });
            }
        }

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            PhieuChuyenKho? phieu = null;
            bool isNew = !request.MaPhieuChuyen.HasValue || request.MaPhieuChuyen.Value <= 0;

            if (isNew)
            {
                string codeToSet;
                if (!string.IsNullOrWhiteSpace(request.MaPhieu))
                {
                    codeToSet = request.MaPhieu.Trim().ToUpper();
                    bool exists = await _context.PhieuChuyenKhos.AnyAsync(p => p.MaPhieu == codeToSet);
                    if (exists)
                    {
                        return BadRequest(new { success = false, message = $"Mã chuyển hàng '{codeToSet}' đã tồn tại trong hệ thống. Vui lòng chọn mã khác." });
                    }
                }
                else
                {
                    codeToSet = await SinhMaPhieuTuDongAsync();
                }

                phieu = new PhieuChuyenKho
                {
                    MaPhieu = codeToSet,
                    MaKhoNguon = whId,
                    MaKhoDich = request.MaKhoDich,
                    MaNvlap = CurrentNhanVienId,
                    NgayLap = request.NgayLap ?? DateTime.Now,
                    TrangThai = isSend ? "DA_XUAT" : "NHAP",
                    ThoiDiemXuat = isSend ? DateTime.Now : null,
                    MaNvxuat = isSend ? CurrentNhanVienId : null,
                    GhiChu = request.GhiChu?.Trim()
                };

                _context.PhieuChuyenKhos.Add(phieu);
                await _context.SaveChangesAsync();
            }
            else
            {
                phieu = await _context.PhieuChuyenKhos
                    .Include(p => p.ChiTietPhieuChuyenKhos)
                    .FirstOrDefaultAsync(p => p.MaPhieuChuyen == request.MaPhieuChuyen!.Value);

                if (phieu == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy phiếu chuyển để cập nhật." });
                }

                if (phieu.TrangThai != "NHAP")
                {
                    return BadRequest(new { success = false, message = "Phiếu này đã được xuất hoặc nhận, không thể chỉnh sửa." });
                }

                string codeToSet;
                if (!string.IsNullOrWhiteSpace(request.MaPhieu))
                {
                    codeToSet = request.MaPhieu.Trim().ToUpper();
                    bool exists = await _context.PhieuChuyenKhos.AnyAsync(p => p.MaPhieu == codeToSet && p.MaPhieuChuyen != phieu.MaPhieuChuyen);
                    if (exists)
                    {
                        return BadRequest(new { success = false, message = $"Mã chuyển hàng '{codeToSet}' đã tồn tại trong hệ thống. Vui lòng chọn mã khác." });
                    }
                }
                else if (!string.IsNullOrWhiteSpace(phieu.MaPhieu))
                {
                    codeToSet = phieu.MaPhieu;
                }
                else
                {
                    codeToSet = await SinhMaPhieuTuDongAsync();
                }

                phieu.MaPhieu = codeToSet;
                phieu.MaKhoDich = request.MaKhoDich;
                phieu.GhiChu = request.GhiChu?.Trim();
                if (request.NgayLap.HasValue) phieu.NgayLap = request.NgayLap.Value;

                if (isSend)
                {
                    phieu.TrangThai = "DA_XUAT";
                    phieu.ThoiDiemXuat = DateTime.Now;
                    phieu.MaNvxuat = CurrentNhanVienId;
                }

                // Xóa chi tiết cũ để nạp mới
                _context.ChiTietPhieuChuyenKhos.RemoveRange(phieu.ChiTietPhieuChuyenKhos);
            }

            // Nạp giá vốn hiện tại từ bảng HangHoa
            var hangIds = request.Lines.Select(l => l.MaHang).Distinct().ToList();
            var hangDict = await _context.HangHoas
                .Where(h => hangIds.Contains(h.MaHang))
                .ToDictionaryAsync(h => h.MaHang, h => h.GiaVon);

            decimal tongSl = 0m;
            decimal tongGiaTri = 0m;

            foreach (var line in request.Lines)
            {
                decimal giaVon = hangDict.TryGetValue(line.MaHang, out var gv) ? gv : 0m;
                decimal thanhTien = line.SoLuong * giaVon;

                var ct = new ChiTietPhieuChuyenKho
                {
                    MaPhieuChuyen = phieu.MaPhieuChuyen,
                    MaHang = line.MaHang,
                    SoLuong = line.SoLuong,
                    DonGiaChuyen = giaVon,
                    ThanhTien = thanhTien
                };

                _context.ChiTietPhieuChuyenKhos.Add(ct);
                tongSl += line.SoLuong;
                tongGiaTri += thanhTien;
            }

            phieu.TongSoLuongChuyen = tongSl;
            phieu.TongGiaTriChuyen = tongGiaTri;

            await _context.SaveChangesAsync();
            await trans.CommitAsync();

            string actionMsg = isSend ? "Đã chuyển hàng thành công" : "Đã lưu tạm phiếu chuyển hàng";
            await _nhatKyService.GhiNhatKyAsync(
                CurrentNhanVienId,
                isSend ? "CHUYEN_HANG" : "LUU_TAM_CHUYEN_KHO",
                "PhieuChuyenKho",
                $"{actionMsg} #{phieu.MaPhieu} ({tongSl} sản phẩm)"
            );

            return Json(new
            {
                success = true,
                id = phieu.MaPhieuChuyen,
                code = phieu.MaPhieu,
                message = $"{actionMsg} ({phieu.MaPhieu})."
            });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            _logger.LogError(ex, "Lỗi khi lưu phiếu chuyển kho");
            return StatusCode(500, new { success = false, message = "Đã xảy ra lỗi hệ thống: " + ex.Message });
        }
    }

    // 8. Nhận hàng tại kho nhận (Xử lý thực nhận & Thất thoát)
    [HttpPost]
    public async Task<IActionResult> Receive([FromBody] ReceiveChuyenKhoRequest request)
    {
        if (request == null || request.MaPhieuChuyen <= 0)
        {
            return BadRequest(new { success = false, message = "Dữ liệu nhận hàng không hợp lệ." });
        }

        var phieu = await _context.PhieuChuyenKhos
            .Include(p => p.ChiTietPhieuChuyenKhos)
                .ThenInclude(ct => ct.MaHangNavigation)
            .FirstOrDefaultAsync(p => p.MaPhieuChuyen == request.MaPhieuChuyen);

        if (phieu == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy phiếu chuyển hàng." });
        }

        if (phieu.TrangThai != "DA_XUAT")
        {
            return BadRequest(new { success = false, message = "Chỉ có thể nhận hàng khi phiếu đang ở trạng thái 'Đang chuyển'." });
        }

        int whId = GetCurrentWarehouseId();
        if (phieu.MaKhoDich != whId && whId != 0)
        {
            return BadRequest(new { success = false, message = "Bạn không thuộc chi nhánh kho nhận của phiếu chuyển này." });
        }

        if (request.Lines == null || !request.Lines.Any())
        {
            return BadRequest(new { success = false, message = "Danh sách hàng hóa nhận không được rỗng." });
        }

        // Kiểm tra số lượng nhận không vượt quá số lượng chuyển
        var inputDict = request.Lines.ToDictionary(l => l.MaHang, l => l.SoLuongNhan);
        bool coNhanThieu = false;

        foreach (var ct in phieu.ChiTietPhieuChuyenKhos)
        {
            if (!inputDict.TryGetValue(ct.MaHang, out var slNhan))
            {
                return BadRequest(new { success = false, message = $"Chưa nhập số lượng nhận cho mặt hàng '{ct.MaHangNavigation?.TenHang}'." });
            }

            if (slNhan < 0)
            {
                return BadRequest(new { success = false, message = $"Số lượng nhận của '{ct.MaHangNavigation?.TenHang}' không được nhỏ hơn 0." });
            }

            if (slNhan > ct.SoLuong)
            {
                return BadRequest(new { success = false, message = $"Mặt hàng '{ct.MaHangNavigation?.TenHang}': Số lượng nhận ({slNhan}) không được vượt quá số lượng chuyển ({ct.SoLuong})." });
            }

            if (slNhan < ct.SoLuong)
            {
                coNhanThieu = true;
            }
        }

        if (coNhanThieu && string.IsNullOrWhiteSpace(request.GhiChuNhan))
        {
            return BadRequest(new { success = false, message = "Phát hiện nhận thiếu hàng so với phiếu chuyển. Vui lòng ghi rõ lý do vào ô ghi chú nhận hàng." });
        }

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            decimal tongSlNhan = 0m;
            foreach (var ct in phieu.ChiTietPhieuChuyenKhos)
            {
                decimal slNhan = inputDict[ct.MaHang];
                ct.SoLuongNhan = slNhan;
                tongSlNhan += slNhan;
            }

            phieu.TrangThai = "DA_NHAN";
            phieu.ThoiDiemNhan = DateTime.Now;
            phieu.MaNvnhan = CurrentNhanVienId;
            phieu.GhiChuNhan = request.GhiChuNhan?.Trim();
            phieu.TongSoLuongNhan = tongSlNhan;

            await _context.SaveChangesAsync();
            await trans.CommitAsync();

            string msg = coNhanThieu
                ? $"Đã nhận hàng phiếu {phieu.MaPhieu} (có ghi nhận thiếu {phieu.TongSoLuongChuyen - tongSlNhan} SP)."
                : $"Đã nhận đủ hàng phiếu {phieu.MaPhieu}.";

            await _nhatKyService.GhiNhatKyAsync(
                CurrentNhanVienId,
                "NHAN_HANG_CHUYEN_KHO",
                "PhieuChuyenKho",
                $"{msg} Mã phiếu: #{phieu.MaPhieu}"
            );

            return Json(new { success = true, id = phieu.MaPhieuChuyen, message = msg });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            _logger.LogError(ex, "Lỗi khi nhận hàng phiếu chuyển kho");
            return StatusCode(500, new { success = false, message = "Đã xảy ra lỗi: " + ex.Message });
        }
    }

    // 9. Hủy phiếu chuyển (Phiếu tạm hoặc Phiếu đang chuyển chưa nhận)
    [HttpPost]
    public async Task<IActionResult> Cancel(int id)
    {
        var phieu = await _context.PhieuChuyenKhos.FindAsync(id);
        if (phieu == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy phiếu chuyển hàng." });
        }

        if (phieu.TrangThai == "DA_NHAN")
        {
            return BadRequest(new { success = false, message = "Phiếu chuyển đã được kho đích nhận hàng hoàn tất, tuyệt đối không thể hủy." });
        }

        if (phieu.TrangThai == "HUY")
        {
            return BadRequest(new { success = false, message = "Phiếu chuyển này đã ở trạng thái hủy." });
        }

        int whId = GetCurrentWarehouseId();
        if (phieu.TrangThai == "DA_XUAT" && phieu.MaKhoNguon != whId && whId != 0)
        {
            return BadRequest(new { success = false, message = "Chỉ kho gửi mới có quyền hủy phiếu đang chuyển để thu hồi hàng." });
        }

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            phieu.TrangThai = "HUY";
            await _context.SaveChangesAsync();
            await trans.CommitAsync();

            string msg = phieu.TrangThai == "DA_XUAT"
                ? $"Đã hủy phiếu {phieu.MaPhieu}. Hàng hóa đã được hoàn trả về tồn kho gửi."
                : $"Đã hủy phiếu tạm {phieu.MaPhieu}.";

            await _nhatKyService.GhiNhatKyAsync(
                CurrentNhanVienId,
                "HUY_PHIEU_CHUYEN_KHO",
                "PhieuChuyenKho",
                $"{msg} (#{phieu.MaPhieu})"
            );

            return Json(new { success = true, id = phieu.MaPhieuChuyen, message = msg });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            _logger.LogError(ex, "Lỗi khi hủy phiếu chuyển kho");
            return StatusCode(500, new { success = false, message = "Đã xảy ra lỗi: " + ex.Message });
        }
    }

    // 10. Lưu nhanh ghi chú từ Drawer xem chi tiết
    [HttpPost]
    public async Task<IActionResult> SaveNote([FromBody] SaveChuyenKhoNoteRequest request)
    {
        if (request == null || request.MaPhieuChuyen <= 0)
        {
            return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ." });
        }

        var phieu = await _context.PhieuChuyenKhos.FindAsync(request.MaPhieuChuyen);
        if (phieu == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy phiếu chuyển hàng." });
        }

        phieu.GhiChu = request.GhiChu?.Trim();
        await _context.SaveChangesAsync();

        return Json(new { success = true, message = "Đã lưu ghi chú thành công." });
    }

    // 11. Tìm kiếm hàng hóa (Autocomplete F3) kèm tồn kho kho gửi
    [HttpGet]
    public async Task<IActionResult> SearchProducts(string? q, int? warehouseId, int? whId)
    {
        int wh = (warehouseId.HasValue && warehouseId.Value > 0)
            ? warehouseId.Value
            : ((whId.HasValue && whId.Value > 0) ? whId.Value : GetCurrentWarehouseId());

        q = (q ?? "").Trim();

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
        var tonKhoDict = await _tonKhoService.LayTonKhoTheoKhoAsync(wh);

        var result = products.Select(p => new
        {
            id = p.MaHang,
            code = p.MaHangNoiBo,
            name = p.TenHang,
            unit = p.MaDvtNavigation?.TenDvt ?? "",
            cost = p.GiaVon,
            stock = tonKhoDict.TryGetValue(p.MaHang, out var ton) ? ton : 0m,
            // Thêm các trường cho tương thích với component f3-product-search.js
            maHang = p.MaHang,
            maHangNoiBo = p.MaHangNoiBo,
            tenHang = p.TenHang,
            tenDvt = p.MaDvtNavigation?.TenDvt ?? "",
            tenNhom = p.MaNhomNavigation?.TenNhom ?? "",
            gia = p.GiaVon,
            tonKho = tonKhoDict.TryGetValue(p.MaHang, out var ton2) ? ton2 : 0m
        }).ToList();

        return Json(result);
    }

    // 12. Xuất file Excel danh sách chuyển kho
    [HttpGet]
    public async Task<IActionResult> Export(ChuyenKhoFilterVM filter)
    {
        filter.Page = 1;
        filter.PageSize = 10000;
        var model = await BuildIndexViewModelAsync(filter);

        var bytes = ExcelHelper.Export("ChuyenHang", model.PagedData.Items, col => col
            .AddCenter("Mã chuyển hàng", x => x.MaPhieuHienThi)
            .AddDateTime("Thời gian tạo", x => x.NgayLap)
            .AddText("Kho gửi", x => x.TenKhoNguon)
            .AddText("Kho nhận", x => x.TenKhoDich)
            .AddCenter("Thời điểm xuất", x => x.ThoiDiemXuat?.ToString("dd/MM/yyyy HH:mm") ?? "")
            .AddCenter("Thời điểm nhận", x => x.ThoiDiemNhan?.ToString("dd/MM/yyyy HH:mm") ?? "")
            .AddNumber("Tổng SL chuyển", x => x.TongSoLuongChuyen)
            .AddNumber("Tổng SL nhận", x => x.TrangThai == "DA_NHAN" ? x.TongSoLuongNhan : 0)
            .AddCurrency("Tổng giá trị chuyển", x => x.TongGiaTriChuyen)
            .AddText("Người tạo", x => x.TenNguoiLap)
            .AddCenter("Trạng thái", x => x.TenTrangThai)
            .AddText("Ghi chú", x => x.GhiChu ?? "")
        );

        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"DanhSachChuyenHang_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
    }

    #region Private Helpers

    private async Task<ChuyenKhoIndexVM> BuildIndexViewModelAsync(ChuyenKhoFilterVM filter)
    {
        int whId = GetCurrentWarehouseId();
        var currentKho = await _context.Khos.FindAsync(whId);

        var query = _context.PhieuChuyenKhos
            .AsNoTracking()
            .Include(p => p.MaKhoNguonNavigation)
            .Include(p => p.MaKhoDichNavigation)
            .Include(p => p.MaNvlapNavigation)
            .Include(p => p.MaNvxuatNavigation)
            .Include(p => p.MaNvnhanNavigation)
            .Include(p => p.ChiTietPhieuChuyenKhos)
                .ThenInclude(ct => ct.MaHangNavigation)
                    .ThenInclude(h => h.MaDvtNavigation)
            .AsQueryable();

        // 1. Lọc theo ngữ cảnh kho và hướng chuyển
        if (whId != 0)
        {
            if (filter.Dir == "out")
            {
                query = query.Where(p => p.MaKhoNguon == whId);
            }
            else if (filter.Dir == "in")
            {
                query = query.Where(p => p.MaKhoDich == whId);
            }
            else
            {
                query = query.Where(p => p.MaKhoNguon == whId || p.MaKhoDich == whId);
            }
        }

        // 2. Lọc theo trạng thái
        if (filter.Statuses != null && filter.Statuses.Any())
        {
            query = query.Where(p => filter.Statuses.Contains(p.TrangThai));
        }

        // 3. Lọc theo thời gian tạo
        if (filter.FromDate.HasValue)
        {
            var from = filter.FromDate.Value.Date;
            query = query.Where(p => p.NgayLap >= from);
        }
        if (filter.ToDate.HasValue)
        {
            var to = filter.ToDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(p => p.NgayLap <= to);
        }

        // 4. Lọc theo đánh dấu sao
        if (filter.DaDanhDau)
        {
            query = query.Where(p => p.DaDanhDau);
        }

        // 5. Lọc theo từ khóa F3
        if (!string.IsNullOrWhiteSpace(filter.Q))
        {
            string keyword = filter.Q.Trim().ToLower();
            query = query.Where(p =>
                (p.MaPhieu != null && p.MaPhieu.ToLower().Contains(keyword)) ||
                (p.GhiChu != null && p.GhiChu.ToLower().Contains(keyword)) ||
                p.ChiTietPhieuChuyenKhos.Any(ct =>
                    ct.MaHangNavigation.MaHangNoiBo.ToLower().Contains(keyword) ||
                    ct.MaHangNavigation.TenHang.ToLower().Contains(keyword))
            );
        }

        // Tổng kết trước phân trang
        decimal tongSlChuyen = await query.SumAsync(p => (decimal?)p.TongSoLuongChuyen) ?? 0m;
        decimal tongSlNhan = await query.Where(p => p.TrangThai == "DA_NHAN").SumAsync(p => (decimal?)p.TongSoLuongNhan) ?? 0m;
        decimal tongGiaTri = await query.SumAsync(p => (decimal?)p.TongGiaTriChuyen) ?? 0m;

        // 6. Sắp xếp
        query = (filter.SortBy?.ToLower(), filter.SortDir?.ToLower()) switch
        {
            ("maphieu", "asc") => query.OrderBy(p => p.MaPhieu ?? p.MaPhieuChuyen.ToString()),
            ("maphieu", "desc") => query.OrderByDescending(p => p.MaPhieu ?? p.MaPhieuChuyen.ToString()),
            ("ngaylap", "asc") => query.OrderBy(p => p.NgayLap),
            ("ngaylap", "desc") => query.OrderByDescending(p => p.NgayLap),
            ("khonguon", "asc") => query.OrderBy(p => p.MaKhoNguonNavigation.TenKho),
            ("khonguon", "desc") => query.OrderByDescending(p => p.MaKhoNguonNavigation.TenKho),
            ("khodich", "asc") => query.OrderBy(p => p.MaKhoDichNavigation.TenKho),
            ("khodich", "desc") => query.OrderByDescending(p => p.MaKhoDichNavigation.TenKho),
            ("ngaychuyen", "asc") => query.OrderBy(p => p.ThoiDiemXuat),
            ("ngaychuyen", "desc") => query.OrderByDescending(p => p.ThoiDiemXuat),
            ("ngaynhan", "asc") => query.OrderBy(p => p.ThoiDiemNhan),
            ("ngaynhan", "desc") => query.OrderByDescending(p => p.ThoiDiemNhan),
            ("slchuyen", "asc") => query.OrderBy(p => p.TongSoLuongChuyen),
            ("slchuyen", "desc") => query.OrderByDescending(p => p.TongSoLuongChuyen),
            ("slnhan", "asc") => query.OrderBy(p => p.TongSoLuongNhan),
            ("slnhan", "desc") => query.OrderByDescending(p => p.TongSoLuongNhan),
            ("giatri", "asc") => query.OrderBy(p => p.TongGiaTriChuyen),
            ("giatri", "desc") => query.OrderByDescending(p => p.TongGiaTriChuyen),
            ("ghi", "asc") => query.OrderBy(p => p.GhiChu),
            ("ghi", "desc") => query.OrderByDescending(p => p.GhiChu),
            ("st", "asc") => query.OrderBy(p => p.TrangThai),
            ("st", "desc") => query.OrderByDescending(p => p.TrangThai),
            _ => query.OrderByDescending(p => p.MaPhieuChuyen)
        };

        // 7. Phân trang
        int totalItems = await query.CountAsync();
        int page = Math.Max(1, filter.Page);
        int pageSize = filter.PageSize > 0 ? filter.PageSize : 15;

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var listVM = items.Select(p => new ChuyenKhoListItemVM
        {
            MaPhieuChuyen = p.MaPhieuChuyen,
            MaPhieu = p.MaPhieu,
            MaKhoNguon = p.MaKhoNguon,
            TenKhoNguon = p.MaKhoNguonNavigation?.TenKho ?? "",
            MaKhoDich = p.MaKhoDich,
            TenKhoDich = p.MaKhoDichNavigation?.TenKho ?? "",
            MaNvlap = p.MaNvlap,
            TenNguoiLap = p.MaNvlapNavigation?.HoTen ?? "",
            MaNvxuat = p.MaNvxuat,
            TenNguoiXuat = p.MaNvxuatNavigation?.HoTen,
            MaNvnhan = p.MaNvnhan,
            TenNguoiNhan = p.MaNvnhanNavigation?.HoTen,
            NgayLap = p.NgayLap,
            ThoiDiemXuat = p.ThoiDiemXuat,
            ThoiDiemNhan = p.ThoiDiemNhan,
            TrangThai = p.TrangThai,
            GhiChu = p.GhiChu,
            GhiChuNhan = p.GhiChuNhan,
            TongSoLuongChuyen = p.TongSoLuongChuyen,
            TongSoLuongNhan = p.TongSoLuongNhan,
            TongGiaTriChuyen = p.TongGiaTriChuyen,
            DaDanhDau = p.DaDanhDau,
            Lines = p.ChiTietPhieuChuyenKhos.Select(ct => new ChuyenKhoLineVM
            {
                MaCtphieuChuyen = ct.MaCtphieuChuyen,
                MaHang = ct.MaHang,
                MaHangNoiBo = ct.MaHangNavigation?.MaHangNoiBo ?? "",
                TenHang = ct.MaHangNavigation?.TenHang ?? "",
                TenDvt = ct.MaHangNavigation?.MaDvtNavigation?.TenDvt ?? "",
                SoLuong = ct.SoLuong,
                SoLuongNhan = ct.SoLuongNhan,
                DonGiaChuyen = ct.DonGiaChuyen
            }).ToList()
        }).ToList();

        var khoList = await _context.Khos.AsNoTracking().Where(k => k.TrangThai == "HOAT_DONG").ToListAsync();

        return new ChuyenKhoIndexVM
        {
            PagedData = new PagedResult<ChuyenKhoListItemVM>
            {
                Items = listVM,
                PageIndex = page,
                PageSize = pageSize,
                TotalItems = totalItems
            },
            Filter = filter,
            CurrentKhoId = whId,
            CurrentKhoName = currentKho?.TenKho ?? "Tất cả kho",
            TongSlChuyenTong = tongSlChuyen,
            TongSlNhanTong = tongSlNhan,
            TongGiaTriTong = tongGiaTri,
            DanhSachKho = khoList
        };
    }

    private async Task PopulateWarehouseOptionsAsync(ChuyenKhoFormVM vm, int currentWhId)
    {
        var otherWarehouses = await _context.Khos
            .AsNoTracking()
            .Where(k => k.TrangThai == "HOAT_DONG" && k.MaKho != currentWhId)
            .OrderBy(k => k.TenKho)
            .Select(k => new SelectListItem
            {
                Value = k.MaKho.ToString(),
                Text = k.TenKho
            })
            .ToListAsync();

        vm.KhoNhanOptions = otherWarehouses;
    }

    private async Task<string> SinhMaPhieuTuDongAsync()
    {
        var existingCodes = await _context.PhieuChuyenKhos
            .Where(p => p.MaPhieu != null && p.MaPhieu.StartsWith("CK"))
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
        return $"CK{(maxNum + 1):D6}";
    }

    #endregion
}
