-- =====================================================================================
-- KHO PRO - MIGRATION 15: DỮ LIỆU MẪU TOÀN DIỆN KIỂM THỬ TẤT CẢ CHỨC NĂNG
-- File: migrations/sql/15_du_lieu_mau_toan_dien.sql
-- Mục tiêu: Cung cấp tập dữ liệu mẫu phong phú, thực tế cho toàn bộ các chức năng:
--   1. Danh mục Khách hàng, Nhà cung cấp (kèm nhóm NCC chuẩn KiotViet)
--   2. Hàng hóa đa dạng (Bình gas, Bếp gas, Phụ kiện, Khí CN, Than/Cồn, Xe đẩy...)
--   3. Cấp tồn dồi dào cho cả 3 kho: Kho trung tâm, Kho An Thới, Kho phụ kiện Tuna
--   4. Đầy đủ các chứng từ với đa dạng trạng thái và mốc thời gian:
--      - Nhập hàng (DA_XAC_NHAN, NHAP, HUY)
--      - Chuyển kho (NHAP, DA_XUAT, DA_NHAN có thất thoát, HUY)
--      - Trả hàng nhập (NHAP, DA_TRA_HANG có chiết khấu, HUY)
--      - Xuất hủy (NHAP, DA_XAC_NHAN nhiều lý do, HUY)
--      - Bán hàng (Đơn bán + Phiếu xuất bán)
--      - Kiểm kho (NHAP, DA_DIEU_CHINH lệch tăng, lệch giảm, cân bằng)
--   5. Ghi nhật ký thao tác (NhatKyThaoTac)
-- =====================================================================================

USE [QuanLyKhoPhuQuocLTW];
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET NOCOUNT ON;

PRINT N'==> [BẮT ĐẦU] Nạp dữ liệu mẫu toàn diện phục vụ kiểm thử hệ thống...';

-- -------------------------------------------------------------------------------------
-- PHẦN 1: BỔ SUNG & CHUẨN HÓA NHÓM NHÀ CUNG CẤP (NhomNhaCungCap)
-- -------------------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM NhomNhaCungCap WHERE TenNhom = N'Nhà phân phối Gas')
    INSERT INTO NhomNhaCungCap (TenNhom, GhiChu) VALUES (N'Nhà phân phối Gas', N'Các đơn vị cung cấp vỏ và khí gas chính hãng');

IF NOT EXISTS (SELECT 1 FROM NhomNhaCungCap WHERE TenNhom = N'Thiết bị & Phụ kiện gas')
    INSERT INTO NhomNhaCungCap (TenNhom, GhiChu) VALUES (N'Thiết bị & Phụ kiện gas', N'Bếp gas, van ngắt, ống dẫn và phụ kiện');

IF NOT EXISTS (SELECT 1 FROM NhomNhaCungCap WHERE TenNhom = N'Khí công nghiệp & Y tế')
    INSERT INTO NhomNhaCungCap (TenNhom, GhiChu) VALUES (N'Khí công nghiệp & Y tế', N'Khí oxy y tế, argon, nitơ, CO2');

IF NOT EXISTS (SELECT 1 FROM NhomNhaCungCap WHERE TenNhom = N'Than sạch & Nhiên liệu')
    INSERT INTO NhomNhaCungCap (TenNhom, GhiChu) VALUES (N'Than sạch & Nhiên liệu', N'Than mùn cưa, than gáo dừa, cồn khô');

IF NOT EXISTS (SELECT 1 FROM NhomNhaCungCap WHERE TenNhom = N'Bao bì & Vận tải')
    INSERT INTO NhomNhaCungCap (TenNhom, GhiChu) VALUES (N'Bao bì & Vận tải', N'Bao bì, màng co, xe đẩy vận chuyển');

PRINT N'   [1/11] Đã đồng bộ Nhóm nhà cung cấp.';

-- -------------------------------------------------------------------------------------
-- PHẦN 2: BỔ SUNG NHÀ CUNG CẤP ĐA DẠNG (DonViCapHang)
-- -------------------------------------------------------------------------------------
DECLARE @nhomGas INT = ISNULL((SELECT TOP 1 MaNhomNcc FROM NhomNhaCungCap WHERE TenNhom LIKE N'%Gas%'), 1);
DECLARE @nhomPk INT = ISNULL((SELECT TOP 1 MaNhomNcc FROM NhomNhaCungCap WHERE TenNhom LIKE N'%Phụ kiện%' OR TenNhom LIKE N'%Thiết bị%'), 2);
DECLARE @nhomKhi INT = ISNULL((SELECT TOP 1 MaNhomNcc FROM NhomNhaCungCap WHERE TenNhom LIKE N'%Khí%'), 3);
DECLARE @nhomThan INT = ISNULL((SELECT TOP 1 MaNhomNcc FROM NhomNhaCungCap WHERE TenNhom LIKE N'%Than%'), 1);
DECLARE @nhomVanTai INT = ISNULL((SELECT TOP 1 MaNhomNcc FROM NhomNhaCungCap WHERE TenNhom LIKE N'%Vận tải%' OR TenNhom LIKE N'%Bao bì%'), 1);

IF NOT EXISTS (SELECT 1 FROM DonViCapHang WHERE MaNcc = 'NCC00012')
    INSERT INTO DonViCapHang (MaNcc, TenDonVi, DienThoai, Email, DiaChi, KhuVuc, PhuongXa, MaNhomNcc, TenCongTy, MaSoThue, TrangThai, NgayTao, NguoiTao, DaDanhDau)
    VALUES ('NCC00012', N'Tổng kho Gas Petrolimex Kiên Giang', '02973868686', N'petrolimex.kg@gas.vn', N'Đường 30/4, Khu phố 1', N'Kiên Giang - Phú Quốc', N'Phường Dương Đông', @nhomGas, N'Công ty Cổ phần Gas Petrolimex Chi nhánh Kiên Giang', '1700123456', 'HOAT_DONG', DATEADD(DAY, -60, GETDATE()), N'Nguyễn Minh Quản', 1);

IF NOT EXISTS (SELECT 1 FROM DonViCapHang WHERE MaNcc = 'NCC00013')
    INSERT INTO DonViCapHang (MaNcc, TenDonVi, DienThoai, Email, DiaChi, KhuVuc, PhuongXa, MaNhomNcc, TenCongTy, MaSoThue, TrangThai, NgayTao, NguoiTao, DaDanhDau)
    VALUES ('NCC00013', N'Công ty CP Bếp & Thiết bị Kaff Việt Nam', '02838999888', N'sales@kaff.vn', N'128 Nguyễn Thị Thập, Quận 7', N'Hồ Chí Minh', N'Tân Phú', @nhomPk, N'Công ty Cổ phần Thiết bị Nhà bếp Kaff Quốc Tế', '0312987654', 'HOAT_DONG', DATEADD(DAY, -45, GETDATE()), N'Nguyễn Minh Quản', 1);

IF NOT EXISTS (SELECT 1 FROM DonViCapHang WHERE MaNcc = 'NCC00014')
    INSERT INTO DonViCapHang (MaNcc, TenDonVi, DienThoai, Email, DiaChi, KhuVuc, PhuongXa, MaNhomNcc, TenCongTy, MaSoThue, TrangThai, NgayTao, NguoiTao, DaDanhDau)
    VALUES ('NCC00014', N'Công ty TNHH Van An Toàn Namilux SG', '02837555666', N'namilux@hcm.vnn.vn', N'KCN Tân Tạo, Bình Tân', N'Hồ Chí Minh', N'Tân Tạo', @nhomPk, N'Công ty TNHH Thiết bị Ngắt gas Namilux Việt Nam', '0301456789', 'HOAT_DONG', DATEADD(DAY, -30, GETDATE()), N'Trần Thị Kho', 0);

IF NOT EXISTS (SELECT 1 FROM DonViCapHang WHERE MaNcc = 'NCC00015')
    INSERT INTO DonViCapHang (MaNcc, TenDonVi, DienThoai, Email, DiaChi, KhuVuc, PhuongXa, MaNhomNcc, TenCongTy, MaSoThue, TrangThai, NgayTao, NguoiTao, DaDanhDau)
    VALUES ('NCC00015', N'Nhà máy Khí Công Nghiệp Messer Tây Nam', '02923888777', N'messer.sw@messer.com.vn', N'KCN Trà Nóc, Bình Thủy', N'Cần Thơ', N'Trà Nóc', @nhomKhi, N'Công ty TNHH Khí Công Nghiệp Messer Tây Nam Bộ', '1800654321', 'HOAT_DONG', DATEADD(DAY, -40, GETDATE()), N'Nguyễn Minh Quản', 0);

