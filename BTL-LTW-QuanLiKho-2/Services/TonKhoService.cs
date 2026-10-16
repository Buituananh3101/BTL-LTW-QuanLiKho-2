using Microsoft.EntityFrameworkCore;
using BTL_LTW_QuanLiKho_2.Models;

namespace BTL_LTW_QuanLiKho_2.Services;

public interface ITonKhoService
{
    Task<decimal> LayTonKhoHienTaiAsync(int maKho, int maHang);
    Task<Dictionary<int, decimal>> LayTonKhoTheoKhoAsync(int maKho);
    Task<(bool HopLe, string? ThongBaoLoi)> KiemTraXuatKhoAsync(int maKho, IEnumerable<(int MaHang, decimal SoLuongXuat)> danhSachXuat);
    Task<(bool HopLe, string? ThongBaoLoi)> KiemTraHuyPhieuNhapAsync(int maPhieuNhap);
    Task<(bool HopLe, string? ThongBaoLoi)> KiemTraKiemKeAsync(int maKho, IEnumerable<(int MaHang, decimal? SoLuongThucTe)> danhSachKiem);
}

public class TonKhoService : ITonKhoService
{
    private readonly QuanLyKhoPhuQuocLtwContext _context;

    public TonKhoService(QuanLyKhoPhuQuocLtwContext context)
    {
        _context = context;
    }

    public async Task<decimal> LayTonKhoHienTaiAsync(int maKho, int maHang)
    {
        var ton = await _context.VwTonKhoHienTais
            .Where(t => t.MaKho == maKho && t.MaHang == maHang)
            .Select(t => t.SoLuongTon)
            .FirstOrDefaultAsync();
        return ton ?? 0m;
    }

    public async Task<Dictionary<int, decimal>> LayTonKhoTheoKhoAsync(int maKho)
    {
        return await _context.VwTonKhoHienTais
            .Where(t => t.MaKho == maKho)
            .ToDictionaryAsync(t => t.MaHang, t => t.SoLuongTon ?? 0m);
    }

    public async Task<(bool HopLe, string? ThongBaoLoi)> KiemTraXuatKhoAsync(int maKho, IEnumerable<(int MaHang, decimal SoLuongXuat)> danhSachXuat)
    {
        var tonMap = await LayTonKhoTheoKhoAsync(maKho);
        var hangIds = danhSachXuat.Select(x => x.MaHang).Distinct().ToList();
        var hangHoas = await _context.HangHoas
            .Where(h => hangIds.Contains(h.MaHang))
            .ToDictionaryAsync(h => h.MaHang, h => h.TenHang);

        foreach (var item in danhSachXuat)
        {
            decimal tonHienTai = tonMap.TryGetValue(item.MaHang, out var s) ? s : 0m;
            if (tonHienTai < item.SoLuongXuat)
            {
                string tenHang = hangHoas.TryGetValue(item.MaHang, out var name) ? name : $"Hàng #{item.MaHang}";
                return (false, $"Mặt hàng '{tenHang}' tồn kho chỉ còn {tonHienTai:N0}, không đủ để xuất {item.SoLuongXuat:N0}. Giao dịch bị chặn để bảo đảm không âm kho.");
            }
        }

        return (true, null);
    }

    public async Task<(bool HopLe, string? ThongBaoLoi)> KiemTraHuyPhieuNhapAsync(int maPhieuNhap)
    {
        var phieu = await _context.PhieuNhaps
            .Include(p => p.ChiTietPhieuNhaps)
            .FirstOrDefaultAsync(p => p.MaPhieuNhap == maPhieuNhap);

        if (phieu == null) return (false, "Không tìm thấy phiếu nhập.");
        if (phieu.TrangThai != "DA_XAC_NHAN") return (true, null); // Phiếu chưa xác nhận thì không ảnh hưởng tồn

        var tonMap = await LayTonKhoTheoKhoAsync(phieu.MaKho);
        var hangIds = phieu.ChiTietPhieuNhaps.Select(x => x.MaHang).Distinct().ToList();
        var hangHoas = await _context.HangHoas
            .Where(h => hangIds.Contains(h.MaHang))
            .ToDictionaryAsync(h => h.MaHang, h => h.TenHang);

        foreach (var ct in phieu.ChiTietPhieuNhaps)
        {
            decimal tonHienTai = tonMap.TryGetValue(ct.MaHang, out var s) ? s : 0m;
            if (tonHienTai < ct.SoLuong)
            {
                string tenHang = hangHoas.TryGetValue(ct.MaHang, out var name) ? name : $"Hàng #{ct.MaHang}";
                return (false, $"Không thể hủy phiếu nhập #{maPhieuNhap} vì mặt hàng '{tenHang}' đã phát sinh xuất kho (tồn hiện tại chỉ còn {tonHienTai:N0}, nếu trừ {ct.SoLuong:N0} sẽ bị âm kho).");
            }
        }

        return (true, null);
    }

    public async Task<(bool HopLe, string? ThongBaoLoi)> KiemTraKiemKeAsync(int maKho, IEnumerable<(int MaHang, decimal? SoLuongThucTe)> danhSachKiem)
    {
        var hangIds = danhSachKiem.Where(x => x.SoLuongThucTe.HasValue && x.SoLuongThucTe.Value < 0).Select(x => x.MaHang).ToList();
        if (hangIds.Any())
        {
            var tenHang = await _context.HangHoas.Where(h => h.MaHang == hangIds.First()).Select(h => h.TenHang).FirstOrDefaultAsync();
            return (false, $"Số lượng thực tế của mặt hàng '{tenHang}' không được nhỏ hơn 0. Không thể cân bằng kho âm.");
        }

        return (true, null);
    }
}
