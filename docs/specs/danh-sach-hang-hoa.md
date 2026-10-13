# Đặc tả Chức năng: Quản lý Hàng hóa (Product Catalog)

> **Mục tiêu**: Đây là **khuôn mẫu chuẩn cho toàn bộ các màn hình Danh mục (CRUD)** trong hệ thống (Quản lý Kho, Nhà cung cấp, Khách hàng, Nhóm hàng). Mọi màn hình danh mục làm sau đều tuân theo kiến trúc bộ lọc sidebar, phân trang AJAX, modal thêm/sửa JSON, và cơ chế bảo toàn dữ liệu của module này.

---

## 1. Kiến trúc File & Bảng CSDL liên quan

### 1.1. Bản đồ File liên quan (File Map)
Khi cần sửa đổi chức năng này, mở chính xác các file sau:
- **Controller chính**: `Controllers/HangHoaController.cs` (Xử lý `Index`, lọc AJAX `Filter`, thêm `Create`, sửa `Edit`, lấy chi tiết `GetItem`, đổi sao `ToggleFavorite`, xóa `Delete`, ảnh `GetImage`).
- **ViewModel**: `ViewModels/HangHoa/HangHoaForm.cs` (Chứa `HangHoaIndexVM`, `HangHoaItemVM`, `HangHoaForm`).
- **Giao diện khung & JS**: `Views/HangHoa/Index.cshtml` (Search bar, 7 khối lọc sidebar, modal thêm/sửa, toàn bộ logic JS gom tham số và gọi AJAX).
- **Bảng dữ liệu AJAX**: `Views/HangHoa/_HangHoaTable.cshtml` (Partial View bảng sản phẩm, badge trạng thái, icon sao, phân trang AJAX).
- **Service tồn kho**: `Services/ITonKhoService.cs`, `Services/TonKhoService.cs` (Kiểm tra và tính toán tồn kho).
- **DbContext & Entity**: `Models/QuanLyKhoPhuQuocLtwContext.cs`, các Model trong `Models/` (`HangHoa.cs`, `NhomHang.cs`, `DonViTinh.cs`, `NguongTonKho.cs`, `VwTonKhoHienTai.cs`).

### 1.2. Bảng CSDL tham gia:
- `HangHoa`: Bảng thực thể chính (`MaHang`, `MaHangNoiBo`, `TenHang`, `MaNhom`, `MaDvt`, `QuyCach`, `GiaBanThamKhao`, `GiaVon`, `HinhAnh VARBINARY(MAX)`, `TrangThai: DANG_BAN / NGUNG_BAN`, `NgayTao`, `DaDanhDau`).
- `NhomHang`: Phân loại hàng hóa (`MaNhom`, `TenNhom`).
- `DonViTinh`: Đơn vị tính cơ bản (`MaDvt`, `TenDvt`). Áp dụng quy tắc **1 đơn vị tính cơ bản duy nhất**.
- `NguongTonKho`: Định mức tồn Min/Max theo từng kho (`MaNguong`, `MaHang`, `MaKho`, `TonToiThieu`, `TonToiDa`).
- `vw_TonKhoHienTai`: View tính tồn kho động hiện thời theo `(MaKho, MaHang)`.

---

## 2. Bảng Luồng Tương tác Chi tiết (4 Bước)

