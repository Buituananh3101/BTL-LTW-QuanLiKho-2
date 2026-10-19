using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using BTL_LTW_QuanLiKho_2.Helpers;
using BTL_LTW_QuanLiKho_2.Models;
using BTL_LTW_QuanLiKho_2.ViewModels;

namespace BTL_LTW_QuanLiKho_2.Services;

/// <summary>
/// Dịch vụ tính toán số liệu và trích xuất Báo cáo Thẻ kho chuẩn nghiệp vụ
/// </summary>
public class TheKhoService : ITheKhoService
{
    private readonly QuanLyKhoPhuQuocLtwContext _context;

    public TheKhoService(QuanLyKhoPhuQuocLtwContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Nạp dữ liệu báo cáo Thẻ kho đầy đủ kèm KPI tổng hợp, tồn đầu kỳ, tồn lũy kế và phân trang
    /// </summary>
    public async Task<TheKhoIndexVM> LayBaoCaoTheKhoAsync(TheKhoFilterParams filter, int? userKhoId = null, bool isQuanLy = false)
    {
        // 1. Phân giải khoảng thời gian từ Lego DateRangeHelper
        var (tuNgay, denNgay) = DateRangeHelper.Resolve(filter.DateRange, filter.TuNgay, filter.DenNgay);
        filter.TuNgay = tuNgay;
        filter.DenNgay = denNgay;

        // 2. Kiểm soát phân quyền kho
        if (!isQuanLy)
        {
            filter.MaKho = userKhoId ?? 1;
        }

        // 3. Nếu chưa chọn mặt hàng, mặc định lấy mặt hàng đang kinh doanh đầu tiên
        if (!filter.MaHang.HasValue || filter.MaHang.Value <= 0)
        {
            var firstHang = await _context.HangHoas.AsNoTracking()
                .Where(h => h.TrangThai == "DANG_KINH_DOANH")
                .OrderBy(h => h.MaHang)
                .FirstOrDefaultAsync();

            if (firstHang != null)
            {
                filter.MaHang = firstHang.MaHang;
            }
        }

        var result = new TheKhoIndexVM
        {
            Filter = filter
        };

        // Danh sách kho trên dropdown
        var khoList = await _context.Khos.AsNoTracking().Where(k => k.TrangThai == "HOAT_DONG").ToListAsync();
        if (isQuanLy)
        {
            result.DanhSachKho.Add(new SelectListItem("--- Tất cả chi nhánh kho ---", ""));
        }
        result.DanhSachKho.AddRange(khoList.Select(k => new SelectListItem(k.TenKho, k.MaKho.ToString(), filter.MaKho == k.MaKho)));

        // Danh sách nhóm hàng
        var nhomList = await _context.NhomHangs.AsNoTracking().OrderBy(n => n.TenNhom).ToListAsync();
        result.DanhSachNhomHang = nhomList.Select(n => new SelectListItem(n.TenNhom, n.MaNhom.ToString())).ToList();

        if (!filter.MaHang.HasValue || filter.MaHang.Value <= 0)
        {
            return result;
        }

        int maHang = filter.MaHang.Value;

        // 4. Lấy thông tin hàng hóa
        var hangHoa = await _context.HangHoas.AsNoTracking()
            .Include(h => h.MaDvtNavigation)
            .Include(h => h.MaNhomNavigation)
            .FirstOrDefaultAsync(h => h.MaHang == maHang);

        if (hangHoa == null)
        {
            return result;
        }

        // 5. Tính Tồn đầu kỳ từ vw_BienDongKho (trước TuNgay)
        var qTonDau = _context.VwBienDongKhos.AsNoTracking()
            .Where(x => x.MaHang == maHang && x.NgayGiaoDich < tuNgay);

        if (filter.MaKho.HasValue && filter.MaKho.Value > 0)
        {
            qTonDau = qTonDau.Where(x => x.MaKho == filter.MaKho.Value);
        }

        decimal tonDauKy = await qTonDau.SumAsync(x => (decimal?)(x.SoLuongTang - x.SoLuongGiam)) ?? 0m;

        // 6. Truy vấn các giao dịch biến động trong kỳ
        var qTrongKy = _context.VwBienDongKhos.AsNoTracking()
            .Where(x => x.MaHang == maHang && x.NgayGiaoDich >= tuNgay && x.NgayGiaoDich <= denNgay);

        if (filter.MaKho.HasValue && filter.MaKho.Value > 0)
        {
            qTrongKy = qTrongKy.Where(x => x.MaKho == filter.MaKho.Value);
        }

        if (filter.LoaiChungTu != null && filter.LoaiChungTu.Any())
        {
            qTrongKy = qTrongKy.Where(x => filter.LoaiChungTu.Contains(x.LoaiChungTu));
        }

        var rawList = await qTrongKy.OrderBy(x => x.NgayGiaoDich).ThenBy(x => x.MaChungTu).ToListAsync();

        // 7. Nạp chi tiết bổ sung (Đối tác, Đơn giá, Mã hiển thị, Ghi chú) từ các bảng chứng từ
        var allDong = await BoSungThongTinChungTuAsync(rawList, maHang, tonDauKy);

        // 8. Lọc theo từ khóa tìm kiếm nếu có
        var filteredDong = allDong;
        if (!string.IsNullOrWhiteSpace(filter.TuKhoa))
        {
            var kw = filter.TuKhoa.Trim().ToLower();
            filteredDong = allDong.Where(d =>
                d.MaChungTuHienThi.ToLower().Contains(kw) ||
                d.DoiTac.ToLower().Contains(kw) ||
                (d.GhiChu != null && d.GhiChu.ToLower().Contains(kw)) ||
                d.TenLoaiChungTu.ToLower().Contains(kw)
            ).ToList();
        }

        // 9. Thống kê KPI tổng hợp
        decimal tongNhapKy = allDong.Sum(x => x.SoLuongTang);
        decimal tongXuatKy = allDong.Sum(x => x.SoLuongGiam);
        decimal tonCuoiKy = tonDauKy + tongNhapKy - tongXuatKy;

        string tenKho = "Tất cả kho";
        if (filter.MaKho.HasValue && filter.MaKho.Value > 0)
        {
            var k = khoList.FirstOrDefault(x => x.MaKho == filter.MaKho.Value);
            if (k != null) tenKho = k.TenKho;
        }

        result.TongHop = new TheKhoTongHopVM
        {
            MaHang = hangHoa.MaHang,
            MaHangNoiBo = hangHoa.MaHangNoiBo,
            TenHang = hangHoa.TenHang,
            TenDvt = hangHoa.MaDvtNavigation?.TenDvt ?? "Cái",
            TenNhomHang = hangHoa.MaNhomNavigation?.TenNhom,
            ViTri = hangHoa.ViTri,
            GiaVon = hangHoa.GiaVon,
            GiaBan = hangHoa.GiaBanThamKhao,
            MaKho = filter.MaKho,
            TenKho = tenKho,
            TuNgay = tuNgay,
            DenNgay = denNgay,
            TonDauKy = tonDauKy,
            TongNhapKy = tongNhapKy,
            TongXuatKy = tongXuatKy,
            TonCuoiKy = tonCuoiKy,
            TongSoGiaoDich = allDong.Count
        };

        // 10. Phân trang kết quả
        int page = filter.Page <= 0 ? 1 : filter.Page;
        int pageSize = filter.PageSize <= 0 ? 20 : filter.PageSize;
        var pagedItems = filteredDong.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        result.DanhSachDong = new PagedResult<TheKhoDongVM>(pagedItems, filteredDong.Count, page, pageSize);

        return result;
    }

    /// <summary>
    /// Xuất toàn bộ dữ liệu dòng biến động Thẻ kho ra file Excel ClosedXML
    /// </summary>
    public async Task<byte[]> XuatExcelTheKhoAsync(TheKhoFilterParams filter, int? userKhoId = null, bool isQuanLy = false)
    {
        var vm = await LayBaoCaoTheKhoAsync(filter, userKhoId, isQuanLy);
        if (vm.TongHop == null)
        {
            return Array.Empty<byte>();
        }

        // Tải toàn bộ dòng không phân trang
        var (tuNgay, denNgay) = DateRangeHelper.Resolve(filter.DateRange, filter.TuNgay, filter.DenNgay);
        int maHang = vm.TongHop.MaHang;

        var qTrongKy = _context.VwBienDongKhos.AsNoTracking()
            .Where(x => x.MaHang == maHang && x.NgayGiaoDich >= tuNgay && x.NgayGiaoDich <= denNgay);

        if (filter.MaKho.HasValue && filter.MaKho.Value > 0)
        {
            qTrongKy = qTrongKy.Where(x => x.MaKho == filter.MaKho.Value);
        }

        if (filter.LoaiChungTu != null && filter.LoaiChungTu.Any())
        {
            qTrongKy = qTrongKy.Where(x => filter.LoaiChungTu.Contains(x.LoaiChungTu));
        }

        var rawList = await qTrongKy.OrderBy(x => x.NgayGiaoDich).ThenBy(x => x.MaChungTu).ToListAsync();
        var allDong = await BoSungThongTinChungTuAsync(rawList, maHang, vm.TongHop.TonDauKy);

        // Tạo dòng đầu kỳ và các dòng giao dịch
        var exportList = new List<TheKhoDongVM>
        {
            new TheKhoDongVM
            {
                Stt = 0,
                NgayGiaoDich = tuNgay,
                MaChungTuHienThi = "-",
                TenLoaiChungTu = "Tồn đầu kỳ",
                DoiTac = "Số dư tồn tính đến đầu kỳ",
                SoLuongTang = 0,
                SoLuongGiam = 0,
                TonLuyKe = vm.TongHop.TonDauKy
            }
        };
        exportList.AddRange(allDong);

        return ExcelHelper.Export<TheKhoDongVM>($"TheKho_{vm.TongHop.MaHangNoiBo}", exportList, builder =>
        {
            builder.Add("STT", d => d.Stt == 0 ? "•" : d.Stt.ToString(), ExcelColumnType.Text, width: 8);
            builder.Add("Thời gian", d => d.NgayGiaoDich, ExcelColumnType.DateTime, "dd/MM/yyyy HH:mm", width: 18);
            builder.Add("Mã chứng từ", d => d.MaChungTuHienThi, ExcelColumnType.Text, width: 16);
            builder.Add("Loại giao dịch", d => d.TenLoaiChungTu, ExcelColumnType.Text, width: 18);
            builder.Add("Đối tác / Diễn giải", d => d.DoiTac, ExcelColumnType.Text, width: 30);
            builder.Add("Đơn giá / Giá vốn", d => d.DonGia, ExcelColumnType.Currency, "#,##0", width: 16);
            builder.Add("Số lượng nhập", d => d.SoLuongTang, ExcelColumnType.Number, "#,##0.##", width: 15);
            builder.Add("Số lượng xuất", d => d.SoLuongGiam, ExcelColumnType.Number, "#,##0.##", width: 15);
            builder.Add("Tồn cuối", d => d.TonLuyKe, ExcelColumnType.Number, "#,##0.##", width: 15);
            builder.Add("Ghi chú", d => d.GhiChu ?? "", ExcelColumnType.Text, width: 25);
        });
    }

    /// <summary>
    /// Nạp nhanh N dòng biến động gần nhất của mặt hàng tại kho phục vụ hiển thị trong Drawer Hàng hóa
    /// </summary>
    public async Task<List<TheKhoDongVM>> LayLichSuTheKhoNhanhAsync(int maHang, int maKho, int soLuong = 10)
    {
        var rawList = await _context.VwBienDongKhos.AsNoTracking()
            .Where(x => x.MaHang == maHang && (maKho <= 0 || x.MaKho == maKho))
            .OrderByDescending(x => x.NgayGiaoDich)
            .ThenByDescending(x => x.MaChungTu)
            .Take(soLuong)
            .ToListAsync();

        if (!rawList.Any()) return new List<TheKhoDongVM>();

        // Lấy tồn hiện tại để tính lùi hoặc tính tịnh tiến
        var tonHienTai = await _context.VwTonKhoHienTais.AsNoTracking()
            .Where(x => x.MaHang == maHang && (maKho <= 0 || x.MaKho == maKho))
            .SumAsync(x => x.SoLuongTon) ?? 0m;

        // Đảo lại để tính lũy kế rồi hiển thị giảm dần
        var ascList = rawList.OrderBy(x => x.NgayGiaoDich).ThenBy(x => x.MaChungTu).ToList();
        var dongList = await BoSungThongTinChungTuAsync(ascList, maHang, 0);

        // Tính tồn lũy kế chính xác cho các dòng gần nhất
        decimal runningTon = tonHienTai;
        for (int i = dongList.Count - 1; i >= 0; i--)
        {
            dongList[i].TonLuyKe = runningTon;
            runningTon -= (dongList[i].SoLuongTang - dongList[i].SoLuongGiam);
        }

        return dongList.OrderByDescending(x => x.NgayGiaoDich).ToList();
    }

    /// <summary>
    /// Bổ sung thông tin đối tác, đơn giá, mã hiển thị và tính tồn lũy kế
    /// </summary>
    private async Task<List<TheKhoDongVM>> BoSungThongTinChungTuAsync(List<VwBienDongKho> rawList, int maHang, decimal tonDauKy)
    {
        if (!rawList.Any()) return new List<TheKhoDongVM>();

        // Gom các mã chứng từ theo loại
        var pnIds = rawList.Where(x => x.LoaiChungTu == "PHIEU_NHAP").Select(x => x.MaChungTu).Distinct().ToList();
        var pxIds = rawList.Where(x => x.LoaiChungTu.StartsWith("XUAT_")).Select(x => x.MaChungTu).Distinct().ToList();
        var ckIds = rawList.Where(x => x.LoaiChungTu == "CHUYEN_XUAT" || x.LoaiChungTu == "CHUYEN_NHAP").Select(x => x.MaChungTu).Distinct().ToList();
        var kkIds = rawList.Where(x => x.LoaiChungTu == "KIEM_KE").Select(x => x.MaChungTu).Distinct().ToList();
        var thnIds = rawList.Where(x => x.LoaiChungTu == "TRA_HANG_NHAP").Select(x => x.MaChungTu).Distinct().ToList();

        // Nạp song song thông tin từ các bảng chứng từ
        var pnDict = pnIds.Any()
            ? await _context.PhieuNhaps.AsNoTracking()
                .Where(p => pnIds.Contains(p.MaPhieuNhap))
                .Select(p => new {
                    p.MaPhieuNhap,
                    MaHienThi = !string.IsNullOrEmpty(p.MaPhieu) ? p.MaPhieu : MaChungTuHelper.FormatMaNhapKho(p.MaPhieuNhap),
                    DoiTac = p.MaDonViCapHangNavigation != null ? p.MaDonViCapHangNavigation.TenDonVi : "Nhà cung cấp",
                    p.GhiChu,
                    DonGia = p.ChiTietPhieuNhaps.Where(c => c.MaHang == maHang).Select(c => c.DonGiaNhap).FirstOrDefault(),
                    Url = $"/NhapHang/Index?search={p.MaPhieuNhap}"
                })
                .ToDictionaryAsync(x => x.MaPhieuNhap)
            : new();

        var pxDict = pxIds.Any()
            ? await _context.PhieuXuats.AsNoTracking()
                .Where(p => pxIds.Contains(p.MaPhieuXuat))
                .Select(p => new {
                    p.MaPhieuXuat,
                    p.LoaiPhieuXuat,
                    MaHienThi = !string.IsNullOrEmpty(p.MaPhieu) ? p.MaPhieu : (p.LoaiPhieuXuat == "XUAT_HUY" ? MaChungTuHelper.FormatMaXuatHuy(p.MaPhieuXuat) : MaChungTuHelper.FormatMaXuatKho(p.MaPhieuXuat)),
                    DoiTac = p.LoaiPhieuXuat == "XUAT_HUY" ? "Xuất hủy kho" : (p.MaDonBanNavigation != null && p.MaDonBanNavigation.MaKhNavigation != null ? p.MaDonBanNavigation.MaKhNavigation.TenKh : "Khách lẻ tại quầy"),
                    p.GhiChu,
                    DonGia = p.ChiTietPhieuXuats.Where(c => c.MaHang == maHang).Select(c => c.DonGiaXuat).FirstOrDefault(),
                    Url = p.LoaiPhieuXuat == "XUAT_HUY" ? $"/XuatHuy/Index?search={p.MaPhieuXuat}" : null
                })
                .ToDictionaryAsync(x => x.MaPhieuXuat)
            : new();

        var ckDict = ckIds.Any()
            ? await _context.PhieuChuyenKhos.AsNoTracking()
                .Where(p => ckIds.Contains(p.MaPhieuChuyen))
                .Select(p => new {
                    p.MaPhieuChuyen,
                    MaHienThi = !string.IsNullOrEmpty(p.MaPhieu) ? p.MaPhieu : MaChungTuHelper.FormatMaChuyenKho(p.MaPhieuChuyen),
                    KhoNguon = p.MaKhoNguonNavigation.TenKho,
                    KhoDich = p.MaKhoDichNavigation.TenKho,
                    p.GhiChu,
                    DonGia = p.ChiTietPhieuChuyenKhos.Where(c => c.MaHang == maHang).Select(c => c.DonGiaChuyen).FirstOrDefault(),
                    Url = $"/ChuyenKho/Index?search={p.MaPhieuChuyen}"
                })
                .ToDictionaryAsync(x => x.MaPhieuChuyen)
            : new();

        var kkDict = kkIds.Any()
            ? await _context.PhieuKiemKes.AsNoTracking()
                .Where(p => kkIds.Contains(p.MaPhieuKiemKe))
                .Select(p => new {
                    p.MaPhieuKiemKe,
                    MaHienThi = !string.IsNullOrEmpty(p.MaPhieu) ? p.MaPhieu : MaChungTuHelper.FormatMaKiemKe(p.MaPhieuKiemKe),
                    DoiTac = "Cân bằng kiểm kê",
                    p.GhiChu,
                    DonGia = p.ChiTietPhieuKiemKes.Where(c => c.MaHang == maHang).Select(c => c.DonGia).FirstOrDefault(),
                    Url = $"/PhieuKiemKe/Index?search={p.MaPhieuKiemKe}"
                })
                .ToDictionaryAsync(x => x.MaPhieuKiemKe)
            : new();

        var thnDict = thnIds.Any()
            ? await _context.PhieuTraHangNhaps.AsNoTracking()
                .Where(p => thnIds.Contains(p.MaPhieuTraHang))
                .Select(p => new {
                    p.MaPhieuTraHang,
                    MaHienThi = !string.IsNullOrEmpty(p.MaPhieu) ? p.MaPhieu : MaChungTuHelper.FormatMaTraHangNhap(p.MaPhieuTraHang),
                    DoiTac = p.MaDonViCapHangNavigation != null ? p.MaDonViCapHangNavigation.TenDonVi : "Nhà cung cấp",
                    p.GhiChu,
                    DonGia = p.ChiTietPhieuTraHangNhaps.Where(c => c.MaHang == maHang).Select(c => c.DonGiaTra).FirstOrDefault(),
                    Url = $"/TraHangNhap/Index?search={p.MaPhieuTraHang}"
                })
                .ToDictionaryAsync(x => x.MaPhieuTraHang)
            : new();

        // 9. Duyệt danh sách và tính tồn lũy kế tịnh tiến
        decimal runningTon = tonDauKy;
        var allDong = new List<TheKhoDongVM>();
        int stt = 1;

        foreach (var item in rawList)
        {
            runningTon += item.SoLuongTang - item.SoLuongGiam;
            var dong = new TheKhoDongVM
            {
                Stt = stt++,
                NgayGiaoDich = item.NgayGiaoDich,
                MaChungTu = item.MaChungTu,
                LoaiChungTu = item.LoaiChungTu,
                SoLuongTang = item.SoLuongTang,
                SoLuongGiam = item.SoLuongGiam,
                TonLuyKe = runningTon
            };

            if (item.LoaiChungTu == "PHIEU_NHAP")
            {
                dong.TenLoaiChungTu = "Nhập hàng";
                dong.BadgeClass = "badge-nhap";
                if (pnDict.TryGetValue(item.MaChungTu, out var pn))
                {
                    dong.MaChungTuHienThi = pn.MaHienThi;
                    dong.DoiTac = pn.DoiTac;
                    dong.GhiChu = pn.GhiChu;
                    dong.DonGia = pn.DonGia;
                    dong.UrlChiTiet = pn.Url;
                }
            }
            else if (item.LoaiChungTu == "XUAT_HUY")
            {
                dong.TenLoaiChungTu = "Xuất hủy";
                dong.BadgeClass = "badge-xuat-huy";
                if (pxDict.TryGetValue(item.MaChungTu, out var px))
                {
                    dong.MaChungTuHienThi = px.MaHienThi;
                    dong.DoiTac = px.DoiTac;
                    dong.GhiChu = px.GhiChu;
                    dong.DonGia = px.DonGia;
                    dong.UrlChiTiet = px.Url;
                }
            }
            else if (item.LoaiChungTu == "XUAT_BAN")
            {
                dong.TenLoaiChungTu = "Bán hàng";
                dong.BadgeClass = "badge-xuat-ban";
                if (pxDict.TryGetValue(item.MaChungTu, out var px))
                {
                    dong.MaChungTuHienThi = px.MaHienThi;
                    dong.DoiTac = px.DoiTac;
                    dong.GhiChu = px.GhiChu;
                    dong.DonGia = px.DonGia;
                    dong.UrlChiTiet = px.Url;
                }
            }
            else if (item.LoaiChungTu == "CHUYEN_XUAT")
            {
                dong.TenLoaiChungTu = "Chuyển đi";
                dong.BadgeClass = "badge-chuyen-xuat";
                if (ckDict.TryGetValue(item.MaChungTu, out var ck))
                {
                    dong.MaChungTuHienThi = ck.MaHienThi;
                    dong.DoiTac = $"Chuyển đến: {ck.KhoDich}";
                    dong.GhiChu = ck.GhiChu;
                    dong.DonGia = ck.DonGia;
                    dong.UrlChiTiet = ck.Url;
                }
            }
            else if (item.LoaiChungTu == "CHUYEN_NHAP")
            {
                dong.TenLoaiChungTu = "Chuyển đến";
                dong.BadgeClass = "badge-chuyen-nhap";
                if (ckDict.TryGetValue(item.MaChungTu, out var ck))
                {
                    dong.MaChungTuHienThi = ck.MaHienThi;
                    dong.DoiTac = $"Nhận từ: {ck.KhoNguon}";
                    dong.GhiChu = ck.GhiChu;
                    dong.DonGia = ck.DonGia;
                    dong.UrlChiTiet = ck.Url;
                }
            }
            else if (item.LoaiChungTu == "KIEM_KE")
            {
                dong.TenLoaiChungTu = "Kiểm kê";
                dong.BadgeClass = "badge-kiem-ke";
                if (kkDict.TryGetValue(item.MaChungTu, out var kk))
                {
                    dong.MaChungTuHienThi = kk.MaHienThi;
                    dong.DoiTac = kk.DoiTac;
                    dong.GhiChu = kk.GhiChu;
                    dong.DonGia = kk.DonGia;
                    dong.UrlChiTiet = kk.Url;
                }
            }
            else if (item.LoaiChungTu == "TRA_HANG_NHAP")
            {
                dong.TenLoaiChungTu = "Trả hàng nhập";
                dong.BadgeClass = "badge-tra-hang";
                if (thnDict.TryGetValue(item.MaChungTu, out var thn))
                {
                    dong.MaChungTuHienThi = thn.MaHienThi;
                    dong.DoiTac = thn.DoiTac;
                    dong.GhiChu = thn.GhiChu;
                    dong.DonGia = thn.DonGia;
                    dong.UrlChiTiet = thn.Url;
                }
            }
            else
            {
                dong.TenLoaiChungTu = item.LoaiChungTu;
                dong.BadgeClass = "badge-kiem-ke";
                dong.MaChungTuHienThi = $"#{item.MaChungTu}";
                dong.DoiTac = "Khác";
            }

            allDong.Add(dong);
        }

        return allDong;
    }
}
