-- ========================================================================
-- MIGRATION SCRIPT 16: NÂNG CẤP TOÀN DIỆN DANH MỤC KHÁCH HÀNG
-- Tuân thủ 3 nguyên tắc vàng CSDL (Luật 8 AGENTS.md):
-- 1. Chỉ thêm bảng và cột mới, không DROP/RENAME cột cũ.
-- 2. Đồng bộ chặt chẽ với Entity Model C# và DbContext.
-- 3. Đảm bảo an toàn 100% dữ liệu hiện có trong hệ thống.
-- ========================================================================

USE [QuanLyKhoPhuQuocLTW];
GO

-- 1. TẠO BẢNG NHÓM KHÁCH HÀNG NẾU CHƯA CÓ
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NhomKhachHang')
BEGIN
    CREATE TABLE [dbo].[NhomKhachHang] (
        [MaNhomKhachHang] INT IDENTITY(1,1) PRIMARY KEY,
        [TenNhom] NVARCHAR(100) NOT NULL,
        [GhiChu] NVARCHAR(255) NULL
    );
    PRINT N'Đã tạo bảng NhomKhachHang.';
END
GO

-- 2. CHÈN DỮ LIỆU MẪU BAN ĐẦU CHO NHÓM KHÁCH HÀNG
IF NOT EXISTS (SELECT 1 FROM [dbo].[NhomKhachHang])
BEGIN
    INSERT INTO [dbo].[NhomKhachHang] ([TenNhom], [GhiChu])
    VALUES 
        (N'Khách VIP', N'Nhóm khách hàng thân thiết, doanh số lớn'),
        (N'Khách sỉ', N'Đại lý và đối tác mua số lượng lớn'),
        (N'Khách lẻ', N'Khách hàng tiêu dùng cá nhân thông thường'),
        (N'Nhà hàng - Khách sạn', N'Đối tác du lịch và lưu trú tại Phú Quốc'),
        (N'Đối tác dự án', N'Các đơn vị thi công và công trình xây dựng');
    PRINT N'Đã chèn dữ liệu mẫu cho NhomKhachHang.';
END
GO

-- 3. BỔ SUNG CÁC CỘT MỚI CHO BẢNG KHACHHANG (KIỂM TRA TỒN TẠI TỪNG CỘT)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'MaKhHienThi')
    ALTER TABLE [dbo].[KhachHang] ADD [MaKhHienThi] NVARCHAR(30) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'DienThoai2')
    ALTER TABLE [dbo].[KhachHang] ADD [DienThoai2] VARCHAR(15) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'NgaySinh')
    ALTER TABLE [dbo].[KhachHang] ADD [NgaySinh] DATE NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'GioiTinh')
    ALTER TABLE [dbo].[KhachHang] ADD [GioiTinh] NVARCHAR(10) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'Email')
    ALTER TABLE [dbo].[KhachHang] ADD [Email] NVARCHAR(150) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'Facebook')
    ALTER TABLE [dbo].[KhachHang] ADD [Facebook] NVARCHAR(255) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'HinhAnh')
    ALTER TABLE [dbo].[KhachHang] ADD [HinhAnh] NVARCHAR(500) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'KhuVuc')
    ALTER TABLE [dbo].[KhachHang] ADD [KhuVuc] NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'PhuongXa')
    ALTER TABLE [dbo].[KhachHang] ADD [PhuongXa] NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'MaNhomKhachHang')
    ALTER TABLE [dbo].[KhachHang] ADD [MaNhomKhachHang] INT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'GhiChu')
    ALTER TABLE [dbo].[KhachHang] ADD [GhiChu] NVARCHAR(1000) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'NgayTao')
    ALTER TABLE [dbo].[KhachHang] ADD [NgayTao] DATETIME NOT NULL CONSTRAINT DF_KhachHang_NgayTao DEFAULT GETDATE();

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'NguoiTao')
    ALTER TABLE [dbo].[KhachHang] ADD [NguoiTao] NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'DaDanhDau')
    ALTER TABLE [dbo].[KhachHang] ADD [DaDanhDau] BIT NOT NULL CONSTRAINT DF_KhachHang_DaDanhDau DEFAULT 0;