IF NOT EXISTS (SELECT 1 FROM DonViCapHang WHERE MaNcc = 'NCC00016')
    INSERT INTO DonViCapHang (MaNcc, TenDonVi, DienThoai, Email, DiaChi, KhuVuc, PhuongXa, MaNhomNcc, TenCongTy, MaSoThue, TrangThai, NgayTao, NguoiTao, DaDanhDau)
    VALUES ('NCC00016', N'Hợp tác xã Than gáo dừa Bến Tre Mekong', '02753822333', N'thanbentre@mekong.vn', N'Ấp 4, An Khánh, Châu Thành', N'Bến Tre', N'An Khánh', @nhomThan, N'Hợp tác xã Nông nghiệp & Năng lượng Xanh Bến Tre', '1300987123', 'HOAT_DONG', DATEADD(DAY, -50, GETDATE()), N'Trần Thị Kho', 1);

IF NOT EXISTS (SELECT 1 FROM DonViCapHang WHERE MaNcc = 'NCC00017')
    INSERT INTO DonViCapHang (MaNcc, TenDonVi, DienThoai, Email, DiaChi, KhuVuc, PhuongXa, MaNhomNcc, TenCongTy, MaSoThue, TrangThai, NgayTao, NguoiTao, DaDanhDau)
    VALUES ('NCC00017', N'Xưởng Cơ khí & Xe đẩy Hàng Hải Nam', '0918777888', N'xedayhainam@gmail.com', N'Cảng cá An Thới, Tổ 4', N'Kiên Giang - Phú Quốc', N'Phường An Thới', @nhomVanTai, N'Hộ kinh doanh Cơ khí Chế tạo Hải Nam', '8401239871', 'HOAT_DONG', DATEADD(DAY, -20, GETDATE()), N'Trần Thị Kho', 0);

PRINT N'   [2/11] Đã bổ sung 6 Nhà cung cấp mới chuẩn KiotViet.';

-- -------------------------------------------------------------------------------------
-- PHẦN 3: BỔ SUNG KHÁCH HÀNG THỰC TẾ KHẮP PHÚ QUỐC (KhachHang)
-- -------------------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM KhachHang WHERE DienThoai = '0903111222')
    INSERT INTO KhachHang (TenKH, DienThoai, DiaChi, LoaiKhachHang, TrangThai)
    VALUES (N'Resort Vinpearl Wonderworld Phú Quốc', '0903111222', N'Bãi Dài, Xã Gành Dầu, Phú Quốc', N'CUA_HANG', N'HOAT_DONG');

IF NOT EXISTS (SELECT 1 FROM KhachHang WHERE DienThoai = '0903222333')
    INSERT INTO KhachHang (TenKH, DienThoai, DiaChi, LoaiKhachHang, TrangThai)
    VALUES (N'Khách sạn Mường Thanh Luxury Phú Quốc', '0903222333', N'Lô CH1, Bãi Trường, Xã Dương Tơ, Phú Quốc', N'CUA_HANG', N'HOAT_DONG');

IF NOT EXISTS (SELECT 1 FROM KhachHang WHERE DienThoai = '0903333444')
    INSERT INTO KhachHang (TenKH, DienThoai, DiaChi, LoaiKhachHang, TrangThai)
    VALUES (N'Nhà hàng Hải sản Biển Xanh Hàm Ninh', '0903333444', N'Cầu cảng Hàm Ninh, Xã Hàm Ninh, Phú Quốc', N'CUA_HANG', N'HOAT_DONG');

IF NOT EXISTS (SELECT 1 FROM KhachHang WHERE DienThoai = '0903444555')
    INSERT INTO KhachHang (TenKH, DienThoai, DiaChi, LoaiKhachHang, TrangThai)
    VALUES (N'Resort Premier Village Phu Quoc Resort', '0903444555', N'Mũi Ông Đội, Phường An Thới, Phú Quốc', N'CUA_HANG', N'HOAT_DONG');

IF NOT EXISTS (SELECT 1 FROM KhachHang WHERE DienThoai = '0903555666')
    INSERT INTO KhachHang (TenKH, DienThoai, DiaChi, LoaiKhachHang, TrangThai)
    VALUES (N'Đại lý Gas & Bếp Minh Hiền Cửa Cạn', '0903555666', N'Ngã ba Cửa Cạn, Xã Cửa Cạn, Phú Quốc', N'CUA_HANG', N'HOAT_DONG');

IF NOT EXISTS (SELECT 1 FROM KhachHang WHERE DienThoai = '0903666777')
    INSERT INTO KhachHang (TenKH, DienThoai, DiaChi, LoaiKhachHang, TrangThai)
    VALUES (N'Xưởng đóng tàu cá & Cơ khí Hùng Phát', '0903666777', N'Bến tràm, Xã Bãi Thơm, Phú Quốc', N'CUA_HANG', N'HOAT_DONG');

IF NOT EXISTS (SELECT 1 FROM KhachHang WHERE DienThoai = '0903777888')
    INSERT INTO KhachHang (TenKH, DienThoai, DiaChi, LoaiKhachHang, TrangThai)
    VALUES (N'Chị Lan - Hộ kinh doanh Bún Quậy Kiến Xây', '0903777888', N'Đường Bạch Đằng, Phường Dương Đông, Phú Quốc', N'LE', N'HOAT_DONG');

IF NOT EXISTS (SELECT 1 FROM KhachHang WHERE DienThoai = '0903888999')
    INSERT INTO KhachHang (TenKH, DienThoai, DiaChi, LoaiKhachHang, TrangThai)
    VALUES (N'Anh Tuấn - Hộ gia đình Khu phố 4', '0903888999', N'Đường Trần Phú, Phường Dương Đông, Phú Quốc', N'LE', N'HOAT_DONG');

PRINT N'   [3/11] Đã bổ sung 8 Khách hàng đa dạng ngành nghề tại Phú Quốc.';

-- -------------------------------------------------------------------------------------
-- PHẦN 4: BỔ SUNG MẶT HÀNG MỚI CHẤT LƯỢNG CAO (HangHoa)
-- -------------------------------------------------------------------------------------
DECLARE @dvtBinh INT = ISNULL((SELECT TOP 1 MaDvt FROM DonViTinh WHERE TenDvt LIKE N'%Bình%'), 1);
DECLARE @dvtCai INT = ISNULL((SELECT TOP 1 MaDvt FROM DonViTinh WHERE TenDvt LIKE N'%Cái%'), 2);
DECLARE @dvtCuon INT = ISNULL((SELECT TOP 1 MaDvt FROM DonViTinh WHERE TenDvt LIKE N'%Cuộn%'), 11);
DECLARE @dvtHop INT = ISNULL((SELECT TOP 1 MaDvt FROM DonViTinh WHERE TenDvt LIKE N'%Hộp%'), 12);
DECLARE @dvtBao INT = ISNULL((SELECT TOP 1 MaDvt FROM DonViTinh WHERE TenDvt LIKE N'%Bao%'), 3);
DECLARE @dvtMet INT = ISNULL((SELECT TOP 1 MaDvt FROM DonViTinh WHERE TenDvt LIKE N'%Mét%'), 4);
DECLARE @dvtBo INT = ISNULL((SELECT TOP 1 MaDvt FROM DonViTinh WHERE TenDvt LIKE N'%Bộ%'), 13);

DECLARE @nhGas INT = ISNULL((SELECT TOP 1 MaNhom FROM NhomHang WHERE TenNhom LIKE N'%Bình gas%' OR TenNhom LIKE N'%gas%'), 1);
DECLARE @nhPk INT = ISNULL((SELECT TOP 1 MaNhom FROM NhomHang WHERE TenNhom LIKE N'%Phụ kiện%' OR TenNhom LIKE N'%Tuna%'), 2);
DECLARE @nhThan INT = ISNULL((SELECT TOP 1 MaNhom FROM NhomHang WHERE TenNhom LIKE N'%Than%'), 3);
DECLARE @nhOxi INT = ISNULL((SELECT TOP 1 MaNhom FROM NhomHang WHERE TenNhom LIKE N'%oxy%'), 4);
DECLARE @nhAnToan INT = ISNULL((SELECT TOP 1 MaNhom FROM NhomHang WHERE TenNhom LIKE N'%an toàn%' OR TenNhom LIKE N'%Thiết bị%'), 5);

