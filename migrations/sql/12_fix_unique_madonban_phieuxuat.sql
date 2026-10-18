-- Migration 12: Chuyển đổi ràng buộc UNIQUE MaDonBan và MaCTDonBan sang Filtered Unique Index
-- Khắc phục lỗi vi phạm UQ khi lập phiếu xuất hủy (XUAT_HUY có MaDonBan = NULL)
-- Tuân thủ 3 nguyên tắc vàng CSDL trong AGENTS.md: Giữ nguyên cột, chuyển ràng buộc sang Filtered Index WHERE NOT NULL

USE [QuanLyKhoPhuQuocLTW];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Xóa ràng buộc UNIQUE cũ trên PhieuXuat(MaDonBan) nếu còn tồn tại
DECLARE @sql1 NVARCHAR(MAX);
SELECT @sql1 = 'ALTER TABLE [dbo].[PhieuXuat] DROP CONSTRAINT [' + kc.name + '];'
FROM sys.key_constraints kc
JOIN sys.tables t ON kc.parent_object_id = t.object_id
JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE t.name = 'PhieuXuat' AND c.name = 'MaDonBan' AND kc.type = 'UQ';

IF @sql1 IS NOT NULL
BEGIN
    EXEC sp_executesql @sql1;
    PRINT N'[OK] Đã xóa ràng buộc UNIQUE cũ trên PhieuXuat(MaDonBan).';
END
ELSE
BEGIN
    PRINT N'[SKIP] Không tìm thấy ràng buộc UNIQUE cũ trên PhieuXuat(MaDonBan).';
END
GO

-- 2. Tạo Filtered Unique Index cho PhieuXuat(MaDonBan) (chỉ áp dụng duy nhất khi MaDonBan IS NOT NULL)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_PhieuXuat_MaDonBan' AND object_id = OBJECT_ID('dbo.PhieuXuat'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UQ_PhieuXuat_MaDonBan]
    ON [dbo].[PhieuXuat]([MaDonBan])
    WHERE [MaDonBan] IS NOT NULL;
    PRINT N'[OK] Đã tạo Filtered Unique Index UQ_PhieuXuat_MaDonBan.';
END
ELSE
BEGIN
    PRINT N'[SKIP] Index UQ_PhieuXuat_MaDonBan đã tồn tại.';
END
GO

-- 3. Xóa ràng buộc UNIQUE cũ trên ChiTietPhieuXuat(MaCTDonBan) nếu còn tồn tại
DECLARE @sql2 NVARCHAR(MAX);
SELECT @sql2 = 'ALTER TABLE [dbo].[ChiTietPhieuXuat] DROP CONSTRAINT [' + kc.name + '];'
FROM sys.key_constraints kc
JOIN sys.tables t ON kc.parent_object_id = t.object_id
JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE t.name = 'ChiTietPhieuXuat' AND c.name = 'MaCTDonBan' AND kc.type = 'UQ';

IF @sql2 IS NOT NULL
BEGIN
    EXEC sp_executesql @sql2;
    PRINT N'[OK] Đã xóa ràng buộc UNIQUE cũ trên ChiTietPhieuXuat(MaCTDonBan).';
END
ELSE
BEGIN
    PRINT N'[SKIP] Không tìm thấy ràng buộc UNIQUE cũ trên ChiTietPhieuXuat(MaCTDonBan).';
END
GO

-- 4. Tạo Filtered Unique Index cho ChiTietPhieuXuat(MaCTDonBan) (chỉ áp dụng duy nhất khi MaCTDonBan IS NOT NULL)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_ChiTietPhieuXuat_MaCTDonBan' AND object_id = OBJECT_ID('dbo.ChiTietPhieuXuat'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UQ_ChiTietPhieuXuat_MaCTDonBan]
    ON [dbo].[ChiTietPhieuXuat]([MaCTDonBan])
    WHERE [MaCTDonBan] IS NOT NULL;
    PRINT N'[OK] Đã tạo Filtered Unique Index UQ_ChiTietPhieuXuat_MaCTDonBan.';
END
ELSE
BEGIN
    PRINT N'[SKIP] Index UQ_ChiTietPhieuXuat_MaCTDonBan đã tồn tại.';
END
GO
