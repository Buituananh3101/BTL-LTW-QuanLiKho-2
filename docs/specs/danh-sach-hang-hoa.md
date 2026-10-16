# Đặc tả Chức năng: Quản lý Hàng hóa (Product Catalog)

> **Mục tiêu**: **Khuôn mẫu chuẩn cho toàn bộ màn hình Danh mục (CRUD)** trong hệ thống. Lọc sidebar, phân trang AJAX, modal JSON, bảo toàn dữ liệu, nhập/xuất Excel chuẩn KiotViet.

---

## 1. Kiến trúc File & Bảng CSDL liên quan

### 1.1. Bản đồ File liên quan (File Map)
- **Controller**: `Controllers/HangHoaController.cs` (`Index`, lọc AJAX `Filter`, `Create`, `Edit`, `GetItem`, `ToggleFavorite`, `Delete`, `NgungBan`, `GetImage`, `CreateDvtQuick`, `UpdateThuocTinh`, `DownloadTemplate`, `ExportExcel`, `ImportExcel`).
- **ViewModel**: `ViewModels/HangHoa/` (`HangHoaForm.cs`, `QuickGroupRequest.cs`, `QuickDvtRequest.cs`, `ExportHangHoaRequest.cs`, `ImportHangHoaResult.cs`).
- **View & Modal**: `Views/HangHoa/Index.cshtml`, `_HangHoaModal.cshtml` (form thêm/sửa 5 ảnh CSDL), `_HangHoaExportModal.cshtml` (chọn cột xuất Excel), `_HangHoaImportModal.cshtml` (nhập Excel kéo thả).
- **Styles & Scripts**: `wwwroot/css/` (`hang-hoa-form.css`, `hang-hoa-excel.css`, `site.css`), `wwwroot/js/` (`hang-hoa-form.js`, `hang-hoa-excel.js`).
- **Bảng dữ liệu**: `Views/HangHoa/_HangHoaTable.cshtml` (Bảng danh sách, accordion chi tiết, sắp xếp 3 trạng thái).
- **Service & Helper**: `Services/ITonKhoService.cs`, `TonKhoService.cs`, `MaChungTuHelper.cs`.
- **DbContext & Entity**: `QuanLyKhoPhuQuocLtwContext`, Entity (`HangHoa`, `HinhAnhHangHoa`, `NhomHang`, `DonViTinh`, `NguongTonKho`, `VwTonKhoHienTai`).

### 1.2. Bảng CSDL tham gia:
- `HangHoa`: `MaHang`, `MaHangNoiBo`, `TenHang`, `MaNhom`, `MaDvt`, `QuyCach`, `GiaBanThamKhao`, `GiaVon`, `HinhAnh`, `TrangThai`, `NgayTao`, `DaDanhDau`, `ViTri`, `TrongLuong`, `DonViTrongLuong`, `ThuocTinh`, `MoTa`.
- `HinhAnhHangHoa`: `MaHinhAnh`, `MaHang`, `DuLieuAnh` (VARBINARY MAX), `ThuTu`, `LaAnhChinh`, `NgayTao` (tối đa 5 ảnh).
- `NhomHang`, `DonViTinh`: Phân loại và ĐVT (tự sinh nếu nhập file có tên mới).
- `NguongTonKho`: Định mức tồn theo kho (`MaHang`, `MaKho`, `TonToiThieu`, `TonCaoNhat`).
- `vw_TonKhoHienTai`: View tính tồn kho động hiện thời theo `(MaKho, MaHang)`.

---

## 2. Bảng Luồng Tương tác Chi tiết (4 Bước)

| Tên Luồng | 1. Tương tác | 2. Frontend (View / JS) | 3. Backend (Controller) | 4. CSDL & Phản hồi |
|---|---|---|---|---|
| **Load ban đầu** | Vào `/HangHoa` | Gửi GET `/HangHoa` | `Index()` nạp danh mục, kho | Nạp VM ➜ Render `Index.cshtml` |
| **Tìm kiếm & Lọc** | Gõ tìm / Chọn lọc / Đánh dấu sao | JS debounce 300ms ➜ AJAX `GET /HangHoa/Filter` | `Filter(...)` query kết hợp `vw_TonKhoHienTai` | Render `_HangHoaTable.cshtml` (AJAX) |
| **Phân trang** | Click trang | JS gán `pageIndex` ➜ AJAX `GET /HangHoa/Filter` | `Filter(...)` dùng `.Skip().Take()` | Cập nhật bảng và thanh phân trang |
| **Thêm mới hàng** | "+ Thêm mới", nhập form, "Lưu" | JS gom form + Base64 ➜ `POST /HangHoa/Create` | `Create(...)` validate, tự sinh mã hàng | Lưu `HangHoa`, `NguongTonKho`, `PhieuNhap` đầu kỳ ➜ JSON `{success:true}` |
| **Mở form Sửa** | Click Chỉnh sửa | JS AJAX `GET /HangHoa/GetItem?id=X` | `GetItem(id)` đọc thông tin hàng & tồn | Trả JSON ➜ điền form modal sửa |
| **Lưu Sửa hàng** | Sửa form, "Cập nhật" | JS gom form ➜ AJAX `POST /HangHoa/Edit?id=X` | `Edit(id, form)` validate & cập nhật | Cập nhật `HangHoa`, `NguongTonKho` ➜ JSON `{success:true}` |
| **Xóa hàng** | Click Xóa ➜ Xác nhận | Mở `#hhDeleteProductOv` ➜ AJAX `POST /HangHoa/Delete/{id}` | `Delete(id)` check 5 bảng GD, bọc Transaction xóa cascade ảnh & ngưỡng | Chưa có GD: Xóa thành công. Đã có GD: Trả `hasTransaction: true` kèm nút Ngừng bán |
| **Xuất file Excel** | Bấm "Xuất file" ➜ Chọn cột ➜ Bấm Xuất | Mở `#hhExportModalOv`, chọn cột ➜ `POST /HangHoa/ExportExcel` | ClosedXML lọc theo bộ lọc/hàng chọn, xuất đúng cột chọn | Trả file `Danh_Sach_Hang_Hoa_yyyyMMdd_HHmmss.xlsx` |
| **Nhập file Excel** | Kéo thả file ➜ Bấm Thực hiện nhập | Mở `#hhImportModalOv`, FormData ➜ `POST /HangHoa/ImportExcel` | Validate cột bắt buộc `TenHang`, parse 16 trường, xử lý trùng mã, tạo PN đầu kỳ nếu có tồn ban đầu | Commit Transaction ➜ Trả JSON tổng kết & lỗi chi tiết ➜ reload bảng |

