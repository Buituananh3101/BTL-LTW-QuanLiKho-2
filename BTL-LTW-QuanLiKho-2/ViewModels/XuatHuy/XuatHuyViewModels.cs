using System.ComponentModel.DataAnnotations;
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

public class XuatHuyFilterVM
{
    public string? Q { get; set; }
    public string DateFilterType { get; set; } = "THANG_NAY"; // THANG_NAY là mặc định chuẩn KiotViet
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public List<string> Statuses { get; set; } = new() { "NHAP", "DA_XAC_NHAN" };
    public List<int> CreatorIds { get; set; } = new();
    public List<int> ConfirmerIds { get; set; } = new();
    public int? WarehouseId { get; set; }
    public bool DaDanhDau { get; set; } = false;
    public string? SortBy { get; set; }
    public string? SortDir { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 15;
}

public class XuatHuyIndexVM
{
    public XuatHuyFilterVM Filter { get; set; } = new();
    public bool DaDanhDauFilter => Filter.DaDanhDau;
    public List<XuatHuyListItemVM> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int TotalPages => Math.Max(1, (int)Math.Ceiling(TotalCount / (double)Filter.PageSize));
    public PagedResult<XuatHuyListItemVM> PagedData => new()
    {
        Items = Items,
        TotalItems = TotalCount,
        PageIndex = Filter.Page,
        PageSize = Filter.PageSize
    };
    public int CurrentWarehouseId { get; set; }
    public string CurrentWarehouseName { get; set; } = "";
    public List<WarehouseItemVM> Warehouses { get; set; } = new();
    public List<CreatorItemVM> Creators { get; set; } = new();
    public List<CreatorItemVM> Confirmers { get; set; } = new();
    public string? SortBy { get; set; }
    public string? SortDir { get; set; }
}

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
