-- =========================================================================================
-- FILE CẬP NHẬT CƠ SỞ DỮ LIỆU: migrations/sql/03_add_dongia_chitietkiemke.sql
-- Dự án: Quản lý kho hàng nhiều kho (QuanLyKhoPhuQuocLTW)
-- Giải quyết: [ISSUE-07] Bổ sung DonGia vào ChiTietPhieuKiemKe để lưu đơn giá chốt lúc kiểm
-- Tuân thủ: 3 Nguyên tắc vàng trong .agent/rules/05-co-so-du-lieu.md ("Chỉ cộng, không phá")
-- =========================================================================================

USE QuanLyKhoPhuQuocLTW;
GO

PRINT N'=== BẮT ĐẦU NÂNG CẤP SCHEMA: BỔ SUNG DONGIA VÀO CHITIETPHIEUKIEMKE ===';
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'ChiTietPhieuKiemKe') AND name = N'DonGia')
BEGIN
    ALTER TABLE ChiTietPhieuKiemKe ADD DonGia DECIMAL(18, 2) NOT NULL CONSTRAINT DF_CTPKK_DonGia DEFAULT (0);
    PRINT N'[OK] Đã thêm cột DonGia vào bảng ChiTietPhieuKiemKe (DEFAULT 0).';
END
ELSE
BEGIN
    PRINT N'[SKIP] Cột DonGia đã tồn tại trong bảng ChiTietPhieuKiemKe.';
END
GO

-- Đồng bộ đơn giá chốt cho các dòng kiểm kê lịch sử từ GiaVon (hoặc GiaBanThamKhao)
UPDATE ctpkk
SET ctpkk.DonGia = ISNULL(NULLIF(h.GiaVon, 0), h.GiaBanThamKhao)
FROM ChiTietPhieuKiemKe ctpkk
JOIN HangHoa h ON h.MaHang = ctpkk.MaHang
WHERE ctpkk.DonGia = 0;
GO

PRINT N'[OK] Đã đồng bộ giá trị DonGia cho các dòng kiểm kê hiện có.';
GO
