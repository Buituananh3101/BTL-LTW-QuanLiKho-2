using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using BTL_LTW_QuanLiKho_2.Models;
using BTL_LTW_QuanLiKho_2.Helpers;
using BTL_LTW_QuanLiKho_2.Services;
using BTL_LTW_QuanLiKho_2.ViewModels;
using BTL_LTW_QuanLiKho_2.ViewModels.KhachHang;

namespace BTL_LTW_QuanLiKho_2.Controllers;

[Authorize]
public class KhachHangController : BaseKhoController
{
    private readonly ILogger<KhachHangController> _logger;
    private readonly INhatKyThaoTacService _nhatKyService;
    private readonly IWebHostEnvironment _env;

    // Danh sách ngân hàng thương mại phổ biến Việt Nam
    private static readonly List<string> DanhSachNganHang = new()
    {
        "Vietcombank (Ngân hàng Ngoại thương Việt Nam)",
        "BIDV (Ngân hàng Đầu tư và Phát triển Việt Nam)",
        "VietinBank (Ngân hàng Công thương Việt Nam)",
        "Agribank (Ngân hàng Nông nghiệp & PT Nông thôn)",
        "Techcombank (Ngân hàng Kỹ thương Việt Nam)",
        "MBBank (Ngân hàng Quân đội)",
        "ACB (Ngân hàng Á Châu)",
        "VPBank (Ngân hàng Việt Nam Thịnh Vượng)",
        "TPBank (Ngân hàng Tiên Phong)",
        "Sacombank (Ngân hàng Sài Gòn Thương Tín)",
        "HDBank (Ngân hàng Phát triển TP.HCM)",
        "VIB (Ngân hàng Quốc tế)",
        "MSB (Ngân hàng Hàng Hải)",
        "SHB (Ngân hàng Sài Gòn - Hà Nội)",
        "OCB (Ngân hàng Phương Đông)"
    };

    // Danh sách tỉnh thành phổ biến
    private static readonly List<string> DanhSachTinhThanh = new()
    {
        "Kiên Giang", "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", 
        "Hải Phòng", "An Giang", "Cà Mau", "Bình Dương", "Đồng Nai", 
        "Bà Rịa - Vũng Tàu", "Khánh Hòa", "Lâm Đồng", "Quảng Ninh"
    };

    public KhachHangController(
        QuanLyKhoPhuQuocLtwContext context,
        ILogger<KhachHangController> logger,
        INhatKyThaoTacService nhatKyService,
        IWebHostEnvironment env) : base(context)
    {
        _logger = logger;
        _nhatKyService = nhatKyService;
        _env = env;
    }

    // 1. Màn hình chính danh sách Khách hàng
    [HttpGet]
    public async Task<IActionResult> Index(KhachHangFilterParams filter)
    {
        if (Request.Query.ContainsKey("export") && string.Equals(Request.Query["export"], "excel", StringComparison.OrdinalIgnoreCase))
        {
            return await ExportExcel(filter);
        }

        var (items, totalItems, totalBan, totalNo) = await QueryKhachHangDataAsync(filter, applyPaging: true);

        // Lấy danh sách nhóm khách hàng
        var nhomList = await _context.NhomKhachHangs.AsNoTracking()
            .Select(n => new NhomKhachHangItemVM
            {
                MaNhomKhachHang = n.MaNhomKhachHang,
                TenNhom = n.TenNhom,
                GhiChu = n.GhiChu,
                SoKhachHang = n.KhachHangs.Count
            })
            .ToListAsync();

        // Lấy danh sách người tạo
        var nhanViens = await _context.KhachHangs.AsNoTracking()
            .Where(k => !string.IsNullOrEmpty(k.NguoiTao))
            .Select(k => k.NguoiTao!)
            .Distinct()
            .ToListAsync();

        var vm = new KhachHangIndexVM
        {
            PagedData = new PagedResult<KhachHangItemVM>
            {
                Items = items,
                TotalItems = totalItems,
                PageIndex = filter.Page,
                PageSize = filter.PageSize
            },
            Filter = filter,
            SortBy = filter.SortBy ?? "makh",
            SortDir = filter.SortDir ?? "desc",
            TongSoKhachHang = totalItems,
            TongBanToanBo = totalBan,
            TongNoToanBo = totalNo,
            NhomKhachHangs = nhomList,
            NhanViens = nhanViens,
            TinhThanhs = DanhSachTinhThanh
        };

        ViewBag.DanhSachNganHang = DanhSachNganHang;
        ViewBag.DanhSachTinhThanh = DanhSachTinhThanh;

        return View(vm);
    }

    // 2. Lọc danh sách qua AJAX
    [HttpGet]
    public async Task<IActionResult> Filter(KhachHangFilterParams filter)
    {
        var (items, totalItems, _, _) = await QueryKhachHangDataAsync(filter, applyPaging: true);

        var pagedData = new PagedResult<KhachHangItemVM>
        {
            Items = items,
            TotalItems = totalItems,
            PageIndex = filter.Page,
            PageSize = filter.PageSize
        };

        ViewBag.SortBy = filter.SortBy ?? "makh";
        ViewBag.SortDir = filter.SortDir ?? "desc";
        ViewBag.DaDanhDauFilter = filter.DaDanhDau;

        return PartialView("_KhachHangTable", pagedData);
    }