---

## 3. Quy chuẩn Giao diện & Bộ lọc

### 3.1. Cột lọc bên trái (Sidebar Filter):
1. **Nhóm hàng**: Multi-select Tag Dropdown + ô tìm kiếm dính đỉnh + tạo nhanh.
2. **Tồn kho**: Custom Single Select KiotViet (Tất cả / Còn hàng / Hết hàng / Dưới định mức ⚠️).
3. **Dự kiến hết hàng**: Hôm nay, 3 ngày tới, 7 ngày tới, Trong tháng, > 30 ngày.
4. **Nhà cung cấp**: Multi-select tag dropdown theo NCC đã từng nhập.
5. **Loại hàng**: Hàng hóa / Dịch vụ / Combo đóng gói.
6. **Vị trí**: Dropdown đa chọn kèm ô tìm kiếm nhanh `.kiot-ms-search`.
7. **Thời gian tạo**: Hôm nay, Hôm qua, 7 ngày, 30 ngày hoặc tùy chọn ngày (Dual Calendar).

### 3.2. Sắp xếp 3 trạng thái (3-State Column Sorting):
Click header: Lần 1 Tăng dần (ASC `bi-arrow-up`) ➜ Lần 2 Giảm dần (DESC `bi-arrow-down`) ➜ Lần 3 Mặc định (Default, không hiện icon). Áp dụng cho 8 cột chính. Cột căn trái dùng inline-flex trong ô chống tràn viền (Dự kiến hết hàng 160px), cột số dùng padding-right 22px cố định vị trí icon không làm dịch chuyển chữ.

### 3.3. Tùy chọn Cột & Độ rộng Cố định (Fixed Columns & Horizontal Scroll):
Nút `bi-grid-3x2-gap` mở popup 11 cột đồng bộ 100% với các trường dữ liệu của file xuất (Loại hàng, Nhóm hàng, Mã hàng, Tên hàng, Giá bán, Giá vốn, Tồn kho, Tồn nhỏ nhất, Tồn lớn nhất, Vị trí, Trạng thái). Dùng Dynamic CSS tức thì (0ms, không flicker), lưu vào `localStorage`. Toàn bộ cột được cố định chiều rộng (`table-layout: fixed; width: max-content; min-width: 100%;`), khi bật nhiều cột vượt màn hình sẽ xuất hiện thanh cuộn ngang mượt mà, không co ép méo mó cột.

---

## 4. Các Quy tắc Nghiệp vụ Bất biến

1. **BẢO TOÀN DỮ LIỆU & RÀNG BUỘC CHỨNG TỪ**: Kiểm tra cả 5 bảng: `ChiTietDonBan`, `ChiTietPhieuNhap`, `ChiTietPhieuXuat`, `ChiTietPhieuChuyenKho`, `ChiTietPhieuKiemKe`. Có giao dịch: chặn xóa, gợi ý chuyển `NGUNG_BAN`. Chưa có: xóa cascade ảnh và ngưỡng tồn trong Transaction.
2. **QUY CHUẨN XUẤT NHẬP EXCEL ĐỒNG BỘ 16 TRƯỜNG**:
   - 16 trường quản lý chuẩn: Loại hàng, Nhóm hàng, Mã hàng, Tên hàng (*), Giá bán, Giá vốn, Tồn kho, Tồn nhỏ nhất, Tồn lớn nhất, Đơn vị tính, Thuộc tính, Trọng lượng, Đơn vị TL, Vị trí, Mô tả, Trạng thái.
   - Khi xuất file, người bán được chọn cột muốn xuất. Có cảnh báo: Nếu bỏ chọn các cột thiết yếu (Tên hàng, Mã hàng, Loại hàng, ĐVT) thì file xuất ra KHÔNG THỂ làm file nhập ngược lại.
   - Khi nhập file, bắt buộc phải có cột "Tên hàng (*)". Xử lý trùng mã theo 3 chế độ: Cập nhật (ghi đè), Bỏ qua dòng trùng, Báo lỗi và dừng. Tự động sinh phiếu nhập `DAU_KY` nếu có tồn kho ban đầu.
3. **Mã nội bộ & Retry**: Mã `HH` + 6 số tự tăng (`HH000001`), Unique, retry chống Race Condition.
4. **Tồn kho theo kho làm việc**: Đọc động từ `vw_TonKhoHienTai` theo `CurrentWarehouseId`.
5. **Tối ưu RAM ảnh**: Không `SELECT HinhAnh` ở danh sách. Dùng LINQ Projection `HasImage`.
