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
using BTL_LTW_QuanLiKho_2.ViewModels.NguoiDung;

namespace BTL_LTW_QuanLiKho_2.Controllers;

/// <summary>
/// Quản lý Người dùng & Phân quyền chi nhánh kho
/// Chỉ cho phép người dùng có vai trò "Quản lý" truy cập và thao tác.
/// </summary>
[Authorize(Roles = "Quản lý")]
public class NguoiDungController : BaseKhoController
{
    private readonly INhatKyThaoTacService _nhatKyService;

    public NguoiDungController(
        QuanLyKhoPhuQuocLtwContext context,
        INhatKyThaoTacService nhatKyService) : base(context)
    {
        _nhatKyService = nhatKyService;
    }

    /// <summary>
    /// Màn hình chính danh sách người dùng & phân quyền
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Index([FromQuery] NguoiDungFilterParams filter)
    {
        filter ??= new NguoiDungFilterParams();
        ViewBag.SortBy = filter.SortBy;
        ViewBag.SortDir = filter.SortDir;

        var vm = new NguoiDungIndexVM
        {
            Filter = filter,
            VaiTroList = await _context.VaiTros.OrderBy(v => v.MaVaiTro).ToListAsync(),
            KhoList = await _context.Khos.Where(k => k.TrangThai == "HOAT_DONG").OrderBy(k => k.MaKho).ToListAsync()
        };

        // Thống kê tổng số lượng
        vm.TongNguoiDung = await _context.TaiKhoans.CountAsync();
        vm.TongHoatDong = await _context.TaiKhoans.CountAsync(t => t.TrangThai == "HOAT_DONG");
        vm.TongBiKhoa = vm.TongNguoiDung - vm.TongHoatDong;

        // Nạp trang dữ liệu ban đầu
        vm.PagedData = await BuildPagedResultAsync(vm.Filter);

        return View(vm);
    }

    /// <summary>
    /// API AJAX lọc và phân trang bảng danh sách người dùng
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Filter([FromQuery] NguoiDungFilterParams filter)
    {
        filter ??= new NguoiDungFilterParams();
        ViewBag.SortBy = filter.SortBy;
        ViewBag.SortDir = filter.SortDir;

        var pagedResult = await BuildPagedResultAsync(filter);
        return PartialView("_NguoiDungTable", pagedResult);
    }

    /// <summary>
    /// Lấy chi tiết 1 tài khoản để nạp vào modal Sửa người dùng
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetItem(int id)
    {
        var taiKhoan = await _context.TaiKhoans
            .Include(t => t.MaNvNavigation)
            .Include(t => t.TaiKhoanKhos)
            .FirstOrDefaultAsync(t => t.MaTaiKhoan == id);

        if (taiKhoan == null)
        {
            return Json(new { success = false, message = "Không tìm thấy thông tin tài khoản." });
        }

        var data = new
        {
            maTaiKhoan = taiKhoan.MaTaiKhoan,
            maNv = taiKhoan.MaNv,
            hoTen = taiKhoan.MaNvNavigation?.HoTen ?? string.Empty,
            dienThoai = taiKhoan.MaNvNavigation?.DienThoai ?? string.Empty,
            email = taiKhoan.MaNvNavigation?.Email ?? string.Empty,
            diaChi = taiKhoan.MaNvNavigation?.DiaChi ?? string.Empty,
            ghiChu = taiKhoan.MaNvNavigation?.GhiChu ?? string.Empty,
            tenDangNhap = taiKhoan.TenDangNhap,
            maVaiTro = taiKhoan.MaVaiTro,
            trangThai = taiKhoan.TrangThai,
            khoIds = taiKhoan.TaiKhoanKhos.Select(tk => tk.MaKho).ToList()
        };

        return Json(new { success = true, data });
    }