    // 3. Lấy thông tin 1 khách hàng để nạp vào Modal sửa (JSON)
    [HttpGet]
    public async Task<IActionResult> GetItem(int id)
    {
        var kh = await _context.KhachHangs.AsNoTracking()
            .Include(k => k.MaNhomKhachHangNavigation)
            .FirstOrDefaultAsync(k => k.MaKh == id);

        if (kh == null)
        {
            return Json(new { success = false, message = "Không tìm thấy khách hàng yêu cầu." });
        }

        var form = new KhachHangFormVM
        {
            MaKh = kh.MaKh,
            MaKhCustom = kh.MaKhHienThi ?? $"KH{kh.MaKh:D5}",
            TenKh = kh.TenKh,
            DienThoai = kh.DienThoai,
            DienThoai2 = kh.DienThoai2,
            NgaySinh = kh.NgaySinh,
            GioiTinh = kh.GioiTinh,
            Email = kh.Email,
            Facebook = kh.Facebook,
            HinhAnh = kh.HinhAnh,
            DiaChi = kh.DiaChi,
            KhuVuc = kh.KhuVuc,
            PhuongXa = kh.PhuongXa,
            MaNhomKhachHang = kh.MaNhomKhachHang,
            GhiChu = kh.GhiChu,
            LoaiKhachHang = kh.LoaiKhachHang,
            TrangThai = kh.TrangThai,

            // Xuất HĐ
            XhdLoaiKhachHang = kh.XhdLoaiKhachHang ?? "CA_NHAN",
            MaSoThue = kh.MaSoThue,
            XhdTenDonVi = kh.XhdTenDonVi,
            SoCccd = kh.SoCccd,
            TenNguoiMua = kh.TenNguoiMua,
            XhdDiaChi = kh.XhdDiaChi,
            XhdKhuVuc = kh.XhdKhuVuc,
            XhdPhuongXa = kh.XhdPhuongXa,
            XhdEmail = kh.XhdEmail,
            SoHoChieu = kh.SoHoChieu,
            MaDvqhns = kh.MaDvqhns,
            XhdSoDienThoai = kh.XhdSoDienThoai,
            TenNganHang = kh.TenNganHang,
            SoTaiKhoanNganHang = kh.SoTaiKhoanNganHang
        };

        return Json(new { success = true, data = form });
    }

    // 4. Lấy chi tiết khách hàng nạp vào Drawer Inline
    [HttpGet]
    public async Task<IActionResult> GetDetail(int id)
    {
        var kh = await _context.KhachHangs.AsNoTracking()
            .Include(k => k.MaNhomKhachHangNavigation)
            .FirstOrDefaultAsync(k => k.MaKh == id);

        if (kh == null)
        {
            return NotFound("Không tìm thấy khách hàng.");
        }

        var donBans = await _context.DonBans.AsNoTracking()
            .Where(d => d.MaKh == id)
            .Include(d => d.MaKhoNavigation)
            .Include(d => d.MaNvlapNavigation)
            .Include(d => d.ChiTietDonBans)
            .Include(d => d.KhoanThus)
            .OrderByDescending(d => d.NgayLap)
            .ToListAsync();

        var donBanVMs = donBans.Select(d =>
        {
            decimal tongTien = d.ChiTietDonBans.Sum(ct => ct.SoLuong * ct.DonGiaApDung - ct.ChietKhau);
            decimal daThu = d.KhoanThus.Sum(kt => kt.SoTien);
            return new KhachHangLichSuDonBanVM
            {
                MaDonBan = d.MaDonBan,
                NgayLap = d.NgayLap,
                TenKho = d.MaKhoNavigation?.TenKho ?? "Chưa phân",
                NguoiLap = d.MaNvlapNavigation?.HoTen ?? "Hệ thống",
                TongTien = tongTien,
                DaThu = daThu,
                TrangThai = d.TrangThai,
                GhiChu = d.GhiChu
            };
        }).ToList();

        decimal tongBan = donBanVMs.Sum(x => x.TongTien);
        decimal tongDaThu = donBanVMs.Sum(x => x.DaThu);

        var vm = new KhachHangDetailVM
        {
            ThongTin = new KhachHangItemVM
            {
                MaKh = kh.MaKh,
                MaKhHienThi = kh.MaKhHienThi ?? $"KH{kh.MaKh:D5}",
                TenKh = kh.TenKh,
                DienThoai = kh.DienThoai,
                DienThoai2 = kh.DienThoai2,
                NgaySinh = kh.NgaySinh,
                GioiTinh = kh.GioiTinh,
                Email = kh.Email,
                Facebook = kh.Facebook,
                HinhAnh = kh.HinhAnh,
                DiaChi = kh.DiaChi,
                KhuVuc = kh.KhuVuc,
                PhuongXa = kh.PhuongXa,
                MaNhomKhachHang = kh.MaNhomKhachHang,
                TenNhomKhachHang = kh.MaNhomKhachHangNavigation?.TenNhom ?? "Chưa phân nhóm",
                GhiChu = kh.GhiChu,
                NgayTao = kh.NgayTao,
                NguoiTao = kh.NguoiTao ?? "Hệ thống",
                DaDanhDau = kh.DaDanhDau,
                LoaiKhachHang = kh.LoaiKhachHang,
                TrangThai = kh.TrangThai,
                TongBan = tongBan,
                TongBanTruTraHang = tongBan,
                DaThu = tongDaThu,
                NoHienTai = tongBan - tongDaThu,
                SoDonBan = donBanVMs.Count,

                // Xuất HĐ
                XhdLoaiKhachHang = kh.XhdLoaiKhachHang,
                MaSoThue = kh.MaSoThue,
                XhdTenDonVi = kh.XhdTenDonVi,
                SoCccd = kh.SoCccd,
                TenNguoiMua = kh.TenNguoiMua,
                XhdDiaChi = kh.XhdDiaChi,
                XhdKhuVuc = kh.XhdKhuVuc,
                XhdPhuongXa = kh.XhdPhuongXa,
                XhdEmail = kh.XhdEmail,
                SoHoChieu = kh.SoHoChieu,
                MaDvqhns = kh.MaDvqhns,
                XhdSoDienThoai = kh.XhdSoDienThoai,
                TenNganHang = kh.TenNganHang,
                SoTaiKhoanNganHang = kh.SoTaiKhoanNganHang
            },
            LichSuDonBans = donBanVMs
        };

        return PartialView("_KhachHangDetail", vm);
    }

