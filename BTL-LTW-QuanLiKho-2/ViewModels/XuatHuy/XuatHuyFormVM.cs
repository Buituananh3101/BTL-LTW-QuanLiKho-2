using System.ComponentModel.DataAnnotations;
using BTL_LTW_QuanLiKho_2.Services;

namespace BTL_LTW_QuanLiKho_2.ViewModels;

public class XuatHuyFormVM
{
    public int MaPhieuXuat { get; set; }
    public string? MaPhieu { get; set; }
    public string MaPhieuHienThi => !string.IsNullOrWhiteSpace(MaPhieu) ? MaPhieu : (MaPhieuXuat > 0 ? MaChungTuHelper.FormatMaXuatHuy(MaPhieuXuat) : "Mã phiếu tự động");

    [Required(ErrorMessage = "Vui lòng chọn kho")]
    public int MaKho { get; set; }
    public string TenKho { get; set; } = "";

    public int MaNvlap { get; set; }
    public string TenNguoiLap { get; set; } = "";

    public int? MaNvxacNhan { get; set; }
    public string? TenNguoiXacNhan { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn ngày giờ xuất hủy")]
    public DateTime NgayLap { get; set; } = DateTime.Now;
    public DateTime? NgayXacNhan { get; set; }

    public string TrangThai { get; set; } = "NHAP";
    public string? GhiChu { get; set; }
    public bool IsReadOnly { get; set; }

    public List<XuatHuyLineVM> Lines { get; set; } = new();

    public decimal TongSoLuong => Lines.Sum(x => x.SoLuongXuat);
    public decimal TongGiaTriHuy => Lines.Sum(x => x.ThanhTien);
    public int CountAll => Lines.Count;

    public List<CreatorItemVM> NhanViens { get; set; } = new();
}

public class SaveXuatHuyRequest
{
    public int MaPhieuXuat { get; set; }
    public string? MaPhieu { get; set; }
    public int MaKho { get; set; }
    public int? MaNvxacNhan { get; set; }
    public DateTime NgayLap { get; set; } = DateTime.Now;
    public string? GhiChu { get; set; }
    public List<SaveXuatHuyLineRequest> Lines { get; set; } = new();
}

public class SaveXuatHuyLineRequest
{
    public int MaHang { get; set; }
    public decimal SoLuongXuat { get; set; }
    public decimal DonGiaXuat { get; set; }
}

public class UpdateXuatHuyNoteRequest
{
    public int MaPhieuXuat { get; set; }
    public string? GhiChu { get; set; }
}