    /// <summary>
    /// Thêm mới Người dùng, Tài khoản và Phân quyền kho
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] NguoiDungFormVM model)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return Json(new { success = false, message = string.Join("<br/>", errors) });
        }

        if (string.IsNullOrWhiteSpace(model.MatKhau) || model.MatKhau.Length < 6)
        {
            return Json(new { success = false, message = "Mật khẩu ban đầu bắt buộc và phải có ít nhất 6 ký tự." });
        }

        var username = model.TenDangNhap.Trim().ToLowerInvariant();
        if (await _context.TaiKhoans.AnyAsync(t => t.TenDangNhap.ToLower() == username))
        {
            return Json(new { success = false, message = $"Tên đăng nhập '{model.TenDangNhap}' đã được sử dụng. Vui lòng chọn tên khác." });
        }

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Tạo bản ghi Nhân viên
            var nhanVien = new NhanVien
            {
                HoTen = model.HoTen.Trim(),
                DienThoai = string.IsNullOrWhiteSpace(model.DienThoai) ? null : model.DienThoai.Trim(),
                Email = string.IsNullOrWhiteSpace(model.Email) ? null : model.Email.Trim(),
                DiaChi = string.IsNullOrWhiteSpace(model.DiaChi) ? null : model.DiaChi.Trim(),
                GhiChu = string.IsNullOrWhiteSpace(model.GhiChu) ? null : model.GhiChu.Trim(),
                NgayVaoLam = DateOnly.FromDateTime(DateTime.Now),
                TrangThai = model.TrangThai == "HOAT_DONG" ? "DANG_LAM" : "NGHI_VIEC"
            };
            _context.NhanViens.Add(nhanVien);
            await _context.SaveChangesAsync();

            // 2. Tạo bản ghi Tài khoản (Băm SHA-256)
            var taiKhoan = new TaiKhoan
            {
                MaNv = nhanVien.MaNv,
                MaVaiTro = model.MaVaiTro,
                TenDangNhap = model.TenDangNhap.Trim(),
                MatKhauHash = PasswordHelper.HashPassword(model.MatKhau),
                TrangThai = model.TrangThai
            };
            _context.TaiKhoans.Add(taiKhoan);
            await _context.SaveChangesAsync();

            // 3. Gán phân quyền kho trong TaiKhoanKho
            if (model.KhoIds != null && model.KhoIds.Any())
            {
                foreach (var khoId in model.KhoIds.Distinct())
                {
                    _context.TaiKhoanKhos.Add(new TaiKhoanKho
                    {
                        MaTaiKhoan = taiKhoan.MaTaiKhoan,
                        MaKho = khoId,
                        NgayPhanCong = DateTime.Now,
                        GhiChu = "Phân công khi tạo mới tài khoản"
                    });
                }
                await _context.SaveChangesAsync();
            }

            // 4. Ghi nhật ký thao tác
            await _nhatKyService.GhiNhatKyAsync(
                CurrentUserId,
                "Tạo mới",
                "TaiKhoan",
                taiKhoan.MaTaiKhoan.ToString(),
                $"Tạo tài khoản '{taiKhoan.TenDangNhap}' cho nhân viên '{nhanVien.HoTen}'"
            );

            await trans.CommitAsync();
            return Json(new { success = true, message = "Tạo người dùng mới thành công." });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return Json(new { success = false, message = "Đã xảy ra lỗi khi tạo tài khoản: " + ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật thông tin Người dùng, Vai trò & Phân quyền kho
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Edit([FromBody] NguoiDungFormVM model)
    {
        if (model.MaTaiKhoan <= 0)
        {
            return Json(new { success = false, message = "Mã tài khoản không hợp lệ." });
        }

        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return Json(new { success = false, message = string.Join("<br/>", errors) });
        }

        var taiKhoan = await _context.TaiKhoans
            .Include(t => t.MaNvNavigation)
            .Include(t => t.TaiKhoanKhos)
            .FirstOrDefaultAsync(t => t.MaTaiKhoan == model.MaTaiKhoan);

        if (taiKhoan == null)
        {
            return Json(new { success = false, message = "Không tìm thấy tài khoản cần cập nhật." });
        }

        // Kiểm tra không được khóa tài khoản của chính mình
        if (taiKhoan.MaTaiKhoan == CurrentUserId && model.TrangThai == "KHOA")
        {
            return Json(new { success = false, message = "Bạn không thể tự khóa tài khoản của chính mình." });
        }

        // Kiểm tra trùng tên đăng nhập với tài khoản khác
        var username = model.TenDangNhap.Trim().ToLowerInvariant();
        if (await _context.TaiKhoans.AnyAsync(t => t.TenDangNhap.ToLower() == username && t.MaTaiKhoan != model.MaTaiKhoan))
        {
            return Json(new { success = false, message = $"Tên đăng nhập '{model.TenDangNhap}' đã được tài khoản khác sử dụng." });
        }

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Cập nhật thông tin nhân viên
            if (taiKhoan.MaNvNavigation != null)
            {
                taiKhoan.MaNvNavigation.HoTen = model.HoTen.Trim();
                taiKhoan.MaNvNavigation.DienThoai = string.IsNullOrWhiteSpace(model.DienThoai) ? null : model.DienThoai.Trim();
                taiKhoan.MaNvNavigation.Email = string.IsNullOrWhiteSpace(model.Email) ? null : model.Email.Trim();
                taiKhoan.MaNvNavigation.DiaChi = string.IsNullOrWhiteSpace(model.DiaChi) ? null : model.DiaChi.Trim();
                taiKhoan.MaNvNavigation.GhiChu = string.IsNullOrWhiteSpace(model.GhiChu) ? null : model.GhiChu.Trim();
                taiKhoan.MaNvNavigation.TrangThai = model.TrangThai == "HOAT_DONG" ? "DANG_LAM" : "NGHI_VIEC";
            }

            // 2. Cập nhật thông tin tài khoản
            taiKhoan.TenDangNhap = model.TenDangNhap.Trim();
            taiKhoan.MaVaiTro = model.MaVaiTro;
            taiKhoan.TrangThai = model.TrangThai;

            // Nếu người dùng nhập mật khẩu mới thì cập nhật
            if (!string.IsNullOrWhiteSpace(model.MatKhau))
            {
                var newPw = model.MatKhau.Trim();
                if (newPw.Length < 6)
                {
                    return Json(new { success = false, message = "Mật khẩu mới phải có ít nhất 6 ký tự." });
                }
                taiKhoan.MatKhauHash = PasswordHelper.HashPassword(newPw);
            }

            // 3. Cập nhật phân quyền chi nhánh kho
            var newKhoIds = model.KhoIds != null ? model.KhoIds.Distinct().ToHashSet() : new HashSet<int>();
            var currentKhoIds = taiKhoan.TaiKhoanKhos.Select(tk => tk.MaKho).ToHashSet();

            // Xóa các kho bị bỏ chọn
            var khoToRemove = taiKhoan.TaiKhoanKhos.Where(tk => !newKhoIds.Contains(tk.MaKho)).ToList();
            if (khoToRemove.Any())
            {
                _context.TaiKhoanKhos.RemoveRange(khoToRemove);
            }

            // Thêm các kho mới được chọn
            foreach (var khoId in newKhoIds.Where(k => !currentKhoIds.Contains(k)))
            {
                _context.TaiKhoanKhos.Add(new TaiKhoanKho
                {
                    MaTaiKhoan = taiKhoan.MaTaiKhoan,
                    MaKho = khoId,
                    NgayPhanCong = DateTime.Now,
                    GhiChu = "Cập nhật phân quyền kho"
                });
            }

            await _context.SaveChangesAsync();

            // 4. Ghi nhật ký
            await _nhatKyService.GhiNhatKyAsync(
                CurrentUserId,
                "Cập nhật",
                "TaiKhoan",
                taiKhoan.MaTaiKhoan.ToString(),
                $"Cập nhật tài khoản '{taiKhoan.TenDangNhap}'"
            );

            await trans.CommitAsync();
            return Json(new { success = true, message = "Cập nhật thông tin người dùng thành công." });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return Json(new { success = false, message = "Đã xảy ra lỗi khi cập nhật: " + ex.Message });
        }
    }

    /// <summary>
    /// Chuyển đổi trạng thái nhanh (Khóa / Mở khóa tài khoản)
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        if (id == CurrentUserId)
        {
            return Json(new { success = false, message = "Bạn không thể tự khóa tài khoản của chính mình." });
        }

        var taiKhoan = await _context.TaiKhoans
            .Include(t => t.MaNvNavigation)
            .FirstOrDefaultAsync(t => t.MaTaiKhoan == id);

        if (taiKhoan == null)
        {
            return Json(new { success = false, message = "Không tìm thấy tài khoản." });
        }

        var newStatus = taiKhoan.TrangThai == "HOAT_DONG" ? "KHOA" : "HOAT_DONG";
        taiKhoan.TrangThai = newStatus;

        if (taiKhoan.MaNvNavigation != null)
        {
            taiKhoan.MaNvNavigation.TrangThai = newStatus == "HOAT_DONG" ? "DANG_LAM" : "NGHI_VIEC";
        }

        await _context.SaveChangesAsync();

        await _nhatKyService.GhiNhatKyAsync(
            CurrentUserId,
            newStatus == "HOAT_DONG" ? "Mở khóa" : "Khóa",
            "TaiKhoan",
            taiKhoan.MaTaiKhoan.ToString(),
            $"{(newStatus == "HOAT_DONG" ? "Mở khóa" : "Khóa")} tài khoản '{taiKhoan.TenDangNhap}'"
        );

        return Json(new
        {
            success = true,
            newStatus = newStatus,
            message = newStatus == "HOAT_DONG"
                ? $"Đã mở khóa tài khoản '{taiKhoan.TenDangNhap}'."
                : $"Đã khóa tài khoản '{taiKhoan.TenDangNhap}'."
        });
    }

    /// <summary>
    /// Đặt lại mật khẩu nhanh cho người dùng
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> ResetPassword([FromBody] DoiMatKhauVM model)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return Json(new { success = false, message = string.Join("<br/>", errors) });
        }

        var taiKhoan = await _context.TaiKhoans.FindAsync(model.MaTaiKhoan);
        if (taiKhoan == null)
        {
            return Json(new { success = false, message = "Không tìm thấy tài khoản." });
        }

        taiKhoan.MatKhauHash = PasswordHelper.HashPassword(model.MatKhauMoi);
        await _context.SaveChangesAsync();

        await _nhatKyService.GhiNhatKyAsync(
            CurrentUserId,
            "Đổi mật khẩu",
            "TaiKhoan",
            taiKhoan.MaTaiKhoan.ToString(),
            $"Đặt lại mật khẩu cho tài khoản '{taiKhoan.TenDangNhap}'"
        );

        return Json(new { success = true, message = $"Đặt lại mật khẩu cho tài khoản '{taiKhoan.TenDangNhap}' thành công." });
    }

    /// <summary>
    /// Hàm xây dựng PagedResult phân trang và lọc cho danh sách người dùng
    /// </summary>
    private async Task<PagedResult<NguoiDungItemVM>> BuildPagedResultAsync(NguoiDungFilterParams filter)
    {
        var query = _context.TaiKhoans
            .Include(t => t.MaNvNavigation)
            .Include(t => t.MaVaiTroNavigation)
            .Include(t => t.TaiKhoanKhos)
                .ThenInclude(tk => tk.MaKhoNavigation)
            .AsNoTracking()
            .AsQueryable();

        // 1. Tìm kiếm theo từ khóa (Tên đăng nhập, Họ tên, SĐT, Email)
        if (!string.IsNullOrWhiteSpace(filter.Q))
        {
            var q = filter.Q.Trim().ToLower();
            query = query.Where(t =>
                t.TenDangNhap.ToLower().Contains(q) ||
                (t.MaNvNavigation != null && t.MaNvNavigation.HoTen.ToLower().Contains(q)) ||
                (t.MaNvNavigation != null && t.MaNvNavigation.DienThoai != null && t.MaNvNavigation.DienThoai.Contains(q)) ||
                (t.MaNvNavigation != null && t.MaNvNavigation.Email != null && t.MaNvNavigation.Email.ToLower().Contains(q))
            );
        }

        // 2. Lọc theo Vai trò
        if (filter.VaiTroIds != null && filter.VaiTroIds.Any())
        {
            query = query.Where(t => filter.VaiTroIds.Contains(t.MaVaiTro));
        }

        // 3. Lọc theo Trạng thái
        if (filter.TrangThais != null && filter.TrangThais.Any())
        {
            query = query.Where(t => filter.TrangThais.Contains(t.TrangThai));
        }

        // 4. Lọc theo Kho được phân công
        if (filter.KhoIds != null && filter.KhoIds.Any())
        {
            query = query.Where(t =>
                t.TaiKhoanKhos.Any(tk => filter.KhoIds.Contains(tk.MaKho)) ||
                (t.MaVaiTroNavigation != null && t.MaVaiTroNavigation.TenVaiTro == "Quản lý")
            );
        }

        // 5. Đếm tổng số bản ghi
        var totalItems = await query.CountAsync();

        // 6. Sắp xếp
        var sortBy = filter.SortBy?.ToLower();
        var isDesc = filter.SortDir?.ToLower() == "desc";

        query = sortBy switch
        {
            "tendangnhap" => isDesc ? query.OrderByDescending(t => t.TenDangNhap) : query.OrderBy(t => t.TenDangNhap),
            "hoten" => isDesc ? query.OrderByDescending(t => t.MaNvNavigation.HoTen) : query.OrderBy(t => t.MaNvNavigation.HoTen),
            "vaitro" => isDesc ? query.OrderByDescending(t => t.MaVaiTroNavigation.TenVaiTro) : query.OrderBy(t => t.MaVaiTroNavigation.TenVaiTro),
            "trangthai" => isDesc ? query.OrderByDescending(t => t.TrangThai) : query.OrderBy(t => t.TrangThai),
            _ => query.OrderByDescending(t => t.MaTaiKhoan)
        };

        // 7. Phân trang
        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Max(1, filter.PageSize);
        var currentUserId = CurrentUserId;

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new NguoiDungItemVM
            {
                MaTaiKhoan = t.MaTaiKhoan,
                MaNv = t.MaNv,
                TenDangNhap = t.TenDangNhap,
                HoTen = t.MaNvNavigation != null ? t.MaNvNavigation.HoTen : t.TenDangNhap,
                DienThoai = t.MaNvNavigation != null ? t.MaNvNavigation.DienThoai : null,
                Email = t.MaNvNavigation != null ? t.MaNvNavigation.Email : null,
                GhiChu = t.MaNvNavigation != null ? t.MaNvNavigation.GhiChu : null,
                MaVaiTro = t.MaVaiTro,
                TenVaiTro = t.MaVaiTroNavigation != null ? t.MaVaiTroNavigation.TenVaiTro : "Nhân viên",
                TrangThai = t.TrangThai,
                LanDangNhapCuoi = t.LanDangNhapCuoi,
                IsCurrentUser = (t.MaTaiKhoan == currentUserId),
                DanhSachKho = t.MaVaiTroNavigation != null && t.MaVaiTroNavigation.TenVaiTro == "Quản lý"
                    ? new List<string> { "Tất cả các kho" }
                    : t.TaiKhoanKhos.Select(tk => tk.MaKhoNavigation.TenKho).ToList(),
                DanhSachMaKho = t.TaiKhoanKhos.Select(tk => tk.MaKho).ToList()
            })
            .ToListAsync();

        return new PagedResult<NguoiDungItemVM>(items, totalItems, page, pageSize);
    }
}