    // 5. Thêm mới Khách hàng (Hỗ trợ cả JSON và multipart/form-data upload ảnh)
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] KhachHangFormVM model)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return Json(new { success = false, message = string.Join("<br>", errors) });
        }

        // Kiểm tra trùng SĐT nếu có nhập
        if (!string.IsNullOrWhiteSpace(model.DienThoai))
        {
            var phoneTrim = model.DienThoai.Trim();
            bool phoneExists = await _context.KhachHangs.AnyAsync(k => k.DienThoai == phoneTrim);
            if (phoneExists)
            {
                return Json(new { success = false, message = $"Số điện thoại '{phoneTrim}' đã được sử dụng bởi khách hàng khác." });
            }
        }

        // Xử lý mã khách hàng tự nhập
        string? maKhHienThi = null;
        if (!string.IsNullOrWhiteSpace(model.MaKhCustom))
        {
            maKhHienThi = model.MaKhCustom.Trim().ToUpperInvariant();
            bool codeExists = await _context.KhachHangs.AnyAsync(k => k.MaKhHienThi == maKhHienThi);
            if (codeExists)
            {
                return Json(new { success = false, message = $"Mã khách hàng '{maKhHienThi}' đã tồn tại trong hệ thống." });
            }
        }

        // Xử lý upload ảnh đại diện nếu có
        string? imagePath = model.HinhAnh;
        if (model.AvatarFile != null && model.AvatarFile.Length > 0)
        {
            if (model.AvatarFile.Length > 2 * 1024 * 1024)
            {
                return Json(new { success = false, message = "Ảnh đại diện không được vượt quá dung lượng 2MB." });
            }

            string uploadsFolder = Path.Combine(_env.WebRootPath, "uploads", "khachhang");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            string extension = Path.GetExtension(model.AvatarFile.FileName).ToLower();
            string fileName = $"kh_{Guid.NewGuid():N}{extension}";
            string filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await model.AvatarFile.CopyToAsync(stream);
            }

            imagePath = $"/uploads/khachhang/{fileName}";
        }

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            var kh = new KhachHang
            {
                TenKh = model.TenKh.Trim(),
                MaKhHienThi = maKhHienThi,
                DienThoai = string.IsNullOrWhiteSpace(model.DienThoai) ? null : model.DienThoai.Trim(),
                DienThoai2 = string.IsNullOrWhiteSpace(model.DienThoai2) ? null : model.DienThoai2.Trim(),
                NgaySinh = model.NgaySinh,
                GioiTinh = string.IsNullOrWhiteSpace(model.GioiTinh) ? null : model.GioiTinh.Trim(),
                Email = string.IsNullOrWhiteSpace(model.Email) ? null : model.Email.Trim(),
                Facebook = string.IsNullOrWhiteSpace(model.Facebook) ? null : model.Facebook.Trim(),
                HinhAnh = imagePath,
                DiaChi = string.IsNullOrWhiteSpace(model.DiaChi) ? null : model.DiaChi.Trim(),
                KhuVuc = string.IsNullOrWhiteSpace(model.KhuVuc) ? null : model.KhuVuc.Trim(),
                PhuongXa = string.IsNullOrWhiteSpace(model.PhuongXa) ? null : model.PhuongXa.Trim(),
                MaNhomKhachHang = model.MaNhomKhachHang,
                GhiChu = string.IsNullOrWhiteSpace(model.GhiChu) ? null : model.GhiChu.Trim(),
                NgayTao = DateTime.Now,
                NguoiTao = User?.Identity?.Name ?? "Quản trị viên",
                DaDanhDau = false,
                LoaiKhachHang = string.Equals(model.LoaiKhachHang, "CUA_HANG", StringComparison.OrdinalIgnoreCase) ? "CUA_HANG" : "LE",
                TrangThai = string.Equals(model.TrangThai, "NGUNG_GIAO_DICH", StringComparison.OrdinalIgnoreCase) ? "NGUNG_GIAO_DICH" : "HOAT_DONG",

                // Thông tin xuất hóa đơn
                XhdLoaiKhachHang = model.XhdLoaiKhachHang,
                MaSoThue = string.IsNullOrWhiteSpace(model.MaSoThue) ? null : model.MaSoThue.Trim(),
                XhdTenDonVi = string.IsNullOrWhiteSpace(model.XhdTenDonVi) ? null : model.XhdTenDonVi.Trim(),
                SoCccd = string.IsNullOrWhiteSpace(model.SoCccd) ? null : model.SoCccd.Trim(),
                TenNguoiMua = string.IsNullOrWhiteSpace(model.TenNguoiMua) ? null : model.TenNguoiMua.Trim(),
                XhdDiaChi = string.IsNullOrWhiteSpace(model.XhdDiaChi) ? null : model.XhdDiaChi.Trim(),
                XhdKhuVuc = string.IsNullOrWhiteSpace(model.XhdKhuVuc) ? null : model.XhdKhuVuc.Trim(),
                XhdPhuongXa = string.IsNullOrWhiteSpace(model.XhdPhuongXa) ? null : model.XhdPhuongXa.Trim(),
                XhdEmail = string.IsNullOrWhiteSpace(model.XhdEmail) ? null : model.XhdEmail.Trim(),
                SoHoChieu = string.IsNullOrWhiteSpace(model.SoHoChieu) ? null : model.SoHoChieu.Trim(),
                MaDvqhns = string.IsNullOrWhiteSpace(model.MaDvqhns) ? null : model.MaDvqhns.Trim(),
                XhdSoDienThoai = string.IsNullOrWhiteSpace(model.XhdSoDienThoai) ? null : model.XhdSoDienThoai.Trim(),
                TenNganHang = string.IsNullOrWhiteSpace(model.TenNganHang) ? null : model.TenNganHang.Trim(),
                SoTaiKhoanNganHang = string.IsNullOrWhiteSpace(model.SoTaiKhoanNganHang) ? null : model.SoTaiKhoanNganHang.Trim()
            };

            _context.KhachHangs.Add(kh);
            await _context.SaveChangesAsync();

            // Tự động gán mã KH nếu để trống
            if (string.IsNullOrWhiteSpace(kh.MaKhHienThi))
            {
                kh.MaKhHienThi = $"KH{kh.MaKh:D5}";
                await _context.SaveChangesAsync();
            }

            await _nhatKyService.GhiNhatKyAsync(
                CurrentUserId,
                "Tạo mới",
                "KhachHang",
                kh.MaKh.ToString(),
                $"Thêm mới khách hàng '{kh.TenKh}' (Mã: {kh.MaKhHienThi})"
            );

            await trans.CommitAsync();

            return Json(new
            {
                success = true,
                message = $"Thêm mới khách hàng '{kh.TenKh}' thành công.",
                id = kh.MaKh
            });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            _logger.LogError(ex, "Lỗi khi thêm mới khách hàng: {TenKh}", model.TenKh);
            return Json(new { success = false, message = "Đã xảy ra lỗi hệ thống khi thêm khách hàng: " + ex.Message });
        }
    }

    // 6. Cập nhật Khách hàng
    [HttpPost]
    public async Task<IActionResult> Edit(int id, [FromForm] KhachHangFormVM model)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return Json(new { success = false, message = string.Join("<br>", errors) });
        }

        var kh = await _context.KhachHangs.FirstOrDefaultAsync(k => k.MaKh == id);
        if (kh == null)
        {
            return Json(new { success = false, message = "Không tìm thấy khách hàng cần chỉnh sửa." });
        }

        // Kiểm tra trùng SĐT
        if (!string.IsNullOrWhiteSpace(model.DienThoai))
        {
            var phoneTrim = model.DienThoai.Trim();
            bool phoneExists = await _context.KhachHangs.AnyAsync(k => k.DienThoai == phoneTrim && k.MaKh != id);
            if (phoneExists)
            {
                return Json(new { success = false, message = $"Số điện thoại '{phoneTrim}' đã được sử dụng bởi khách hàng khác." });
            }
        }

        // Kiểm tra trùng mã tự nhập
        if (!string.IsNullOrWhiteSpace(model.MaKhCustom))
        {
            var codeTrim = model.MaKhCustom.Trim().ToUpperInvariant();
            bool codeExists = await _context.KhachHangs.AnyAsync(k => k.MaKhHienThi == codeTrim && k.MaKh != id);
            if (codeExists)
            {
                return Json(new { success = false, message = $"Mã khách hàng '{codeTrim}' đã tồn tại trong hệ thống." });
            }
            kh.MaKhHienThi = codeTrim;
        }

        // Xử lý upload ảnh đại diện mới nếu có
        if (model.AvatarFile != null && model.AvatarFile.Length > 0)
        {
            if (model.AvatarFile.Length > 2 * 1024 * 1024)
            {
                return Json(new { success = false, message = "Ảnh đại diện không được vượt quá dung lượng 2MB." });
            }

            string uploadsFolder = Path.Combine(_env.WebRootPath, "uploads", "khachhang");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            string extension = Path.GetExtension(model.AvatarFile.FileName).ToLower();
            string fileName = $"kh_{Guid.NewGuid():N}{extension}";
            string filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await model.AvatarFile.CopyToAsync(stream);
            }

            kh.HinhAnh = $"/uploads/khachhang/{fileName}";
        }

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            kh.TenKh = model.TenKh.Trim();
            kh.DienThoai = string.IsNullOrWhiteSpace(model.DienThoai) ? null : model.DienThoai.Trim();
            kh.DienThoai2 = string.IsNullOrWhiteSpace(model.DienThoai2) ? null : model.DienThoai2.Trim();
            kh.NgaySinh = model.NgaySinh;
            kh.GioiTinh = string.IsNullOrWhiteSpace(model.GioiTinh) ? null : model.GioiTinh.Trim();
            kh.Email = string.IsNullOrWhiteSpace(model.Email) ? null : model.Email.Trim();
            kh.Facebook = string.IsNullOrWhiteSpace(model.Facebook) ? null : model.Facebook.Trim();
            kh.DiaChi = string.IsNullOrWhiteSpace(model.DiaChi) ? null : model.DiaChi.Trim();
            kh.KhuVuc = string.IsNullOrWhiteSpace(model.KhuVuc) ? null : model.KhuVuc.Trim();
            kh.PhuongXa = string.IsNullOrWhiteSpace(model.PhuongXa) ? null : model.PhuongXa.Trim();
            kh.MaNhomKhachHang = model.MaNhomKhachHang;
            kh.GhiChu = string.IsNullOrWhiteSpace(model.GhiChu) ? null : model.GhiChu.Trim();
            kh.LoaiKhachHang = string.Equals(model.LoaiKhachHang, "CUA_HANG", StringComparison.OrdinalIgnoreCase) ? "CUA_HANG" : "LE";
            kh.TrangThai = string.Equals(model.TrangThai, "NGUNG_GIAO_DICH", StringComparison.OrdinalIgnoreCase) ? "NGUNG_GIAO_DICH" : "HOAT_DONG";

            // Thông tin xuất HĐ
            kh.XhdLoaiKhachHang = model.XhdLoaiKhachHang;
            kh.MaSoThue = string.IsNullOrWhiteSpace(model.MaSoThue) ? null : model.MaSoThue.Trim();
            kh.XhdTenDonVi = string.IsNullOrWhiteSpace(model.XhdTenDonVi) ? null : model.XhdTenDonVi.Trim();
            kh.SoCccd = string.IsNullOrWhiteSpace(model.SoCccd) ? null : model.SoCccd.Trim();
            kh.TenNguoiMua = string.IsNullOrWhiteSpace(model.TenNguoiMua) ? null : model.TenNguoiMua.Trim();
            kh.XhdDiaChi = string.IsNullOrWhiteSpace(model.XhdDiaChi) ? null : model.XhdDiaChi.Trim();
            kh.XhdKhuVuc = string.IsNullOrWhiteSpace(model.XhdKhuVuc) ? null : model.XhdKhuVuc.Trim();
            kh.XhdPhuongXa = string.IsNullOrWhiteSpace(model.XhdPhuongXa) ? null : model.XhdPhuongXa.Trim();
            kh.XhdEmail = string.IsNullOrWhiteSpace(model.XhdEmail) ? null : model.XhdEmail.Trim();
            kh.SoHoChieu = string.IsNullOrWhiteSpace(model.SoHoChieu) ? null : model.SoHoChieu.Trim();
            kh.MaDvqhns = string.IsNullOrWhiteSpace(model.MaDvqhns) ? null : model.MaDvqhns.Trim();
            kh.XhdSoDienThoai = string.IsNullOrWhiteSpace(model.XhdSoDienThoai) ? null : model.XhdSoDienThoai.Trim();
            kh.TenNganHang = string.IsNullOrWhiteSpace(model.TenNganHang) ? null : model.TenNganHang.Trim();
            kh.SoTaiKhoanNganHang = string.IsNullOrWhiteSpace(model.SoTaiKhoanNganHang) ? null : model.SoTaiKhoanNganHang.Trim();

            await _context.SaveChangesAsync();

            await _nhatKyService.GhiNhatKyAsync(
                CurrentUserId,
                "Cập nhật",
                "KhachHang",
                kh.MaKh.ToString(),
                $"Cập nhật thông tin khách hàng '{kh.TenKh}' (Mã: {kh.MaKhHienThi})"
            );

            await trans.CommitAsync();

            return Json(new
            {
                success = true,
                message = $"Cập nhật thông tin khách hàng '{kh.TenKh}' thành công."
            });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            _logger.LogError(ex, "Lỗi khi cập nhật khách hàng {Id}", id);
            return Json(new { success = false, message = "Lỗi khi cập nhật thông tin: " + ex.Message });
        }
    }

    // 7. Xóa Khách hàng (Kiểm tra ràng buộc nghiệp vụ)
    [HttpPost]
    public async Task<IActionResult> Delete(int id)
    {
        var kh = await _context.KhachHangs.FirstOrDefaultAsync(k => k.MaKh == id);
        if (kh == null)
        {
            return Json(new { success = false, message = "Không tìm thấy khách hàng cần xóa." });
        }

        // BẢO VỆ DỮ LIỆU: Nếu khách hàng đã phát sinh đơn bán hàng, tuyệt đối không được xóa
        bool hasOrders = await _context.DonBans.AnyAsync(d => d.MaKh == id);
        if (hasOrders)
        {
            return Json(new
            {
                success = false,
                hasTransaction = true,
                message = $"Khách hàng '<b>{kh.TenKh}</b>' đã có giao dịch đơn bán hàng trong hệ thống.<br>" +
                          "Để bảo toàn lịch sử sổ sách và hóa đơn, bạn <b>không thể xóa</b> khách hàng này. " +
                          "Vui lòng chuyển trạng thái sang <b>Ngừng giao dịch</b> nếu không còn phục vụ."
            });
        }

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.KhachHangs.Remove(kh);
            await _context.SaveChangesAsync();

            await _nhatKyService.GhiNhatKyAsync(
                CurrentUserId,
                "Xóa",
                "KhachHang",
                id.ToString(),
                $"Xóa khách hàng '{kh.TenKh}' (Mã: {kh.MaKhHienThi ?? kh.MaKh.ToString()})"
            );

            await trans.CommitAsync();

            return Json(new
            {
                success = true,
                message = $"Đã xóa khách hàng '{kh.TenKh}' thành công."
            });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            _logger.LogError(ex, "Lỗi khi xóa khách hàng {Id}", id);
            return Json(new { success = false, message = "Không thể xóa khách hàng do lỗi hệ thống: " + ex.Message });
        }
    }

    // 8. Chuyển đổi trạng thái (HOAT_DONG <-> NGUNG_GIAO_DICH)
    [HttpPost]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var kh = await _context.KhachHangs.FirstOrDefaultAsync(k => k.MaKh == id);
        if (kh == null)
        {
            return Json(new { success = false, message = "Không tìm thấy khách hàng." });
        }

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            kh.TrangThai = kh.TrangThai == "HOAT_DONG" ? "NGUNG_GIAO_DICH" : "HOAT_DONG";
            await _context.SaveChangesAsync();

            string actionName = kh.TrangThai == "HOAT_DONG" ? "Kích hoạt lại" : "Ngừng giao dịch";
            await _nhatKyService.GhiNhatKyAsync(
                CurrentUserId,
                "Đổi trạng thái",
                "KhachHang",
                kh.MaKh.ToString(),
                $"{actionName} khách hàng '{kh.TenKh}'"
            );

            await trans.CommitAsync();

            return Json(new
            {
                success = true,
                newStatus = kh.TrangThai,
                message = kh.TrangThai == "HOAT_DONG"
                    ? $"Đã kích hoạt lại khách hàng '{kh.TenKh}'."
                    : $"Đã chuyển khách hàng '{kh.TenKh}' sang trạng thái Ngừng giao dịch."
            });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            _logger.LogError(ex, "Lỗi khi đổi trạng thái khách hàng {Id}", id);
            return Json(new { success = false, message = "Lỗi khi cập nhật trạng thái: " + ex.Message });
        }
    }

    // 9. Bật/tắt đánh dấu sao ⭐ (Favorite)
    [HttpPost]
    public async Task<IActionResult> ToggleFavorite(int id)
    {
        var kh = await _context.KhachHangs.FirstOrDefaultAsync(k => k.MaKh == id);
        if (kh == null)
        {
            return Json(new { success = false, message = "Không tìm thấy khách hàng." });
        }

        kh.DaDanhDau = !kh.DaDanhDau;
        await _context.SaveChangesAsync();

        return Json(new { success = true, isStarred = kh.DaDanhDau });
    }

    // 10. API Quản lý Nhóm khách hàng (Tạo nhanh / Sửa / Xóa)
    [HttpPost]
    public async Task<IActionResult> CreateNhom([FromBody] NhomKhachHang model)
    {
        if (string.IsNullOrWhiteSpace(model.TenNhom))
        {
            return Json(new { success = false, message = "Vui lòng nhập tên nhóm khách hàng." });
        }

        string tenTrim = model.TenNhom.Trim();
        bool exists = await _context.NhomKhachHangs.AnyAsync(n => n.TenNhom == tenTrim);
        if (exists)
        {
            return Json(new { success = false, message = $"Nhóm khách hàng '{tenTrim}' đã tồn tại." });
        }

        var nhom = new NhomKhachHang
        {
            TenNhom = tenTrim,
            GhiChu = model.GhiChu?.Trim()
        };

        _context.NhomKhachHangs.Add(nhom);
        await _context.SaveChangesAsync();

        return Json(new
        {
            success = true,
            id = nhom.MaNhomKhachHang,
            name = nhom.TenNhom,
            message = $"Đã tạo nhóm khách hàng '{nhom.TenNhom}'."
        });
    }

    [HttpPost]
    public async Task<IActionResult> UpdateNhom(int id, [FromBody] NhomKhachHang model)
    {
        if (string.IsNullOrWhiteSpace(model.TenNhom))
        {
            return Json(new { success = false, message = "Vui lòng nhập tên nhóm khách hàng." });
        }

        var nhom = await _context.NhomKhachHangs.FirstOrDefaultAsync(n => n.MaNhomKhachHang == id);
        if (nhom == null)
        {
            return Json(new { success = false, message = "Không tìm thấy nhóm khách hàng cần cập nhật." });
        }

        string tenTrim = model.TenNhom.Trim();
        bool exists = await _context.NhomKhachHangs.AnyAsync(n => n.TenNhom == tenTrim && n.MaNhomKhachHang != id);
        if (exists)
        {
            return Json(new { success = false, message = $"Nhóm khách hàng '{tenTrim}' đã tồn tại." });
        }

        nhom.TenNhom = tenTrim;
        if (model.GhiChu != null) nhom.GhiChu = model.GhiChu.Trim();

        await _context.SaveChangesAsync();

        return Json(new
        {
            success = true,
            id = nhom.MaNhomKhachHang,
            name = nhom.TenNhom,
            message = $"Đã cập nhật nhóm khách hàng thành '{nhom.TenNhom}'."
        });
    }

    [HttpPost]
    public async Task<IActionResult> DeleteNhom(int id)
    {
        var nhom = await _context.NhomKhachHangs.FirstOrDefaultAsync(n => n.MaNhomKhachHang == id);
        if (nhom == null)
        {
            return Json(new { success = false, message = "Không tìm thấy nhóm khách hàng." });
        }

        _context.NhomKhachHangs.Remove(nhom);
        await _context.SaveChangesAsync();

        return Json(new
        {
            success = true,
            message = $"Đã xóa nhóm khách hàng '{nhom.TenNhom}'."
        });
    }

    // 11. Xuất danh sách khách hàng ra Excel (ClosedXML)
    [HttpGet]
    public async Task<IActionResult> ExportExcel(KhachHangFilterParams filter)
    {
        var (items, _, _, _) = await QueryKhachHangDataAsync(filter, applyPaging: false);

        int stt = 1;
        var rows = items.Select(x => new
        {
            Stt = stt++,
            MaKh = x.MaKhHienThi,
            TenKh = x.TenKh,
            DienThoai = x.DienThoai ?? "",
            DiaChi = x.DiaChi ?? "",
            KhuVuc = x.KhuVuc ?? "",
            PhuongXa = x.PhuongXa ?? "",
            NhomKh = x.TenNhomKhachHang ?? "",
            MaSoThue = x.MaSoThue ?? "",
            NgaySinh = x.NgaySinh?.ToString("dd/MM/yyyy") ?? "",
            GioiTinh = x.GioiTinh ?? "",
            Email = x.Email ?? "",
            TongBan = x.TongBan,
            TongBanTruTraHang = x.TongBanTruTraHang,
            NoHienTai = x.NoHienTai,
            TrangThai = x.TenTrangThai
        }).ToList();

        var bytes = ExcelHelper.Export("DanhSachKhachHang", rows, col => col
            .AddCenter("STT", x => x.Stt)
            .AddCenter("Mã khách hàng", x => x.MaKh)
            .AddText("Tên khách hàng", x => x.TenKh)
            .AddCenter("Điện thoại", x => x.DienThoai)
            .AddText("Địa chỉ", x => x.DiaChi)
            .AddText("Khu vực", x => x.KhuVuc)
            .AddText("Phường/Xã", x => x.PhuongXa)
            .AddText("Nhóm khách hàng", x => x.NhomKh)
            .AddCenter("Mã số thuế", x => x.MaSoThue)
            .AddCenter("Ngày sinh", x => x.NgaySinh)
            .AddCenter("Giới tính", x => x.GioiTinh)
            .AddText("Email", x => x.Email)
            .AddCurrency("Tổng bán", x => x.TongBan)
            .AddCurrency("Tổng bán trừ trả hàng", x => x.TongBanTruTraHang)
            .AddCurrency("Nợ hiện tại", x => x.NoHienTai)
            .AddCenter("Trạng thái", x => x.TrangThai)
        );

        string fileName = $"DanhSachKhachHang_{DateTime.Now:yyyyMMdd_HHmm}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    // Tiện ích truy vấn và tính toán số liệu khách hàng
    private async Task<(List<KhachHangItemVM> Items, int TotalItems, decimal TongBan, decimal TongNo)> QueryKhachHangDataAsync(
        KhachHangFilterParams filter,
        bool applyPaging)
    {
        // 1. Tải danh sách đơn bán và khoản thu để tính tổng bán & nợ theo khách hàng
        var donBanStats = await _context.DonBans.AsNoTracking()
            .Where(d => d.MaKh != null)
            .Select(d => new
            {
                MaKh = d.MaKh!.Value,
                MaDonBan = d.MaDonBan,
                TienBan = d.ChiTietDonBans.Sum(ct => (decimal?)(ct.SoLuong * ct.DonGiaApDung - ct.ChietKhau)) ?? 0m,
                TienThu = d.KhoanThus.Sum(kt => (decimal?)kt.SoTien) ?? 0m
            })
            .ToListAsync();

        var khStatsMap = donBanStats
            .GroupBy(d => d.MaKh)
            .ToDictionary(g => g.Key, g => new
            {
                TongBan = g.Sum(x => x.TienBan),
                TongThu = g.Sum(x => x.TienThu),
                SoDon = g.Count()
            });

        // 2. Query khách hàng cơ sở
        var query = _context.KhachHangs.AsNoTracking()
            .Include(k => k.MaNhomKhachHangNavigation)
            .AsQueryable();

        // Lọc theo từ khóa F3
        if (!string.IsNullOrWhiteSpace(filter.Q))
        {
            var q = filter.Q.Trim().ToLower();
            query = query.Where(k =>
                k.TenKh.ToLower().Contains(q) ||
                (k.MaKhHienThi != null && k.MaKhHienThi.ToLower().Contains(q)) ||
                (k.DienThoai != null && k.DienThoai.Contains(q)) ||
                (k.DienThoai2 != null && k.DienThoai2.Contains(q)) ||
                (k.Email != null && k.Email.ToLower().Contains(q)) ||
                (k.DiaChi != null && k.DiaChi.ToLower().Contains(q)));
        }

        // Lọc theo Nhóm khách hàng
        if (filter.NhomKhachHangs != null && filter.NhomKhachHangs.Count > 0)
        {
            query = query.Where(k => k.MaNhomKhachHang.HasValue && filter.NhomKhachHangs.Contains(k.MaNhomKhachHang.Value));
        }

        // Lọc theo Segment Loại khách hàng (Tất cả / Cá nhân / Công ty)
        if (!string.IsNullOrWhiteSpace(filter.LoaiKhachHangSegment) && filter.LoaiKhachHangSegment != "ALL")
        {
            if (filter.LoaiKhachHangSegment == "CA_NHAN")
                query = query.Where(k => k.LoaiKhachHang == "LE");
            else if (filter.LoaiKhachHangSegment == "CONG_TY")
                query = query.Where(k => k.LoaiKhachHang == "CUA_HANG");
        }
        else if (filter.LoaiKhachHangs != null && filter.LoaiKhachHangs.Count > 0)
        {
            query = query.Where(k => filter.LoaiKhachHangs.Contains(k.LoaiKhachHang));
        }

        // Lọc theo Giới tính (Segment buttons)
        if (!string.IsNullOrWhiteSpace(filter.GioiTinh) && filter.GioiTinh != "ALL")
        {
            if (filter.GioiTinh == "Nam")
                query = query.Where(k => k.GioiTinh == "Nam");
            else if (filter.GioiTinh == "Nu")
                query = query.Where(k => k.GioiTinh == "Nữ");
        }

        // Lọc theo Ngày tạo
        if (!string.IsNullOrWhiteSpace(filter.TgTaoFilter) && filter.TgTaoFilter != "ALL")
        {
            var now = DateTime.Now;
            var today = now.Date;
            switch (filter.TgTaoFilter)
            {
                case "HOM_NAY":
                    query = query.Where(k => k.NgayTao >= today && k.NgayTao < today.AddDays(1));
                    break;
                case "HOM_QUA":
                    var yesterday = today.AddDays(-1);
                    query = query.Where(k => k.NgayTao >= yesterday && k.NgayTao < today);
                    break;
                case "7_NGAY":
                    var sevenDaysAgo = today.AddDays(-7);
                    query = query.Where(k => k.NgayTao >= sevenDaysAgo);
                    break;
                case "THANG_NAY":
                    var firstDayMonth = new DateTime(today.Year, today.Month, 1);
                    query = query.Where(k => k.NgayTao >= firstDayMonth);
                    break;
                case "CUSTOM":
                    if (filter.TgTaoTu.HasValue) query = query.Where(k => k.NgayTao >= filter.TgTaoTu.Value);
                    if (filter.TgTaoDen.HasValue) query = query.Where(k => k.NgayTao <= filter.TgTaoDen.Value.AddDays(1).AddTicks(-1));
                    break;
            }
        }

        // Lọc theo Sinh nhật
        if (!string.IsNullOrWhiteSpace(filter.SinhNhatFilter) && filter.SinhNhatFilter != "ALL")
        {
            var today = DateTime.Today;
            if (filter.SinhNhatFilter == "THANG_NAY")
            {
                int currentMonth = today.Month;
                query = query.Where(k => k.NgaySinh.HasValue && k.NgaySinh.Value.Month == currentMonth);
            }
            else if (filter.SinhNhatFilter == "HOM_NAY")
            {
                int curDay = today.Day;
                int curMonth = today.Month;
                query = query.Where(k => k.NgaySinh.HasValue && k.NgaySinh.Value.Day == curDay && k.NgaySinh.Value.Month == curMonth);
            }
        }

        // Lọc theo Người tạo
        if (!string.IsNullOrWhiteSpace(filter.NguoiTao) && filter.NguoiTao != "ALL")
        {
            query = query.Where(k => k.NguoiTao == filter.NguoiTao);
        }

        // Lọc đánh dấu sao
        if (filter.DaDanhDau)
        {
            query = query.Where(k => k.DaDanhDau);
        }

        // Lọc trạng thái
        if (filter.TrangThais != null && filter.TrangThais.Count > 0)
        {
            query = query.Where(k => filter.TrangThais.Contains(k.TrangThai));
        }

        var rawList = await query.ToListAsync();

        // 3. Ghép số liệu tài chính & công nợ
        var items = rawList.Select(k =>
        {
            decimal tongBan = 0;
            decimal tongThu = 0;
            int soDon = 0;
            if (khStatsMap.TryGetValue(k.MaKh, out var stat))
            {
                tongBan = stat.TongBan;
                tongThu = stat.TongThu;
                soDon = stat.SoDon;
            }

            return new KhachHangItemVM
            {
                MaKh = k.MaKh,
                MaKhHienThi = k.MaKhHienThi ?? $"KH{k.MaKh:D5}",
                TenKh = k.TenKh,
                DienThoai = k.DienThoai,
                DienThoai2 = k.DienThoai2,
                NgaySinh = k.NgaySinh,
                GioiTinh = k.GioiTinh,
                Email = k.Email,
                Facebook = k.Facebook,
                HinhAnh = k.HinhAnh,
                DiaChi = k.DiaChi,
                KhuVuc = k.KhuVuc,
                PhuongXa = k.PhuongXa,
                MaNhomKhachHang = k.MaNhomKhachHang,
                TenNhomKhachHang = k.MaNhomKhachHangNavigation?.TenNhom ?? "---",
                GhiChu = k.GhiChu,
                NgayTao = k.NgayTao,
                NguoiTao = k.NguoiTao ?? "Hệ thống",
                DaDanhDau = k.DaDanhDau,
                LoaiKhachHang = k.LoaiKhachHang,
                TrangThai = k.TrangThai,
                TongBan = tongBan,
                TongBanTruTraHang = tongBan,
                DaThu = tongThu,
                NoHienTai = tongBan - tongThu,
                SoDonBan = soDon,

                // Xuất HĐ
                XhdLoaiKhachHang = k.XhdLoaiKhachHang,
                MaSoThue = k.MaSoThue,
                XhdTenDonVi = k.XhdTenDonVi,
                SoCccd = k.SoCccd,
                TenNguoiMua = k.TenNguoiMua,
                XhdDiaChi = k.XhdDiaChi,
                XhdKhuVuc = k.XhdKhuVuc,
                XhdPhuongXa = k.XhdPhuongXa,
                XhdEmail = k.XhdEmail,
                SoHoChieu = k.SoHoChieu,
                MaDvqhns = k.MaDvqhns,
                XhdSoDienThoai = k.XhdSoDienThoai,
                TenNganHang = k.TenNganHang,
                SoTaiKhoanNganHang = k.SoTaiKhoanNganHang
            };
        }).AsQueryable();

        // Lọc theo khoảng Tổng bán
        if (filter.TongBanTu.HasValue)
        {
            items = items.Where(x => x.TongBan >= filter.TongBanTu.Value);
        }
        if (filter.TongBanDen.HasValue)
        {
            items = items.Where(x => x.TongBan <= filter.TongBanDen.Value);
        }

        // Lọc theo khoảng Nợ hiện tại
        if (filter.NoTu.HasValue)
        {
            items = items.Where(x => x.NoHienTai >= filter.NoTu.Value);
        }
        if (filter.NoDen.HasValue)
        {
            items = items.Where(x => x.NoHienTai <= filter.NoDen.Value);
        }

        // Thống kê toàn bộ sau khi lọc
        var filteredList = items.ToList();
        int totalItems = filteredList.Count;
        decimal totalBan = filteredList.Sum(x => x.TongBan);
        decimal totalNo = filteredList.Sum(x => x.NoHienTai);

        // 4. Sắp xếp 3 trạng thái
        string sortBy = (filter.SortBy ?? "makh").ToLower();
        string sortDir = (filter.SortDir ?? "desc").ToLower();
        bool isAsc = sortDir == "asc";

        var sorted = sortBy switch
        {
            "tenkh" => isAsc ? filteredList.OrderBy(x => x.TenKh) : filteredList.OrderByDescending(x => x.TenKh),
            "dienthoai" => isAsc ? filteredList.OrderBy(x => x.DienThoai) : filteredList.OrderByDescending(x => x.DienThoai),
            "diachi" => isAsc ? filteredList.OrderBy(x => x.DiaChi) : filteredList.OrderByDescending(x => x.DiaChi),
            "khuvuc" => isAsc ? filteredList.OrderBy(x => x.KhuVuc) : filteredList.OrderByDescending(x => x.KhuVuc),
            "phuongxa" => isAsc ? filteredList.OrderBy(x => x.PhuongXa) : filteredList.OrderByDescending(x => x.PhuongXa),
            "nhomkh" => isAsc ? filteredList.OrderBy(x => x.TenNhomKhachHang) : filteredList.OrderByDescending(x => x.TenNhomKhachHang),
            "mst" => isAsc ? filteredList.OrderBy(x => x.MaSoThue) : filteredList.OrderByDescending(x => x.MaSoThue),
            "ngaysinh" => isAsc ? filteredList.OrderBy(x => x.NgaySinh) : filteredList.OrderByDescending(x => x.NgaySinh),
            "gioitinh" => isAsc ? filteredList.OrderBy(x => x.GioiTinh) : filteredList.OrderByDescending(x => x.GioiTinh),
            "email" => isAsc ? filteredList.OrderBy(x => x.Email) : filteredList.OrderByDescending(x => x.Email),
            "loaikh" => isAsc ? filteredList.OrderBy(x => x.LoaiKhachHang) : filteredList.OrderByDescending(x => x.LoaiKhachHang),
            "tongban" => isAsc ? filteredList.OrderBy(x => x.TongBan) : filteredList.OrderByDescending(x => x.TongBan),
            "tongbantrutrahang" => isAsc ? filteredList.OrderBy(x => x.TongBanTruTraHang) : filteredList.OrderByDescending(x => x.TongBanTruTraHang),
            "no" => isAsc ? filteredList.OrderBy(x => x.NoHienTai) : filteredList.OrderByDescending(x => x.NoHienTai),
            "trangthai" => isAsc ? filteredList.OrderBy(x => x.TrangThai) : filteredList.OrderByDescending(x => x.TrangThai),
            _ => isAsc ? filteredList.OrderBy(x => x.MaKh) : filteredList.OrderByDescending(x => x.MaKh)
        };

        // 5. Phân trang & Pre-rendering Lịch sử đơn bán
        List<KhachHangItemVM> pagedItems;
        if (applyPaging)
        {
            pagedItems = sorted
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToList();

            var pagedKhIds = pagedItems.Select(x => (int?)x.MaKh).ToList();
            var pagedDonBans = await _context.DonBans.AsNoTracking()
                .Where(d => d.MaKh != null && pagedKhIds.Contains(d.MaKh))
                .Include(d => d.MaKhoNavigation)
                .Include(d => d.MaNvlapNavigation)
                .Include(d => d.ChiTietDonBans)
                .Include(d => d.KhoanThus)
                .OrderByDescending(d => d.NgayLap)
                .ToListAsync();

            var donBanGroup = pagedDonBans.GroupBy(d => d.MaKh!.Value).ToDictionary(g => g.Key, g => g.ToList());

            foreach (var item in pagedItems)
            {
                if (donBanGroup.TryGetValue(item.MaKh, out var dbs))
                {
                    item.LichSuDonBans = dbs.Select(d =>
                    {
                        decimal tongTien = d.ChiTietDonBans.Sum(ct => ct.SoLuong * ct.DonGiaApDung - ct.ChietKhau);
                        decimal daThu = d.KhoanThus.Sum(kt => kt.SoTien);
                        return new KhachHangLichSuDonBanVM
                        {
                            MaDonBan = d.MaDonBan,
                            NgayLap = d.NgayLap,
                            TenKho = d.MaKhoNavigation?.TenKho ?? "Chưa phân",
                            NguoiLap = d.MaNvlapNavigation?.HoTen ?? "Hệ thống",
                            TongTien = tongTien,
                            DaThu = daThu,
                            TrangThai = d.TrangThai,
                            GhiChu = d.GhiChu
                        };
                    }).ToList();
                }
            }
        }
        else
        {
            pagedItems = sorted.ToList();
        }

        return (pagedItems, totalItems, totalBan, totalNo);
    }
}
