using System.ComponentModel.DataAnnotations;
namespace BTL_LTW_QuanLiKho_2.ViewModels;
public class HangHoaForm
{
    public int MaHang { get; set; }
    [Required(ErrorMessage = "Nhập mã hàng."), StringLength(30), RegularExpression(@"[A-Za-z0-9_-]+", ErrorMessage = "Mã chỉ gồm chữ không dấu, số, dấu gạch ngang hoặc gạch dưới.")]
    public string MaHangNoiBo { get; set; } = "";
    [Required(ErrorMessage = "Nhập tên hàng."), StringLength(150)]
    public string TenHang { get; set; } = "";
    [Range(1, int.MaxValue, ErrorMessage = "Chọn nhóm hàng.")]
    public int MaNhom { get; set; }
    [Range(1, int.MaxValue, ErrorMessage = "Chọn đơn vị tính.")]
    public int MaDvt { get; set; }
    [StringLength(255)] public string? QuyCach { get; set; }
    [Range(typeof(decimal), "0", "999999999999999", ErrorMessage = "Giá phải từ 0 và nằm trong giới hạn lưu trữ.")]
    public decimal GiaBanThamKhao { get; set; }
    [Required, StringLength(20)] public string TrangThai { get; set; } = "DANG_BAN";
}