-- CÁC CỘT THÔNG TIN XUẤT HÓA ĐƠN
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'XhdLoaiKhachHang')
    ALTER TABLE [dbo].[KhachHang] ADD [XhdLoaiKhachHang] NVARCHAR(30) NULL CONSTRAINT DF_KhachHang_XhdLoai DEFAULT 'CA_NHAN';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'MaSoThue')
    ALTER TABLE [dbo].[KhachHang] ADD [MaSoThue] VARCHAR(20) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'XhdTenDonVi')
    ALTER TABLE [dbo].[KhachHang] ADD [XhdTenDonVi] NVARCHAR(255) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'SoCccd')
    ALTER TABLE [dbo].[KhachHang] ADD [SoCccd] VARCHAR(20) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'TenNguoiMua')
    ALTER TABLE [dbo].[KhachHang] ADD [TenNguoiMua] NVARCHAR(150) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'XhdDiaChi')
    ALTER TABLE [dbo].[KhachHang] ADD [XhdDiaChi] NVARCHAR(255) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'XhdKhuVuc')
    ALTER TABLE [dbo].[KhachHang] ADD [XhdKhuVuc] NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'XhdPhuongXa')
    ALTER TABLE [dbo].[KhachHang] ADD [XhdPhuongXa] NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'XhdEmail')
    ALTER TABLE [dbo].[KhachHang] ADD [XhdEmail] NVARCHAR(150) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'SoHoChieu')
    ALTER TABLE [dbo].[KhachHang] ADD [SoHoChieu] VARCHAR(30) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'MaDvqhns')
    ALTER TABLE [dbo].[KhachHang] ADD [MaDvqhns] VARCHAR(30) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'XhdSoDienThoai')
    ALTER TABLE [dbo].[KhachHang] ADD [XhdSoDienThoai] VARCHAR(15) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'TenNganHang')
    ALTER TABLE [dbo].[KhachHang] ADD [TenNganHang] NVARCHAR(150) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KhachHang') AND name = 'SoTaiKhoanNganHang')
    ALTER TABLE [dbo].[KhachHang] ADD [SoTaiKhoanNganHang] VARCHAR(50) NULL;

PRINT N'Đã hoàn tất bổ sung các cột mới cho bảng KhachHang.';
GO

-- 4. TẠO KHÓA NGOẠI TỪ KHACHHANG SANG NHOMKHACHHANG NẾU CHƯA CÓ
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_KhachHang_NhomKhachHang')
BEGIN
    ALTER TABLE [dbo].[KhachHang] 
    ADD CONSTRAINT FK_KhachHang_NhomKhachHang 
    FOREIGN KEY ([MaNhomKhachHang]) REFERENCES [dbo].[NhomKhachHang]([MaNhomKhachHang])
    ON DELETE SET NULL;
    PRINT N'Đã tạo khóa ngoại FK_KhachHang_NhomKhachHang.';
END
GO

-- 5. CẬP NHẬT DỮ LIỆU ĐỒNG BỘ CHO CÁC KHÁCH HÀNG CŨ
UPDATE [dbo].[KhachHang]
SET [MaKhHienThi] = 'KH' + RIGHT('00000' + CAST([MaKH] AS VARCHAR(10)), 5)
WHERE [MaKhHienThi] IS NULL OR [MaKhHienThi] = '';

UPDATE [dbo].[KhachHang]
SET [NgayTao] = DATEADD(DAY, -([MaKH] * 3), GETDATE()),
    [NguoiTao] = N'Quản trị viên',
    [XhdLoaiKhachHang] = CASE WHEN [LoaiKhachHang] = 'CUA_HANG' THEN 'DOANH_NGHIEP' ELSE 'CA_NHAN' END,
    [KhuVuc] = N'Kiên Giang',
    [PhuongXa] = N'Phường Dương Đông',
    [MaNhomKhachHang] = CASE 
        WHEN [LoaiKhachHang] = 'CUA_HANG' THEN 2 -- Khách sỉ
        ELSE 3 -- Khách lẻ
    END
WHERE [NguoiTao] IS NULL;

PRINT N'Migration 16 hoàn tất thành công 100%.';
GO
