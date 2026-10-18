using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using BTL_LTW_QuanLiKho_2.Models;
using BTL_LTW_QuanLiKho_2.Helpers;
using Microsoft.AspNetCore.Authorization;
using BTL_LTW_QuanLiKho_2.ViewModels;
using BTL_LTW_QuanLiKho_2.ViewModels.Common;
using BTL_LTW_QuanLiKho_2.ViewModels.NhaCungCap;

namespace BTL_LTW_QuanLiKho_2.Controllers;

[Authorize]
public class NhaCungCapController : BaseKhoController
{
    private readonly ILogger<NhaCungCapController> _logger;

    public NhaCungCapController(QuanLyKhoPhuQuocLtwContext context, ILogger<NhaCungCapController> logger)
        : base(context)
    {
        _logger = logger;
    }

    // 1. Màn hình chính danh sách Nhà cung cấp
    [HttpGet]
    public async Task<IActionResult> Index(NhaCungCapFilterParams filter)
    {
        if (Request.Query.ContainsKey("export") && string.Equals(Request.Query["export"], "excel", StringComparison.OrdinalIgnoreCase))
        {
            return await Export(filter);
        }

        var nhomList = await _context.NhomNhaCungCaps.AsNoTracking().OrderBy(g => g.TenNhom).ToListAsync();

        var query = BuildFilterQuery(filter);
        var totalItems = await query.CountAsync();

        var (dateFrom, dateTo) = DateRangeHelper.Resolve(filter.ThoiGian, filter.FromDate, filter.ToDate);
        filter.FromDate = dateFrom;
        filter.ToDate = dateTo;

        var items = await ApplySortingAndPaging(query, filter).ToListAsync();

        // Thống kê tổng số lượng, tổng nợ toàn hệ thống
        var allStats = await _context.DonViCapHangs.AsNoTracking().Select(d => new
        {
            d.MaDonViCapHang,
            TongMua = d.PhieuNhaps
                .Where(p => p.TrangThai == "DA_XAC_NHAN" || p.TrangThai == "HOAN_THANH" || p.TrangThai == "DA_NHAP")
                .SelectMany(p => p.ChiTietPhieuNhaps)
                .Sum(ct => (decimal?)(ct.SoLuong * ct.DonGiaNhap)) ?? 0m
        }).ToListAsync();

        var vm = new NhaCungCapIndexVM
        {
            PagedData = new PagedResult<NhaCungCapItemVM>
            {
                Items = items,
                PageIndex = filter.Page < 1 ? 1 : filter.Page,
                PageSize = filter.PageSize < 1 ? 15 : filter.PageSize,
                TotalItems = totalItems
            },
            Filter = filter,
            NhomNccList = nhomList,
            TongMuaToanBo = allStats.Sum(s => s.TongMua),
            TongNoToanBo = allStats.Sum(s => s.TongMua),
            SortBy = filter.SortBy,
            SortDir = filter.SortDir
        };

        return View(vm);
    }

    // 2. Lọc danh sách AJAX trả về PartialView bảng dữ liệu
    [HttpGet]
    public async Task<IActionResult> Filter(NhaCungCapFilterParams filter)
    {
        var (dateFrom, dateTo) = DateRangeHelper.Resolve(filter.ThoiGian, filter.FromDate, filter.ToDate);
        filter.FromDate = dateFrom;
        filter.ToDate = dateTo;

        var query = BuildFilterQuery(filter);
        var totalItems = await query.CountAsync();
        var items = await ApplySortingAndPaging(query, filter).ToListAsync();

        var vm = new NhaCungCapIndexVM
        {
            PagedData = new PagedResult<NhaCungCapItemVM>
            {
                Items = items,
                PageIndex = filter.Page < 1 ? 1 : filter.Page,
                PageSize = filter.PageSize < 1 ? 15 : filter.PageSize,
                TotalItems = totalItems
            },
            Filter = filter,
            SortBy = filter.SortBy,
            SortDir = filter.SortDir
        };

        return PartialView("_NhaCungCapTable", vm);
    }

