using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BTL_LTW_QuanLiKho_2.Models;
using BTL_LTW_QuanLiKho_2.Services;
using BTL_LTW_QuanLiKho_2.ViewModels;
using BTL_LTW_QuanLiKho_2.ViewModels.QuanLyKho;

namespace BTL_LTW_QuanLiKho_2.Controllers;

/// <summary>
/// Quản lý Danh mục Chi nhánh Kho
/// Chỉ cho phép người dùng có vai trò "Quản lý" truy cập và thực hiện thao tác.
/// </summary>
[Authorize(Roles = "Quản lý")]
public class KhoController : BaseKhoController
{
    private readonly INhatKyThaoTacService _nhatKyService;

    public KhoController(
        QuanLyKhoPhuQuocLtwContext context,
        INhatKyThaoTacService nhatKyService) : base(context)
    {
        _nhatKyService = nhatKyService;
    }

    /// <summary>
    /// Màn hình chính danh sách chi nhánh kho
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Index([FromQuery] KhoFilterParams filter)
    {
        filter ??= new KhoFilterParams();
        ViewBag.SortBy = filter.SortBy;
        ViewBag.SortDir = filter.SortDir;

        var vm = new KhoIndexVM
        {
            Filter = filter,
            DanhSachTaiKhoan = await _context.TaiKhoans
                .Include(t => t.MaNvNavigation)
                .Include(t => t.MaVaiTroNavigation)
                .Where(t => t.TrangThai == "HOAT_DONG")
                .OrderBy(t => t.MaVaiTro)
                .ThenBy(t => t.TenDangNhap)
                .Select(t => new TaiKhoanItemForKhoVM
                {
                    MaTaiKhoan = t.MaTaiKhoan,
                    TenDangNhap = t.TenDangNhap,
                    HoTen = t.MaNvNavigation != null ? t.MaNvNavigation.HoTen : t.TenDangNhap,
                    TenVaiTro = t.MaVaiTroNavigation != null ? t.MaVaiTroNavigation.TenVaiTro : "Nhân viên"
                })
                .ToListAsync()
        };

        // Thống kê tổng số lượng kho
        vm.TongSoKho = await _context.Khos.CountAsync();
        vm.TongHoatDong = await _context.Khos.CountAsync(k => k.TrangThai == "HOAT_DONG");
        vm.TongNgungHoatDong = vm.TongSoKho - vm.TongHoatDong;

        // Nạp trang dữ liệu đầu tiên
        vm.PagedData = await BuildPagedResultAsync(vm.Filter);

        return View(vm);
    }

    /// <summary>
    /// API AJAX lọc và phân trang bảng danh sách kho
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Filter([FromQuery] KhoFilterParams filter)
    {
        filter ??= new KhoFilterParams();
        ViewBag.SortBy = filter.SortBy;
        ViewBag.SortDir = filter.SortDir;

        var pagedResult = await BuildPagedResultAsync(filter);
        return PartialView("_KhoTable", pagedResult);
    }

    /// <summary>
    /// Lấy chi tiết 1 kho để nạp vào modal Sửa
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetItem(int id)
    {
        var kho = await _context.Khos
            .Include(k => k.TaiKhoanKhos)
            .FirstOrDefaultAsync(k => k.MaKho == id);

        if (kho == null)
        {
            return Json(new { success = false, message = "Không tìm thấy thông tin kho." });
        }

        var data = new
        {
            maKho = kho.MaKho,
            tenKho = kho.TenKho,
            diaChi = kho.DiaChi ?? string.Empty,
            moTa = kho.MoTa ?? string.Empty,
            trangThai = kho.TrangThai,
            taiKhoanIds = kho.TaiKhoanKhos.Select(tk => tk.MaTaiKhoan).ToList()
        };

        return Json(new { success = true, data });
    }

