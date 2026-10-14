# Đặc tả Chức năng: Quản lý Hàng hóa (Product Catalog)

> **Mục tiêu**: **Khuôn mẫu chuẩn cho toàn bộ màn hình Danh mục (CRUD)** trong hệ thống. Các màn hình danh mục tuân theo kiến trúc lọc sidebar, phân trang AJAX, modal JSON, và bảo toàn dữ liệu.

---

## 1. Kiến trúc File & Bảng CSDL liên quan

### 1.1. Bản đồ File liên quan (File Map)
- **Controller**: `Controllers/HangHoaController.cs` (`Index`, lọc AJAX `Filter`, `Create`, `Edit`, `GetItem`, `ToggleFavorite`, `Delete`, `GetImage`, `UpdateThuocTinh`).
- **ViewModel**: `ViewModels/HangHoa/HangHoaForm.cs` (`HangHoaIndexVM`, `HangHoaItemVM`, `HangHoaForm`, `ThuocTinhItemVM`, `CapNhatThuocTinhRequest`).
- **View & JS**: `Views/HangHoa/Index.cshtml` (Search bar, 7 khối lọc, modal thêm/sửa, `quickAttrModal`, logic JS AJAX).
- **Bảng dữ liệu**: `Views/HangHoa/_HangHoaTable.cshtml` (Partial bảng, accordion chi tiết: vị trí, trọng lượng, định mức tồn Min-Max, thuộc tính).
- **Service tồn kho**: `Services/ITonKhoService.cs`, `Services/TonKhoService.cs`.
- **DbContext & Entity**: `Models/QuanLyKhoPhuQuocLtwContext.cs`, các Entity (`HangHoa`, `NhomHang`, `DonViTinh`, `NguongTonKho`, `VwTonKhoHienTai`).

### 1.2. Bảng CSDL tham gia:
- `HangHoa`: `MaHang`, `MaHangNoiBo`, `TenHang`, `MaNhom`, `MaDvt`, `QuyCach`, `GiaBanThamKhao`, `GiaVon`, `HinhAnh`, `TrangThai`, `NgayTao`, `DaDanhDau`, `ViTri`, `TrongLuong`, `DonViTrongLuong`, `ThuocTinh` (JSON array).
- `NhomHang`, `DonViTinh`: Phân loại và ĐVT cơ bản duy nhất.
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
| **Mở form Sửa** | Click icon bút chì | JS AJAX `GET /HangHoa/GetItem?id=X` | `GetItem(id)` đọc thông tin hàng & tồn | Trả JSON ➜ điền form modal sửa |
| **Lưu Sửa hàng** | Sửa form, "Cập nhật" | JS gom form ➜ AJAX `POST /HangHoa/Edit?id=X` | `Edit(id, form)` validate & cập nhật | Cập nhật `HangHoa`, `NguongTonKho` ➜ JSON `{success:true}` |
| **Đánh dấu sao** | Click ngôi sao | JS AJAX `POST /HangHoa/ToggleFavorite?id=X` | `ToggleFavorite(id)` đảo cờ `DaDanhDau` | Lưu DB ➜ Trả JSON toggle class vàng |
| **Xóa hàng** | Click Xóa ➜ Xác nhận | JS AJAX `POST /HangHoa/Delete?id=X` | `Delete(id)` kiểm tra ràng buộc chứng từ | Chặn nếu đã có giao dịch; xóa nếu chưa có |
| **Cập nhật nhanh thuộc tính** | "+ Thêm thuộc tính" ở dòng chi tiết | JS mở `quickAttrModal`, nạp thuộc tính | `UpdateThuocTinh(...)` lưu JSON mảng thuộc tính | Cập nhật `HangHoa.ThuocTinh` ➜ reload bảng |
| **Hiển thị ảnh** | Bảng hiển thị `<img>` | `src="/HangHoa/GetImage?id=X"` | `GetImage(id)` đọc byte ảnh từ DB | Trả byte ảnh / SVG. Cấm SELECT ảnh ở bảng |

---

## 3. Quy chuẩn Giao diện & 7 Bộ lọc Sidebar