-- 1. Bình gas Petrolimex van ngang 12kg
IF NOT EXISTS (SELECT 1 FROM HangHoa WHERE MaHangNoiBo = 'GAS-PETRO')
    INSERT INTO HangHoa (MaHangNoiBo, TenHang, MaNhom, MaDvt, GiaBanThamKhao, GiaVon, TrangThai, DaDanhDau, ViTri, MoTa, NgayTao)
    VALUES ('GAS-PETRO', N'Bình gas Petrolimex 12kg van ngang', @nhGas, @dvtBinh, 440000, 365000, 'DANG_BAN', 1, N'Kệ A1-KhoGas', N'Bình gas màu xanh dương chuẩn Petrolimex, có tem chống giả', DATEADD(DAY, -45, GETDATE()));

-- 2. Bình gas Saigon Petro van chụp 12kg
IF NOT EXISTS (SELECT 1 FROM HangHoa WHERE MaHangNoiBo = 'GAS-SP')
    INSERT INTO HangHoa (MaHangNoiBo, TenHang, MaNhom, MaDvt, GiaBanThamKhao, GiaVon, TrangThai, DaDanhDau, ViTri, MoTa, NgayTao)
    VALUES ('GAS-SP', N'Bình gas Saigon Petro 12kg van chụp', @nhGas, @dvtBinh, 435000, 360000, 'DANG_BAN', 1, N'Kệ A2-KhoGas', N'Bình gas màu xám xanh, van chụp ngắt gas nhanh an toàn', DATEADD(DAY, -40, GETDATE()));

-- 3. Bình gas Elf đỏ 12kg
IF NOT EXISTS (SELECT 1 FROM HangHoa WHERE MaHangNoiBo = 'GAS-ELF')
    INSERT INTO HangHoa (MaHangNoiBo, TenHang, MaNhom, MaDvt, GiaBanThamKhao, GiaVon, TrangThai, DaDanhDau, ViTri, MoTa, NgayTao)
    VALUES ('GAS-ELF', N'Bình gas Total Elf 12kg vỏ đỏ', @nhGas, @dvtBinh, 450000, 375000, 'DANG_BAN', 0, N'Kệ A3-KhoGas', N'Khí gas tinh khiết nhiệt lượng cao, vỏ đỏ nổi bật', DATEADD(DAY, -35, GETDATE()));

-- 4. Bình gas Composite Miss Gas chống nổ
IF NOT EXISTS (SELECT 1 FROM HangHoa WHERE MaHangNoiBo = 'GAS-MISS')
    INSERT INTO HangHoa (MaHangNoiBo, TenHang, MaNhom, MaDvt, GiaBanThamKhao, GiaVon, TrangThai, DaDanhDau, ViTri, MoTa, NgayTao)
    VALUES ('GAS-MISS', N'Bình gas Composite chống nổ Miss Gas 12kg', @nhGas, @dvtBinh, 620000, 510000, 'DANG_BAN', 1, N'Kệ A4-CaoCap', N'Vỏ sợi thủy tinh trong suốt nhìn thấy mức gas, tuyệt đối không cháy nổ', DATEADD(DAY, -30, GETDATE()));

-- 5. Bình gas mini du lịch 250g (hộp 4 lon)
IF NOT EXISTS (SELECT 1 FROM HangHoa WHERE MaHangNoiBo = 'GAS-MINI')
    INSERT INTO HangHoa (MaHangNoiBo, TenHang, MaNhom, MaDvt, GiaBanThamKhao, GiaVon, TrangThai, DaDanhDau, ViTri, MoTa, NgayTao)
    VALUES ('GAS-MINI', N'Bình gas mini du lịch 250g (Lốc 4 lon)', @nhGas, @dvtHop, 85000, 58000, 'DANG_BAN', 0, N'Kệ B1-Mini', N'Dùng cho bếp lẩu cắm trại và nhà hàng nướng', DATEADD(DAY, -25, GETDATE()));

-- 6. Bếp gas du lịch gấp gọn Namilux
IF NOT EXISTS (SELECT 1 FROM HangHoa WHERE MaHangNoiBo = 'BEP-DL')
    INSERT INTO HangHoa (MaHangNoiBo, TenHang, MaNhom, MaDvt, GiaBanThamKhao, GiaVon, TrangThai, DaDanhDau, ViTri, MoTa, NgayTao)
    VALUES ('BEP-DL', N'Bếp gas du lịch dã ngoại Namilux NA-194', @nhPk, @dvtCai, 290000, 210000, 'DANG_BAN', 1, N'Kệ B2-Bep', N'Thiết kế inox chống cháy gió, ngắt gas inline cut an toàn', DATEADD(DAY, -20, GETDATE()));

-- 7. Bếp khè công nghiệp Gado đôi
IF NOT EXISTS (SELECT 1 FROM HangHoa WHERE MaHangNoiBo = 'BEP-KHE')
    INSERT INTO HangHoa (MaHangNoiBo, TenHang, MaNhom, MaDvt, GiaBanThamKhao, GiaVon, TrangThai, DaDanhDau, ViTri, MoTa, NgayTao)
    VALUES ('BEP-KHE', N'Bếp khè gas công nghiệp Gado 5A2', @nhPk, @dvtCai, 680000, 490000, 'DANG_BAN', 1, N'Kệ B3-CongNghiep', N'Ngọn lửa cực mạnh chuyên dùng cho nhà hàng khách sạn xào nấu nhanh', DATEADD(DAY, -22, GETDATE()));

-- 8. Dây dẫn gas bọc inox chống chuột (Cuộn 50m)
IF NOT EXISTS (SELECT 1 FROM HangHoa WHERE MaHangNoiBo = 'DAY-GAS')
    INSERT INTO HangHoa (MaHangNoiBo, TenHang, MaNhom, MaDvt, GiaBanThamKhao, GiaVon, TrangThai, DaDanhDau, ViTri, MoTa, NgayTao)
    VALUES ('DAY-GAS', N'Dây dẫn gas 3 lớp bọc lưới inox (Cuộn 50m)', @nhPk, @dvtCuon, 1250000, 920000, 'DANG_BAN', 0, N'Kệ C1-Day', N'Chống chuột cắn, chịu áp lực nổ 60 bar', DATEADD(DAY, -28, GETDATE()));

-- 9. Đồng hồ đo áp suất đường ống gas
IF NOT EXISTS (SELECT 1 FROM HangHoa WHERE MaHangNoiBo = 'DH-AP')
    INSERT INTO HangHoa (MaHangNoiBo, TenHang, MaNhom, MaDvt, GiaBanThamKhao, GiaVon, TrangThai, DaDanhDau, ViTri, MoTa, NgayTao)
    VALUES ('DH-AP', N'Đồng hồ đo áp suất gas 0-10 bar chân ren đồng', @nhAnToan, @dvtCai, 220000, 155000, 'DANG_BAN', 0, N'Kệ C2-ThietBi', N'Đo áp suất hệ thống gas trung tâm nhà hàng', DATEADD(DAY, -15, GETDATE()));

-- 10. Cổ dê inox 304 siết ống gas (Gói 50 cái)
IF NOT EXISTS (SELECT 1 FROM HangHoa WHERE MaHangNoiBo = 'CO-DE')
    INSERT INTO HangHoa (MaHangNoiBo, TenHang, MaNhom, MaDvt, GiaBanThamKhao, GiaVon, TrangThai, DaDanhDau, ViTri, MoTa, NgayTao)
    VALUES ('CO-DE', N'Đai siết cổ dê inox 304 phi 13-19 (Gói 50 cái)', @nhPk, @dvtHop, 120000, 75000, 'DANG_BAN', 0, N'Kệ C3-OcVit', N'Inox 304 chống rỉ sét bởi hơi muối biển đảo Phú Quốc', DATEADD(DAY, -12, GETDATE()));

-- 11. Bình khí Argon tinh khiết 40L
IF NOT EXISTS (SELECT 1 FROM HangHoa WHERE MaHangNoiBo = 'KHI-ARGON')
    INSERT INTO HangHoa (MaHangNoiBo, TenHang, MaNhom, MaDvt, GiaBanThamKhao, GiaVon, TrangThai, DaDanhDau, ViTri, MoTa, NgayTao)
    VALUES ('KHI-ARGON', N'Bình khí Argon tinh khiết 99.999% 40L', @nhOxi, @dvtBinh, 950000, 720000, 'DANG_BAN', 1, N'Bãi khí 1', N'Dùng trong hàn TIG đóng tàu thuyền và kết cấu inox', DATEADD(DAY, -18, GETDATE()));