    // 3. Lấy chi tiết Master-Detail xổ xuống khi click vào dòng
    [HttpGet]
    public async Task<IActionResult> GetDetail(int id)
    {
        var ncc = await _context.DonViCapHangs
            .AsNoTracking()
            .Include(d => d.MaNhomNccNavigation)
            .FirstOrDefaultAsync(d => d.MaDonViCapHang == id);

        if (ncc == null) return NotFound("Không tìm thấy nhà cung cấp.");

        // Danh sách 10 phiếu nhập gần nhất
        var phieuNhaps = await _context.PhieuNhaps
            .AsNoTracking()
            .Where(p => p.MaDonViCapHang == id)
            .OrderByDescending(p => p.NgayLap)
            .Take(10)
            .Select(p => new NhaCungCapLichSuNhapVM
            {
                MaPhieuNhap = p.MaPhieuNhap,
                MaPhieuHienThi = "PN" + p.MaPhieuNhap.ToString("D5"),
                NgayNhap = p.NgayLap,
                TrangThai = p.TrangThai,
                TenKho = p.MaKhoNavigation.TenKho,
                TongTien = p.ChiTietPhieuNhaps.Sum(ct => ct.SoLuong * ct.DonGiaNhap)
            })
            .ToListAsync();

        decimal tongMua = await _context.PhieuNhaps
            .Where(p => p.MaDonViCapHang == id && (p.TrangThai == "DA_XAC_NHAN" || p.TrangThai == "HOAN_THANH" || p.TrangThai == "DA_NHAP"))
            .SelectMany(p => p.ChiTietPhieuNhaps)
            .SumAsync(ct => (decimal?)(ct.SoLuong * ct.DonGiaNhap)) ?? 0m;

        var itemVm = new NhaCungCapItemVM
        {
            MaDonViCapHang = ncc.MaDonViCapHang,
            MaNcc = ncc.MaNcc ?? ("NCC" + ncc.MaDonViCapHang.ToString("D5")),
            TenDonVi = ncc.TenDonVi,
            DienThoai = ncc.DienThoai,
            Email = ncc.Email,
            MaNhomNcc = ncc.MaNhomNcc,
            TenNhomNcc = ncc.MaNhomNccNavigation?.TenNhom,
            DiaChi = ncc.DiaChi,
            KhuVuc = ncc.KhuVuc,
            PhuongXa = ncc.PhuongXa,
            TrangThai = ncc.TrangThai,
            NgayTao = ncc.NgayTao,
            NguoiTao = ncc.NguoiTao,
            TongMua = tongMua,
            NoCanTraHienTai = tongMua
        };

        var detailVm = new NhaCungCapDetailVM
        {
            ThongTin = itemVm,
            GhiChu = ncc.GhiChu,
            TenCongTy = ncc.TenCongTy,
            MaSoThue = ncc.MaSoThue,
            SoCccd = ncc.SoCccd,
            LichSuPhieuNhaps = phieuNhaps
        };

        return PartialView("_NhaCungCapDetail", detailVm);
    }

    // 4. Lấy dữ liệu 1 NCC đổ vào modal chỉnh sửa
    [HttpGet]
    public async Task<IActionResult> GetItem(int id)
    {
        var ncc = await _context.DonViCapHangs.AsNoTracking().FirstOrDefaultAsync(d => d.MaDonViCapHang == id);
        if (ncc == null) return NotFound(new { message = "Không tìm thấy nhà cung cấp." });

        return Json(new
        {
            success = true,
            data = new NhaCungCapFormVM
            {
                MaDonViCapHang = ncc.MaDonViCapHang,
                MaNcc = ncc.MaNcc,
                TenDonVi = ncc.TenDonVi,
                DienThoai = ncc.DienThoai,
                Email = ncc.Email,
                DiaChi = ncc.DiaChi,
                KhuVuc = ncc.KhuVuc,
                PhuongXa = ncc.PhuongXa,
                MaNhomNcc = ncc.MaNhomNcc,
                GhiChu = ncc.GhiChu,
                TenCongTy = ncc.TenCongTy,
                MaSoThue = ncc.MaSoThue,
                SoCccd = ncc.SoCccd,
                TrangThai = ncc.TrangThai
            }
        });
    }

