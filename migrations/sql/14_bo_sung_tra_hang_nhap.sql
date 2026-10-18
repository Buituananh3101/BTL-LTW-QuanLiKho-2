-- =========================================================================================
-- MIGRATION 14: BỔ SUNG PHÂN HỆ TRẢ HÀNG NHẬP (PURCHASE RETURNS)
-- =========================================================================================
-- 1. Tạo bảng PhieuTraHangNhap
-- 2. Tạo bảng ChiTietPhieuTraHangNhap
-- 3. Tạo chỉ mục Unique cho MaPhieu
-- 4. Cập nhật View vw_BienDongKho (giảm tồn kho khi trạng thái DA_TRA_HANG)
-- =========================================================================================

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Tạo bảng PhieuTraHangNhap nếu chưa tồn tại
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'PhieuTraHangNhap')
BEGIN
    CREATE TABLE [dbo].[PhieuTraHangNhap] (
        [MaPhieuTraHang] INT IDENTITY(1,1) NOT NULL,
        [MaPhieu] VARCHAR(30) NULL,
        [MaKho] INT NOT NULL,
        [MaDonViCapHang] INT NULL,
        [MaNvlap] INT NOT NULL,
        [MaNvtra] INT NULL,
        [NgayLap] DATETIME NOT NULL CONSTRAINT [DF_PhieuTraHangNhap_NgayLap] DEFAULT GETDATE(),
        [NgayTra] DATETIME NOT NULL CONSTRAINT [DF_PhieuTraHangNhap_NgayTra] DEFAULT GETDATE(),
        [TrangThai] VARCHAR(20) NOT NULL CONSTRAINT [DF_PhieuTraHangNhap_TrangThai] DEFAULT 'NHAP',
        [TongSoLuong] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_PhieuTraHangNhap_TongSoLuong] DEFAULT 0,
        [TongTienHang] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_PhieuTraHangNhap_TongTienHang] DEFAULT 0,
        [GiamGia] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_PhieuTraHangNhap_GiamGia] DEFAULT 0,
        [CanThuNcc] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_PhieuTraHangNhap_CanThuNcc] DEFAULT 0,
        [DaThuNcc] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_PhieuTraHangNhap_DaThuNcc] DEFAULT 0,
        [GhiChu] NVARCHAR(500) NULL,
        [DaDanhDau] BIT NOT NULL CONSTRAINT [DF_PhieuTraHangNhap_DaDanhDau] DEFAULT 0,

        CONSTRAINT [PK_PhieuTraHangNhap] PRIMARY KEY CLUSTERED ([MaPhieuTraHang] ASC),
        CONSTRAINT [CK_PhieuTraHangNhap_TrangThai] CHECK ([TrangThai] IN ('NHAP', 'DA_TRA_HANG', 'HUY')),
        CONSTRAINT [FK_PhieuTraHangNhap_Kho] FOREIGN KEY ([MaKho]) REFERENCES [dbo].[Kho]([MaKho]),
        CONSTRAINT [FK_PhieuTraHangNhap_DonViCapHang] FOREIGN KEY ([MaDonViCapHang]) REFERENCES [dbo].[DonViCapHang]([MaDonViCapHang]),
        CONSTRAINT [FK_PhieuTraHangNhap_NhanVienLap] FOREIGN KEY ([MaNvlap]) REFERENCES [dbo].[NhanVien]([MaNV]),
        CONSTRAINT [FK_PhieuTraHangNhap_NhanVienTra] FOREIGN KEY ([MaNvtra]) REFERENCES [dbo].[NhanVien]([MaNV])
    );
    PRINT N'[OK] Đã tạo bảng PhieuTraHangNhap.';
END
GO

-- 2. Tạo bảng ChiTietPhieuTraHangNhap nếu chưa tồn tại
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ChiTietPhieuTraHangNhap')
BEGIN
    CREATE TABLE [dbo].[ChiTietPhieuTraHangNhap] (
        [MaCtphieuTra] INT IDENTITY(1,1) NOT NULL,
        [MaPhieuTraHang] INT NOT NULL,
        [MaHang] INT NOT NULL,
        [SoLuong] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_ChiTietPhieuTraHangNhap_SoLuong] DEFAULT 0,
        [GiaVon] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_ChiTietPhieuTraHangNhap_GiaVon] DEFAULT 0,
        [DonGiaTra] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_ChiTietPhieuTraHangNhap_DonGiaTra] DEFAULT 0,
        [ThanhTien] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_ChiTietPhieuTraHangNhap_ThanhTien] DEFAULT 0,
        [GhiChu] NVARCHAR(255) NULL,

        CONSTRAINT [PK_ChiTietPhieuTraHangNhap] PRIMARY KEY CLUSTERED ([MaCtphieuTra] ASC),
        CONSTRAINT [FK_ChiTietPhieuTra_PhieuTra] FOREIGN KEY ([MaPhieuTraHang]) REFERENCES [dbo].[PhieuTraHangNhap]([MaPhieuTraHang]) ON DELETE CASCADE,
        CONSTRAINT [FK_ChiTietPhieuTra_HangHoa] FOREIGN KEY ([MaHang]) REFERENCES [dbo].[HangHoa]([MaHang])
    );
    PRINT N'[OK] Đã tạo bảng ChiTietPhieuTraHangNhap.';
END
GO

-- 3. Tạo Unique Index cho MaPhieu
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_PhieuTraHangNhap_MaPhieu' AND object_id = OBJECT_ID('dbo.PhieuTraHangNhap'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UQ_PhieuTraHangNhap_MaPhieu] 
    ON [dbo].[PhieuTraHangNhap]([MaPhieu]) 
    WHERE [MaPhieu] IS NOT NULL;
    PRINT N'[OK] Đã tạo Unique Index UQ_PhieuTraHangNhap_MaPhieu.';
END
GO

-- 4. Cập nhật View vw_BienDongKho
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
WHERE pdc.TrangThai = 'DA_DUYET'

UNION ALL
-- 6. Trả hàng nhập đã hoàn thành: Giảm tồn kho tại MaKho
SELECT CAST(ISNULL(pt.NgayTra, pt.NgayLap) AS DATETIME) AS NgayGiaoDich,
       pt.MaKho,
       ctpt.MaHang,
       CAST('TRA_HANG_NHAP' AS VARCHAR(30)) AS LoaiChungTu,
       pt.MaPhieuTraHang AS MaChungTu,
       CAST(0 AS DECIMAL(18,2)) AS SoLuongTang,
       ctpt.SoLuong AS SoLuongGiam
FROM PhieuTraHangNhap pt
JOIN ChiTietPhieuTraHangNhap ctpt ON ctpt.MaPhieuTraHang = pt.MaPhieuTraHang
WHERE pt.TrangThai = 'DA_TRA_HANG';
GO

PRINT N'[OK] Migration 14 hoàn tất thành công.';
GO