| Tên Luồng | 1. Tương tác Người dùng | 2. Frontend (View / JS) | 3. Backend (Controller / Action) | 4. CSDL & Dữ liệu phản hồi |
|---|---|---|---|---|
| **Load trang ban đầu** | Bấm menu Hàng hóa (`/HangHoa`) | Trình duyệt gửi GET `/HangHoa` | `HangHoaController.Index()` lấy danh mục, kho làm việc | Nạp dropdown & bảng trang 1 vào `HangHoaIndexVM` ➜ Render `Views/HangHoa/Index.cshtml` |
| **Tìm kiếm & Lọc** | Gõ ô tìm kiếm / Tích chọn lọc ở cột trái / Lọc sao | JS trong `Index.cshtml` bắt sự kiện (debounce 300ms), gom params ➜ AJAX `GET /HangHoa/Filter?...` | `HangHoaController.Filter(...)` nhận param, query LINQ kết hợp view `vw_TonKhoHienTai` | Render Partial `_HangHoaTable.cshtml` ➜ JS thay thế nội dung vùng `#contentTable` (không reload toàn trang) |
| **Phân trang AJAX** | Click số trang (2, 3...) hoặc nút Trước/Sau | JS bắt click `.page-link`, giữ nguyên bộ lọc, gán `pageIndex` ➜ gửi AJAX `GET /HangHoa/Filter` | `HangHoaController.Filter(...)` thực hiện `.Skip().Take()` theo trang | Trả về Partial `_HangHoaTable.cshtml` ➜ JS cập nhật bảng và thanh phân trang |
| **Thêm mới hàng** | Bấm "+ Thêm mới", điền form modal, bấm "Lưu" | JS gom form + ảnh Base64 ➜ AJAX `POST /HangHoa/Create` (`[FromBody] HangHoaForm`) | `HangHoaController.Create(...)` validate dữ liệu, tự sinh `MaHangNoiBo` (kèm retry 3 lần) | Lưu `HangHoa`, `NguongTonKho`. Nếu có tồn đầu kỳ thì tạo `PhieuNhap` ➜ Trả JSON `{ success: true }` ➜ JS đóng modal, gọi lại `Filter` |
| **Mở form Sửa** | Click icon bút chì trên dòng sản phẩm | JS lấy ID ➜ AJAX `GET /HangHoa/GetItem?id=X` | `HangHoaController.GetItem(id)` đọc thông tin hàng & ngưỡng tồn | Trả JSON chi tiết hàng hóa ➜ JS điền dữ liệu vào các ô input và mở modal sửa |
| **Lưu Sửa hàng** | Sửa thông tin trong modal, bấm "Cập nhật" | JS gom form ➜ AJAX `POST /HangHoa/Edit?id=X` | `HangHoaController.Edit(id, form)` kiểm tra và cập nhật | Cập nhật `HangHoa`, `NguongTonKho` ➜ Trả JSON `{ success: true }` ➜ JS đóng modal, reload bảng |
| **Đánh dấu sao** | Click icon ngôi sao trên dòng sản phẩm | JS bắt click ➜ AJAX `POST /HangHoa/ToggleFavorite?id=X` | `HangHoaController.ToggleFavorite(id)` đảo cờ `DaDanhDau` | Lưu DB ➜ Trả JSON `{ success: true, isFavorite, maHang }` ➜ JS toggle class vàng cho icon tức thì |
| **Xóa hàng hóa** | Click nút Xóa ➜ Xác nhận modal | JS gọi AJAX `POST /HangHoa/Delete?id=X` | `HangHoaController.Delete(id)` kiểm tra ràng buộc giao dịch | Nếu có giao dịch: trả lỗi từ chối. Nếu chưa: xóa DB ➜ Trả JSON `{ success: true }` ➜ reload bảng |
| **Hiển thị ảnh** | Bảng hiển thị thẻ `<img>` | Thẻ `<img>` gọi `src="/HangHoa/GetImage?id=X"` | `HangHoaController.GetImage(id)` đọc byte ảnh từ DB | Trả file ảnh (kèm cache trình duyệt) hoặc icon SVG mặc định. **Tuyệt đối không SELECT HinhAnh ở bảng** |

---

## 3. Quy chuẩn Giao diện & 7 Bộ lọc Sidebar

### 3.1. Cột lọc bên trái (Sidebar Filter):
1. **Nhóm hàng**: Radio/Checkbox danh sách nhóm + nút tạo nhanh nhóm.
2. **Tồn kho**: Tất cả / Còn hàng trong kho / Hết hàng trong kho / Dưới định mức tồn (⚠️).
3. **Dự kiến hết hàng**: Hôm nay, 3 ngày tới, 7 ngày tới, Trong tháng này, > 30 ngày.
4. **Nhà cung cấp**: Lọc hàng từng nhập từ nhà cung cấp tương ứng.
5. **Loại hàng**: Hàng hóa / Dịch vụ / Combo đóng gói.
6. **Vị trí**: Tìm theo chuỗi vị trí trong kho (`QuyCach`).
7. **Thời gian tạo**: Hôm nay, Tuần này, Tháng này, hoặc tùy chọn ngày.

### 3.2. Thanh công cụ trên (Action Bar):
- Ô tìm kiếm từ khóa (Tên, Mã nội bộ, Mã vạch).
- Nút lọc nhanh hàng Đánh dấu sao (`DaDanhDau`).
- Nút "+ Thêm mới" mở modal; nút Import/Export Excel.

---

## 4. Các Quy tắc Nghiệp vụ Bất biến

1. **QUY TẮC BẢO TOÀN DỮ LIỆU (CẤM XÓA KHI ĐÃ CÓ GIAO DỊCH)**:
   - Trước khi xóa (`POST /HangHoa/Delete`), hệ thống kiểm tra sự tồn tại trong các bảng:
     - `ChiTietDonBan`
     - `ChiTietPhieuNhap`
     - `ChiTietPhieuChuyenKho`
     - `ChiTietPhieuKiemKe`
   - **Nếu đã có ít nhất 1 chứng từ**: Chặn lại và trả lỗi: *"Hàng hóa này đã phát sinh giao dịch trong hệ thống, không thể xóa. Bạn có thể chuyển sang trạng thái 'Ngừng bán'."*
   - Chỉ cho phép xóa khi hàng hoàn toàn chưa phát sinh bất kỳ giao dịch nào.
2. **Quy tắc Mã nội bộ & Retry**: Mã định dạng `HH` + 6 số tự tăng (`HH000001`), bắt buộc Unique, có cơ chế retry tự động 3 lần chống Race Condition.
3. **Quy tắc Tồn kho theo kho làm việc**: Tồn kho sổ sách hiển thị trên bảng lấy động từ View `vw_TonKhoHienTai` theo `CurrentWarehouseId`. Đổi kho ở Header thì tồn kho tự động đổi theo.
4. **Quy tắc Tối ưu RAM ảnh**: Tuyệt đối không `SELECT HinhAnh` khi truy vấn danh sách (tránh nạp `VARBINARY(MAX)` vào RAM). Dùng LINQ Projection lấy `HasImage = x.HinhAnh != null`.
