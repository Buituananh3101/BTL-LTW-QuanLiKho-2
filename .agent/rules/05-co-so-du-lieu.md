# 05. Cơ sở dữ liệu & Quy tắc nâng cấp Schema

## 1. Môi trường CSDL & EF Core

- **Hệ quản trị CSDL**: Microsoft SQL Server.
- **Tên CSDL**: `QuanLyKhoPhuQuocLTW`.
- **DbContext**: [`QuanLyKhoPhuQuocLtwContext`](../../BTL-LTW-QuanLiKho-2/Models/QuanLyKhoPhuQuocLtwContext.cs) (kế thừa `DbContext`).
- **Chuỗi kết nối**: Khai báo trong [`appsettings.json`](../../BTL-LTW-QuanLiKho-2/appsettings.json):
  ```json
  "ConnectionStrings": {
    "QuanLyKhoPhuQuocLtwContext": "Server=.\\SQLEXPRESS;Database=QuanLyKhoPhuQuocLTW;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
  }
  ```

---

## 2. 3 "Nguyên tắc vàng" khi AI sửa & nâng cấp CSDL

Khi hệ thống cần thêm tính năng mới dẫn đến thay đổi CSDL, AI **bắt buộc tuân thủ 3 nguyên tắc sau**:

### 🌟 Nguyên tắc 1: "Chỉ cộng, không phá" (Additive only)
- Chỉ được phép **thêm bảng mới** (`CREATE TABLE`) hoặc **thêm cột mới** (`ALTER TABLE ADD ... NULL / DEFAULT`).
- **Tuyệt đối KHÔNG** xóa bảng (`DROP TABLE`), không xóa cột (`DROP COLUMN`) và không đổi tên cột cũ đang có dữ liệu để tránh làm hỏng dữ liệu mẫu và các truy vấn hiện hữu.

### 🌟 Nguyên tắc 2: "Đồng bộ tức thì & Quản lý Script có version" (Synchronous versioned script)
- Hệ thống áp dụng mô hình **Database First có kiểm soát**. Toàn bộ script DDL được quản lý tập trung và đánh số theo phiên bản trong thư mục `migrations/sql/`:
  - `01_init_schema.sql`: Script khởi tạo schema nền tảng của hệ thống.
  - `02_update_schema.sql`: Script cập nhật đợt 1 (GiaVon, PhieuXuat, TaiKhoan_Kho, DaDanhDau, View 2 tầng).
  - `03_...sql`: Các lần nâng cấp tiếp theo được đánh số liên tục.
- Mỗi khi bổ sung thuộc tính trong C# Model hoặc cấu hình trong `QuanLyKhoPhuQuocLtwContext.cs`, AI **bắt buộc phải xuất ra câu lệnh SQL tương ứng** vào file migration đánh số mới trong `migrations/sql/` và đồng bộ vào `docs/database_update.sql`. Người dùng chỉ cần chạy script trong SSMS là CSDL đồng bộ 100% với Code.

### 🌟 Nguyên tắc 3: "Báo cáo trước khi chạm CSDL"
- Trước khi thêm cột hoặc bảng mới, AI phải giải thích rõ ràng trong phiên:
  - Cần thêm bảng/cột gì?
  - Lý do nghiệp vụ tại sao cần thêm?
  - Ảnh hưởng thế nào đến các bảng và View cũ?
- Chờ người dùng đồng ý mới tiến hành sửa code model.

---

## 3. Cấu hình Fluent API trong `OnModelCreating`

Toàn bộ ràng buộc nâng cao được cấu hình tập trung trong `OnModelCreating` của DbContext:

1. **Khóa chính & Bảng**:
   ```csharp
   entity.ToTable("HangHoa");
   entity.HasKey(e => e.MaHang);
   ```
2. **Khóa kép (Bảng phân quyền `TaiKhoanKho`)**:
   ```csharp
   entity.ToTable("TaiKhoanKho");
   entity.HasKey(e => new { e.MaTaiKhoan, e.MaKho });
   ```
3. **Chỉ mục duy nhất (Unique Index)**:
   ```csharp
   entity.HasIndex(e => e.MaHangNoiBo, "UQ_HangHoa_MaHangNoiBo").IsUnique();
   entity.HasIndex(e => new { e.MaPhieuChuyen, e.MaHang }, "UQ_CTPCK_Phieu_Hang").IsUnique();
   ```
4. **Kiểu dữ liệu tiền tệ & số lượng**:
   - Tiền và số lượng luôn dùng kiểu `decimal(18, 2)`:
   ```csharp
   entity.Property(e => e.GiaBanThamKhao).HasColumnType("decimal(18, 2)");
   entity.Property(e => e.SoLuong).HasColumnType("decimal(18, 2)");
   ```
5. **View không khóa (`HasNoKey`)**:
   ```csharp
   modelBuilder.Entity<VwTonKhoHienTai>(entity =>
   {
       entity.HasNoKey().ToView("vw_TonKhoHienTai");
       entity.Property(e => e.SoLuongTon).HasColumnType("decimal(18, 2)");
   });
   ```

---

## 4. Quy ước đặt tên trong CSDL (Khớp SQL Server)

- **Tên bảng**: Danh từ số ít, PascalCase tiếng Việt không dấu (`HangHoa`, `Kho`, `PhieuNhap`, `ChiTietPhieuNhap`).
- **Khóa chính**: `Ma<TênBảng>` (ví dụ: `MaHang`, `MaKho`, `MaPhieuKiemKe`).
- **Khóa ngoại**: Trùng tên với khóa chính của bảng tham chiếu (ví dụ: `ChiTietPhieuNhap.MaHang` tham chiếu `HangHoa.MaHang`).
- **Quy ước tiền tố Constraint**:
  - Khóa chính: `PK_<TênBảng>`
  - Khóa ngoại: `FK_<BảngCon>_<BảngCha>` (ví dụ: `FK_CTPN_PhieuNhap`)
  - Duy nhất: `UQ_<TênBảng>_<TênCột>` (ví dụ: `UQ_HangHoa_MaHangNoiBo`)
  - Giá trị mặc định: `DF_<TênBảng>_<TênCột>` (ví dụ: `DF_Kho_TrangThai`)
  - Kiểm tra điều kiện: `CK_<TênBảng>_<TênCột>` (ví dụ: `CK_Kho_TrangThai`)