-- 12. Bình khí Nitơ thực phẩm 40L
IF NOT EXISTS (SELECT 1 FROM HangHoa WHERE MaHangNoiBo = 'KHI-NITO')
    INSERT INTO HangHoa (MaHangNoiBo, TenHang, MaNhom, MaDvt, GiaBanThamKhao, GiaVon, TrangThai, DaDanhDau, ViTri, MoTa, NgayTao)
    VALUES ('KHI-NITO', N'Bình khí Nitơ thực phẩm 40L (Bảo quản rượu bia)', @nhOxi, @dvtBinh, 880000, 680000, 'DANG_BAN', 0, N'Bãi khí 2', N'Bảo quản bia tươi, rượu vang và thực phẩm đông lạnh', DATEADD(DAY, -14, GETDATE()));

-- 13. Than gáo dừa nướng BBQ không khói (Thùng 10kg)
IF NOT EXISTS (SELECT 1 FROM HangHoa WHERE MaHangNoiBo = 'THAN-DUA')
    INSERT INTO HangHoa (MaHangNoiBo, TenHang, MaNhom, MaDvt, GiaBanThamKhao, GiaVon, TrangThai, DaDanhDau, ViTri, MoTa, NgayTao)
    VALUES ('THAN-DUA', N'Than gáo dừa nướng BBQ không khói (Thùng 10kg)', @nhThan, @dvtBao, 160000, 115000, 'DANG_BAN', 1, N'Kho Than', N'Cháy đều 3-4 tiếng, không tro bay, không mùi hắc', DATEADD(DAY, -10, GETDATE()));

-- 14. Cồn thạch cháy lâu không mùi (Thùng 60 ly)
IF NOT EXISTS (SELECT 1 FROM HangHoa WHERE MaHangNoiBo = 'CON-THACH')
    INSERT INTO HangHoa (MaHangNoiBo, TenHang, MaNhom, MaDvt, GiaBanThamKhao, GiaVon, TrangThai, DaDanhDau, ViTri, MoTa, NgayTao)
    VALUES ('CON-THACH', N'Cồn thạch siêu cháy lâu không mùi (Thùng 60 ly)', @nhThan, @dvtHop, 140000, 95000, 'DANG_BAN', 0, N'Kho Than', N'An toàn không cay mắt, dùng cho lẩu nhà hàng', DATEADD(DAY, -8, GETDATE()));

-- 15. Xe đẩy 2 bánh chuyên chở bình gas 45kg
IF NOT EXISTS (SELECT 1 FROM HangHoa WHERE MaHangNoiBo = 'XE-DAY45')
    INSERT INTO HangHoa (MaHangNoiBo, TenHang, MaNhom, MaDvt, GiaBanThamKhao, GiaVon, TrangThai, DaDanhDau, ViTri, MoTa, NgayTao)
    VALUES ('XE-DAY45', N'Xe đẩy 2 bánh chịu lực chở bình gas 45kg', @nhPk, @dvtCai, 1350000, 980000, 'DANG_BAN', 1, N'Khu Thiết Bị', N'Khung thép ống mạ kẽm, bánh cao su đúc đặc chống xì', DATEADD(DAY, -5, GETDATE()));

PRINT N'   [4/11] Đã bổ sung 15 mặt hàng phong phú chất lượng cao.';

-- Thiết lập ngưỡng tồn tối thiểu an toàn cho các mặt hàng mới tại Kho 1, Kho 2, Kho 3
INSERT INTO NguongTonKho (MaHang, MaKho, TonToiThieu)
SELECT h.MaHang, k.MaKho, 15
FROM HangHoa h
CROSS JOIN Kho k
WHERE h.MaHangNoiBo IN ('GAS-PETRO', 'GAS-SP', 'GAS-ELF', 'GAS-MISS', 'GAS-MINI', 'BEP-DL', 'BEP-KHE', 'DAY-GAS', 'DH-AP', 'CO-DE', 'KHI-ARGON', 'KHI-NITO', 'THAN-DUA', 'CON-THACH', 'XE-DAY45')
  AND NOT EXISTS (SELECT 1 FROM NguongTonKho n WHERE n.MaHang = h.MaHang AND n.MaKho = k.MaKho);

PRINT N'   [4.1] Đã thiết lập ngưỡng tồn kho NguongTonKho.';

-- -------------------------------------------------------------------------------------
-- PHẦN 5: CẤP TỒN DỒI DÀO QUA PHIẾU NHẬP ĐẦU KỲ VÀ THƯỜNG CHO CẢ 3 KHO
-- Đảm bảo Kho 1, Kho 2 và Kho 3 đều có hàng để chuyển, trả, xuất hủy và kiểm kho
-- -------------------------------------------------------------------------------------
DECLARE @pnNewId INT;

-- 5.1. Nhập lô hàng lớn cho Kho 1 (Kho trung tâm)
IF NOT EXISTS (SELECT 1 FROM PhieuNhap WHERE MaPhieu = 'PN-SEED-K1')
BEGIN
    INSERT INTO PhieuNhap (MaPhieu, MaKho, MaDonViCapHang, MaNVLap, MaNVXacNhan, NgayLap, NgayXacNhan, LoaiPhieuNhap, TrangThai, GhiChu, DaDanhDau, SoHoaDon, GiamGia, TongTien, CanTraNcc)
    VALUES ('PN-SEED-K1', 1, 1, 1, 1, DATEADD(DAY, -20, GETDATE()), DATEADD(DAY, -20, GETDATE()), 'THONG_THUONG', 'DA_XAC_NHAN', N'Nhập bổ sung lượng lớn bình gas và bếp cho Kho trung tâm', 1, 'HD00892', 0, 150000000, 150000000);
    SET @pnNewId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuNhap (MaPhieuNhap, MaHang, SoLuong, DonGiaNhap, GiamGia, ThanhTien)
    SELECT @pnNewId, MaHang, 80, GiaVon, 0, 80 * GiaVon
    FROM HangHoa
    WHERE MaHangNoiBo IN ('GAS-PETRO', 'GAS-SP', 'GAS-ELF', 'GAS-MISS', 'GAS-MINI', 'BEP-DL', 'BEP-KHE', 'DAY-GAS', 'DH-AP', 'CO-DE', 'KHI-ARGON', 'KHI-NITO', 'THAN-DUA', 'CON-THACH', 'XE-DAY45');
END

-- 5.2. Nhập lô hàng cho Kho 2 (Kho An Thới)
IF NOT EXISTS (SELECT 1 FROM PhieuNhap WHERE MaPhieu = 'PN-SEED-K2')
BEGIN
    INSERT INTO PhieuNhap (MaPhieu, MaKho, MaDonViCapHang, MaNVLap, MaNVXacNhan, NgayLap, NgayXacNhan, LoaiPhieuNhap, TrangThai, GhiChu, DaDanhDau, SoHoaDon, GiamGia, TongTien, CanTraNcc)
    VALUES ('PN-SEED-K2', 2, 2, 2, 2, DATEADD(DAY, -18, GETDATE()), DATEADD(DAY, -18, GETDATE()), 'THONG_THUONG', 'DA_XAC_NHAN', N'Nhập hàng cấp tồn độc lập cho chi nhánh Kho An Thới', 1, 'HD00895', 500000, 75000000, 74500000);
    SET @pnNewId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuNhap (MaPhieuNhap, MaHang, SoLuong, DonGiaNhap, GiamGia, ThanhTien)
    SELECT @pnNewId, MaHang, 40, GiaVon, 0, 40 * GiaVon
    FROM HangHoa
    WHERE MaHangNoiBo IN ('GAS12', 'GAS45', 'GAS-PETRO', 'GAS-SP', 'BEP01', 'BEP-DL', 'THAN10', 'THAN-DUA', 'CON-THACH', 'OXI40');
END

