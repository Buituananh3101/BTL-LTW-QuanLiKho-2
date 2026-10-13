namespace BTL_LTW_QuanLiKho_2.Services;

public static class MaChungTuHelper
{
    public static string FormatMaKiemKe(int id) => $"PKK{id:D6}";
    public static string FormatMaNhapKho(int id) => $"PN{id:D6}";
    public static string FormatMaXuatKho(int id) => $"PX{id:D6}";
    public static string FormatMaChuyenKho(int id) => $"PCK{id:D6}";
    public static string FormatMaDieuChinh(int id) => $"PDC{id:D6}";
    public static string FormatMaHoaDon(int id) => $"HD{id:D6}";
    public static string FormatMaHang(int number) => $"HH{number:D6}";
}
