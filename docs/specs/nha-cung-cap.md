# Đặc tả Chức năng: Quản lý Nhà cung cấp (Supplier Management)

> **Mục tiêu**: Quản lý danh mục Nhà cung cấp chuẩn giao diện & nghiệp vụ KiotViet. Tìm kiếm, lọc đa tiêu chí, Master-Detail xem lịch sử & nợ, modal thêm/sửa với Accordions, đánh dấu sao yêu thích.

---

## 1. Kiến trúc File & CSDL

### 1.1. Bản đồ File liên quan (File Map)
- **Controller**: `Controllers/NhaCungCapController.cs` (kế thừa `BaseKhoController`, phân quyền, lọc AJAX, CRUD, ToggleFavorite).
- **ViewModels (`ViewModels/NhaCungCap/`)**:
  - `NhaCungCapIndexVM.cs`: Trang Index & dữ liệu khởi tạo, có `DaDanhDauFilter`.
  - `NhaCungCapFilterParams.cs`: Tiêu chí lọc (Q, NhomNcc, TongMua, ThoiGian, No, TrangThai, DaDanhDau).
  - `NhaCungCapItemVM.cs`: Dòng hiển thị bảng (`MaDonViCapHang`, `MaNcc`, `TenDonVi`, `DaDanhDau`, `NoCanTraHienTai`...).
  - `NhaCungCapFormVM.cs`: Dữ liệu tạo mới/sửa modal (13 trường dữ liệu + Accordions).
  - `NhaCungCapDetailVM.cs`: Thông tin chi tiết nạp vào panel Master-Detail.
- **Views (`Views/NhaCungCap/`)**:
  - `Index.cshtml`: Topbar công cụ, sidebar 5 khối LEGO, bảng dữ liệu.
  - `_NhaCungCapFilterSidebar.cshtml`: 5 khối lọc KiotViet (Nhóm, Tổng mua, Thời gian, Nợ, Trạng thái).
  - `_NhaCungCapTable.cshtml`: Bảng AJAX (`NhaCungCapIndexVM`), khớp chuẩn `HangHoa` (`product-row`, inline panel, cột sao, ẩn/hiện 12 cột).
  - `_NhaCungCapModal.cshtml`: Modal tạo mới/sửa NCC (3 Accordion: Địa chỉ, Nhóm & Ghi chú, Thông tin hóa đơn).
  - `_NhaCungCapDetail.cshtml`: Panel chi tiết (Tabs: Thông tin, Lịch sử nhập/trả hàng, Nợ cần trả).
- **Styles & Scripts**:
  - `wwwroot/js/nha-cung-cap-index.js`: AJAX lọc, phân trang, toggle sao, Master-Detail.
  - `wwwroot/css/nha-cung-cap.css`: Form modal, accordion, detail panel.
- **Menu điều hướng**: `_MainMenu.cshtml`, `_Header.cshtml`.

### 1.2. Cơ sở dữ liệu (Tuân thủ 3 Nguyên tắc Vàng CSDL)
- **Bảng `DonViCapHang`**:
  - `MaDonViCapHang` INT IDENTITY PK.
  - `TenDonVi` NVARCHAR(150) NOT NULL UNIQUE.
  - `DienThoai` VARCHAR(15) NULL, `DiaChi` NVARCHAR(255) NULL.
  - `TrangThai` VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG' (`HOAT_DONG` / `NGUNG_GIAO_DICH`, tuân thủ check constraint `CK_DonViCapHang_TrangThai`).
  - `MaNcc` VARCHAR(30) NULL (tự sinh `NCC00001` nếu để trống).
  - `Email` NVARCHAR(100) NULL, `KhuVuc` NVARCHAR(100) NULL, `PhuongXa` NVARCHAR(100) NULL.
  - `MaNhomNcc` INT NULL (FK đến `NhomNhaCungCap`).
  - `GhiChu` NVARCHAR(500) NULL, `TenCongTy` NVARCHAR(200) NULL, `MaSoThue` VARCHAR(30) NULL, `SoCccd` VARCHAR(30) NULL.
  - `DaDanhDau` BIT NOT NULL DEFAULT 0 (Đánh dấu sao yêu thích).
  - `NgayTao` DATETIME NOT NULL DEFAULT GETDATE(), `NguoiTao` NVARCHAR(100) NULL.
- **Bảng `NhomNhaCungCap`**: `MaNhomNcc` INT IDENTITY PK, `TenNhom` NVARCHAR(150) UNIQUE, `GhiChu` NVARCHAR(255).

---

## 2. Luồng Tương tác Nghiệp vụ Chi tiết