-- 5.3. Nhập lô hàng cho Kho 3 (Kho phụ kiện Tuna)
IF NOT EXISTS (SELECT 1 FROM PhieuNhap WHERE MaPhieu = 'PN-SEED-K3')
BEGIN
    INSERT INTO PhieuNhap (MaPhieu, MaKho, MaDonViCapHang, MaNVLap, MaNVXacNhan, NgayLap, NgayXacNhan, LoaiPhieuNhap, TrangThai, GhiChu, DaDanhDau, SoHoaDon, GiamGia, TongTien, CanTraNcc)
    VALUES ('PN-SEED-K3', 3, 2, 1, 1, DATEADD(DAY, -15, GETDATE()), DATEADD(DAY, -15, GETDATE()), 'THONG_THUONG', 'DA_XAC_NHAN', N'Khởi tạo tồn kho các loại phụ kiện và thiết bị cho Kho Tuna', 0, 'HD00901', 0, 48000000, 48000000);
    SET @pnNewId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuNhap (MaPhieuNhap, MaHang, SoLuong, DonGiaNhap, GiamGia, ThanhTien)
    SELECT @pnNewId, MaHang, 60, GiaVon, 0, 60 * GiaVon
    FROM HangHoa
    WHERE MaHangNoiBo IN ('ONG01', 'DAY-GAS', 'VAN-01', 'DH-AP', 'CO-DE', 'CB-GAS', 'BEP-DL', 'XE-DAY45');
END

-- 5.4. Thêm 1 phiếu nhập tạm (NHAP) và 1 phiếu nhập đã hủy (HUY) để test bộ lọc Nhập hàng
IF NOT EXISTS (SELECT 1 FROM PhieuNhap WHERE MaPhieu = 'PN-DRAFT-01')
BEGIN
    INSERT INTO PhieuNhap (MaPhieu, MaKho, MaDonViCapHang, MaNVLap, NgayLap, LoaiPhieuNhap, TrangThai, GhiChu, DaDanhDau, GiamGia, TongTien, CanTraNcc)
    VALUES ('PN-DRAFT-01', 1, 3, 1, DATEADD(HOUR, -5, GETDATE()), 'THONG_THUONG', 'NHAP', N'Đang chờ nhà xe giao bình oxy y tế tới cảng', 1, 0, 15000000, 15000000);
    SET @pnNewId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuNhap (MaPhieuNhap, MaHang, SoLuong, DonGiaNhap, GiamGia, ThanhTien)
    SELECT @pnNewId, MaHang, 20, GiaVon, 0, 20 * GiaVon
    FROM HangHoa WHERE MaHangNoiBo = 'OXI40';
END

IF NOT EXISTS (SELECT 1 FROM PhieuNhap WHERE MaPhieu = 'PN-CANCEL-01')
BEGIN
    INSERT INTO PhieuNhap (MaPhieu, MaKho, MaDonViCapHang, MaNVLap, NgayLap, LoaiPhieuNhap, TrangThai, GhiChu, DaDanhDau, GiamGia, TongTien, CanTraNcc)
    VALUES ('PN-CANCEL-01', 1, 2, 2, DATEADD(DAY, -7, GETDATE()), 'THONG_THUONG', 'HUY', N'Hủy do nhà cung cấp giao trễ tiến độ phà biển', 0, 0, 12000000, 12000000);
    SET @pnNewId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuNhap (MaPhieuNhap, MaHang, SoLuong, DonGiaNhap, GiamGia, ThanhTien)
    SELECT @pnNewId, MaHang, 15, GiaVon, 0, 15 * GiaVon
    FROM HangHoa WHERE MaHangNoiBo = 'BEP01';
END

PRINT N'   [5/11] Đã cấp tồn dồi dào cho cả 3 kho và đa dạng hóa trạng thái PhieuNhap.';

-- -------------------------------------------------------------------------------------
-- PHẦN 6: BỔ SUNG PHIẾU CHUYỂN KHO ĐẦY ĐỦ TRẠNG THÁI (PhieuChuyenKho)
-- -------------------------------------------------------------------------------------
DECLARE @ckId INT;

-- 6.1. Phiếu đang chuyển (DA_XUAT): Kho 1 -> Kho 2 (Kho An Thới đang chờ nhận)
IF NOT EXISTS (SELECT 1 FROM PhieuChuyenKho WHERE MaPhieu = 'CK000003')
BEGIN
    INSERT INTO PhieuChuyenKho (MaPhieu, MaKhoNguon, MaKhoDich, MaNVLap, MaNVXuat, NgayLap, ThoiDiemXuat, TrangThai, GhiChu, TongSoLuongChuyen, TongSoLuongNhan, TongGiaTriChuyen, DaDanhDau)
    VALUES ('CK000003', 1, 2, 1, 1, DATEADD(HOUR, -4, GETDATE()), DATEADD(HOUR, -3, GETDATE()), 'DA_XUAT', N'Chuyển bình gas tiếp tế chi nhánh An Thới đợt sáng', 15, 0, 15 * 365000, 1);
    SET @ckId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuChuyenKho (MaPhieuChuyen, MaHang, SoLuong, DonGiaChuyen, ThanhTien)
    SELECT @ckId, MaHang, 15, GiaVon, 15 * GiaVon
    FROM HangHoa WHERE MaHangNoiBo = 'GAS-PETRO';
END

-- 6.2. Phiếu đang chuyển (DA_XUAT): Kho 3 -> Kho 1 (Chuyển van và đồng hồ về trung tâm)
IF NOT EXISTS (SELECT 1 FROM PhieuChuyenKho WHERE MaPhieu = 'CK000004')
BEGIN
    INSERT INTO PhieuChuyenKho (MaPhieu, MaKhoNguon, MaKhoDich, MaNVLap, MaNVXuat, NgayLap, ThoiDiemXuat, TrangThai, GhiChu, TongSoLuongChuyen, TongSoLuongNhan, TongGiaTriChuyen, DaDanhDau)
    VALUES ('CK000004', 3, 1, 2, 2, DATEADD(HOUR, -2, GETDATE()), DATEADD(HOUR, -1, GETDATE()), 'DA_XUAT', N'Điều chuyển phụ kiện gas về kho trung tâm phục vụ đơn lắp đặt resort', 20, 0, 20 * 155000, 0);
    SET @ckId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuChuyenKho (MaPhieuChuyen, MaHang, SoLuong, DonGiaChuyen, ThanhTien)
    SELECT @ckId, MaHang, 20, GiaVon, 20 * GiaVon
    FROM HangHoa WHERE MaHangNoiBo = 'DH-AP';
END

-- 6.3. Phiếu chuyển tạm (NHAP): Kho 1 -> Kho 3 (Chưa xuất)
IF NOT EXISTS (SELECT 1 FROM PhieuChuyenKho WHERE MaPhieu = 'CK000005')
BEGIN
    INSERT INTO PhieuChuyenKho (MaPhieu, MaKhoNguon, MaKhoDich, MaNVLap, NgayLap, TrangThai, GhiChu, TongSoLuongChuyen, TongSoLuongNhan, TongGiaTriChuyen, DaDanhDau)
    VALUES ('CK000005', 1, 3, 1, DATEADD(HOUR, -1, GETDATE()), 'NHAP', N'Dự thảo điều chuyển xe chở bình gas qua kho phụ kiện', 2, 0, 2 * 980000, 1);
    SET @ckId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuChuyenKho (MaPhieuChuyen, MaHang, SoLuong, DonGiaChuyen, ThanhTien)
    SELECT @ckId, MaHang, 2, GiaVon, 2 * GiaVon
    FROM HangHoa WHERE MaHangNoiBo = 'XE-DAY45';
END

-- 6.4. Phiếu đã nhận ĐỦ (DA_NHAN): Kho 1 -> Kho 2
IF NOT EXISTS (SELECT 1 FROM PhieuChuyenKho WHERE MaPhieu = 'CK000006')
BEGIN
    INSERT INTO PhieuChuyenKho (MaPhieu, MaKhoNguon, MaKhoDich, MaNVLap, MaNVXuat, MaNVNhan, NgayLap, ThoiDiemXuat, ThoiDiemNhan, TrangThai, GhiChu, TongSoLuongChuyen, TongSoLuongNhan, TongGiaTriChuyen, DaDanhDau)
    VALUES ('CK000006', 1, 2, 1, 1, 2, DATEADD(DAY, -3, GETDATE()), DATEADD(DAY, -3, GETDATE()), DATEADD(DAY, -2, GETDATE()), 'DA_NHAN', N'Chuyển bếp và than sạch cho Kho An Thới bán dịp cuối tuần', 15, 15, (10 * 210000 + 5 * 115000), 0);
    SET @ckId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuChuyenKho (MaPhieuChuyen, MaHang, SoLuong, SoLuongNhan, DonGiaChuyen, ThanhTien)
    SELECT @ckId, MaHang, 10, 10, GiaVon, 10 * GiaVon
    FROM HangHoa WHERE MaHangNoiBo = 'BEP-DL';

    INSERT INTO ChiTietPhieuChuyenKho (MaPhieuChuyen, MaHang, SoLuong, SoLuongNhan, DonGiaChuyen, ThanhTien)
    SELECT @ckId, MaHang, 5, 5, GiaVon, 5 * GiaVon
    FROM HangHoa WHERE MaHangNoiBo = 'THAN-DUA';
