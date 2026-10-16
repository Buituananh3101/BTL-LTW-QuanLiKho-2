using System.ComponentModel.DataAnnotations;
using BTL_LTW_QuanLiKho_2.Models;

namespace BTL_LTW_QuanLiKho_2.ViewModels;

public class HangHoaForm
{
    public int MaHang { get; set; }

    [StringLength(30), RegularExpression(@"^[A-Za-z0-9_-]*$", ErrorMessage = "Mã chỉ gồm chữ không dấu, số, dấu gạch ngang hoặc gạch dưới.")]
    [Display(Name = "Mã hàng")]
    public string? MaHangNoiBo { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập tên hàng hóa."), StringLength(150)]
    [Display(Name = "Tên hàng")]
    public string TenHang { get; set; } = "";

    [Range(1, int.MaxValue, ErrorMessage = "Vui lòng chọn nhóm hàng.")]
    [Display(Name = "Nhóm hàng")]
    public int MaNhom { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Vui lòng chọn đơn vị tính.")]
    [Display(Name = "Đơn vị tính")]
    public int MaDvt { get; set; }

    [StringLength(255)]
    [Display(Name = "Quy cách / Mã vạch")]
    public string? QuyCach { get; set; }

    [Range(typeof(decimal), "0", "999999999999999", ErrorMessage = "Giá bán phải từ 0.")]
    [Display(Name = "Giá bán")]
    public decimal GiaBanThamKhao { get; set; }

    [Range(typeof(decimal), "0", "999999999999999", ErrorMessage = "Giá vốn phải từ 0.")]
    [Display(Name = "Giá vốn")]
    public decimal GiaVon { get; set; }

    [Range(typeof(decimal), "0", "999999999999999", ErrorMessage = "Tồn kho phải từ 0.")]
    [Display(Name = "Tồn kho ban đầu")]
    public decimal? TonKhoBanDau { get; set; }

    [Range(typeof(decimal), "0", "999999999999999", ErrorMessage = "Định mức tồn tối thiểu phải từ 0.")]
    [Display(Name = "Tồn tối thiểu")]
    public decimal? TonToiThieu { get; set; }

    [Required, StringLength(20)]
    [Display(Name = "Trạng thái")]
    public string TrangThai { get; set; } = "DANG_BAN";

    public string? HinhAnhBase64 { get; set; }
    public bool XoaHinhAnh { get; set; }
}

public class HangHoaItemVM
{
    public int MaHang { get; set; }
    public string MaHangNoiBo { get; set; } = "";
    public string TenHang { get; set; } = "";
    public int MaNhom { get; set; }
    public string TenNhom { get; set; } = "";
    public int MaDvt { get; set; }
    public string TenDvt { get; set; } = "";
    public decimal GiaBan { get; set; }
    public decimal GiaVon { get; set; }
    public decimal TonKho { get; set; }
    public decimal? TonToiThieu { get; set; }
    public string? QuyCach { get; set; }
    public string TrangThai { get; set; } = "DANG_BAN";
    public bool IsFavorite { get; set; }
    public bool DaDanhDau { get; set; }
    public bool HasImage { get; set; }
    public DateTime? NgayTao { get; set; }
    public int KhachDat { get; set; } = 0;
    public string DuKienHetHang { get; set; } = "---";
}

public class HangHoaIndexVM
{
    public List<HangHoaItemVM> Items { get; set; } = new();
    public int CurrentWarehouseId { get; set; }
    public string CurrentWarehouseName { get; set; } = "";
    public string? Q { get; set; }
    public int? Nhom { get; set; }
    public string? TrangThai { get; set; }
    public string TonKhoFilter { get; set; } = "ALL"; // ALL, DUOI_DINH_MUC, CON_HANG, HET_HANG
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 15;
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public int ActiveCount { get; set; }
    public decimal TotalStockSum { get; set; }
    public decimal TotalValueSum { get; set; }
    public int TotalKhachDatSum { get; set; } = 0;

    public string? NhaCungCap { get; set; }
    public string? LoaiHang { get; set; }
    public string? ViTri { get; set; }
    public string DuKienFilter { get; set; } = "ALL";
    public string TgTaoFilter { get; set; } = "ALL";
    public bool DaDanhDauFilter { get; set; } = false;

    public List<NhomHang> NhomHangs { get; set; } = new();
    public List<DonViTinh> DonViTinhs { get; set; } = new();
    public List<DonViCapHang> DonViCapHangs { get; set; } = new();
}
