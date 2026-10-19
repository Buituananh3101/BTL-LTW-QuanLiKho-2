-- Migration 12: Bổ sung MaPhieu, DaDanhDau, SoHoaDon, GiamGia, TongTien, CanTraNcc vào bảng PhieuNhap & ChiTietPhieuNhap
-- Phục vụ phân hệ Nhập hàng (KiotViet Goods Receipt)
-- Tuân thủ 3 nguyên tắc vàng CSDL trong AGENTS.md: Chỉ cộng thêm cột mới, không DROP/đổi tên cột cũ.

USE [QuanLyKhoPhuQuocLTW];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Bổ sung các cột mới vào bảng PhieuNhap
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PhieuNhap') AND name = 'MaPhieu')
BEGIN
    ALTER TABLE [dbo].[PhieuNhap] ADD [MaPhieu] VARCHAR(30) NULL;
    PRINT N'[OK] Đã thêm cột MaPhieu vào bảng PhieuNhap.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PhieuNhap') AND name = 'DaDanhDau')
BEGIN
    ALTER TABLE [dbo].[PhieuNhap] ADD [DaDanhDau] BIT NOT NULL CONSTRAINT [DF_PhieuNhap_DaDanhDau] DEFAULT 0;
    PRINT N'[OK] Đã thêm cột DaDanhDau vào bảng PhieuNhap.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PhieuNhap') AND name = 'SoHoaDon')
BEGIN
    ALTER TABLE [dbo].[PhieuNhap] ADD [SoHoaDon] VARCHAR(50) NULL;
    PRINT N'[OK] Đã thêm cột SoHoaDon vào bảng PhieuNhap.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PhieuNhap') AND name = 'GiamGia')
BEGIN
    ALTER TABLE [dbo].[PhieuNhap] ADD [GiamGia] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_PhieuNhap_GiamGia] DEFAULT 0;
    PRINT N'[OK] Đã thêm cột GiamGia vào bảng PhieuNhap.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PhieuNhap') AND name = 'TongTien')
BEGIN
    ALTER TABLE [dbo].[PhieuNhap] ADD [TongTien] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_PhieuNhap_TongTien] DEFAULT 0;
    PRINT N'[OK] Đã thêm cột TongTien vào bảng PhieuNhap.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PhieuNhap') AND name = 'CanTraNcc')
BEGIN
    ALTER TABLE [dbo].[PhieuNhap] ADD [CanTraNcc] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_PhieuNhap_CanTraNcc] DEFAULT 0;
    PRINT N'[OK] Đã thêm cột CanTraNcc vào bảng PhieuNhap.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PhieuNhap') AND name = 'MaDatHangNhap')
BEGIN
    ALTER TABLE [dbo].[PhieuNhap] ADD [MaDatHangNhap] VARCHAR(30) NULL;
    PRINT N'[OK] Đã thêm cột MaDatHangNhap vào bảng PhieuNhap.';
END
GO

-- 2. Bổ sung các cột mới vào bảng ChiTietPhieuNhap
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ChiTietPhieuNhap') AND name = 'GiamGia')
BEGIN
    ALTER TABLE [dbo].[ChiTietPhieuNhap] ADD [GiamGia] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_ChiTietPhieuNhap_GiamGia] DEFAULT 0;
    PRINT N'[OK] Đã thêm cột GiamGia vào bảng ChiTietPhieuNhap.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ChiTietPhieuNhap') AND name = 'ThanhTien')
BEGIN
    ALTER TABLE [dbo].[ChiTietPhieuNhap] ADD [ThanhTien] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_ChiTietPhieuNhap_ThanhTien] DEFAULT 0;
    PRINT N'[OK] Đã thêm cột ThanhTien vào bảng ChiTietPhieuNhap.';
END
GO

-- 3. Cập nhật dữ liệu cũ: Điền mã mặc định PN00000X và tính tiền
UPDATE [dbo].[PhieuNhap]
SET [MaPhieu] = 'PN' + RIGHT('000000' + CAST(MaPhieuNhap AS VARCHAR(10)), 6)
WHERE [MaPhieu] IS NULL;
GO

UPDATE ct
SET ct.ThanhTien = (ct.SoLuong * ct.DonGiaNhap) - ISNULL(ct.GiamGia, 0)
FROM [dbo].[ChiTietPhieuNhap] ct
WHERE ct.ThanhTien = 0;
GO

UPDATE pn
SET pn.TongTien = ISNULL(t.TongTien, 0),
    pn.CanTraNcc = CASE WHEN ISNULL(t.TongTien, 0) - ISNULL(pn.GiamGia, 0) > 0 THEN ISNULL(t.TongTien, 0) - ISNULL(pn.GiamGia, 0) ELSE 0 END
FROM [dbo].[PhieuNhap] pn
LEFT JOIN (
    SELECT MaPhieuNhap, SUM(ThanhTien) AS TongTien
    FROM [dbo].[ChiTietPhieuNhap]
    GROUP BY MaPhieuNhap
) t ON t.MaPhieuNhap = pn.MaPhieuNhap
WHERE pn.TongTien = 0;
GO

-- 4. Tạo Filtered Unique Index cho MaPhieu
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_PhieuNhap_MaPhieu' AND object_id = OBJECT_ID('dbo.PhieuNhap'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UQ_PhieuNhap_MaPhieu] 
    ON [dbo].[PhieuNhap]([MaPhieu]) 
    WHERE [MaPhieu] IS NOT NULL;
    PRINT N'[OK] Đã tạo Unique Index UQ_PhieuNhap_MaPhieu.';
END
GO