| Luồng | Tương tác người dùng | Frontend (JS / View) | Backend (Controller / DB) |
|---|---|---|---|
| **1. Nạp ban đầu** | Vào menu "Mua hàng" ➜ "Nhà cung cấp" | GET `/NhaCungCap` | `Index()` nạp nhóm, danh sách trang 1, tính tổng mua & nợ ➜ Render `Index.cshtml` |
| **2. Lọc & Tìm kiếm** | Gõ tìm kiếm (F3) / Nhóm / Thời gian / Trạng thái | Debounce 300ms ➜ AJAX `GET /NhaCungCap/Filter` | `Filter(...)` lọc LINQ, tính nợ/tổng mua ➜ Render `_NhaCungCapTable.cshtml` |
| **3. Phân trang & Sắp xếp** | Click số trang hoặc tiêu đề cột | Gán page/sort ➜ AJAX `GET /NhaCungCap/Filter` | `.OrderBy()`, `.Skip().Take()` ➜ Cập nhật bảng và phân trang |
| **4. Xem chi tiết (Inline Drawer)** | Click vào 1 dòng NCC trên bảng | Bung dòng chi tiết `tr.product-detail-row` trượt êm, viền xanh `selected` khép kín hình chữ nhật. 3 card thuộc tính cố định 992px (320px/card) không dãn theo khung xanh. Tab 1 sẵn, Tab 2 & 3 AJAX | Nạp thông tin NCC, lịch sử phiếu nhập, công nợ qua `GetDetail` |
| **5. Thêm mới NCC** | Bấm "+ Nhà cung cấp", điền form, bấm "Lưu" | Form validate ➜ AJAX `POST /NhaCungCap/Create` | Tự sinh `MaNcc`, lưu DB ➜ Trả JSON `{success: true}` ➜ Reload bảng |
| **6. Sửa NCC** | Bấm "Chỉnh sửa" trong chi tiết hoặc dòng | AJAX `GET /NhaCungCap/GetItem?id=X` ➜ Đổ vào modal | AJAX `POST /NhaCungCap/Edit?id=X` ➜ Cập nhật DB ➜ Reload bảng & detail |
| **7. Xóa NCC** | Bấm nút Xóa trong panel chi tiết | Modal `KiotConfirm` xác nhận | Kiểm tra `PhieuNhaps.Any()`. Nếu đã có GD ➜ Báo lỗi, gợi ý "Ngừng hoạt động" |
| **8. Quản lý Nhóm NCC** | Bấm "+ Tạo mới" hoặc ✎ sửa/xóa trong dropdown nhóm | Mở `KiotPrompt` nhập tên nhóm | `CreateGroupQuick`, `UpdateGroupQuick`, `DeleteGroupQuick` |
| **9. Đánh dấu sao** | Click sao dòng hoặc sao header | Click sao dòng: Toggle AJAX `/NhaCungCap/ToggleFavorite` tức thì âm thầm (bỏ toast). Sao header: Lọc các NCC đã đánh dấu sao | Cập nhật `DaDanhDau`, trả JSON `{success, isFavorite}` |
| **10. Chuyển đổi trạng thái** | Bấm "Ngừng hoạt động" hoặc "Kích hoạt lại" | Mở modal `#nccStatusConfirmOv` xác nhận hành động ➜ Bấm "Đồng ý" | `ToggleStatus(id)` chuyển đổi `HOAT_DONG` ⇋ `NGUNG_GIAO_DICH` |

---

## 3. Khối Lego Tái sử dụng (Tuân thủ Luật 10 & 03-giao-dien-layout.md)
- [x] **Modal Xác nhận Ngừng hoạt động**: `#nccStatusConfirmOv` căn giữa, chuyển cảnh mượt mà, hỏi xác nhận trước khi đổi trạng thái.
- [x] **Cột Sao Yêu Thích**: Cột sao cố định (`th-star`, `cell-star`), toggle sao âm thầm và lọc danh sách sao trên header.
- [x] **Panel Chi tiết Cố định**: `.ncc-detail-fixed-wrap`, `.ncc-attr-grid`, `.ncc-attr-col` cố định 3 card 992px (320px/card), viền khép kín hình chữ nhật.
- [x] **Hiển thị Cột (`#colMenu`)**: Bật/tắt 12 cột, chuẩn `#productTableContainer`, lưu `localStorage` (`kiot_ncc_columns_v2`).
- [x] **Bộ lọc Thời gian**: `<partial name="_KiotDateFilter" ... />` kết hợp `KiotFilter.initDateFilter`.
- [x] **Bộ lọc Nhóm NCC**: `<partial name="_KiotMultiSelectFilter" ... />` hỗ trợ sửa/xóa ✎ tại chỗ.
- [x] **Bộ lọc Trạng thái**: `<partial name="_KiotStatusFilter" ... />` (Đang hoạt động / Ngừng hoạt động).
- [x] **Phân trang AJAX**: `<partial name="_Pagination" model="Model.PagedData" />`.
- [x] **Khối Accordion trong Form**: `.kiot-sec`, `.kiot-sec-h`, `.kiot-chev` cho 3 khối thông tin.
- [x] **Modal con KiotPrompt & KiotConfirm**: Thêm nhanh nhóm, sửa nhóm, xác nhận xóa NCC.
- [x] **Format tiền tệ**: class `.kiot-num` cho khoảng Tổng mua và Nợ hiện tại.
- [x] **Thông báo Toast**: `window.KiotToast` dùng chung toàn hệ thống, dạng viên bo tròn tối màu, không viền kẻ dọc.

---

## 4. Quy tắc Nghiệp vụ Bất biến
1. **Mã nhà cung cấp**: Tự động sinh `NCC00001`, `NCC00002`... nếu để trống. Kiểm tra chống trùng lặp.
2. **Tên nhà cung cấp**: Bắt buộc nhập, tối đa 150 ký tự, không trùng lặp.
3. **Bảo vệ toàn vẹn dữ liệu chứng từ**: Tuyệt đối không xóa cứng NCC đã phát sinh phiếu nhập kho (`PhieuNhap`).
4. **Tính toán Công nợ & Tổng mua**:
   - `TongMua`: Tổng giá trị các phiếu nhập kho trạng thái hoàn thành (`DA_XAC_NHAN` / `DA_NHAN`).
   - `NoCanTraHienTai`: Tổng mua trừ tổng tiền đã thanh toán (bằng `TongMua` khi chưa có sổ quỹ).
