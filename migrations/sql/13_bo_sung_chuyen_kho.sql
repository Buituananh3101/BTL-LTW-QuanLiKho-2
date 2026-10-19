-- Migration 13: Bổ sung MaPhieu, DaDanhDau, GhiChuNhan, TongSoLuongChuyen, TongSoLuongNhan, TongGiaTriChuyen cho PhieuChuyenKho
-- Bổ sung SoLuongNhan, DonGiaChuyen, ThanhTien cho ChiTietPhieuChuyenKho
-- Cập nhật View vw_BienDongKho hỗ trợ nhận thiếu / thất thoát
-- Tuân thủ 3 nguyên tắc vàng CSDL trong AGENTS.md: Chỉ cộng thêm cột mới, không DROP/đổi tên cột cũ.

USE [QuanLyKhoPhuQuocLTW];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Bổ sung các cột mới vào bảng PhieuChuyenKho
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PhieuChuyenKho') AND name = 'MaPhieu')
BEGIN
    ALTER TABLE [dbo].[PhieuChuyenKho] ADD [MaPhieu] VARCHAR(30) NULL;
    PRINT N'[OK] Đã thêm cột MaPhieu vào bảng PhieuChuyenKho.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PhieuChuyenKho') AND name = 'DaDanhDau')
BEGIN
    ALTER TABLE [dbo].[PhieuChuyenKho] ADD [DaDanhDau] BIT NOT NULL CONSTRAINT [DF_PhieuChuyenKho_DaDanhDau] DEFAULT 0;
    PRINT N'[OK] Đã thêm cột DaDanhDau vào bảng PhieuChuyenKho.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PhieuChuyenKho') AND name = 'GhiChuNhan')
BEGIN
    ALTER TABLE [dbo].[PhieuChuyenKho] ADD [GhiChuNhan] NVARCHAR(500) NULL;
    PRINT N'[OK] Đã thêm cột GhiChuNhan vào bảng PhieuChuyenKho.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PhieuChuyenKho') AND name = 'TongSoLuongChuyen')
BEGIN
    ALTER TABLE [dbo].[PhieuChuyenKho] ADD [TongSoLuongChuyen] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_PhieuChuyenKho_TongSoLuongChuyen] DEFAULT 0;
    PRINT N'[OK] Đã thêm cột TongSoLuongChuyen vào bảng PhieuChuyenKho.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PhieuChuyenKho') AND name = 'TongSoLuongNhan')
BEGIN
    ALTER TABLE [dbo].[PhieuChuyenKho] ADD [TongSoLuongNhan] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_PhieuChuyenKho_TongSoLuongNhan] DEFAULT 0;
    PRINT N'[OK] Đã thêm cột TongSoLuongNhan vào bảng PhieuChuyenKho.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PhieuChuyenKho') AND name = 'TongGiaTriChuyen')
BEGIN
    ALTER TABLE [dbo].[PhieuChuyenKho] ADD [TongGiaTriChuyen] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_PhieuChuyenKho_TongGiaTriChuyen] DEFAULT 0;
    PRINT N'[OK] Đã thêm cột TongGiaTriChuyen vào bảng PhieuChuyenKho.';
END
GO

-- 2. Bổ sung các cột mới vào bảng ChiTietPhieuChuyenKho
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ChiTietPhieuChuyenKho') AND name = 'SoLuongNhan')
BEGIN
    ALTER TABLE [dbo].[ChiTietPhieuChuyenKho] ADD [SoLuongNhan] DECIMAL(18,2) NULL;
    PRINT N'[OK] Đã thêm cột SoLuongNhan vào bảng ChiTietPhieuChuyenKho.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ChiTietPhieuChuyenKho') AND name = 'DonGiaChuyen')
BEGIN
    ALTER TABLE [dbo].[ChiTietPhieuChuyenKho] ADD [DonGiaChuyen] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_ChiTietPhieuChuyenKho_DonGiaChuyen] DEFAULT 0;
    PRINT N'[OK] Đã thêm cột DonGiaChuyen vào bảng ChiTietPhieuChuyenKho.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ChiTietPhieuChuyenKho') AND name = 'ThanhTien')
