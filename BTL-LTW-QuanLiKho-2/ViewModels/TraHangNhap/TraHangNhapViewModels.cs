using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.Rendering;
using BTL_LTW_QuanLiKho_2.Services;
using BTL_LTW_QuanLiKho_2.ViewModels.Common;

namespace BTL_LTW_QuanLiKho_2.ViewModels.TraHangNhap;

public class TraHangNhapListItemVM
{
    public int MaPhieuTraHang { get; set; }
    public string? MaPhieu { get; set; }
    public string MaPhieuHienThi => !string.IsNullOrWhiteSpace(MaPhieu) ? MaPhieu : MaChungTuHelper.FormatMaTraHangNhap(MaPhieuTraHang);
    public DateTime NgayLap { get; set; }
    public DateTime NgayTra { get; set; }
    public string TrangThai { get; set; } = "NHAP";

    public string TenTrangThai => TrangThai switch
    {
        "PHIEU_TAM" or "NHAP" => "Phiếu tạm",
        "DA_TRA_HANG" or "HOAN_THANH" or "DA_XAC_NHAN" => "Đã trả hàng",
        "DA_HUY" or "HUY" => "Đã hủy",
        _ => TrangThai
    };

    public string BadgeClass => TrangThai switch
    {
        "PHIEU_TAM" or "NHAP" => "badge bg-warning-subtle text-warning border border-warning-subtle",
        "DA_TRA_HANG" or "HOAN_THANH" or "DA_XAC_NHAN" => "badge bg-success-subtle text-success border border-success-subtle",
        _ => "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
    };

    public int? MaDonViCapHang { get; set; }
    public string? MaNcc { get; set; }
    public string? TenNcc { get; set; }

    public int MaKho { get; set; }
    public string TenKho { get; set; } = "";
    public int MaNvlap { get; set; }
    public string TenNguoiLap { get; set; } = "";
    public int? MaNvtra { get; set; }
    public string? TenNguoiTra { get; set; }

    public string? GhiChu { get; set; }

    public decimal TongSoLuong { get; set; }
    public decimal TongTienHang { get; set; }
    public decimal GiamGia { get; set; }
    public decimal CanThuNcc { get; set; }
    public decimal DaThuNcc { get; set; }
    public decimal CongNo => CanThuNcc - DaThuNcc;
    public bool DaDanhDau { get; set; }

    public List<TraHangNhapLineVM> Lines { get; set; } = new();
    public int SoMatHang => Lines.Count;
}

public class TraHangNhapLineVM
{
    public int MaHang { get; set; }
    public string MaHangNoiBo { get; set; } = "";
    public string TenHang { get; set; } = "";
    public string TenDvt { get; set; } = "";
    public decimal SoLuong { get; set; }
    public decimal GiaVon { get; set; }
    public decimal DonGiaTra { get; set; }
    public decimal ThanhTien => SoLuong * DonGiaTra;
    public decimal TonKho { get; set; }
    public string? GhiChu { get; set; }
}

public class TraHangNhapFilterVM
{
    public string? Q { get; set; }
    public string? AdvSup { get; set; }
    public string? AdvProd { get; set; }
    public string DateFilterType { get; set; } = "ALL";
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public List<string> Statuses { get; set; } = new() { "NHAP", "DA_TRA_HANG" };
    public List<int> NccIds { get; set; } = new();
    public int? NccId { get; set; }
    public List<int> CreatorIds { get; set; } = new();
    public int? CreatorId { get; set; }
    public List<int> PayerIds { get; set; } = new();
    public int? PayerId { get; set; }
    public bool DaDanhDau { get; set; } = false;

    public string? SortBy { get; set; }
    public string? SortDir { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 15;
}

public class TraHangNhapIndexVM
{
    public PagedResult<TraHangNhapListItemVM> PagedData { get; set; } = new();
    public TraHangNhapFilterVM Filter { get; set; } = new();
    public bool DaDanhDauFilter => Filter?.DaDanhDau ?? false;
    public string? SortBy => string.IsNullOrWhiteSpace(Filter?.SortBy) ? null : Filter.SortBy;
    public string? SortDir => string.IsNullOrWhiteSpace(Filter?.SortDir) ? null : Filter.SortDir;