    /// <summary>
    /// Thêm mới chi nhánh kho
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] KhoFormVM model)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return Json(new { success = false, message = string.Join("<br/>", errors) });
        }

        var tenKho = model.TenKho.Trim();
        if (await _context.Khos.AnyAsync(k => k.TenKho.ToLower() == tenKho.ToLower()))
        {
            return Json(new { success = false, message = $"Tên kho '{tenKho}' đã tồn tại trong hệ thống. Vui lòng đặt tên khác." });
        }

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Tạo bản ghi Kho
            var kho = new Kho
            {
                TenKho = tenKho,
                DiaChi = string.IsNullOrWhiteSpace(model.DiaChi) ? null : model.DiaChi.Trim(),
                MoTa = string.IsNullOrWhiteSpace(model.MoTa) ? null : model.MoTa.Trim(),
                TrangThai = string.IsNullOrWhiteSpace(model.TrangThai) ? "HOAT_DONG" : model.TrangThai
            };
            _context.Khos.Add(kho);
            await _context.SaveChangesAsync();

            // 2. Gán phân quyền tài khoản vào bảng TaiKhoanKho
            // Tài khoản vai trò Quản lý luôn được cấp quyền tự động cho mọi kho
            var quanLyAccountIds = await _context.TaiKhoans
                .Where(t => t.MaVaiTroNavigation != null && t.MaVaiTroNavigation.TenVaiTro == "Quản lý")
                .Select(t => t.MaTaiKhoan)
                .ToListAsync();

            var allAssignedAccountIds = (model.TaiKhoanIds ?? new List<int>())
                .Union(quanLyAccountIds)
                .Distinct()
                .ToList();

            foreach (var accId in allAssignedAccountIds)
            {
                _context.TaiKhoanKhos.Add(new TaiKhoanKho
                {
                    MaTaiKhoan = accId,
                    MaKho = kho.MaKho,
                    NgayPhanCong = DateTime.Now,
                    GhiChu = "Phân công khi tạo mới kho"
                });
            }
            await _context.SaveChangesAsync();

            // 3. Ghi nhật ký thao tác
            await _nhatKyService.GhiNhatKyAsync(
                CurrentUserId,
                "Tạo mới",
                "Kho",
                kho.MaKho.ToString(),
                $"Tạo mới chi nhánh kho '{kho.TenKho}'"
            );

            await trans.CommitAsync();
            return Json(new { success = true, message = $"Thêm mới chi nhánh kho '{kho.TenKho}' thành công." });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return Json(new { success = false, message = "Đã xảy ra lỗi khi tạo kho: " + ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật thông tin chi nhánh kho & phân quyền nhân sự
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Edit([FromBody] KhoFormVM model)
    {
        if (model.MaKho <= 0)
        {
            return Json(new { success = false, message = "Mã kho không hợp lệ." });
        }

        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return Json(new { success = false, message = string.Join("<br/>", errors) });
        }

        var kho = await _context.Khos
            .Include(k => k.TaiKhoanKhos)
            .FirstOrDefaultAsync(k => k.MaKho == model.MaKho);

        if (kho == null)
        {
            return Json(new { success = false, message = "Không tìm thấy kho cần cập nhật." });
        }

        var tenKho = model.TenKho.Trim();
        if (await _context.Khos.AnyAsync(k => k.TenKho.ToLower() == tenKho.ToLower() && k.MaKho != model.MaKho))
        {
            return Json(new { success = false, message = $"Tên kho '{tenKho}' đã được sử dụng cho chi nhánh khác. Vui lòng chọn tên khác." });
        }

        // Chặn chuyển sang ngừng hoạt động nếu là kho hoạt động duy nhất của hệ thống hoặc là kho hiện tại
        if (model.TrangThai == "NGUNG_HOAT_DONG" && kho.TrangThai == "HOAT_DONG")
        {
            if (kho.MaKho == CurrentWarehouseId)
            {
                return Json(new { success = false, message = "Không thể ngừng hoạt động (khóa) chi nhánh kho bạn đang làm việc trong phiên này. Vui lòng chuyển sang chi nhánh kho khác trên thanh tiêu đề trước khi thao tác." });
            }

            var activeKhoCount = await _context.Khos.CountAsync(k => k.TrangThai == "HOAT_DONG");
            if (activeKhoCount <= 1)
            {
                return Json(new { success = false, message = "Hệ thống phải có ít nhất một kho đang hoạt động. Không thể ngừng hoạt động kho duy nhất này." });
            }
        }

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            kho.TenKho = tenKho;
            kho.DiaChi = string.IsNullOrWhiteSpace(model.DiaChi) ? null : model.DiaChi.Trim();
            kho.MoTa = string.IsNullOrWhiteSpace(model.MoTa) ? null : model.MoTa.Trim();
            kho.TrangThai = model.TrangThai;

            // Cập nhật phân quyền tài khoản phụ trách
            var quanLyAccountIds = await _context.TaiKhoans
                .Where(t => t.MaVaiTroNavigation != null && t.MaVaiTroNavigation.TenVaiTro == "Quản lý")
                .Select(t => t.MaTaiKhoan)
                .ToListAsync();

            var newAccIds = (model.TaiKhoanIds ?? new List<int>())
                .Union(quanLyAccountIds)
                .Distinct()
                .ToHashSet();

            var currentAccIds = kho.TaiKhoanKhos.Select(tk => tk.MaTaiKhoan).ToHashSet();

            // Xóa phân quyền cũ không còn chọn
            var accsToRemove = kho.TaiKhoanKhos
                .Where(tk => !newAccIds.Contains(tk.MaTaiKhoan))
                .ToList();

            if (accsToRemove.Any())
            {
                _context.TaiKhoanKhos.RemoveRange(accsToRemove);
            }

            // Thêm các phân quyền mới
            foreach (var accId in newAccIds.Where(a => !currentAccIds.Contains(a)))
            {
                _context.TaiKhoanKhos.Add(new TaiKhoanKho
                {
                    MaTaiKhoan = accId,
                    MaKho = kho.MaKho,
                    NgayPhanCong = DateTime.Now,
                    GhiChu = "Cập nhật phân quyền kho"
                });
            }

            await _context.SaveChangesAsync();

            // Ghi nhật ký thao tác
            await _nhatKyService.GhiNhatKyAsync(
                CurrentUserId,
                "Cập nhật",
                "Kho",
                kho.MaKho.ToString(),
                $"Cập nhật chi nhánh kho '{kho.TenKho}'"
            );

            await trans.CommitAsync();
            return Json(new { success = true, message = $"Cập nhật chi nhánh kho '{kho.TenKho}' thành công." });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return Json(new { success = false, message = "Đã xảy ra lỗi khi cập nhật: " + ex.Message });
        }
    }

    /// <summary>
    /// Chuyển đổi trạng thái nhanh (Kích hoạt / Ngừng hoạt động kho)
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var kho = await _context.Khos.FindAsync(id);
        if (kho == null)
        {
            return Json(new { success = false, message = "Không tìm thấy kho." });
        }

        var isDisabling = kho.TrangThai == "HOAT_DONG";
        if (isDisabling)
        {
            if (kho.MaKho == CurrentWarehouseId)
            {
                return Json(new { success = false, message = "Không thể ngừng hoạt động (khóa) chi nhánh kho bạn đang làm việc trong phiên này. Vui lòng chuyển sang chi nhánh kho khác trên thanh tiêu đề trước khi thao tác." });
            }

            var activeKhoCount = await _context.Khos.CountAsync(k => k.TrangThai == "HOAT_DONG");
            if (activeKhoCount <= 1)
            {
                return Json(new { success = false, message = "Hệ thống phải có ít nhất một kho đang hoạt động. Không thể ngừng hoạt động kho duy nhất này." });
            }
        }

        var newStatus = isDisabling ? "NGUNG_HOAT_DONG" : "HOAT_DONG";
        kho.TrangThai = newStatus;
        await _context.SaveChangesAsync();

        await _nhatKyService.GhiNhatKyAsync(
            CurrentUserId,
            isDisabling ? "Ngừng hoạt động" : "Kích hoạt",
            "Kho",
            kho.MaKho.ToString(),
            $"{(isDisabling ? "Ngừng hoạt động" : "Kích hoạt")} chi nhánh kho '{kho.TenKho}'"
        );

        return Json(new
        {
            success = true,
            newStatus = newStatus,
            message = isDisabling
                ? $"Đã ngừng hoạt động kho '{kho.TenKho}'."
                : $"Đã kích hoạt kho '{kho.TenKho}' hoạt động trở lại."
        });
    }

    /// <summary>
    /// Xóa chi nhánh kho (Chỉ cho phép xóa khi kho tạo nhầm, chưa phát sinh chứng từ; Nếu đã có chứng từ -> Chặn xóa và gợi ý Khóa/Ngừng hoạt động)
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Delete(int id, bool chuyenKhoa = false)
    {
        if (id <= 0)
        {
            return Json(new { success = false, message = "Mã chi nhánh kho không hợp lệ." });
        }

        var kho = await _context.Khos.FindAsync(id);
        if (kho == null)
        {
            return Json(new { success = false, message = "Không tìm thấy thông tin chi nhánh kho cần xóa." });
        }

        // Chặn xóa kho đang làm việc trong phiên
        if (kho.MaKho == CurrentWarehouseId)
        {
            return Json(new { success = false, message = "Không thể xóa chi nhánh kho bạn đang làm việc trong phiên này. Vui lòng chuyển sang chi nhánh kho khác trên thanh tiêu đề trước khi thao tác." });
        }

        // Chặn xóa nếu hệ thống chỉ còn 1 kho duy nhất
        var totalKhoCount = await _context.Khos.CountAsync();
        if (totalKhoCount <= 1)
        {
            return Json(new { success = false, message = "Hệ thống phải có ít nhất một chi nhánh kho hoạt động. Không thể xóa kho duy nhất này." });
        }

        // Kiểm tra tất cả các loại chứng từ/giao dịch liên quan đến kho này
        var hasPhieuNhap = await _context.PhieuNhaps.AnyAsync(p => p.MaKho == id);
        var hasPhieuXuat = await _context.PhieuXuats.AnyAsync(p => p.MaKho == id);
        var hasChuyenKho = await _context.PhieuChuyenKhos.AnyAsync(p => p.MaKhoNguon == id || p.MaKhoDich == id);
        var hasKiemKe = await _context.PhieuKiemKes.AnyAsync(p => p.MaKho == id);
        var hasTraHangNhap = await _context.PhieuTraHangNhaps.AnyAsync(p => p.MaKho == id);
        var hasDonBan = await _context.DonBans.AnyAsync(d => d.MaKho == id);

        var hasTransactions = hasPhieuNhap || hasPhieuXuat || hasChuyenKho || hasKiemKe || hasTraHangNhap || hasDonBan;

        if (hasTransactions)
        {
            // Nếu người dùng xác nhận chuyển sang khóa/ngừng hoạt động kho
            if (chuyenKhoa)
            {
                if (kho.TrangThai == "NGUNG_HOAT_DONG")
                {
                    return Json(new { success = true, action = "ALREADY_LOCKED", message = $"Chi nhánh kho '{kho.TenKho}' vốn đã ở trạng thái Ngừng hoạt động." });
                }

                var activeKhoCount = await _context.Khos.CountAsync(k => k.TrangThai == "HOAT_DONG");
                if (activeKhoCount <= 1)
                {
                    return Json(new { success = false, message = "Hệ thống phải có ít nhất một kho đang hoạt động. Không thể ngừng hoạt động kho duy nhất này." });
                }

                kho.TrangThai = "NGUNG_HOAT_DONG";
                await _context.SaveChangesAsync();

                await _nhatKyService.GhiNhatKyAsync(
                    CurrentUserId,
                    "Ngừng hoạt động",
                    "Kho",
                    kho.MaKho.ToString(),
                    $"Ngừng hoạt động chi nhánh kho '{kho.TenKho}' do đã phát sinh chứng từ không thể xóa"
                );

                return Json(new
                {
                    success = true,
                    action = "LOCKED",
                    message = $"Đã chuyển chi nhánh kho '{kho.TenKho}' sang trạng thái Ngừng hoạt động."
                });
            }

            // Chưa xác nhận chuyển khóa -> Chặn xóa và thông báo cho người dùng
            return Json(new
            {
                success = false,
                hasTransaction = true,
                isLocked = (kho.TrangThai == "NGUNG_HOAT_DONG"),
                message = $"Chi nhánh kho '<b>{kho.TenKho}</b>' đã phát sinh chứng từ (nhập, xuất, chuyển kho hoặc kiểm kê) trong hệ thống.<br>" +
                          "Để bảo toàn lịch sử sổ sách và số liệu kho, bạn <b>không thể xóa vĩnh viễn</b> kho này."
            });
        }

        // Trường hợp kho chưa từng phát sinh chứng từ (tạo nhầm / kho mới thử nghiệm) -> Xóa vĩnh viễn an toàn
        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Xóa các phân quyền tài khoản phụ trách kho trong TaiKhoanKho
            var assignedAccounts = await _context.TaiKhoanKhos.Where(t => t.MaKho == id).ToListAsync();
            if (assignedAccounts.Any())
            {
                _context.TaiKhoanKhos.RemoveRange(assignedAccounts);
            }

            // 2. Xóa các cấu hình ngưỡng tồn kho nếu có
            var nguongTons = await _context.NguongTonKhos.Where(n => n.MaKho == id).ToListAsync();
            if (nguongTons.Any())
            {
                _context.NguongTonKhos.RemoveRange(nguongTons);
            }

            // 3. Xóa chi nhánh kho
            _context.Khos.Remove(kho);
            await _context.SaveChangesAsync();

            // 4. Ghi nhật ký kiểm toán
            await _nhatKyService.GhiNhatKyAsync(
                CurrentUserId,
                "Xóa",
                "Kho",
                id.ToString(),
                $"Xóa chi nhánh kho '{kho.TenKho}' (kho tạo nhầm, chưa phát sinh chứng từ)"
            );

            await trans.CommitAsync();

            return Json(new
            {
                success = true,
                message = $"Đã xóa chi nhánh kho '{kho.TenKho}' thành công."
            });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return Json(new { success = false, message = "Đã xảy ra lỗi khi xóa kho: " + ex.Message });
        }
    }

    /// <summary>
    /// Hàm xây dựng PagedResult phân trang và lọc cho danh sách kho
    /// </summary>
    private async Task<PagedResult<KhoListItemVM>> BuildPagedResultAsync(KhoFilterParams filter)
    {
        var query = _context.Khos
            .Include(k => k.TaiKhoanKhos)
                .ThenInclude(tk => tk.MaTaiKhoanNavigation)
                    .ThenInclude(t => t.MaNvNavigation)
            .Include(k => k.PhieuNhaps)
            .Include(k => k.PhieuXuats)
            .Include(k => k.PhieuKiemKes)
            .Include(k => k.PhieuChuyenKhoMaKhoNguonNavigations)
            .Include(k => k.PhieuChuyenKhoMaKhoDichNavigations)
            .AsNoTracking()
            .AsQueryable();

        // 1. Tìm kiếm theo từ khóa (Tên kho, Địa chỉ, Mô tả)
        if (!string.IsNullOrWhiteSpace(filter.Q))
        {
            var q = filter.Q.Trim().ToLower();
            query = query.Where(k =>
                k.TenKho.ToLower().Contains(q) ||
                (k.DiaChi != null && k.DiaChi.ToLower().Contains(q)) ||
                (k.MoTa != null && k.MoTa.ToLower().Contains(q))
            );
        }

        // 2. Lọc theo Trạng thái
        if (filter.TrangThais != null && filter.TrangThais.Any())
        {
            query = query.Where(k => filter.TrangThais.Contains(k.TrangThai));
        }

        // 3. Đếm tổng số bản ghi
        var totalItems = await query.CountAsync();

        // 4. Sắp xếp
        var sortBy = filter.SortBy?.ToLower();
        var isDesc = filter.SortDir?.ToLower() == "desc";

        query = sortBy switch
        {
            "tenkho" => isDesc ? query.OrderByDescending(k => k.TenKho) : query.OrderBy(k => k.TenKho),
            "diachi" => isDesc ? query.OrderByDescending(k => k.DiaChi) : query.OrderBy(k => k.DiaChi),
            "trangthai" => isDesc ? query.OrderByDescending(k => k.TrangThai) : query.OrderBy(k => k.TrangThai),
            "nhanvien" => isDesc ? query.OrderByDescending(k => k.TaiKhoanKhos.Count) : query.OrderBy(k => k.TaiKhoanKhos.Count),
            _ => query.OrderBy(k => k.MaKho)
        };

        // 5. Phân trang
        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Max(1, filter.PageSize);
        var currentWhId = CurrentWarehouseId;

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(k => new KhoListItemVM
            {
                MaKho = k.MaKho,
                TenKho = k.TenKho,
                DiaChi = k.DiaChi,
                MoTa = k.MoTa,
                TrangThai = k.TrangThai,
                SoNhanVien = k.TaiKhoanKhos.Count,
                DanhSachNhanVien = k.TaiKhoanKhos
                    .Select(tk => tk.MaTaiKhoanNavigation.MaNvNavigation != null
                        ? tk.MaTaiKhoanNavigation.MaNvNavigation.HoTen
                        : tk.MaTaiKhoanNavigation.TenDangNhap)
                    .ToList(),
                SoChungTuLienQuan = k.PhieuNhaps.Count + k.PhieuXuats.Count + k.PhieuKiemKes.Count +
                                    k.PhieuChuyenKhoMaKhoNguonNavigations.Count + k.PhieuChuyenKhoMaKhoDichNavigations.Count,
                IsCurrentWarehouse = (k.MaKho == currentWhId)
            })
            .ToListAsync();

        return new PagedResult<KhoListItemVM>(items, totalItems, page, pageSize);
    }
}