END

-- 6.5. Phiếu đã nhận THIẾU có thất thoát (DA_NHAN): Kho 1 -> Kho 2
IF NOT EXISTS (SELECT 1 FROM PhieuChuyenKho WHERE MaPhieu = 'CK000007')
BEGIN
    INSERT INTO PhieuChuyenKho (MaPhieu, MaKhoNguon, MaKhoDich, MaNVLap, MaNVXuat, MaNVNhan, NgayLap, ThoiDiemXuat, ThoiDiemNhan, TrangThai, GhiChu, GhiChuNhan, TongSoLuongChuyen, TongSoLuongNhan, TongGiaTriChuyen, DaDanhDau)
    VALUES ('CK000007', 1, 2, 1, 1, 2, DATEADD(DAY, -5, GETDATE()), DATEADD(DAY, -5, GETDATE()), DATEADD(DAY, -4, GETDATE()), 'DA_NHAN', N'Chuyển bình gas Saigon Petro', N'Thất thoát 1 bình do rò rỉ van trên phà, đã lập biên bản giám định', 10, 9, 10 * 360000, 1);
    SET @ckId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuChuyenKho (MaPhieuChuyen, MaHang, SoLuong, SoLuongNhan, DonGiaChuyen, ThanhTien)
    SELECT @ckId, MaHang, 10, 9, GiaVon, 10 * GiaVon
    FROM HangHoa WHERE MaHangNoiBo = 'GAS-SP';
END

-- 6.6. Phiếu chuyển đã hủy (HUY): Kho 2 -> Kho 1
IF NOT EXISTS (SELECT 1 FROM PhieuChuyenKho WHERE MaPhieu = 'CK000008')
BEGIN
    INSERT INTO PhieuChuyenKho (MaPhieu, MaKhoNguon, MaKhoDich, MaNVLap, NgayLap, TrangThai, GhiChu, TongSoLuongChuyen, TongSoLuongNhan, TongGiaTriChuyen, DaDanhDau)
    VALUES ('CK000008', 2, 1, 2, DATEADD(DAY, -8, GETDATE()), 'HUY', N'Hủy lệnh điều chuyển do xe tải gặp trục trặc kỹ thuật', 5, 0, 5 * 365000, 0);
    SET @ckId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuChuyenKho (MaPhieuChuyen, MaHang, SoLuong, DonGiaChuyen, ThanhTien)
    SELECT @ckId, MaHang, 5, GiaVon, 5 * GiaVon
    FROM HangHoa WHERE MaHangNoiBo = 'GAS-PETRO';
END

PRINT N'   [6/11] Đã bổ sung 6 Phiếu chuyển kho với đầy đủ luồng nghiệp vụ chuẩn KiotViet.';

-- -------------------------------------------------------------------------------------
-- PHẦN 7: BỔ SUNG PHIẾU TRẢ HÀNG NHẬP (PhieuTraHangNhap)
-- -------------------------------------------------------------------------------------
DECLARE @thnId INT;

-- 7.1. Phiếu trả hàng đã hoàn thành (DA_TRA_HANG): Trả vỏ bình/hàng lỗi cho Gas Petrolimex
IF NOT EXISTS (SELECT 1 FROM PhieuTraHangNhap WHERE MaPhieu = 'THN000002')
BEGIN
    INSERT INTO PhieuTraHangNhap (MaPhieu, MaKho, MaDonViCapHang, MaNvlap, MaNvtra, NgayLap, NgayTra, TrangThai, TongSoLuong, TongTienHang, GiamGia, CanThuNcc, DaThuNcc, GhiChu, DaDanhDau)
    VALUES ('THN000002', 1, 1, 1, 1, DATEADD(DAY, -4, GETDATE()), DATEADD(DAY, -4, GETDATE()), 'DA_TRA_HANG', 5, 5 * 365000, 50000, 5 * 365000 - 50000, 5 * 365000 - 50000, N'Trả lại 5 bình gas cận date cho nhà phân phối', 1);
    SET @thnId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuTraHangNhap (MaPhieuTraHang, MaHang, SoLuong, GiaVon, DonGiaTra, ThanhTien, GhiChu)
    SELECT @thnId, MaHang, 5, GiaVon, GiaVon, 5 * GiaVon, N'Đổi lô sản xuất mới'
    FROM HangHoa WHERE MaHangNoiBo = 'GAS-PETRO';
END

-- 7.2. Phiếu trả hàng đã hoàn thành (DA_TRA_HANG): Trả phụ kiện lỗi cho Công ty Kaff
IF NOT EXISTS (SELECT 1 FROM PhieuTraHangNhap WHERE MaPhieu = 'THN000003')
BEGIN
    INSERT INTO PhieuTraHangNhap (MaPhieu, MaKho, MaDonViCapHang, MaNvlap, MaNvtra, NgayLap, NgayTra, TrangThai, TongSoLuong, TongTienHang, GiamGia, CanThuNcc, DaThuNcc, GhiChu, DaDanhDau)
    VALUES ('THN000003', 1, 2, 2, 2, DATEADD(DAY, -2, GETDATE()), DATEADD(DAY, -2, GETDATE()), 'DA_TRA_HANG', 2, 2 * 210000, 0, 2 * 210000, 2 * 210000, N'Trả bếp gas du lịch bị trầy xước vỏ hộp trong lô nhập', 0);
    SET @thnId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuTraHangNhap (MaPhieuTraHang, MaHang, SoLuong, GiaVon, DonGiaTra, ThanhTien, GhiChu)
    SELECT @thnId, MaHang, 2, GiaVon, GiaVon, 2 * GiaVon, N'Hàng trầy xước'
    FROM HangHoa WHERE MaHangNoiBo = 'BEP-DL';
END

-- 7.3. Phiếu trả hàng tạm (NHAP): Đang lập tại Kho An Thới
IF NOT EXISTS (SELECT 1 FROM PhieuTraHangNhap WHERE MaPhieu = 'THN000004')
BEGIN
    INSERT INTO PhieuTraHangNhap (MaPhieu, MaKho, MaDonViCapHang, MaNvlap, NgayLap, NgayTra, TrangThai, TongSoLuong, TongTienHang, GiamGia, CanThuNcc, DaThuNcc, GhiChu, DaDanhDau)
    VALUES ('THN000004', 2, 1, 2, DATEADD(HOUR, -6, GETDATE()), DATEADD(HOUR, -6, GETDATE()), 'NHAP', 3, 3 * 360000, 0, 3 * 360000, 0, N'Dự thảo gom bình gas Saigon Petro đổi trả', 1);
    SET @thnId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuTraHangNhap (MaPhieuTraHang, MaHang, SoLuong, GiaVon, DonGiaTra, ThanhTien, GhiChu)
    SELECT @thnId, MaHang, 3, GiaVon, GiaVon, 3 * GiaVon, N'Gom đổi trả'
    FROM HangHoa WHERE MaHangNoiBo = 'GAS-SP';
END

-- 7.4. Phiếu trả hàng đã hủy (HUY)
IF NOT EXISTS (SELECT 1 FROM PhieuTraHangNhap WHERE MaPhieu = 'THN000005')
BEGIN
    INSERT INTO PhieuTraHangNhap (MaPhieu, MaKho, MaDonViCapHang, MaNvlap, NgayLap, NgayTra, TrangThai, TongSoLuong, TongTienHang, GiamGia, CanThuNcc, DaThuNcc, GhiChu, DaDanhDau)
    VALUES ('THN000005', 1, 2, 1, DATEADD(DAY, -10, GETDATE()), DATEADD(DAY, -10, GETDATE()), 'HUY', 1, 920000, 0, 920000, 0, N'Hủy phiếu trả vì nhà cung cấp đồng ý bảo hành tại chỗ', 0);
    SET @thnId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuTraHangNhap (MaPhieuTraHang, MaHang, SoLuong, GiaVon, DonGiaTra, ThanhTien, GhiChu)
    SELECT @thnId, MaHang, 1, GiaVon, GiaVon, GiaVon, N'Bảo hành thay thế'
    FROM HangHoa WHERE MaHangNoiBo = 'DAY-GAS';
