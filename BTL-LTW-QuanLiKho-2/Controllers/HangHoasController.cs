using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using BTL_LTW_QuanLiKho_2.Models;
using BTL_LTW_QuanLiKho_2.ViewModels;

namespace BTL_LTW_QuanLiKho_2.Controllers;

public class HangHoasController : Controller
{
    private readonly QuanLyKhoPhuQuocLtwContext _context;
    public HangHoasController(QuanLyKhoPhuQuocLtwContext context) => _context = context;
    private IQueryable<HangHoa> Goods() => _context.HangHoas.AsNoTracking()
        .Include(x => x.MaNhomNavigation).Include(x => x.MaDvtNavigation);

    public async Task<IActionResult> Index(string? q, int? nhom, string? trangThai, int page = 1)
    {
        var query = Goods();
        q = q?.Trim();
        if (!string.IsNullOrEmpty(q)) query = query.Where(x => x.TenHang.Contains(q) || x.MaHangNoiBo.Contains(q));
        if (nhom.HasValue) query = query.Where(x => x.MaNhom == nhom);
        if (!string.IsNullOrEmpty(trangThai)) query = query.Where(x => x.TrangThai == trangThai);
        const int size = 10;
        int count = await query.CountAsync();
        int pages = Math.Max(1, (int)Math.Ceiling(count / (double)size));
        page = Math.Clamp(page, 1, pages);
        ViewBag.Q = q; ViewBag.Nhom = nhom; ViewBag.TrangThai = trangThai;
        ViewBag.Count = count; ViewBag.Page = page; ViewBag.Pages = pages;
        ViewBag.Total = await _context.HangHoas.CountAsync();
        ViewBag.Active = await _context.HangHoas.CountAsync(x => x.TrangThai == "DANG_BAN");
        await Options();
        return View(await query.OrderBy(x => x.MaHangNoiBo).Skip((page - 1) * size).Take(size).ToListAsync());
    }
    public async Task<IActionResult> Details(int? id)
    {
        var item = await Goods().FirstOrDefaultAsync(x => x.MaHang == id);
        return item == null ? NotFound() : View(item);
    }
    public async Task<IActionResult> Create() { await Options(); return View(new HangHoaForm()); }
    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(HangHoaForm model)
    {
        model.MaHang = 0;
        await ValidateForm(model);
        if (ModelState.IsValid)
        {
            var item = new HangHoa(); Copy(model, item); _context.HangHoas.Add(item);
            if (await Save()) { TempData["Success"] = "Đã thêm hàng hóa."; return RedirectToAction(nameof(Index)); }
        }
        await Options(model); return View(model);
    }
    public async Task<IActionResult> Edit(int? id)
    {
        var x = await _context.HangHoas.FindAsync(id);
        if (x == null) return NotFound();
        var model = new HangHoaForm { MaHang=x.MaHang, MaHangNoiBo=x.MaHangNoiBo, TenHang=x.TenHang,
            MaNhom=x.MaNhom, MaDvt=x.MaDvt, QuyCach=x.QuyCach, GiaBanThamKhao=x.GiaBanThamKhao, TrangThai=x.TrangThai };
        await Options(model); return View(model);
    }
    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, HangHoaForm model)
    {
        if (id != model.MaHang) return NotFound();
        var item = await _context.HangHoas.FindAsync(id);
        if (item == null) return NotFound();
        await ValidateForm(model);
        if (ModelState.IsValid)
        {
            Copy(model,item);
            if (await Save()) { TempData["Success"] = "Đã cập nhật hàng hóa."; return RedirectToAction(nameof(Index)); }
        }
        await Options(model); return View(model);
    }
    public async Task<IActionResult> Delete(int? id)
    {
        var item = await Goods().FirstOrDefaultAsync(x => x.MaHang == id);
        return item == null ? NotFound() : View(item);
    }
    [HttpPost, ActionName("Delete"), ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var item = await _context.HangHoas.FindAsync(id);
        if (item == null) return NotFound();
        // Không xóa hàng đã được sử dụng trong chứng từ hoặc cấu hình tồn kho.
        bool used = await _context.ChiTietDonBans.AnyAsync(x => x.MaHang == id)
            || await _context.ChiTietPhieuNhaps.AnyAsync(x => x.MaHang == id)
            || await _context.ChiTietPhieuChuyenKhos.AnyAsync(x => x.MaHang == id)
            || await _context.ChiTietPhieuKiemKes.AnyAsync(x => x.MaHang == id)
            || await _context.NguongTonKhos.AnyAsync(x => x.MaHang == id);
        if (used) ModelState.AddModelError("", "Hàng đã được sử dụng. Hãy vào Sửa để ngừng bán thay vì xóa.");
        else
        {
            _context.HangHoas.Remove(item);
            if (await Save()) { TempData["Success"] = "Đã xóa hàng hóa."; return RedirectToAction(nameof(Index)); }
        }
        return View(await Goods().FirstAsync(x => x.MaHang == id));
    }
    private async Task Options(HangHoaForm? model = null)
    {
        ViewBag.NhomHang = new SelectList(await _context.NhomHangs.AsNoTracking().OrderBy(x=>x.TenNhom).ToListAsync(), "MaNhom", "TenNhom", model?.MaNhom);
        ViewBag.DonViTinh = new SelectList(await _context.DonViTinhs.AsNoTracking().OrderBy(x=>x.TenDvt).ToListAsync(), "MaDvt", "TenDvt", model?.MaDvt);
        var states = await _context.HangHoas.Select(x=>x.TrangThai).Distinct().ToListAsync();
        states = states.Concat(new[] { "DANG_BAN", "NGUNG_BAN" }).Distinct().OrderBy(x=>x).ToList();
        ViewBag.States = states.Select(x=>new SelectListItem(x == "DANG_BAN" ? "Đang bán" : x == "NGUNG_BAN" ? "Ngừng bán" : x, x)).ToList();
    }
    private async Task ValidateForm(HangHoaForm m)
    {
        m.MaHangNoiBo = m.MaHangNoiBo?.Trim() ?? ""; m.TenHang = m.TenHang?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(m.TenHang)) ModelState.AddModelError("TenHang", "Nhập tên hàng.");
        if (await _context.HangHoas.AnyAsync(x=>x.MaHangNoiBo==m.MaHangNoiBo && x.MaHang!=m.MaHang)) ModelState.AddModelError("MaHangNoiBo", "Mã hàng đã tồn tại.");
        if (!await _context.NhomHangs.AnyAsync(x=>x.MaNhom==m.MaNhom)) ModelState.AddModelError("MaNhom", "Nhóm hàng không tồn tại.");
        if (!await _context.DonViTinhs.AnyAsync(x=>x.MaDvt==m.MaDvt)) ModelState.AddModelError("MaDvt", "Đơn vị tính không tồn tại.");
        if (m.TrangThai != "DANG_BAN" && m.TrangThai != "NGUNG_BAN"
            && !await _context.HangHoas.AnyAsync(x=>x.TrangThai==m.TrangThai)) ModelState.AddModelError("TrangThai", "Trạng thái không hợp lệ.");
    }
    private static void Copy(HangHoaForm m, HangHoa x)
    {
        x.MaHangNoiBo=m.MaHangNoiBo; x.TenHang=m.TenHang; x.MaNhom=m.MaNhom; x.MaDvt=m.MaDvt;
        x.QuyCach=m.QuyCach?.Trim(); x.GiaBanThamKhao=m.GiaBanThamKhao; x.TrangThai=m.TrangThai;
    }
    private async Task<bool> Save()
    {
        try { await _context.SaveChangesAsync(); return true; }
        catch (DbUpdateConcurrencyException) { ModelState.AddModelError("", "Dữ liệu đã thay đổi. Hãy tải lại trang."); }
        catch (DbUpdateException) { ModelState.AddModelError("", "Không thể lưu. Kiểm tra mã trùng, dữ liệu liên quan hoặc ràng buộc CSDL."); }
        return false;
    }
}
