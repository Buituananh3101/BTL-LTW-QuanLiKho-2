using Microsoft.EntityFrameworkCore;
using BTL_LTW_QuanLiKho_2.Models;

namespace BTL_LTW_QuanLiKho_2.Services;

/// <summary>
/// Giao diện xử lý nghiệp vụ Bán hàng (POS) liên kết tự động với biến động kho.
/// Giải quyết triệt để [ISSUE-05]: Đảm bảo mọi giao dịch bán hàng đều sinh PhieuXuat hợp lệ để trừ tồn kho.
/// </summary>
public interface IBanHangService
{
    /// <summary>
    /// Tạo đơn bán tại quầy (POS) và tự động sinh kèm Phiếu xuất kho (DA_XAC_NHAN, XUAT_BAN)
    /// trong cùng 1 transaction, đồng thời kiểm tra chặn tồn âm.
    /// </summary>
    Task<(bool ThanhCong, string? ThongBaoLoi, DonBan? DonBan, PhieuXuat? PhieuXuat)> TaoDonBanVaXuatKhoAsync(
        DonBan donBan,
        IEnumerable<ChiTietDonBan> danhSachChiTiet,
        int? maNvXacNhan = null,
        int? maTaiKhoan = null);

    /// <summary>
    /// Xuất kho cho một đơn bán hiện có (trước đó chưa sinh phiếu xuất hoặc ở trạng thái tạm),
    /// tự động sinh PhieuXuat (DA_XAC_NHAN, XUAT_BAN) và kiểm tra chặn tồn âm.
    /// </summary>
    Task<(bool ThanhCong, string? ThongBaoLoi, PhieuXuat? PhieuXuat)> XuatKhoChoDonBanAsync(
        int maDonBan,
        int? maNvXacNhan = null,
        int? maTaiKhoan = null);

    /// <summary>
    /// Hủy đơn bán và hủy phiếu xuất kho đi kèm, tự động hoàn trả số lượng tồn kho trong cùng 1 transaction.
    /// </summary>
    Task<(bool ThanhCong, string? ThongBaoLoi)> HuyDonBanVaPhieuXuatAsync(
        int maDonBan,
        string lyDoHuy,
        int? maTaiKhoan = null);
}

public class BanHangService : IBanHangService
{
    private readonly QuanLyKhoPhuQuocLtwContext _context;
    private readonly ITonKhoService _tonKhoService;

    public BanHangService(QuanLyKhoPhuQuocLtwContext context, ITonKhoService tonKhoService)
    {
        _context = context;
        _tonKhoService = tonKhoService;
    }