END

PRINT N'   [7/11] Đã bổ sung 4 Phiếu trả hàng nhập đầy đủ trạng thái.';

-- -------------------------------------------------------------------------------------
-- PHẦN 8: BỔ SUNG PHIẾU XUẤT HỦY (PhieuXuat - LoaiPhieuXuat = 'XUAT_HUY')
-- -------------------------------------------------------------------------------------
DECLARE @xhId INT;

-- 8.1. Xuất hủy đã hoàn thành (DA_XAC_NHAN): Hỏng hóc do rò rỉ van
IF NOT EXISTS (SELECT 1 FROM PhieuXuat WHERE MaPhieu = 'XH000010')
BEGIN
    INSERT INTO PhieuXuat (MaPhieu, MaKho, MaNVLap, MaNVXacNhan, NgayLap, NgayXacNhan, LoaiPhieuXuat, TrangThai, GhiChu, DaDanhDau)
    VALUES ('XH000010', 1, 1, 1, DATEADD(DAY, -6, GETDATE()), DATEADD(DAY, -6, GETDATE()), 'XUAT_HUY', 'DA_XAC_NHAN', N'Xuất hủy 2 vỏ bình rỉ sét chân đế và xì van an toàn không thể phục hồi', 1);
    SET @xhId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuXuat (MaPhieuXuat, MaHang, SoLuongXuat, DonGiaXuat)
    SELECT @xhId, MaHang, 2, GiaVon
    FROM HangHoa WHERE MaHangNoiBo = 'GAS12';
END

-- 8.2. Xuất hủy đã hoàn thành (DA_XAC_NHAN): Than ẩm mốc do ngấm nước biển
IF NOT EXISTS (SELECT 1 FROM PhieuXuat WHERE MaPhieu = 'XH000011')
BEGIN
    INSERT INTO PhieuXuat (MaPhieu, MaKho, MaNVLap, MaNVXacNhan, NgayLap, NgayXacNhan, LoaiPhieuXuat, TrangThai, GhiChu, DaDanhDau)
    VALUES ('XH000011', 2, 2, 2, DATEADD(DAY, -3, GETDATE()), DATEADD(DAY, -3, GETDATE()), 'XUAT_HUY', 'DA_XAC_NHAN', N'Xuất hủy than sạch bị dột nước mưa bão tại kho An Thới', 0);
    SET @xhId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuXuat (MaPhieuXuat, MaHang, SoLuongXuat, DonGiaXuat)
    SELECT @xhId, MaHang, 5, GiaVon
    FROM HangHoa WHERE MaHangNoiBo = 'THAN-DUA';
END

-- 8.3. Phiếu xuất hủy tạm (NHAP): Bếp bể mặt kính đang chờ kiểm định bảo hiểm
IF NOT EXISTS (SELECT 1 FROM PhieuXuat WHERE MaPhieu = 'XH000012')
BEGIN
    INSERT INTO PhieuXuat (MaPhieu, MaKho, MaNVLap, NgayLap, LoaiPhieuXuat, TrangThai, GhiChu, DaDanhDau)
    VALUES ('XH000012', 1, 1, DATEADD(HOUR, -8, GETDATE()), 'XUAT_HUY', 'NHAP', N'Bản tạm: Bếp gas vỡ kính khi bốc dỡ phà biển, chờ biên bản bảo hiểm', 1);
    SET @xhId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuXuat (MaPhieuXuat, MaHang, SoLuongXuat, DonGiaXuat)
    SELECT @xhId, MaHang, 1, GiaVon
    FROM HangHoa WHERE MaHangNoiBo = 'BEP-DOI';
END

-- 8.4. Phiếu xuất hủy đã hủy (HUY)
IF NOT EXISTS (SELECT 1 FROM PhieuXuat WHERE MaPhieu = 'XH000013')
BEGIN
    INSERT INTO PhieuXuat (MaPhieu, MaKho, MaNVLap, NgayLap, LoaiPhieuXuat, TrangThai, GhiChu, DaDanhDau)
    VALUES ('XH000013', 1, 2, DATEADD(DAY, -12, GETDATE()), 'XUAT_HUY', 'HUY', N'Hủy xuất do thợ đã sửa chữa và thay thế ron thành công', 0);
    SET @xhId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuXuat (MaPhieuXuat, MaHang, SoLuongXuat, DonGiaXuat)
    SELECT @xhId, MaHang, 1, GiaVon
    FROM HangHoa WHERE MaHangNoiBo = 'BEP-KHE';
END

PRINT N'   [8/11] Đã bổ sung 4 Phiếu xuất hủy đầy đủ trạng thái và lý do thực tế.';

-- -------------------------------------------------------------------------------------
-- PHẦN 9: BỔ SUNG ĐƠN BÁN HÀNG VÀ XUẤT KHO BÁN HÀNG (DonBan & PhieuXuat BAN_HANG)
-- -------------------------------------------------------------------------------------
DECLARE @khVin INT = (SELECT TOP 1 MaKH FROM KhachHang WHERE TenKH LIKE N'%Vinpearl%');
DECLARE @khMuongThanh INT = (SELECT TOP 1 MaKH FROM KhachHang WHERE TenKH LIKE N'%Mường Thanh%');
DECLARE @khDaiLy INT = (SELECT TOP 1 MaKH FROM KhachHang WHERE TenKH LIKE N'%Minh Hiền%');

DECLARE @dbId INT;
DECLARE @pxbId INT;

-- 9.1. Đơn bán cho Vinpearl Resort
IF NOT EXISTS (SELECT 1 FROM PhieuXuat WHERE MaPhieu = 'PX000002')
BEGIN
    INSERT INTO DonBan (MaKH, MaKho, MaNVLap, NgayLap, TrangThai, GhiChu)
    VALUES (ISNULL(@khVin, 1), 1, 3, DATEADD(DAY, -2, GETDATE()), 'HOAN_TAT', N'Cung cấp gas công nghiệp và than nướng cho bếp Vinpearl');
    SET @dbId = SCOPE_IDENTITY();

    INSERT INTO ChiTietDonBan (MaDonBan, MaHang, SoLuong, DonGiaApDung, ChietKhau)
    SELECT @dbId, MaHang, 5, GiaBanThamKhao, 0 FROM HangHoa WHERE MaHangNoiBo = 'GAS45';

    INSERT INTO ChiTietDonBan (MaDonBan, MaHang, SoLuong, DonGiaApDung, ChietKhau)
    SELECT @dbId, MaHang, 10, GiaBanThamKhao, 0 FROM HangHoa WHERE MaHangNoiBo = 'THAN-DUA';

    -- Phiếu xuất bán hàng tương ứng
    INSERT INTO PhieuXuat (MaPhieu, MaDonBan, MaKho, MaNVLap, MaNVXacNhan, NgayLap, NgayXacNhan, LoaiPhieuXuat, TrangThai, GhiChu, DaDanhDau)
    VALUES ('PX000002', @dbId, 1, 3, 1, DATEADD(DAY, -2, GETDATE()), DATEADD(DAY, -2, GETDATE()), 'XUAT_BAN', 'DA_XAC_NHAN', N'Xuất giao hàng theo đơn bán Vinpearl', 1);
    SET @pxbId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuXuat (MaPhieuXuat, MaCTDonBan, MaHang, SoLuongXuat, DonGiaXuat)
    SELECT @pxbId, NULL, MaHang, 5, GiaBanThamKhao FROM HangHoa WHERE MaHangNoiBo = 'GAS45';

    INSERT INTO ChiTietPhieuXuat (MaPhieuXuat, MaCTDonBan, MaHang, SoLuongXuat, DonGiaXuat)
    SELECT @pxbId, NULL, MaHang, 10, GiaBanThamKhao FROM HangHoa WHERE MaHangNoiBo = 'THAN-DUA';
END

