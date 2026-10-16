namespace BTL_LTW_QuanLiKho_2.Services;

public interface INhatKyThaoTacService
{
    Task GhiNhatKyAsync(int maTaiKhoan, string thaoTac, string loaiDoiTuong, string maDoiTuong, string? noiDung = null);
}