    public async Task<(bool ThanhCong, string? ThongBaoLoi, DonBan? DonBan, PhieuXuat? PhieuXuat)> TaoDonBanVaXuatKhoAsync(
        DonBan donBan,
        IEnumerable<ChiTietDonBan> danhSachChiTiet,
        int? maNvXacNhan = null,
        int? maTaiKhoan = null)
    {
        if (donBan == null)
            return (false, "Dữ liệu đơn bán không hợp lệ.", null, null);

        if (donBan.MaKho <= 0)
            return (false, "Vui lòng chọn kho hàng xuất bán hợp lệ.", null, null);

        var chiTietList = danhSachChiTiet?.ToList() ?? new List<ChiTietDonBan>();
        if (!chiTietList.Any())
            return (false, "Đơn bán phải có ít nhất một mặt hàng.", null, null);

        foreach (var ct in chiTietList)
        {
            if (ct.MaHang <= 0 || ct.SoLuong <= 0)
                return (false, "Thông tin mặt hàng hoặc số lượng xuất bán không hợp lệ.", null, null);
        }

        // 1. Kiểm tra chặn tồn âm trước khi thực hiện giao dịch (ISSUE-02)
        var kiemTraTon = await _tonKhoService.KiemTraXuatKhoAsync(
            donBan.MaKho,
            chiTietList.Select(x => (x.MaHang, x.SoLuong)));

        if (!kiemTraTon.HopLe)
            return (false, kiemTraTon.ThongBaoLoi, null, null);

        // 2. Mở giao dịch CSDL để đồng bộ DonBan và PhieuXuat (ISSUE-05)
        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            // Thiết lập thông tin đơn bán
            donBan.TrangThai = "HOAN_TAT";
            if (donBan.NgayLap == default)
                donBan.NgayLap = DateTime.Now;

            _context.DonBans.Add(donBan);
            await _context.SaveChangesAsync();

            // Lưu chi tiết đơn bán
            foreach (var ct in chiTietList)
            {
                ct.MaDonBan = donBan.MaDonBan;
                _context.ChiTietDonBans.Add(ct);
            }
            await _context.SaveChangesAsync();

            // Tự động sinh Phiếu Xuất Kho đi kèm với trạng thái DA_XAC_NHAN
            var phieuXuat = new PhieuXuat
            {
                MaDonBan = donBan.MaDonBan,
                LoaiPhieuXuat = "XUAT_BAN",
                MaKho = donBan.MaKho,
                MaNvlap = donBan.MaNvlap,
                MaNvxacNhan = maNvXacNhan ?? donBan.MaNvlap,
                NgayLap = donBan.NgayLap,
                NgayXacNhan = DateTime.Now,
                TrangThai = "DA_XAC_NHAN",
                GhiChu = string.IsNullOrWhiteSpace(donBan.GhiChu)
                    ? $"Tự động xuất kho từ đơn bán POS #{donBan.MaDonBan}"
                    : donBan.GhiChu
            };
            _context.PhieuXuats.Add(phieuXuat);
            await _context.SaveChangesAsync();

            // Sao chép chi tiết đơn bán sang chi tiết phiếu xuất
            foreach (var ct in chiTietList)
            {
                var ctXuat = new ChiTietPhieuXuat
                {
                    MaPhieuXuat = phieuXuat.MaPhieuXuat,
                    MaCtdonBan = ct.MaCtdonBan,
                    MaHang = ct.MaHang,
                    SoLuongXuat = ct.SoLuong,
                    DonGiaXuat = ct.DonGiaApDung
                };
                _context.ChiTietPhieuXuats.Add(ctXuat);
            }
            await _context.SaveChangesAsync();

            // Ghi nhật ký thao tác
            if (maTaiKhoan.HasValue)
            {
                _context.NhatKyThaoTacs.Add(new NhatKyThaoTac
                {
                    MaTaiKhoan = maTaiKhoan.Value,
                    ThoiDiem = DateTime.Now,
                    ThaoTac = "Bán hàng POS & Tự động xuất kho",
                    LoaiDoiTuong = "DonBan",
                    MaDoiTuong = donBan.MaDonBan.ToString(),
                    NoiDung = $"Lập đơn bán #{donBan.MaDonBan} và tự động sinh phiếu xuất #{phieuXuat.MaPhieuXuat} tại kho #{donBan.MaKho}"
                });
                await _context.SaveChangesAsync();
            }

            await trans.CommitAsync();
            return (true, null, donBan, phieuXuat);
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return (false, $"Lỗi xử lý giao dịch bán hàng và xuất kho: {ex.Message}", null, null);
        }
    }

    public async Task<(bool ThanhCong, string? ThongBaoLoi, PhieuXuat? PhieuXuat)> XuatKhoChoDonBanAsync(
        int maDonBan,
        int? maNvXacNhan = null,
        int? maTaiKhoan = null)
    {
        var donBan = await _context.DonBans
            .Include(d => d.ChiTietDonBans)
            .Include(d => d.PhieuXuat)
                .ThenInclude(p => p!.ChiTietPhieuXuats)
            .FirstOrDefaultAsync(d => d.MaDonBan == maDonBan);

        if (donBan == null)
            return (false, $"Không tìm thấy đơn bán #{maDonBan}.", null);

        if (donBan.TrangThai == "HUY")
            return (false, "Đơn bán đã bị hủy, không thể xuất kho.", null);

        if (donBan.PhieuXuat != null && donBan.PhieuXuat.TrangThai == "DA_XAC_NHAN")
            return (true, "Đơn bán đã được xuất kho trước đó.", donBan.PhieuXuat);

        if (!donBan.ChiTietDonBans.Any())
            return (false, "Đơn bán không có chi tiết mặt hàng để xuất kho.", null);

        // 1. Kiểm tra chặn tồn âm
        var kiemTraTon = await _tonKhoService.KiemTraXuatKhoAsync(
            donBan.MaKho,
            donBan.ChiTietDonBans.Select(x => (x.MaHang, x.SoLuong)));

        if (!kiemTraTon.HopLe)
            return (false, kiemTraTon.ThongBaoLoi, null);

        // 2. Mở giao dịch CSDL
        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            PhieuXuat phieuXuat;

            if (donBan.PhieuXuat != null)
            {
                // Cập nhật phiếu xuất tạm hiện có sang DA_XAC_NHAN
                phieuXuat = donBan.PhieuXuat;
                phieuXuat.TrangThai = "DA_XAC_NHAN";
                phieuXuat.NgayXacNhan = DateTime.Now;
                phieuXuat.MaNvxacNhan = maNvXacNhan ?? donBan.MaNvlap;
                phieuXuat.MaKho = donBan.MaKho;
                phieuXuat.LoaiPhieuXuat = "XUAT_BAN";
                _context.PhieuXuats.Update(phieuXuat);
            }
            else
            {
                // Tạo mới phiếu xuất
                phieuXuat = new PhieuXuat
                {
                    MaDonBan = donBan.MaDonBan,
                    LoaiPhieuXuat = "XUAT_BAN",
                    MaKho = donBan.MaKho,
                    MaNvlap = donBan.MaNvlap,
                    MaNvxacNhan = maNvXacNhan ?? donBan.MaNvlap,
                    NgayLap = donBan.NgayLap,
                    NgayXacNhan = DateTime.Now,
                    TrangThai = "DA_XAC_NHAN",
                    GhiChu = $"Tự động xuất kho từ đơn bán #{donBan.MaDonBan}"
                };
                _context.PhieuXuats.Add(phieuXuat);
                await _context.SaveChangesAsync();

                foreach (var ct in donBan.ChiTietDonBans)
                {
                    var ctXuat = new ChiTietPhieuXuat
                    {
                        MaPhieuXuat = phieuXuat.MaPhieuXuat,
                        MaCtdonBan = ct.MaCtdonBan,
                        MaHang = ct.MaHang,
                        SoLuongXuat = ct.SoLuong,
                        DonGiaXuat = ct.DonGiaApDung
                    };
                    _context.ChiTietPhieuXuats.Add(ctXuat);
                }
            }

            donBan.TrangThai = "HOAN_TAT";
            await _context.SaveChangesAsync();

            // Ghi nhật ký
            if (maTaiKhoan.HasValue)
            {
                _context.NhatKyThaoTacs.Add(new NhatKyThaoTac
                {
                    MaTaiKhoan = maTaiKhoan.Value,
                    ThoiDiem = DateTime.Now,
                    ThaoTac = "Xuất kho cho đơn bán",
                    LoaiDoiTuong = "DonBan",
                    MaDoiTuong = donBan.MaDonBan.ToString(),
                    NoiDung = $"Xác nhận xuất kho phiếu #{phieuXuat.MaPhieuXuat} cho đơn bán #{donBan.MaDonBan}"
                });
                await _context.SaveChangesAsync();
            }

            await trans.CommitAsync();
            return (true, null, phieuXuat);
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return (false, $"Lỗi xuất kho cho đơn bán: {ex.Message}", null);
        }
    }

    public async Task<(bool ThanhCong, string? ThongBaoLoi)> HuyDonBanVaPhieuXuatAsync(
        int maDonBan,
        string lyDoHuy,
        int? maTaiKhoan = null)
    {
        var donBan = await _context.DonBans
            .Include(d => d.PhieuXuat)
            .FirstOrDefaultAsync(d => d.MaDonBan == maDonBan);

        if (donBan == null)
            return (false, $"Không tìm thấy đơn bán #{maDonBan}.");

        if (donBan.TrangThai == "HUY")
            return (false, "Đơn bán này đã ở trạng thái hủy trước đó.");

        using var trans = await _context.Database.BeginTransactionAsync();
        try
        {
            donBan.TrangThai = "HUY";
            donBan.GhiChu = string.IsNullOrWhiteSpace(donBan.GhiChu)
                ? $"Đã hủy: {lyDoHuy}"
                : $"{donBan.GhiChu} | Đã hủy: {lyDoHuy}";

            if (donBan.PhieuXuat != null)
            {
                // Chuyển phiếu xuất sang HUY -> vw_BienDongKho tự động bỏ qua -> hoàn lại tồn kho
                donBan.PhieuXuat.TrangThai = "HUY";
                donBan.PhieuXuat.GhiChu = string.IsNullOrWhiteSpace(donBan.PhieuXuat.GhiChu)
                    ? $"Hủy theo đơn bán #{maDonBan}: {lyDoHuy}"
                    : $"{donBan.PhieuXuat.GhiChu} | Hủy theo đơn bán #{maDonBan}: {lyDoHuy}";
            }

            await _context.SaveChangesAsync();

            if (maTaiKhoan.HasValue)
            {
                _context.NhatKyThaoTacs.Add(new NhatKyThaoTac
                {
                    MaTaiKhoan = maTaiKhoan.Value,
                    ThoiDiem = DateTime.Now,
                    ThaoTac = "Hủy đơn bán & hoàn tồn",
                    LoaiDoiTuong = "DonBan",
                    MaDoiTuong = donBan.MaDonBan.ToString(),
                    NoiDung = $"Hủy đơn bán #{donBan.MaDonBan} (lý do: {lyDoHuy}). Tồn kho tự động hoàn lại."
                });
                await _context.SaveChangesAsync();
            }

            await trans.CommitAsync();
            return (true, null);
        }
        catch (Exception ex)
        {
            await trans.RollbackAsync();
            return (false, $"Lỗi hủy đơn bán: {ex.Message}");
        }
    }
}