-- 9.2. Đơn bán cho Đại lý Cửa Cạn
IF NOT EXISTS (SELECT 1 FROM PhieuXuat WHERE MaPhieu = 'PX000003')
BEGIN
    INSERT INTO DonBan (MaKH, MaKho, MaNVLap, NgayLap, TrangThai, GhiChu)
    VALUES (ISNULL(@khDaiLy, 1), 1, 3, DATEADD(DAY, -1, GETDATE()), 'HOAN_TAT', N'Giao đại lý Minh Hiền bình gas dân dụng 12kg');
    SET @dbId = SCOPE_IDENTITY();

    INSERT INTO ChiTietDonBan (MaDonBan, MaHang, SoLuong, DonGiaApDung, ChietKhau)
    SELECT @dbId, MaHang, 12, GiaBanThamKhao, 0 FROM HangHoa WHERE MaHangNoiBo = 'GAS-PETRO';

    INSERT INTO PhieuXuat (MaPhieu, MaDonBan, MaKho, MaNVLap, MaNVXacNhan, NgayLap, NgayXacNhan, LoaiPhieuXuat, TrangThai, GhiChu, DaDanhDau)
    VALUES ('PX000003', @dbId, 1, 3, 1, DATEADD(DAY, -1, GETDATE()), DATEADD(DAY, -1, GETDATE()), 'XUAT_BAN', 'DA_XAC_NHAN', N'Giao đại lý Minh Hiền', 0);
    SET @pxbId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuXuat (MaPhieuXuat, MaCTDonBan, MaHang, SoLuongXuat, DonGiaXuat)
    SELECT @pxbId, NULL, MaHang, 12, GiaBanThamKhao FROM HangHoa WHERE MaHangNoiBo = 'GAS-PETRO';
END

PRINT N'   [9/11] Đã tạo đơn bán và phiếu xuất bán hàng mẫu.';

-- -------------------------------------------------------------------------------------
-- PHẦN 10: BỔ SUNG PHIẾU KIỂM KÊ VÀ CÂN BẰNG TỒN (PhieuKiemKe & PhieuDieuChinh)
-- -------------------------------------------------------------------------------------
DECLARE @pkkId INT;
DECLARE @pdcId INT;
DECLARE @ctkkId INT;

-- 10.1. Phiếu kiểm kê đã CÂN BẰNG có lệch tăng và lệch giảm tại Kho An Thới
IF NOT EXISTS (SELECT 1 FROM PhieuKiemKe WHERE MaPhieu = 'PKK000012')
BEGIN
    INSERT INTO PhieuKiemKe (MaPhieu, MaKho, MaNVLap, ThoiDiemChot, TrangThai, GhiChu, DaDanhDau)
    VALUES ('PKK000012', 2, 2, DATEADD(DAY, -7, GETDATE()), 'DA_DIEU_CHINH', N'Kiểm kê định kỳ tháng chi nhánh Kho An Thới', 1);
    SET @pkkId = SCOPE_IDENTITY();

    -- Dòng 1: Lệch thừa +1 bình (Sổ sách 20, Thực tế 21)
    DECLARE @hhGas12 INT = (SELECT TOP 1 MaHang FROM HangHoa WHERE MaHangNoiBo = 'GAS12');
    INSERT INTO ChiTietPhieuKiemKe (MaPhieuKiemKe, MaHang, SoLuongTheoSo, SoLuongThucTe, DonGia)
    VALUES (@pkkId, @hhGas12, 20, 21, 350000);
    DECLARE @ct1 INT = SCOPE_IDENTITY();

    -- Dòng 2: Khớp 100% (Sổ sách 10, Thực tế 10)
    DECLARE @hhBep01 INT = (SELECT TOP 1 MaHang FROM HangHoa WHERE MaHangNoiBo = 'BEP01');
    INSERT INTO ChiTietPhieuKiemKe (MaPhieuKiemKe, MaHang, SoLuongTheoSo, SoLuongThucTe, DonGia)
    VALUES (@pkkId, @hhBep01, 10, 10, 280000);

    -- Phiếu điều chỉnh cân bằng kho
    INSERT INTO PhieuDieuChinh (MaPhieuKiemKe, MaNVLap, MaNVDuyet, NgayLap, NgayDuyet, TrangThai, GhiChu)
    VALUES (@pkkId, 2, 1, DATEADD(DAY, -7, GETDATE()), DATEADD(DAY, -7, GETDATE()), 'DA_DUYET', N'Duyệt cân bằng kho theo biên bản kiểm kê');
    SET @pdcId = SCOPE_IDENTITY();

    INSERT INTO ChiTietPhieuDieuChinh (MaPhieuDieuChinh, MaCTKiemKe, SoLuongDieuChinh)
    VALUES (@pdcId, @ct1, 1);
END

-- 10.2. Phiếu kiểm kê TẠM (NHAP) đang tiến hành tại Kho phụ kiện Tuna
IF NOT EXISTS (SELECT 1 FROM PhieuKiemKe WHERE MaPhieu = 'PKK000013')
BEGIN
    INSERT INTO PhieuKiemKe (MaPhieu, MaKho, MaNVLap, ThoiDiemChot, TrangThai, GhiChu, DaDanhDau)
    VALUES ('PKK000013', 3, 1, DATEADD(HOUR, -3, GETDATE()), 'NHAP', N'Đang kiểm đếm các loại đai xiết cổ dê và đồng hồ đo áp', 1);
    SET @pkkId = SCOPE_IDENTITY();

    DECLARE @hhCoDe INT = (SELECT TOP 1 MaHang FROM HangHoa WHERE MaHangNoiBo = 'CO-DE');
    DECLARE @hhDhAp INT = (SELECT TOP 1 MaHang FROM HangHoa WHERE MaHangNoiBo = 'DH-AP');

    INSERT INTO ChiTietPhieuKiemKe (MaPhieuKiemKe, MaHang, SoLuongTheoSo, SoLuongThucTe, DonGia)
    VALUES (@pkkId, @hhCoDe, 60, NULL, 75000);

    INSERT INTO ChiTietPhieuKiemKe (MaPhieuKiemKe, MaHang, SoLuongTheoSo, SoLuongThucTe, DonGia)
    VALUES (@pkkId, @hhDhAp, 40, NULL, 155000);
END

PRINT N'   [10/11] Đã bổ sung Phiếu kiểm kê và Phiếu điều chỉnh cân bằng kho.';

-- -------------------------------------------------------------------------------------
-- PHẦN 11: BỔ SUNG NHẬT KÝ THAO TÁC HỆ THỐNG (NhatKyThaoTac)
-- -------------------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM NhatKyThaoTac WHERE MaDoiTuong = 'PN-SEED-K1')
BEGIN
    INSERT INTO NhatKyThaoTac (MaTaiKhoan, ThoiDiem, ThaoTac, LoaiDoiTuong, MaDoiTuong, NoiDung)
    VALUES 
    (1, DATEADD(DAY, -20, GETDATE()), N'NHAP_HANG', N'PhieuNhap', 'PN-SEED-K1', N'Lập và xác nhận phiếu nhập bổ sung Kho trung tâm'),
    (2, DATEADD(DAY, -18, GETDATE()), N'NHAP_HANG', N'PhieuNhap', 'PN-SEED-K2', N'Xác nhận nhập kho hàng hóa cho Kho An Thới'),
    (1, DATEADD(DAY, -7, GETDATE()), N'CAN_BANG_KHO', N'PhieuKiemKe', 'PKK000012', N'Duyệt cân bằng kho sau kiểm kê định kỳ chi nhánh An Thới'),
    (1, DATEADD(DAY, -6, GETDATE()), N'XUAT_HUY', N'PhieuXuat', 'XH000010', N'Hoàn thành phiếu xuất hủy bình gas rỉ sét'),
    (1, DATEADD(DAY, -5, GETDATE()), N'CHUYEN_KHO', N'PhieuChuyenKho', 'CK000007', N'Xác nhận xuất chuyển hàng từ Kho trung tâm sang Kho An Thới'),
    (2, DATEADD(DAY, -4, GETDATE()), N'NHAN_HANG', N'PhieuChuyenKho', 'CK000007', N'Kho An Thới xác nhận nhận hàng chuyển (ghi nhận thất thoát 1 bình)'),
    (1, DATEADD(DAY, -4, GETDATE()), N'TRA_HANG', N'PhieuTraHangNhap', 'THN000002', N'Hoàn thành phiếu trả hàng cận date cho NCC Gas Petrolimex'),
    (3, DATEADD(DAY, -2, GETDATE()), N'BAN_HANG', N'DonBan', 'PX000002', N'Lập hóa đơn và xuất kho bán hàng cho Resort Vinpearl');
END

PRINT N'   [11/11] Đã ghi nhận lịch sử nhật ký thao tác NhatKyThaoTac.';

PRINT N'==> [HOÀN TẤT] Nạp thành công tập dữ liệu mẫu toàn diện cho hệ thống Kho Pro!';
GO
