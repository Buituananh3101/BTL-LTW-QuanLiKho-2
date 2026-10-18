using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.Rendering;
using BTL_LTW_QuanLiKho_2.Services;

namespace BTL_LTW_QuanLiKho_2.ViewModels.NhapHang;

public class NhapHangListItemVM
{
    public int MaPhieuNhap { get; set; }
    public string? MaPhieu { get; set; }
    public string MaPhieuHienThi => !string.IsNullOrWhiteSpace(MaPhieu) ? MaPhieu : MaChungTuHelper.FormatMaNhapKho(MaPhieuNhap);
    public DateTime NgayLap { get; set; }
    public DateTime? NgayXacNhan { get; set; }
    public string TrangThai { get; set; } = "NHAP";

    public string TenTrangThai => TrangThai switch
    {
        "PHIEU_TAM" or "NHAP" => "Phiếu tạm",
        "DA_XAC_NHAN" or "HOAN_THANH" => "Đã nhập hàng",
        "DA_HUY" or "HUY" => "Đã hủy",
        _ => TrangThai
    };

    public string BadgeClass => TrangThai switch
    {
        "PHIEU_TAM" or "NHAP" => "badge bg-primary-subtle text-primary border border-primary-subtle",
        "DA_XAC_NHAN" or "HOAN_THANH" => "badge bg-success-subtle text-success border border-success-subtle",
        _ => "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
    };

    public int? MaDonViCapHang { get; set; }
    public string? MaNcc { get; set; }
    public string? TenNcc { get; set; }

    public int MaKho { get; set; }
    public string TenKho { get; set; } = "";
    public int MaNvlap { get; set; }
    public string TenNguoiLap { get; set; } = "";
    public int? MaNvxacNhan { get; set; }
    public string? TenNguoiXacNhan { get; set; }

    public string? SoHoaDon { get; set; }
    public string? MaDatHangNhap { get; set; }
    public string? GhiChu { get; set; }

    public decimal TongTien { get; set; }
    public decimal GiamGia { get; set; }
    public decimal CanTraNcc { get; set; }
    public bool DaDanhDau { get; set; }

    public List<NhapHangLineVM> Lines { get; set; } = new();
    public decimal TongSoLuong => Lines.Sum(l => l.SoLuong);
}

public class NhapHangLineVM
{
    public int MaHang { get; set; }
    public string MaHangNoiBo { get; set; } = "";
    public string TenHang { get; set; } = "";
    public string TenDvt { get; set; } = "";
    public decimal SoLuong { get; set; }
    public decimal DonGiaNhap { get; set; }
    public decimal GiamGia { get; set; }
    public decimal ThanhTien => (SoLuong * DonGiaNhap) - GiamGia;
    public decimal TonKho { get; set; }
}

public class NhapHangFilterVM
{
    public string? Q { get; set; }
    public string DateFilterType { get; set; } = "ALL"; // Mặc định Toàn thời gian khớp Kiểm kho
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public List<string> Statuses { get; set; } = new() { "NHAP", "DA_XAC_NHAN" };
    public List<int> NccIds { get; set; } = new();
    public int? NccId { get; set; }
    public List<int> CreatorIds { get; set; } = new();
    public int? CreatorId { get; set; }
    public List<int> ConfirmerIds { get; set; } = new();
    public int? ConfirmerId { get; set; }
    public string? SoHoaDon { get; set; }
    public bool DaDanhDau { get; set; } = false;

    public string SortBy { get; set; } = "tg"; // ma, tg, ncc, cantra, st
    public string SortDir { get; set; } = "desc";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 15;
}

public class NhapHangIndexVM
{
    public PagedResult<NhapHangListItemVM> PagedData { get; set; } = new();
    public NhapHangFilterVM Filter { get; set; } = new();
    public bool DaDanhDauFilter => Filter?.DaDanhDau ?? false;
    public string SortBy => Filter?.SortBy ?? "tg";
    public string SortDir => Filter?.SortDir ?? "desc";

    public decimal TongCanTraNcc { get; set; }

    public List<SelectListItem> NhanViens { get; set; } = new();
    public List<SelectListItem> NhaCungCaps { get; set; } = new();
}

public class NhapHangFormVM
{
    public int MaPhieuNhap { get; set; }
    public string? MaPhieu { get; set; }
    public string MaPhieuHienThi => !string.IsNullOrWhiteSpace(MaPhieu) ? MaPhieu : (MaPhieuNhap > 0 ? MaChungTuHelper.FormatMaNhapKho(MaPhieuNhap) : "");
    public int MaKho { get; set; }
    public string TenKho { get; set; } = "";
    public DateTime NgayLap { get; set; } = DateTime.Now;
    public int MaNvlap { get; set; }
    public string TenNguoiLap { get; set; } = "";

    public int? MaDonViCapHang { get; set; }
    public string? TenDonViCapHang { get; set; }
    public string? MaNcc { get; set; }

    public string? SoHoaDon { get; set; }
    public string? MaDatHangNhap { get; set; }
    public string? GhiChu { get; set; }

    public decimal GiamGia { get; set; }
    public decimal TongTien { get; set; }
    public decimal CanTraNcc { get; set; }

    public string TrangThai { get; set; } = "NHAP";
    public string TenTrangThai => TrangThai switch
    {
        "PHIEU_TAM" or "NHAP" => "Phiếu tạm",
        "DA_XAC_NHAN" or "HOAN_THANH" => "Đã nhập hàng",
        "DA_HUY" or "HUY" => "Đã hủy",
        _ => TrangThai
    };

    public bool IsReadOnly { get; set; } = false;

    public List<NhapHangLineVM> Lines { get; set; } = new();
    public List<SelectListItem> NhanViens { get; set; } = new();
    public List<SelectListItem> NhaCungCaps { get; set; } = new();
    public List<BTL_LTW_QuanLiKho_2.Models.NhomNhaCungCap> NhomNccList { get; set; } = new();
}

public class SaveNhapHangRequest
{
    public int MaPhieuNhap { get; set; }
    public string? MaPhieu { get; set; }
    public int? MaKho { get; set; }
    public DateTime? NgayLap { get; set; }
    public int? MaNvlap { get; set; }
    public int? MaDonViCapHang { get; set; }
    public string? SoHoaDon { get; set; }
    public string? MaDatHangNhap { get; set; }
    public string? GhiChu { get; set; }
    public decimal GiamGia { get; set; }
    public string ActionType { get; set; } = "TAM"; // "TAM" hoặc "HOAN_THANH"
    public List<SaveNhapHangLineItem> Lines { get; set; } = new();
}

public class SaveNhapHangLineItem
{
    public int MaHang { get; set; }
    public decimal SoLuong { get; set; }
    public decimal DonGiaNhap { get; set; }
    public decimal GiamGia { get; set; }
}

public class SaveNoteRequest
{
    public int MaPhieuNhap { get; set; }
    public string? GhiChu { get; set; }
}

public class QuickSupplierVM
{
    public string TenDonVi { get; set; } = "";
    public string? MaNcc { get; set; }
    public string? DienThoai { get; set; }
    public string? DiaChi { get; set; }
}

