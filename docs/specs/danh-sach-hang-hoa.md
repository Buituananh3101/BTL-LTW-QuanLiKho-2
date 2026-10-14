# Đặc tả Chức năng: Quản lý Hàng hóa (Product Catalog)

> **Mục tiêu**: **Khuôn mẫu chuẩn cho toàn bộ màn hình Danh mục (CRUD)** trong hệ thống. Các màn hình danh mục tuân theo kiến trúc lọc sidebar, phân trang AJAX, modal JSON, và bảo toàn dữ liệu.

---

## 1. Kiến trúc File & Bảng CSDL liên quan

### 1.1. Bản đồ File liên quan (File Map)
- **Controller**: `Controllers/HangHoaController.cs` (`Index`, lọc AJAX `Filter`, `Create`, `Edit`, `GetItem`, `ToggleFavorite`, `Delete`, `NgungBan`, `GetImage`, `CreateDvtQuick`, `UpdateThuocTinh`).
- **ViewModel**: `ViewModels/HangHoa/` (`HangHoaForm.cs`, `QuickGroupRequest.cs`, `QuickDvtRequest.cs`).
- **View & Modal**: `Views/HangHoa/Index.cshtml`, `Views/HangHoa/_HangHoaModal.cshtml` (Modal chuẩn KiotViet: Tab Thông tin & Mô tả, lưu tối đa 5 ảnh CSDL, ĐVT thay Thương hiệu, accordion gập mở, hệ thống custom dropdown đồng nhất; Modal con `hhPickOv` chọn giá trị thuộc tính; Modal con `hhEditItemOv` sửa/xóa vị trí & thuộc tính; Modal con `hhDeleteProductOv` xác nhận xóa chuẩn KiotViet tích hợp cảnh báo giao dịch và nút chuyển nhanh sang Ngừng bán).
- **Styles & Scripts**: `wwwroot/css/hang-hoa-form.css`, `wwwroot/js/hang-hoa-form.js`, `wwwroot/css/site.css` (Quản lý 5 ảnh, định dạng số có phẩy, Single & Multi-Select dropdown, xử lý xóa hàng hóa `window.openDeleteProductModal`, toast thông báo).
- **Bảng dữ liệu**: `Views/HangHoa/_HangHoaTable.cshtml` (Partial bảng, accordion chi tiết: nút Xóa kết nối modal KiotViet đồng bộ).
- **Service tồn kho**: `Services/ITonKhoService.cs`, `Services/TonKhoService.cs`.
- **DbContext & Entity**: `Models/QuanLyKhoPhuQuocLtwContext.cs`, các Entity (`HangHoa`, `HinhAnhHangHoa`, `NhomHang`, `DonViTinh`, `NguongTonKho`, `VwTonKhoHienTai`).

### 1.2. Bảng CSDL tham gia:
- `HangHoa`: `MaHang`, `MaHangNoiBo`, `TenHang`, `MaNhom`, `MaDvt`, `QuyCach`, `GiaBanThamKhao`, `GiaVon`, `HinhAnh` (ảnh chính đồng bộ), `TrangThai`, `NgayTao`, `DaDanhDau`, `ViTri`, `TrongLuong`, `DonViTrongLuong`, `ThuocTinh` (JSON array), `MoTa`.
- `HinhAnhHangHoa`: `MaHinhAnh`, `MaHang` (FK), `DuLieuAnh` (VARBINARY MAX), `ThuTu`, `LaAnhChinh`, `NgayTao` (lưu tối đa 5 ảnh: 1 ảnh to đại diện và 4 ảnh nhỏ phụ bên phải).
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
| **Mở form Sửa** | Click icon bút chì / Chỉnh sửa | JS AJAX `GET /HangHoa/GetItem?id=X` | `GetItem(id)` đọc thông tin hàng & tồn | Trả JSON ➜ điền form modal sửa |
| **Lưu Sửa hàng** | Sửa form, "Cập nhật" | JS gom form ➜ AJAX `POST /HangHoa/Edit?id=X` | `Edit(id, form)` validate & cập nhật | Cập nhật `HangHoa`, `NguongTonKho` ➜ JSON `{success:true}` |
| **Đánh dấu sao** | Click ngôi sao | JS AJAX `POST /HangHoa/ToggleFavorite?id=X` | `ToggleFavorite(id)` đảo cờ `DaDanhDau` | Lưu DB ➜ Trả JSON toggle class vàng |
| **Xóa hàng** | Click Xóa (bảng / modal sửa) | Mở `#hhDeleteProductOv` ➜ AJAX `POST /HangHoa/Delete/{id}` | `Delete(id)` check 5 bảng giao dịch, bọc Transaction xóa cascade ảnh & ngưỡng tồn | Chưa có GD: Xóa thành công ➜ Toast + `loadTable()`. Đã có GD: Trả `hasTransaction: true` kèm nút chuyển Ngừng bán |
| **Ngừng bán** | Bấm "Chuyển sang 'Ngừng bán' ngay" | AJAX `POST /HangHoa/NgungBan/{id}` | `NgungBan(id)` cập nhật `TrangThai = 'NGUNG_BAN'` | Lưu DB ➜ Đóng modal, Toast + `loadTable()` |
| **Hiển thị ảnh** | Bảng hiển thị `<img>` | `src="/HangHoa/GetImage/@item.MaHang?v=@item.ImageVersion"` | `GetImage(id)` hỗ trợ HTTP cache 24h, cache bust theo `ImageVersion` | Trả byte ảnh / SVG. Cấm SELECT ảnh ở bảng |

