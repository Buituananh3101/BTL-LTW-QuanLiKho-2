using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BTL_LTW_QuanLiKho_2.ViewModels.QuanLyKho;

/// <summary>
/// DTO nhận dữ liệu Thêm mới hoặc Chỉnh sửa thông tin kho
/// </summary>
public class KhoFormVM
{
    public int MaKho { get; set; } = 0;

    [Required(ErrorMessage = "Vui lòng nhập tên chi nhánh kho")]
    [StringLength(100, ErrorMessage = "Tên kho không được vượt quá 100 ký tự")]
    public string TenKho { get; set; } = string.Empty;

    [StringLength(255, ErrorMessage = "Địa chỉ không được vượt quá 255 ký tự")]
    public string? DiaChi { get; set; }

    [StringLength(255, ErrorMessage = "Ghi chú/Mô tả không được vượt quá 255 ký tự")]
    public string? MoTa { get; set; }

    public string TrangThai { get; set; } = "HOAT_DONG";

    /// <summary>
    /// Danh sách mã tài khoản được chọn để phân quyền phụ trách kho này
    /// </summary>
    public List<int> TaiKhoanIds { get; set; } = new();
}
