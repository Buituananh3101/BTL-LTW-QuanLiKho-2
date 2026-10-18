using System;
using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class DonViCapHang
{
    public int MaDonViCapHang { get; set; }

    public string? MaNcc { get; set; }

    public string TenDonVi { get; set; } = null!;

    public string? DienThoai { get; set; }

    public string? Email { get; set; }

    public string? DiaChi { get; set; }

    public string? KhuVuc { get; set; }

    public string? PhuongXa { get; set; }

    public int? MaNhomNcc { get; set; }

    public string? GhiChu { get; set; }

    public string? TenCongTy { get; set; }

    public string? MaSoThue { get; set; }

    public string? SoCccd { get; set; }

    public DateTime NgayTao { get; set; } = DateTime.Now;

    public string? NguoiTao { get; set; }

    public string TrangThai { get; set; } = "HOAT_DONG";

    public bool DaDanhDau { get; set; } = false;

    public virtual NhomNhaCungCap? MaNhomNccNavigation { get; set; }

    public virtual ICollection<PhieuNhap> PhieuNhaps { get; set; } = new List<PhieuNhap>();

    public virtual ICollection<PhieuTraHangNhap> PhieuTraHangNhaps { get; set; } = new List<PhieuTraHangNhap>();
}