    public decimal TongSoLuong { get; set; }
    public decimal TongTienHang { get; set; }
    public decimal TongGiamGia { get; set; }
    public decimal TongCanThuNcc { get; set; }
    public decimal TongDaThuNcc { get; set; }

    public List<SelectListItem> NhanViens { get; set; } = new();
    public List<SelectListItem> NhaCungCaps { get; set; } = new();
}

public class TraHangNhapFormVM
{
    public int MaPhieuTraHang { get; set; }
    public string? MaPhieu { get; set; }
    public string MaPhieuHienThi => !string.IsNullOrWhiteSpace(MaPhieu) ? MaPhieu : (MaPhieuTraHang > 0 ? MaChungTuHelper.FormatMaTraHangNhap(MaPhieuTraHang) : "");
    public int MaKho { get; set; }
    public string TenKho { get; set; } = "";
    public DateTime NgayLap { get; set; } = DateTime.Now;
    public DateTime NgayTra { get; set; } = DateTime.Now;
    public int MaNvlap { get; set; }
    public string TenNguoiLap { get; set; } = "";
    public int? MaNvtra { get; set; }
    public string? TenNguoiTra { get; set; }

    public int? MaDonViCapHang { get; set; }
    public string? TenDonViCapHang { get; set; }
    public string? MaNcc { get; set; }
    public string? DienThoaiNcc { get; set; }
    public decimal NoHienTaiNcc { get; set; }

    public string? GhiChu { get; set; }

    public decimal GiamGia { get; set; }
    public string LoaiGiamGia { get; set; } = "vnd";
    public decimal GiamGiaTri { get; set; }
    public decimal TongTienHang { get; set; }
    public decimal CanThuNcc { get; set; }
    public decimal DaThuNcc { get; set; }

    public string TrangThai { get; set; } = "NHAP";
    public string TenTrangThai => TrangThai switch
    {
        "PHIEU_TAM" or "NHAP" => "Phiếu tạm",
        "DA_TRA_HANG" or "HOAN_THANH" or "DA_XAC_NHAN" => "Đã trả hàng",
        "DA_HUY" or "HUY" => "Đã hủy",
        _ => TrangThai
    };

    public bool IsReadOnly { get; set; } = false;

    public List<TraHangNhapLineVM> Lines { get; set; } = new();
    public List<SelectListItem> NhanViens { get; set; } = new();
    public List<SelectListItem> NhaCungCaps { get; set; } = new();
    public List<BTL_LTW_QuanLiKho_2.Models.NhomNhaCungCap> NhomNccList { get; set; } = new();
}

public class SaveTraHangNhapRequest
{
    public int MaPhieuTraHang { get; set; }
    public string? MaPhieu { get; set; }
    public int? MaKho { get; set; }
    public DateTime? NgayTra { get; set; }
    public int? MaNvtra { get; set; }
    public int? MaDonViCapHang { get; set; }
    public string? GhiChu { get; set; }
    public decimal GiamGia { get; set; }
    public decimal DaThuNcc { get; set; }
    public string ActionType { get; set; } = "TAM"; // "TAM" hoặc "HOAN_THANH"
    public List<SaveTraHangNhapLineItem> Lines { get; set; } = new();
}

public class SaveTraHangNhapLineItem
{
    public int MaHang { get; set; }
    public decimal SoLuong { get; set; }
    public decimal GiaVon { get; set; }
    public decimal DonGiaTra { get; set; }
    public string? GhiChu { get; set; }
}

public class QuickUpdateTraHangNoteRequest
{
    public int MaPhieuTraHang { get; set; }
    public string? GhiChu { get; set; }
    public int? MaNvtra { get; set; }
    public DateTime? NgayTra { get; set; }
}