### 3.1. Cột lọc bên trái (Sidebar Filter):
1. **Nhóm hàng**: Radio/Checkbox nhóm + nút tạo nhanh.
2. **Tồn kho**: Tất cả / Còn hàng / Hết hàng / Dưới định mức (⚠️).
3. **Dự kiến hết hàng**: Hôm nay, 3 ngày tới, 7 ngày tới, Trong tháng, > 30 ngày.
4. **Nhà cung cấp**: Lọc theo nhà cung cấp từng nhập.
5. **Loại hàng**: Hàng hóa / Dịch vụ / Combo đóng gói.
6. **Vị trí**: Tìm theo vị trí kho.
7. **Thời gian tạo**: Hôm nay, Tuần này, Tháng này, hoặc tùy chọn ngày.

### 3.2. Thanh công cụ trên (Action Bar):
- Ô tìm kiếm từ khóa (Tên, Mã nội bộ, Mã vạch).
- Nút lọc nhanh hàng Đánh dấu sao (`DaDanhDau`).
- Nút "+ Thêm mới" mở modal; nút Import/Export Excel.

### 3.3. Quy chuẩn Modal Thêm/Sửa Hàng hóa (Chuẩn KiotViet Image Match):
- **Tiêu đề & Tabs**: "Tạo hàng hóa" / "Cập nhật hàng hóa", 2 tabs "Thông tin" và "Mô tả".
- **Kích thước & Kiểu chữ**: Chiều cao các ô input/select/button chuẩn 36px; Font chữ input 13.5px; Nhãn `.form-label-kiot` 12.5px, font-weight 500; Tiêu đề card `.modal-card-title` 13.5px bold kèm icon chevron `bi-chevron-up` bên phải.
- **Khung tải ảnh**: Viền nét đứt `1px dashed #cbd5e1`, placeholder nút `Thêm ảnh`, subtext `Mỗi ảnh không quá 2 MB`, 3 ô thumbnail placeholder mờ bên phải. Khi đã chọn ảnh: placeholder ẩn hoàn toàn, ảnh hiển thị tối đa 105x105px kèm nút xóa tròn đỏ ở góc trên bên phải, click vào ảnh để chọn ảnh khác.
- **Vị trí**: Select box vị trí chuẩn phong cách KiotViet kết hợp modal popup riêng `quickLocationModal` (Tiêu đề "Tạo vị trí", body label "Vị trí", footer "Bỏ qua" & "Lưu"). Chọn "+ Tạo vị trí mới..." hoặc bấm "Tạo mới" ở nhãn sẽ mở modal này.
- **Trọng lượng**: Input group liền khối căn phải số `0` + select đơn vị `g`/`kg`.
- **Thuộc tính**: Dòng động 3 cột: Cột 1 là `<select>` chọn tên thuộc tính (Màu sắc, Kích cỡ, Dung tích... + "+ Thuộc tính khác..."), Cột 2 là input group gồm ô nhập giá trị + nút "Chọn nhanh" (gợi ý nhanh danh sách giá trị phổ biến), Cột 3 là nút icon thùng rác xóa dòng.
- **Chân Modal**: Trái có checkbox `☑ Bán trực tiếp (i)`; Phải có nút `Bỏ qua`, nút group `Lưu & Tạo thêm hàng` kèm menu `Lưu & Sao chép`, nút `Lưu` (`#0070f4`).

---

## 4. Các Quy tắc Nghiệp vụ Bất biến

1. **BẢO TOÀN DỮ LIỆU (CẤM XÓA KHI ĐÃ CÓ GIAO DỊCH)**: Kiểm tra `ChiTietDonBan`, `ChiTietPhieuNhap`, `ChiTietPhieuChuyenKho`, `ChiTietPhieuKiemKe`. Có giao dịch: chặn và báo lỗi, gợi ý chuyển 'NGUNG_BAN'. Chưa có: cho phép xóa.
2. **Mã nội bộ & Retry**: Mã `HH` + 6 số tự tăng (`HH000001`), Unique, retry 3 lần chống Race Condition.
3. **Tồn kho theo kho làm việc**: Đọc động từ `vw_TonKhoHienTai` theo `CurrentWarehouseId`. Đổi kho ở Header thì tồn kho tự động đổi theo.
4. **Tối ưu RAM ảnh**: Tuyệt đối không `SELECT HinhAnh` ở danh sách. Dùng LINQ Projection `HasImage = x.HinhAnh != null`.