    // 5. Thêm mới Nhà cung cấp
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] NhaCungCapFormVM form)
    {
        if (form == null) return BadRequest(new { message = "Dữ liệu không hợp lệ." });
        if (string.IsNullOrWhiteSpace(form.TenDonVi))
            return BadRequest(new { message = "Vui lòng nhập tên nhà cung cấp." });

        string tenTrim = form.TenDonVi.Trim();
        bool isTenTrung = await _context.DonViCapHangs.AnyAsync(d => d.TenDonVi.ToLower() == tenTrim.ToLower());
        if (isTenTrung)
            return BadRequest(new { message = $"Tên nhà cung cấp \"{tenTrim}\" đã tồn tại trên hệ thống." });

        string maNcc = (form.MaNcc ?? "").Trim();
        if (!string.IsNullOrWhiteSpace(maNcc))
        {
            bool isMaTrung = await _context.DonViCapHangs.AnyAsync(d => d.MaNcc != null && d.MaNcc.ToLower() == maNcc.ToLower());
            if (isMaTrung)
                return BadRequest(new { message = $"Mã nhà cung cấp \"{maNcc}\" đã tồn tại trên hệ thống." });
        }

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            var ncc = new DonViCapHang
            {
                TenDonVi = tenTrim,
                DienThoai = string.IsNullOrWhiteSpace(form.DienThoai) ? null : form.DienThoai.Trim(),
                Email = string.IsNullOrWhiteSpace(form.Email) ? null : form.Email.Trim(),
                DiaChi = string.IsNullOrWhiteSpace(form.DiaChi) ? null : form.DiaChi.Trim(),
                KhuVuc = string.IsNullOrWhiteSpace(form.KhuVuc) ? null : form.KhuVuc.Trim(),
                PhuongXa = string.IsNullOrWhiteSpace(form.PhuongXa) ? null : form.PhuongXa.Trim(),
                MaNhomNcc = form.MaNhomNcc > 0 ? form.MaNhomNcc : null,
                GhiChu = string.IsNullOrWhiteSpace(form.GhiChu) ? null : form.GhiChu.Trim(),
                TenCongTy = string.IsNullOrWhiteSpace(form.TenCongTy) ? null : form.TenCongTy.Trim(),
                MaSoThue = string.IsNullOrWhiteSpace(form.MaSoThue) ? null : form.MaSoThue.Trim(),
                SoCccd = string.IsNullOrWhiteSpace(form.SoCccd) ? null : form.SoCccd.Trim(),
                TrangThai = (string.IsNullOrWhiteSpace(form.TrangThai) || form.TrangThai == "HOAT_DONG" || form.TrangThai == "ACTIVE")
                    ? "HOAT_DONG"
                    : "NGUNG_GIAO_DICH",
                NgayTao = DateTime.Now,
                NguoiTao = User.Identity?.Name ?? "Admin"
            };

            _context.DonViCapHangs.Add(ncc);
            await _context.SaveChangesAsync();

            // Nếu người dùng không nhập mã NCC, sinh tự động NCC + id
            if (string.IsNullOrWhiteSpace(maNcc))
            {
                ncc.MaNcc = "NCC" + ncc.MaDonViCapHang.ToString("D5");
                await _context.SaveChangesAsync();
            }
            else
            {
                ncc.MaNcc = maNcc;
                await _context.SaveChangesAsync();
            }

            await trans.CommitAsync();
            return Json(new
            {
                success = true,
                id = ncc.MaDonViCapHang,
                supplier = new
                {
                    maDonViCapHang = ncc.MaDonViCapHang,
                    maNcc = ncc.MaNcc,
                    tenDonVi = ncc.TenDonVi,
                    dienThoai = ncc.DienThoai ?? "",
                    noCanTra = 0
                },
                message = $"Thêm nhà cung cấp \"{ncc.TenDonVi}\" thành công."
            });
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            _logger.LogError(ex, "Lỗi khi thêm mới nhà cung cấp.");
            return StatusCode(500, new { message = "Lỗi máy chủ khi thêm nhà cung cấp: " + ex.Message });
        }
    }

    // 6. Cập nhật Nhà cung cấp
    [HttpPost]
    public async Task<IActionResult> Edit(int id, [FromBody] NhaCungCapFormVM form)
    {
        if (form == null || id <= 0) return BadRequest(new { message = "Dữ liệu không hợp lệ." });
        if (string.IsNullOrWhiteSpace(form.TenDonVi))
            return BadRequest(new { message = "Vui lòng nhập tên nhà cung cấp." });

        var ncc = await _context.DonViCapHangs.FindAsync(id);
        if (ncc == null) return NotFound(new { message = "Không tìm thấy nhà cung cấp." });

        string tenTrim = form.TenDonVi.Trim();
        bool isTenTrung = await _context.DonViCapHangs.AnyAsync(d => d.MaDonViCapHang != id && d.TenDonVi.ToLower() == tenTrim.ToLower());
        if (isTenTrung)
            return BadRequest(new { message = $"Tên nhà cung cấp \"{tenTrim}\" đã tồn tại trên hệ thống." });

        string maNcc = (form.MaNcc ?? "").Trim();
        if (!string.IsNullOrWhiteSpace(maNcc))
        {
            bool isMaTrung = await _context.DonViCapHangs.AnyAsync(d => d.MaDonViCapHang != id && d.MaNcc != null && d.MaNcc.ToLower() == maNcc.ToLower());
            if (isMaTrung)
                return BadRequest(new { message = $"Mã nhà cung cấp \"{maNcc}\" đã tồn tại trên hệ thống." });
        }

        ncc.TenDonVi = tenTrim;
        ncc.MaNcc = string.IsNullOrWhiteSpace(maNcc) ? ("NCC" + ncc.MaDonViCapHang.ToString("D5")) : maNcc;
        ncc.DienThoai = string.IsNullOrWhiteSpace(form.DienThoai) ? null : form.DienThoai.Trim();
        ncc.Email = string.IsNullOrWhiteSpace(form.Email) ? null : form.Email.Trim();
        ncc.DiaChi = string.IsNullOrWhiteSpace(form.DiaChi) ? null : form.DiaChi.Trim();
        ncc.KhuVuc = string.IsNullOrWhiteSpace(form.KhuVuc) ? null : form.KhuVuc.Trim();
        ncc.PhuongXa = string.IsNullOrWhiteSpace(form.PhuongXa) ? null : form.PhuongXa.Trim();
        ncc.MaNhomNcc = form.MaNhomNcc > 0 ? form.MaNhomNcc : null;
        ncc.GhiChu = string.IsNullOrWhiteSpace(form.GhiChu) ? null : form.GhiChu.Trim();
        ncc.TenCongTy = string.IsNullOrWhiteSpace(form.TenCongTy) ? null : form.TenCongTy.Trim();
        ncc.MaSoThue = string.IsNullOrWhiteSpace(form.MaSoThue) ? null : form.MaSoThue.Trim();
        ncc.SoCccd = string.IsNullOrWhiteSpace(form.SoCccd) ? null : form.SoCccd.Trim();
        if (!string.IsNullOrWhiteSpace(form.TrangThai))
        {
            ncc.TrangThai = (form.TrangThai == "HOAT_DONG" || form.TrangThai == "ACTIVE")
                ? "HOAT_DONG"
                : "NGUNG_GIAO_DICH";
        }

        await _context.SaveChangesAsync();
        return Json(new { success = true, id = ncc.MaDonViCapHang, message = $"Cập nhật nhà cung cấp \"{ncc.TenDonVi}\" thành công." });
    }

    // 7. Xóa Nhà cung cấp (Bảo vệ ràng buộc chứng từ)
    [HttpPost]
    public async Task<IActionResult> Delete(int id)
    {
        var ncc = await _context.DonViCapHangs.FindAsync(id);
        if (ncc == null) return NotFound(new { message = "Không tìm thấy nhà cung cấp." });

        bool hasTransaction = await _context.PhieuNhaps.AnyAsync(p => p.MaDonViCapHang == id);
        if (hasTransaction)
        {
            return BadRequest(new
            {
                success = false,
                hasTransaction = true,
                message = $"Nhà cung cấp \"{ncc.TenDonVi}\" ({ncc.MaNcc}) đã phát sinh phiếu nhập hàng trong hệ thống, không thể xóa vĩnh viễn. Bạn có thể chuyển sang trạng thái \"Ngừng hoạt động\"."
            });
        }

        _context.DonViCapHangs.Remove(ncc);
        await _context.SaveChangesAsync();
        return Json(new { success = true, message = $"Đã xóa nhà cung cấp \"{ncc.TenDonVi}\" thành công." });
    }

    // 8. Chuyển đổi trạng thái hoạt động / ngừng hoạt động
    [HttpPost]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        try
        {
            var ncc = await _context.DonViCapHangs.FindAsync(id);
            if (ncc == null) return NotFound(new { message = "Không tìm thấy nhà cung cấp." });

            ncc.TrangThai = (ncc.TrangThai == "HOAT_DONG") ? "NGUNG_GIAO_DICH" : "HOAT_DONG";
            await _context.SaveChangesAsync();

            string msg = ncc.TrangThai == "HOAT_DONG"
                ? $"Đã kích hoạt lại nhà cung cấp \"{ncc.TenDonVi}\"."
                : $"Đã chuyển nhà cung cấp \"{ncc.TenDonVi}\" sang trạng thái Ngừng hoạt động.";

            return Json(new { success = true, trangThai = ncc.TrangThai, message = msg });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi chuyển trạng thái nhà cung cấp id={Id}", id);
            return StatusCode(500, new { success = false, message = "Lỗi khi cập nhật trạng thái: " + ex.Message });
        }
    }

    // 9. Tạo nhanh Nhóm nhà cung cấp
    [HttpPost]
    public async Task<IActionResult> CreateGroupQuick([FromBody] QuickGroupSupplierRequest req)
    {
        if (string.IsNullOrWhiteSpace(req?.TenNhom)) return BadRequest(new { message = "Vui lòng nhập tên nhóm nhà cung cấp." });
        string name = req.TenNhom.Trim();

        var existing = await _context.NhomNhaCungCaps.FirstOrDefaultAsync(g => g.TenNhom.ToLower() == name.ToLower());
        if (existing != null)
        {
            return Json(new { success = true, maNhomNcc = existing.MaNhomNcc, tenNhom = existing.TenNhom });
        }

        var group = new NhomNhaCungCap { TenNhom = name, GhiChu = req.GhiChu };
        _context.NhomNhaCungCaps.Add(group);
        await _context.SaveChangesAsync();
        return Json(new { success = true, maNhomNcc = group.MaNhomNcc, tenNhom = group.TenNhom });
    }

    // 10. Đổi tên Nhóm nhà cung cấp trực tiếp từ dropdown
    [HttpPost]
    public async Task<IActionResult> UpdateGroupQuick([FromBody] UpdateGroupSupplierRequest req)
    {
        if (req == null || req.MaNhomNcc <= 0) return BadRequest(new { message = "Mã nhóm không hợp lệ." });
        if (string.IsNullOrWhiteSpace(req.TenNhom)) return BadRequest(new { message = "Vui lòng nhập tên nhóm nhà cung cấp." });

        string trimmedName = req.TenNhom.Trim();
        var group = await _context.NhomNhaCungCaps.FindAsync(req.MaNhomNcc);
        if (group == null) return NotFound(new { message = "Không tìm thấy nhóm nhà cung cấp." });

        bool isDuplicate = await _context.NhomNhaCungCaps.AnyAsync(g => g.MaNhomNcc != req.MaNhomNcc && g.TenNhom.ToLower() == trimmedName.ToLower());
        if (isDuplicate) return BadRequest(new { message = $"Tên nhóm \"{trimmedName}\" đã tồn tại trên hệ thống." });

        group.TenNhom = trimmedName;
        await _context.SaveChangesAsync();
        return Json(new { success = true, maNhomNcc = group.MaNhomNcc, tenNhom = group.TenNhom });
    }

    // 11. Xóa Nhóm nhà cung cấp trực tiếp từ dropdown
    [HttpPost]
    public async Task<IActionResult> DeleteGroupQuick([FromBody] DeleteGroupSupplierRequest req)
    {
        if (req == null || req.MaNhomNcc <= 0) return BadRequest(new { message = "Mã nhóm không hợp lệ." });

        var group = await _context.NhomNhaCungCaps.FindAsync(req.MaNhomNcc);
        if (group == null) return NotFound(new { message = "Không tìm thấy nhóm nhà cung cấp." });

        bool hasSuppliers = await _context.DonViCapHangs.AnyAsync(d => d.MaNhomNcc == req.MaNhomNcc);
        if (hasSuppliers)
        {
            return BadRequest(new { message = $"Không thể xóa nhóm \"{group.TenNhom}\" vì đang có nhà cung cấp thuộc nhóm này." });
        }

        _context.NhomNhaCungCaps.Remove(group);
        await _context.SaveChangesAsync();
        return Json(new { success = true, message = $"Đã xóa nhóm \"{group.TenNhom}\" thành công." });
    }

    // 12. AJAX Action bật/tắt đánh dấu sao (nhà cung cấp yêu thích)
    [AcceptVerbs("GET", "POST")]
    public async Task<IActionResult> ToggleFavorite(int id)
    {
        var item = await _context.DonViCapHangs.FindAsync(id);
        if (item == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy nhà cung cấp." });
        }

        item.DaDanhDau = !item.DaDanhDau;
        await _context.SaveChangesAsync();

        return Json(new { success = true, isFavorite = item.DaDanhDau, maDonViCapHang = item.MaDonViCapHang });
    }

    #region Helper Query Building
    private IQueryable<NhaCungCapItemVM> BuildFilterQuery(NhaCungCapFilterParams filter)
    {
        var query = _context.DonViCapHangs.AsNoTracking().AsQueryable();

        // 1. Tìm kiếm từ khóa theo mã, tên, số điện thoại (F3)
        if (!string.IsNullOrWhiteSpace(filter.Q))
        {
            string q = filter.Q.Trim().ToLower();
            query = query.Where(d =>
                d.TenDonVi.ToLower().Contains(q) ||
                (d.MaNcc != null && d.MaNcc.ToLower().Contains(q)) ||
                (d.DienThoai != null && d.DienThoai.Contains(q)) ||
                (d.Email != null && d.Email.ToLower().Contains(q)));
        }

        // 2. Lọc theo Nhóm NCC
        if (!string.IsNullOrWhiteSpace(filter.NhomNcc))
        {
            var nhomIds = filter.NhomNcc.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(s => int.TryParse(s, out int val) ? val : 0)
                .Where(v => v > 0)
                .ToList();

            if (nhomIds.Count > 0)
            {
                query = query.Where(d => d.MaNhomNcc.HasValue && nhomIds.Contains(d.MaNhomNcc.Value));
            }
        }

        // 3. Lọc theo Trạng thái (HOAT_DONG / NGUNG_GIAO_DICH / NGUNG_HOAT_DONG hoặc active / off)
        if (!string.IsNullOrWhiteSpace(filter.TrangThai))
        {
            string st = filter.TrangThai.Trim().ToUpper();
            if (st == "HOAT_DONG" || st == "ACTIVE")
            {
                query = query.Where(d => d.TrangThai == "HOAT_DONG");
            }
            else if (st == "NGUNG_HOAT_DONG" || st == "NGUNG_GIAO_DICH" || st == "OFF")
            {
                query = query.Where(d => d.TrangThai == "NGUNG_GIAO_DICH" || d.TrangThai == "NGUNG_HOAT_DONG");
            }
            else if (st != "ALL")
            {
                query = query.Where(d => d.TrangThai == filter.TrangThai);
            }
        }

        // 4. Lọc theo Thời gian tạo (dùng DateRangeHelper)
        if (filter.FromDate.HasValue)
        {
            query = query.Where(d => d.NgayTao >= filter.FromDate.Value);
        }
        if (filter.ToDate.HasValue)
        {
            query = query.Where(d => d.NgayTao <= filter.ToDate.Value);
        }

        // 5. Lọc theo Đánh dấu sao (yêu thích)
        if (filter.DaDanhDau)
        {
            query = query.Where(d => d.DaDanhDau);
        }

        // Ánh xạ sang NhaCungCapItemVM và tính tổng mua / nợ
        var mappedQuery = query.Select(d => new NhaCungCapItemVM
        {
            MaDonViCapHang = d.MaDonViCapHang,
            MaNcc = d.MaNcc ?? ("NCC" + d.MaDonViCapHang.ToString("D5")),
            TenDonVi = d.TenDonVi,
            DienThoai = d.DienThoai,
            Email = d.Email,
            MaNhomNcc = d.MaNhomNcc,
            TenNhomNcc = d.MaNhomNccNavigation != null ? d.MaNhomNccNavigation.TenNhom : null,
            DiaChi = d.DiaChi,
            KhuVuc = d.KhuVuc,
            PhuongXa = d.PhuongXa,
            TrangThai = d.TrangThai,
            DaDanhDau = d.DaDanhDau,
            NgayTao = d.NgayTao,
            NguoiTao = d.NguoiTao,
            GhiChu = d.GhiChu,
            TenCongTy = d.TenCongTy,
            MaSoThue = d.MaSoThue,
            SoCccd = d.SoCccd,
            TongMua = d.PhieuNhaps
                .Where(p => p.TrangThai == "DA_XAC_NHAN" || p.TrangThai == "HOAN_THANH" || p.TrangThai == "DA_NHAP")
                .SelectMany(p => p.ChiTietPhieuNhaps)
                .Sum(ct => (decimal?)(ct.SoLuong * ct.DonGiaNhap)) ?? 0m,
            NoCanTraHienTai = d.PhieuNhaps
                .Where(p => p.TrangThai == "DA_XAC_NHAN" || p.TrangThai == "HOAN_THANH" || p.TrangThai == "DA_NHAP")
                .SelectMany(p => p.ChiTietPhieuNhaps)
                .Sum(ct => (decimal?)(ct.SoLuong * ct.DonGiaNhap)) ?? 0m
        });

        // 5. Lọc theo khoảng Tổng mua
        if (filter.TongMuaTu.HasValue)
        {
            mappedQuery = mappedQuery.Where(d => d.TongMua >= filter.TongMuaTu.Value);
        }
        if (filter.TongMuaDen.HasValue)
        {
            mappedQuery = mappedQuery.Where(d => d.TongMua <= filter.TongMuaDen.Value);
        }

        // 6. Lọc theo khoảng Nợ hiện tại
        if (filter.NoTu.HasValue)
        {
            mappedQuery = mappedQuery.Where(d => d.NoCanTraHienTai >= filter.NoTu.Value);
        }
        if (filter.NoDen.HasValue)
        {
            mappedQuery = mappedQuery.Where(d => d.NoCanTraHienTai <= filter.NoDen.Value);
        }

        return mappedQuery;
    }

    private IQueryable<NhaCungCapItemVM> ApplySortingAndPaging(IQueryable<NhaCungCapItemVM> query, NhaCungCapFilterParams filter)
    {
        string sortBy = (filter.SortBy ?? "").ToLower().Trim();
        string sortDir = (filter.SortDir ?? "").ToLower().Trim();
        bool isDesc = sortDir == "desc";

        query = sortBy switch
        {
            "ma" => isDesc ? query.OrderByDescending(d => d.MaNcc) : query.OrderBy(d => d.MaNcc),
            "ten" => isDesc ? query.OrderByDescending(d => d.TenDonVi) : query.OrderBy(d => d.TenDonVi),
            "sdt" => isDesc ? query.OrderByDescending(d => d.DienThoai) : query.OrderBy(d => d.DienThoai),
            "email" => isDesc ? query.OrderByDescending(d => d.Email) : query.OrderBy(d => d.Email),
            "no" => isDesc ? query.OrderByDescending(d => d.NoCanTraHienTai) : query.OrderBy(d => d.NoCanTraHienTai),
            "tongmua" => isDesc ? query.OrderByDescending(d => d.TongMua) : query.OrderBy(d => d.TongMua),
            _ => query.OrderByDescending(d => d.NgayTao)
        };

        int skip = filter.GetSkipCount();
        int take = filter.PageSize < 1 ? 15 : filter.PageSize;

        return query.Skip(skip).Take(take);
    }

    // 12. Xuất file Excel danh sách Nhà cung cấp (Chuẩn KiotViet ClosedXML)
    [HttpGet]
    public async Task<IActionResult> Export(NhaCungCapFilterParams filter)
    {
        var (dateFrom, dateTo) = DateRangeHelper.Resolve(filter.ThoiGian, filter.FromDate, filter.ToDate);
        filter.FromDate = dateFrom;
        filter.ToDate = dateTo;

        var query = BuildFilterQuery(filter);
        var list = await query.OrderByDescending(d => d.NgayTao).ToListAsync();

        var rows = list.Select((ncc, idx) => (
            Stt: idx + 1,
            ncc.MaNcc,
            ncc.TenDonVi,
            DienThoai: ncc.DienThoai ?? "",
            Email: ncc.Email ?? "",
            TenNhom: ncc.TenNhomNcc ?? "Chưa phân nhóm",
            DiaChi: ncc.DiaChi ?? "",
            ncc.TongMua,
            ncc.NoCanTraHienTai,
            TrangThai: ncc.TrangThai == "HOAT_DONG" ? "Đang hoạt động" : "Ngừng hoạt động",
            GhiChu: ncc.GhiChu ?? ""
        ));

        var bytes = ExcelHelper.Export("DanhSachNhaCungCap", rows, col => col
            .AddCenter("STT", x => x.Stt)
            .AddCenter("Mã NCC", x => x.MaNcc)
            .AddText("Tên nhà cung cấp", x => x.TenDonVi)
            .AddCenter("Điện thoại", x => x.DienThoai)
            .AddText("Email", x => x.Email)
            .AddText("Nhóm nhà cung cấp", x => x.TenNhom)
            .AddText("Địa chỉ", x => x.DiaChi)
            .AddCurrency("Tổng mua", x => x.TongMua)
            .AddCurrency("Nợ hiện tại", x => x.NoCanTraHienTai)
            .AddCenter("Trạng thái", x => x.TrangThai)
            .AddText("Ghi chú", x => x.GhiChu)
        );

        string fileName = $"DanhSachNhaCungCap_{DateTime.Now:yyyyMMdd_HHmm}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
    #endregion
}