BEGIN
    ALTER TABLE [dbo].[ChiTietPhieuChuyenKho] ADD [ThanhTien] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_ChiTietPhieuChuyenKho_ThanhTien] DEFAULT 0;
    PRINT N'[OK] Đã thêm cột ThanhTien vào bảng ChiTietPhieuChuyenKho.';
END
GO

-- 3. Cập nhật dữ liệu cũ
UPDATE [dbo].[PhieuChuyenKho]
SET [MaPhieu] = 'CK' + RIGHT('000000' + CAST(MaPhieuChuyen AS VARCHAR(10)), 6)
WHERE [MaPhieu] IS NULL;
GO

UPDATE ct
SET ct.DonGiaChuyen = ISNULL(h.GiaVon, 0),
    ct.ThanhTien = ct.SoLuong * ISNULL(h.GiaVon, 0),
    ct.SoLuongNhan = CASE WHEN pc.TrangThai = 'DA_NHAN' THEN ct.SoLuong ELSE NULL END
FROM [dbo].[ChiTietPhieuChuyenKho] ct
JOIN [dbo].[HangHoa] h ON h.MaHang = ct.MaHang
JOIN [dbo].[PhieuChuyenKho] pc ON pc.MaPhieuChuyen = ct.MaPhieuChuyen
WHERE ct.DonGiaChuyen = 0 AND ct.ThanhTien = 0;
GO

UPDATE pc
SET pc.TongSoLuongChuyen = ISNULL(t.TongSL, 0),
    pc.TongSoLuongNhan = CASE WHEN pc.TrangThai = 'DA_NHAN' THEN ISNULL(t.TongSL, 0) ELSE 0 END,
    pc.TongGiaTriChuyen = ISNULL(t.TongTien, 0)
FROM [dbo].[PhieuChuyenKho] pc
LEFT JOIN (
    SELECT MaPhieuChuyen, SUM(SoLuong) AS TongSL, SUM(ThanhTien) AS TongTien
    FROM [dbo].[ChiTietPhieuChuyenKho]
    GROUP BY MaPhieuChuyen
) t ON t.MaPhieuChuyen = pc.MaPhieuChuyen
WHERE pc.TongSoLuongChuyen = 0 AND pc.TongGiaTriChuyen = 0;
GO

-- 4. Tạo Unique Index cho MaPhieu
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_PhieuChuyen_MaPhieu' AND object_id = OBJECT_ID('dbo.PhieuChuyenKho'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UQ_PhieuChuyen_MaPhieu] 
    ON [dbo].[PhieuChuyenKho]([MaPhieu]) 
    WHERE [MaPhieu] IS NOT NULL;
    PRINT N'[OK] Đã tạo Unique Index UQ_PhieuChuyen_MaPhieu.';
END
GO

-- 5. Cập nhật View vw_BienDongKho
CREATE OR ALTER VIEW [dbo].[vw_BienDongKho]
AS
-- 1. Nhập kho đã xác nhận (Tăng tồn)
SELECT CAST(ISNULL(pn.NgayXacNhan, pn.NgayLap) AS DATETIME) AS NgayGiaoDich,
       pn.MaKho,
       ct.MaHang,
       CAST('PHIEU_NHAP' AS VARCHAR(30)) AS LoaiChungTu,
       pn.MaPhieuNhap AS MaChungTu,
       ct.SoLuong AS SoLuongTang,
       CAST(0 AS DECIMAL(18,2)) AS SoLuongGiam
FROM PhieuNhap pn
JOIN ChiTietPhieuNhap ct ON ct.MaPhieuNhap = pn.MaPhieuNhap
WHERE pn.TrangThai = 'DA_XAC_NHAN'

