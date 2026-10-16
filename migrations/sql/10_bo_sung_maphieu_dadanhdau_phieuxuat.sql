-- Migration 10: Bổ sung MaPhieu và DaDanhDau vào bảng PhieuXuat
-- Phục vụ các phân hệ Xuất kho (Xuất hủy, Xuất dùng nội bộ, Xuất bán...)
-- Tuân thủ 3 nguyên tắc vàng CSDL trong AGENTS.md: Chỉ cộng thêm cột mới, không DROP/đổi tên cột cũ.

USE [QuanLyKhoPhuQuocLTW];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Thêm cột MaPhieu vào bảng PhieuXuat
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PhieuXuat') AND name = 'MaPhieu')
BEGIN
    ALTER TABLE [dbo].[PhieuXuat] ADD [MaPhieu] VARCHAR(30) NULL;
    PRINT N'[OK] Đã thêm cột MaPhieu vào bảng PhieuXuat.';
END
ELSE
BEGIN
    PRINT N'[SKIP] Cột MaPhieu đã tồn tại.';
END
GO

-- 2. Thêm cột DaDanhDau vào bảng PhieuXuat
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PhieuXuat') AND name = 'DaDanhDau')
BEGIN
    ALTER TABLE [dbo].[PhieuXuat] 
    ADD [DaDanhDau] BIT NOT NULL CONSTRAINT [DF_PhieuXuat_DaDanhDau] DEFAULT 0;
    PRINT N'[OK] Đã thêm cột DaDanhDau vào bảng PhieuXuat.';
END
ELSE
BEGIN
    PRINT N'[SKIP] Cột DaDanhDau đã tồn tại.';
END
GO

-- 3. Đồng bộ dữ liệu cũ: Điền mã mặc định cho các phiếu hiện có nếu chưa có
UPDATE [dbo].[PhieuXuat]
SET [MaPhieu] = CASE 
    WHEN [LoaiPhieuXuat] = 'XUAT_HUY' THEN 'XH' + RIGHT('000000' + CAST(MaPhieuXuat AS VARCHAR(10)), 6)
    ELSE 'PX' + RIGHT('000000' + CAST(MaPhieuXuat AS VARCHAR(10)), 6)
END
WHERE [MaPhieu] IS NULL;
GO

-- 4. Tạo index duy nhất có điều kiện (Filtered Unique Index) để chống trùng lặp mã phiếu
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_PhieuXuat_MaPhieu' AND object_id = OBJECT_ID('dbo.PhieuXuat'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UQ_PhieuXuat_MaPhieu] 
    ON [dbo].[PhieuXuat]([MaPhieu]) 
    WHERE [MaPhieu] IS NOT NULL;
    PRINT N'[OK] Đã tạo Unique Index UQ_PhieuXuat_MaPhieu.';
END
GO
