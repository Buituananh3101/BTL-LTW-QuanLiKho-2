using BTL_LTW_QuanLiKho_2.Models;

namespace BTL_LTW_QuanLiKho_2.Services;

public class NhatKyThaoTacService : INhatKyThaoTacService
{
    private readonly QuanLyKhoPhuQuocLtwContext _context;

    public NhatKyThaoTacService(QuanLyKhoPhuQuocLtwContext context)
    {
        _context = context;
    }

    public async Task GhiNhatKyAsync(int maTaiKhoan, string thaoTac, string loaiDoiTuong, string maDoiTuong, string? noiDung = null)
    {
        try
        {
            var audit = new NhatKyThaoTac
            {
                MaTaiKhoan = maTaiKhoan > 0 ? maTaiKhoan : 1,
                ThoiDiem = DateTime.Now,
                ThaoTac = thaoTac,
                LoaiDoiTuong = loaiDoiTuong,
                MaDoiTuong = maDoiTuong,
                NoiDung = noiDung
            };

            _context.NhatKyThaoTacs.Add(audit);
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Bảo toàn nghiệp vụ: Việc ghi nhật ký thất bại không được làm gián đoạn giao dịch chính
        }
    }
}