UNION ALL
-- 2. Xuất kho đã xác nhận (Giảm tồn)
SELECT CAST(ISNULL(px.NgayXacNhan, px.NgayLap) AS DATETIME) AS NgayGiaoDich,
       px.MaKho,
       ctpx.MaHang,
       CAST(px.LoaiPhieuXuat AS VARCHAR(30)) AS LoaiChungTu,
       px.MaPhieuXuat AS MaChungTu,
       CAST(0 AS DECIMAL(18,2)) AS SoLuongTang,
       ctpx.SoLuongXuat AS SoLuongGiam
FROM PhieuXuat px
JOIN ChiTietPhieuXuat ctpx ON ctpx.MaPhieuXuat = px.MaPhieuXuat
WHERE px.TrangThai = 'DA_XAC_NHAN'

UNION ALL
-- 3. Chuyển kho đã xuất / đã nhận: Trừ tồn kho nguồn
SELECT CAST(ISNULL(pc.ThoiDiemXuat, pc.NgayLap) AS DATETIME) AS NgayGiaoDich,
       pc.MaKhoNguon AS MaKho,
       ct.MaHang,
       CAST('CHUYEN_XUAT' AS VARCHAR(30)) AS LoaiChungTu,
       pc.MaPhieuChuyen AS MaChungTu,
       CAST(0 AS DECIMAL(18,2)) AS SoLuongTang,
       ct.SoLuong AS SoLuongGiam
FROM PhieuChuyenKho pc
JOIN ChiTietPhieuChuyenKho ct ON ct.MaPhieuChuyen = pc.MaPhieuChuyen
WHERE pc.TrangThai IN ('DA_XUAT', 'DA_NHAN')

UNION ALL
-- 4. Chuyển kho đã nhận: Cộng tồn kho đích (Cộng theo số lượng thực nhận, xử lý nhận thiếu/thất thoát)
SELECT CAST(ISNULL(pc.ThoiDiemNhan, ISNULL(pc.ThoiDiemXuat, pc.NgayLap)) AS DATETIME) AS NgayGiaoDich,
       pc.MaKhoDich AS MaKho,
       ct.MaHang,
       CAST('CHUYEN_NHAP' AS VARCHAR(30)) AS LoaiChungTu,
       pc.MaPhieuChuyen AS MaChungTu,
       CAST(ISNULL(ct.SoLuongNhan, ct.SoLuong) AS DECIMAL(18,2)) AS SoLuongTang,
       CAST(0 AS DECIMAL(18,2)) AS SoLuongGiam
FROM PhieuChuyenKho pc
JOIN ChiTietPhieuChuyenKho ct ON ct.MaPhieuChuyen = pc.MaPhieuChuyen
WHERE pc.TrangThai = 'DA_NHAN'

UNION ALL
-- 5. Cân bằng kiểm kê: Tăng hoặc giảm theo số lượng điều chỉnh
SELECT CAST(ISNULL(pdc.NgayDuyet, pdc.NgayLap) AS DATETIME) AS NgayGiaoDich,
       pkk.MaKho,
       ctpkk.MaHang,
       CAST('KIEM_KE' AS VARCHAR(30)) AS LoaiChungTu,
       pkk.MaPhieuKiemKe AS MaChungTu,
       CASE WHEN ctpdc.SoLuongDieuChinh > 0 THEN ctpdc.SoLuongDieuChinh ELSE CAST(0 AS DECIMAL(18,2)) END AS SoLuongTang,
       CASE WHEN ctpdc.SoLuongDieuChinh < 0 THEN -ctpdc.SoLuongDieuChinh ELSE CAST(0 AS DECIMAL(18,2)) END AS SoLuongGiam
FROM PhieuDieuChinh pdc
JOIN PhieuKiemKe pkk ON pkk.MaPhieuKiemKe = pdc.MaPhieuKiemKe
JOIN ChiTietPhieuDieuChinh ctpdc ON ctpdc.MaPhieuDieuChinh = pdc.MaPhieuDieuChinh
JOIN ChiTietPhieuKiemKe ctpkk ON ctpkk.MaCTKiemKe = ctpdc.MaCTKiemKe
WHERE pdc.TrangThai = 'DA_DUYET';
GO

PRINT N'[OK] Migration 13 hoàn tất thành công.';
GO
