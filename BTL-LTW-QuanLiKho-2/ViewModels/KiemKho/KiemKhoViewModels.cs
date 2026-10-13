using System.ComponentModel.DataAnnotations;
using BTL_LTW_QuanLiKho_2.Services;

namespace BTL_LTW_QuanLiKho_2.ViewModels;

public class PhieuKiemKeListItemVM
{
    public int MaPhieuKiemKe { get; set; }
    public string MaPhieuHienThi => MaChungTuHelper.FormatMaKiemKe(MaPhieuKiemKe);
    public DateTime ThoiDiemChot { get; set; }
    public DateTime? NgayCanBang { get; set; }
    public string TrangThai { get; set; } = "NHAP";
    public string TenTrangThai => TrangThai switch
    {
        "NHAP" => "Phiếu tạm",
        "DA_DIEU_CHINH" => "Đã cân bằng kho",
        "DA_KIEM" => "Đã kiểm",
        "HUY" => "Đã hủy",
        _ => TrangThai
    };
    public string BadgeClass => TrangThai switch
    {
        "NHAP" => "bg-primary text-white",
        "DA_DIEU_CHINH" => "bg-success text-white",
        "DA_KIEM" => "bg-info text-white",
        "HUY" => "bg-secondary text-white",
        _ => "bg-light text-dark"
    };

    public int MaKho { get; set; }
    public string TenKho { get; set; } = "";
    public int MaNvlap { get; set; }
    public string TenNguoiLap { get; set; } = "";
    public string? GhiChu { get; set; }

    public decimal TongThucTe { get; set; }
    public decimal TongSoLuongSo { get; set; }
    public decimal TongChenhLech => TongThucTe - TongSoLuongSo;
    public decimal SlLechTang { get; set; }
    public decimal SlLechGiam { get; set; }
    public decimal TongGiaTriLech { get; set; }
}

public class PhieuKiemKeFilterVM
{
    public string? Q { get; set; }
    public string DateFilterType { get; set; } = "THIS_MONTH"; // THIS_MONTH, TODAY, YESTERDAY, THIS_WEEK, LAST_WEEK, LAST_7_DAYS, LAST_MONTH, LAST_30_DAYS, THIS_QUARTER, THIS_YEAR, CUSTOM
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public List<string> Statuses { get; set; } = new() { "NHAP", "DA_DIEU_CHINH" };
    public int? CreatorId { get; set; }
    public int? WarehouseId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 15;
}

public class PhieuKiemKeIndexVM
{
    public PhieuKiemKeFilterVM Filter { get; set; } = new();
    public List<PhieuKiemKeListItemVM> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int TotalPages => Math.Max(1, (int)Math.Ceiling(TotalCount / (double)Filter.PageSize));
    public int CurrentWarehouseId { get; set; }
    public string CurrentWarehouseName { get; set; } = "";
    public List<WarehouseItemVM> Warehouses { get; set; } = new();
    public List<CreatorItemVM> Creators { get; set; } = new();
}

public class WarehouseItemVM
{
    public int MaKho { get; set; }
    public string TenKho { get; set; } = "";
}

public class CreatorItemVM
{
    public int MaNv { get; set; }
    public string TenNv { get; set; } = "";
}

public class PhieuKiemKeFormVM
{
    public int MaPhieuKiemKe { get; set; }
    public string MaPhieuHienThi => MaPhieuKiemKe > 0 ? MaChungTuHelper.FormatMaKiemKe(MaPhieuKiemKe) : "Mã phiếu tự động";

    [Required(ErrorMessage = "Vui lòng chọn kho")]
    public int MaKho { get; set; }
    public string TenKho { get; set; } = "";

    public int MaNvlap { get; set; }
    public string TenNguoiLap { get; set; } = "";

    [Required(ErrorMessage = "Vui lòng chọn ngày giờ kiểm")]
    public DateTime ThoiDiemChot { get; set; } = DateTime.Now;

    public string TrangThai { get; set; } = "NHAP";
    public string? GhiChu { get; set; }
    public bool IsReadOnly { get; set; }

    public DateTime? NgayCanBang { get; set; }
    public string? TenNguoiCanBang { get; set; }

    public List<PhieuKiemKeLineVM> Lines { get; set; } = new();

    // Thuộc tính tổng hợp
    public decimal TongThucTe => Lines.Where(x => x.SoLuongThucTe.HasValue).Sum(x => x.SoLuongThucTe!.Value);
    public decimal TongChenhLech => Lines.Where(x => x.SoLuongThucTe.HasValue).Sum(x => x.SoLuongThucTe!.Value - x.SoLuongTheoSo);
    public decimal SlLechTang => Lines.Where(x => x.SoLuongThucTe.HasValue && x.SoLuongThucTe.Value > x.SoLuongTheoSo).Sum(x => x.SoLuongThucTe!.Value - x.SoLuongTheoSo);
    public decimal SlLechGiam => Lines.Where(x => x.SoLuongThucTe.HasValue && x.SoLuongThucTe.Value < x.SoLuongTheoSo).Sum(x => x.SoLuongTheoSo - x.SoLuongThucTe!.Value);
    public decimal TongGiaTriLech => Lines.Where(x => x.SoLuongThucTe.HasValue).Sum(x => (x.SoLuongThucTe!.Value - x.SoLuongTheoSo) * x.DonGia);

    public int CountAll => Lines.Count;
    public int CountKhop => Lines.Count(x => x.SoLuongThucTe.HasValue && x.SoLuongThucTe.Value == x.SoLuongTheoSo);
    public int CountLech => Lines.Count(x => x.SoLuongThucTe.HasValue && x.SoLuongThucTe.Value != x.SoLuongTheoSo);
    public int CountChuaKiem => Lines.Count(x => !x.SoLuongThucTe.HasValue);
}

public class PhieuKiemKeLineVM
{
    public int MaHang { get; set; }
    public string MaHangNoiBo { get; set; } = "";
    public string TenHang { get; set; } = "";
    public string TenDvt { get; set; } = "";
    public string TenNhom { get; set; } = "";
    public decimal SoLuongTheoSo { get; set; }
    public decimal? SoLuongThucTe { get; set; } // null = Chưa kiểm
    public decimal DonGia { get; set; } // Giá vốn / Giá tham khảo

    public decimal? SlChenhLech => SoLuongThucTe.HasValue ? SoLuongThucTe.Value - SoLuongTheoSo : null;
    public decimal? GiaTriLech => SlChenhLech.HasValue ? SlChenhLech.Value * DonGia : null;
}

public class ProductSearchItemVM
{
    public int MaHang { get; set; }
    public string MaHangNoiBo { get; set; } = "";
    public string TenHang { get; set; } = "";
    public string TenDvt { get; set; } = "";
    public string TenNhom { get; set; } = "";
    public decimal Gia { get; set; }
    public decimal TonKho { get; set; }
}

public class SaveStockTakeRequest
{
    public int MaPhieuKiemKe { get; set; }
    public int MaKho { get; set; }
    public int MaNvlap { get; set; }
    public DateTime ThoiDiemChot { get; set; }
    public string? GhiChu { get; set; }
    public List<SaveStockTakeLineRequest> Lines { get; set; } = new();
}

public class SaveStockTakeLineRequest
{
    public int MaHang { get; set; }
    public decimal SoLuongTheoSo { get; set; }
    public decimal? SoLuongThucTe { get; set; }
    public decimal DonGia { get; set; }
}
