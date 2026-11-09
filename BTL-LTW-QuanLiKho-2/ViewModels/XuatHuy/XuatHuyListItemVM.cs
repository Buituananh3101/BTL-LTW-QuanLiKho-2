using BTL_LTW_QuanLiKho_2.Services;

namespace BTL_LTW_QuanLiKho_2.ViewModels;

public class XuatHuyListItemVM
{
    public int MaPhieuXuat { get; set; }
    public string? MaPhieu { get; set; }
    public string MaPhieuHienThi => !string.IsNullOrWhiteSpace(MaPhieu) ? MaPhieu : MaChungTuHelper.FormatMaXuatHuy(MaPhieuXuat);
    public DateTime NgayLap { get; set; }
    public DateTime? NgayXacNhan { get; set; }
    public string TrangThai { get; set; } = "NHAP";
    public string TenTrangThai => TrangThai switch
    {
        "NHAP" => "Phiếu tạm",
        "DA_XAC_NHAN" => "Hoàn thành",
        "HUY" => "Đã hủy",
        _ => TrangThai
    };
    public string BadgeClass => TrangThai switch
    {
        "NHAP" => "bg-primary text-white",
        "DA_XAC_NHAN" => "bg-success text-white",
        "HUY" => "bg-secondary text-white",
        _ => "bg-light text-dark"
    };

    public int MaKho { get; set; }
    public string TenKho { get; set; } = "";
    public int MaNvlap { get; set; }
    public string TenNguoiLap { get; set; } = "";
    public int? MaNvxacNhan { get; set; }
    public string? TenNguoiXacNhan { get; set; }
    public string? GhiChu { get; set; }

    public decimal TongSoLuong { get; set; }
    public decimal TongGiaTriHuy { get; set; }
    public bool DaDanhDau { get; set; }
    public List<XuatHuyLineVM> Lines { get; set; } = new();
}

public class XuatHuyLineVM
{
    public int MaHang { get; set; }
    public string MaHangNoiBo { get; set; } = "";
    public string TenHang { get; set; } = "";
    public string TenDvt { get; set; } = "";
    public decimal SoLuongXuat { get; set; }
    public decimal DonGiaXuat { get; set; } // Giá vốn
    public decimal ThanhTien => SoLuongXuat * DonGiaXuat;
    public decimal TonKho { get; set; }
}
