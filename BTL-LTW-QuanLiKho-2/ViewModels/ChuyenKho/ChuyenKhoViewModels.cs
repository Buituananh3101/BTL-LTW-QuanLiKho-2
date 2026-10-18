using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.Rendering;
using BTL_LTW_QuanLiKho_2.Models;
using BTL_LTW_QuanLiKho_2.Services;
using BTL_LTW_QuanLiKho_2.ViewModels;
using BTL_LTW_QuanLiKho_2.ViewModels.Common;

namespace BTL_LTW_QuanLiKho_2.ViewModels.ChuyenKho;

public class ChuyenKhoListItemVM
{
    public int MaPhieuChuyen { get; set; }
    public string? MaPhieu { get; set; }
    public string MaPhieuHienThi => !string.IsNullOrWhiteSpace(MaPhieu) ? MaPhieu : MaChungTuHelper.FormatMaChuyenKho(MaPhieuChuyen);

    public int MaKhoNguon { get; set; }
    public string TenKhoNguon { get; set; } = "";
    public int MaKhoDich { get; set; }
    public string TenKhoDich { get; set; } = "";

    public int MaNvlap { get; set; }
    public string TenNguoiLap { get; set; } = "";
    public int? MaNvxuat { get; set; }
    public string? TenNguoiXuat { get; set; }
    public int? MaNvnhan { get; set; }
    public string? TenNguoiNhan { get; set; }

    public DateTime NgayLap { get; set; }
    public DateTime? ThoiDiemXuat { get; set; }
    public DateTime? ThoiDiemNhan { get; set; }

    public string TrangThai { get; set; } = "NHAP";

    public string TenTrangThai => TrangThai switch
    {
        "NHAP" or "PHIEU_TAM" => "Phiếu tạm",
        "DA_XUAT" or "DANG_CHUYEN" => "Đang chuyển",
        "DA_NHAN" => "Đã nhận",
        "HUY" or "DA_HUY" => "Đã hủy",
        _ => TrangThai
    };

    public string BadgeClass => TrangThai switch
    {
        "NHAP" or "PHIEU_TAM" => "badge bg-primary-subtle text-primary border border-primary-subtle",
        "DA_XUAT" or "DANG_CHUYEN" => "badge bg-warning-subtle text-warning border border-warning-subtle",
        "DA_NHAN" => "badge bg-success-subtle text-success border border-success-subtle",
        _ => "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
    };

    public string? GhiChu { get; set; }
    public string? GhiChuNhan { get; set; }

    public decimal TongSoLuongChuyen { get; set; }
    public decimal TongSoLuongNhan { get; set; }
    public decimal TongGiaTriChuyen { get; set; }
    public bool DaDanhDau { get; set; }

    public decimal ChenhLechThieu => TrangThai == "DA_NHAN" ? (TongSoLuongChuyen - TongSoLuongNhan) : 0m;
    public bool CoNhanThieu => TrangThai == "DA_NHAN" && ChenhLechThieu > 0m;

    public List<ChuyenKhoLineVM> Lines { get; set; } = new();
}

public class ChuyenKhoLineVM
{
    public int MaCtphieuChuyen { get; set; }
    public int MaHang { get; set; }
    public string MaHangNoiBo { get; set; } = "";
    public string TenHang { get; set; } = "";
    public string TenDvt { get; set; } = "";

    public decimal TonKho { get; set; }
    public decimal SoLuong { get; set; }
    public decimal? SoLuongNhan { get; set; }
    public decimal DonGiaChuyen { get; set; }
    public decimal ThanhTien => SoLuong * DonGiaChuyen;

    public decimal ChenhLech => SoLuong - (SoLuongNhan ?? SoLuong);
}

public class ChuyenKhoFilterVM
{
    public string? Q { get; set; }
    public string Dir { get; set; } = "all"; // all: Tất cả, out: Chuyển đi từ kho này, in: Chuyển đến kho này
    public List<string> Statuses { get; set; } = new() { "NHAP", "DA_XUAT", "DA_NHAN" };

    public string DateFilterType { get; set; } = "thangnay";
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }

    public bool DaDanhDau { get; set; } = false;
    public string? SortBy { get; set; }
    public string? SortDir { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 15;
}

public class ChuyenKhoIndexVM
{
    public PagedResult<ChuyenKhoListItemVM> PagedData { get; set; } = new();
    public ChuyenKhoFilterVM Filter { get; set; } = new();

    public int CurrentKhoId { get; set; }
    public string CurrentKhoName { get; set; } = "";

    public decimal TongSlChuyenTong { get; set; }
    public decimal TongSlNhanTong { get; set; }
    public decimal TongGiaTriTong { get; set; }

    public List<Kho> DanhSachKho { get; set; } = new();
}

public class ChuyenKhoFormVM
{
    public int? MaPhieuChuyen { get; set; }
    public string? MaPhieu { get; set; }

    public int MaKhoNguon { get; set; }
    public string TenKhoNguon { get; set; } = "";

    [Required(ErrorMessage = "Vui lòng chọn kho nhận")]
    public int MaKhoDich { get; set; }

    public DateTime NgayLap { get; set; } = DateTime.Now;
    public string? GhiChu { get; set; }
    public string TrangThai { get; set; } = "NHAP";

    public List<ChuyenKhoLineVM> Lines { get; set; } = new();

    public List<SelectListItem> KhoNhanOptions { get; set; } = new();

    public bool IsEdit => MaPhieuChuyen.HasValue && MaPhieuChuyen.Value > 0;
    public bool IsCopy { get; set; }
}

public class SaveChuyenKhoRequest
{
    public int? MaPhieuChuyen { get; set; }
    public string? MaPhieu { get; set; }
    public int MaKhoDich { get; set; }
    public DateTime? NgayLap { get; set; }
    public string? GhiChu { get; set; }
    public string ActionType { get; set; } = "SAVE_DRAFT"; // "SAVE_DRAFT" (NHAP) hoặc "SEND" (DA_XUAT)

    public List<SaveChuyenKhoLineItem> Lines { get; set; } = new();
}

public class SaveChuyenKhoLineItem
{
    public int MaHang { get; set; }
    public decimal SoLuong { get; set; }
}

public class ReceiveChuyenKhoRequest
{
    public int MaPhieuChuyen { get; set; }
    public string? GhiChuNhan { get; set; }
    public List<ReceiveLineItem> Lines { get; set; } = new();
}

public class ReceiveLineItem
{
    public int MaHang { get; set; }
    public decimal SoLuongNhan { get; set; }
}

public class SaveChuyenKhoNoteRequest
{
    public int MaPhieuChuyen { get; set; }
    public string? GhiChu { get; set; }
}