---

## 3. Quy chuẩn Giao diện & 7 Bộ lọc Sidebar

### 3.1. Cột lọc bên trái (Sidebar Filter):
1. **Nhóm hàng**: Multi-select Tag Dropdown + ô tìm kiếm dính đỉnh + nút tạo nhanh.
2. **Tồn kho**: Custom Single Select KiotViet (`.kiot-single-select-box`, `.kiot-ss-dropdown`): Tất cả / Còn hàng / Hết hàng / Dưới định mức (⚠️), hỗ trợ auto drop-up.
3. **Dự kiến hết hàng**: Hôm nay, 3 ngày tới, 7 ngày tới, Trong tháng, > 30 ngày.
4. **Nhà cung cấp**: Lọc theo nhà cung cấp từng nhập (Multi-select tag dropdown).
5. **Loại hàng**: Hàng hóa / Dịch vụ / Combo đóng gói.
6. **Vị trí**: Dropdown đa chọn kèm ô tìm kiếm nhanh `.kiot-ms-search`, nạp động danh sách vị trí từ DB và vị trí mặc định (`Model.ViTris`), truy vấn lọc chính xác theo trường `HangHoa.ViTri`.
7. **Thời gian tạo**: Hôm nay, Tuần này, Tháng này, hoặc tùy chọn ngày (Dual Calendar 2 tháng).

### 3.2. Thanh công cụ trên (Action Bar):
- Ô tìm kiếm từ khóa (Tên, Mã nội bộ, Mã vạch).
- Nút lọc nhanh hàng Đánh dấu sao (`DaDanhDau`).
- Nút "+ Thêm mới" mở modal; nút Import/Export Excel.

---

## 4. Các Quy tắc Nghiệp vụ Bất biến

1. **BẢO TOÀN DỮ LIỆU (CẤM XÓA KHI ĐÃ CÓ GIAO DỊCH)**: Kiểm tra cả 5 bảng chứng từ: `ChiTietDonBan`, `ChiTietPhieuNhap`, `ChiTietPhieuXuat`, `ChiTietPhieuChuyenKho`, `ChiTietPhieuKiemKe`.
   - Có giao dịch: Chặn xóa, hiển thị card cảnh báo đỏ trong modal `#hhDeleteProductOv` kèm nút hành động 1-click chuyển sang trạng thái `NGUNG_BAN`.
   - Chưa có giao dịch: Bọc Transaction EF, tự động xóa cascade các bảng phụ thuộc (`HinhAnhHangHoa`, `NguongTonKho`), xóa hàng hóa và commit.
2. **Mã nội bộ & Retry**: Mã `HH` + 6 số tự tăng (`HH000001`), Unique, retry 3 lần chống Race Condition.
3. **Tồn kho theo kho làm việc**: Đọc động từ `vw_TonKhoHienTai` theo `CurrentWarehouseId`. Đổi kho ở Header thì tồn kho tự động đổi theo.
4. **Tối ưu RAM ảnh**: Tuyệt đối không `SELECT HinhAnh` ở danh sách. Dùng LINQ Projection `HasImage = x.HinhAnh != null`.

