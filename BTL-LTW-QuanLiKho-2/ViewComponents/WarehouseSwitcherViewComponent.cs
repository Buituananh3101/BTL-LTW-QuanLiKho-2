using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BTL_LTW_QuanLiKho_2.Models;
using BTL_LTW_QuanLiKho_2.ViewModels;
using BTL_LTW_QuanLiKho_2.Services;

namespace BTL_LTW_QuanLiKho_2.ViewComponents;

public class WarehouseSwitcherViewComponent : ViewComponent
{
    private readonly QuanLyKhoPhuQuocLtwContext _context;

    public WarehouseSwitcherViewComponent(QuanLyKhoPhuQuocLtwContext context)
    {
        _context = context;
    }

    public async Task<IViewComponentResult> InvokeAsync()
    {
        var user = HttpContext.User;
        var isAuthenticated = user.Identity?.IsAuthenticated == true;
        var vaiTro = user.GetVaiTro();
        var maTaiKhoan = user.GetMaTaiKhoan();

        List<KhoItemVM> danhSachKho;

        // Nếu là Quản lý hoặc chưa đăng nhập: Xem được tất cả các kho đang hoạt động
        if (!isAuthenticated || vaiTro == "Quản lý")
        {
            danhSachKho = await _context.Khos
                .Where(k => k.TrangThai == "HOAT_DONG")
                .OrderBy(k => k.MaKho)
                .Select(k => new KhoItemVM
                {
                    MaKho = k.MaKho,
                    TenKho = k.TenKho,
                    DiaChi = k.DiaChi
                })
                .ToListAsync();
        }
        else
        {
            // Nhân viên: Chỉ lấy danh sách kho được phân quyền trong bảng TaiKhoanKho
            var allowedKhoIds = await _context.TaiKhoanKhos
                .Where(tk => tk.MaTaiKhoan == maTaiKhoan)
                .Select(tk => tk.MaKho)
                .ToListAsync();

            danhSachKho = await _context.Khos
                .Where(k => k.TrangThai == "HOAT_DONG" && allowedKhoIds.Contains(k.MaKho))
                .OrderBy(k => k.MaKho)
                .Select(k => new KhoItemVM
                {
                    MaKho = k.MaKho,
                    TenKho = k.TenKho,
                    DiaChi = k.DiaChi
                })
                .ToListAsync();

            // Trường hợp dự phòng an toàn (tài khoản chưa được gán kho cụ thể trong CSDL)
            if (!danhSachKho.Any())
            {
                var khoDauTien = await _context.Khos
                    .Where(k => k.TrangThai == "HOAT_DONG")
                    .OrderBy(k => k.MaKho)
                    .Select(k => new KhoItemVM
                    {
                        MaKho = k.MaKho,
                        TenKho = k.TenKho,
                        DiaChi = k.DiaChi
                    })
                    .FirstOrDefaultAsync();

                if (khoDauTien != null)
                {
                    danhSachKho.Add(khoDauTien);
                }
            }
        }

        // Lấy mã kho hiện tại từ Session
        var currentWhId = HttpContext.Session.GetInt32("CurrentWarehouseId");
        KhoItemVM? currentWh = null;

        if (currentWhId.HasValue && danhSachKho.Any(k => k.MaKho == currentWhId.Value))
        {
            currentWh = danhSachKho.First(k => k.MaKho == currentWhId.Value);
        }
        else if (danhSachKho.Any())
        {
            // Nếu chưa có trong session hoặc kho trong session không được phép truy cập
            currentWh = danhSachKho.First();
            HttpContext.Session.SetInt32("CurrentWarehouseId", currentWh.MaKho);
        }

        var model = new WarehouseSwitcherVM
        {
            CurrentWarehouseId = currentWh?.MaKho ?? 0,
            CurrentWarehouseName = currentWh?.TenKho ?? "Chọn kho",
            DanhSachKho = danhSachKho
        };

        return View(model);
    }
}
