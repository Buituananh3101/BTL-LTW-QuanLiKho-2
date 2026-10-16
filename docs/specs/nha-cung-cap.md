# Đặc tả Chức năng: Quản lý Nhà cung cấp (Supplier Management)

> **Mục tiêu**: Quản lý toàn diện danh mục Nhà cung cấp theo chuẩn giao diện & nghiệp vụ KiotViet. Hỗ trợ tìm kiếm, lọc đa tiêu chí, Master-Detail xem lịch sử giao dịch và công nợ, modal thêm/sửa với các khối Accordion, chống xóa khi đã phát sinh phiếu nhập.

---

## 1. Kiến trúc File & CSDL

### 1.1. Bản đồ File liên quan (File Map)
- **Controller**: `Controllers/NhaCungCapController.cs` (kế thừa `BaseKhoController`, phân quyền, lọc AJAX, CRUD, Detail).
- **ViewModels (`ViewModels/NhaCungCap/`)**:
  - `NhaCungCapIndexVM.cs`: Dữ liệu cho trang Index và khởi tạo các khối lọc.
  - `NhaCungCapFilterParams.cs`: Tiêu chí lọc (Từ khóa, Nhóm, Khoảng tổng mua, Thời gian, Khoảng nợ, Trạng thái) kế thừa `BaseFilterParams`.
  - `NhaCungCapItemVM.cs`: Dòng hiển thị trong bảng dữ liệu (`MaDonViCapHang`, `MaNcc`, `TenDonVi`, `DienThoai`, `Email`, `NoCanTraHienTai`, `TongMua`, `TrangThai`).
  - `NhaCungCapFormVM.cs`: Dữ liệu tạo mới/chỉnh sửa trong modal (13 trường dữ liệu + Accordions).
  - `NhaCungCapDetailVM.cs`: Thông tin chi tiết nạp vào panel mở rộng bên dưới dòng (Master-Detail).
- **Views (`Views/NhaCungCap/`)**:
  - `Index.cshtml`: Khung trang chính gồm topbar công cụ, sidebar bộ lọc 5 khối LEGO, bảng dữ liệu.
  - `_NhaCungCapFilterSidebar.cshtml`: 5 khối lọc KiotViet (Nhóm NCC, Tổng mua, Thời gian, Nợ hiện tại, Trạng thái).
  - `_NhaCungCapTable.cshtml`: Bảng dữ liệu AJAX (`NhaCungCapIndexVM`), khớp chuẩn `HangHoa` (dòng `product-row`, inline panel `product-detail-panel`, slideDown/slideUp, ẩn/hiện 12 cột).
  - `_NhaCungCapModal.cshtml`: Modal tạo mới / sửa Nhà cung cấp (3 khối Accordion: Địa chỉ, Nhóm & Ghi chú, Thông tin hóa đơn).
  - `_NhaCungCapDetail.cshtml`: Panel chi tiết xổ xuống khi click dòng (Tabs: Thông tin, Lịch sử nhập/trả hàng, Nợ cần trả).
- **Styles & Scripts**:
  - `wwwroot/js/nha-cung-cap-index.js`: Xử lý tìm kiếm debounce, AJAX lọc, phân trang, sắp xếp cột, mở modal, Master-Detail.
  - `wwwroot/css/nha-cung-cap.css`: Giao diện chi tiết form modal, accordion, detail panel.
- **Menu điều hướng**:
  - Cập nhật `_MainMenu.cshtml` (active tab "Mua hàng" -> link "Nhà cung cấp").
  - Cập nhật `_Header.cshtml` (link mobile drawer "Nhà cung cấp").

### 1.2. Cơ sở dữ liệu (Tuân thủ 3 Nguyên tắc Vàng CSDL)
- **Bảng `DonViCapHang` (Mở rộng cột mới, không DROP/đổi tên cột cũ)**:
  - `MaDonViCapHang` INT IDENTITY PK (cũ).
  - `TenDonVi` NVARCHAR(150) NOT NULL UNIQUE (cũ - Tên nhà cung cấp).
  - `DienThoai` VARCHAR(15) NULL (cũ).
  - `DiaChi` NVARCHAR(255) NULL (cũ).
  - `TrangThai` VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG' (cũ: 'HOAT_DONG' / 'NGUNG_HOAT_DONG').
  - `MaNcc` VARCHAR(30) NULL (mới: Mã ký hiệu hiển thị, tự sinh `NCC00001` nếu để trống).
  - `Email` NVARCHAR(100) NULL (mới).
  - `KhuVuc` NVARCHAR(100) NULL (mới: Tỉnh/Thành phố).
  - `PhuongXa` NVARCHAR(100) NULL (mới: Phường/Xã).
  - `MaNhomNcc` INT NULL (mới: FK đến `NhomNhaCungCap`).
  - `GhiChu` NVARCHAR(500) NULL (mới).
  - `TenCongTy` NVARCHAR(200) NULL (mới: Tên công ty xuất hóa đơn).
  - `MaSoThue` VARCHAR(30) NULL (mới).
  - `SoCccd` VARCHAR(30) NULL (mới).
  - `NgayTao` DATETIME NOT NULL DEFAULT GETDATE() (mới).
  - `NguoiTao` NVARCHAR(100) NULL (mới).
- **Bảng mới `NhomNhaCungCap`**:
  - `MaNhomNcc` INT IDENTITY(1,1) PRIMARY KEY.
  - `TenNhom` NVARCHAR(150) NOT NULL UNIQUE.
  - `GhiChu` NVARCHAR(255) NULL.

---

## 2. Luồng Tương tác Nghiệp vụ Chi tiết

| Luồng | Tương tác người dùng | Frontend (JS / View) | Backend (Controller / DB) |
|---|---|---|---|
| **1. Nạp ban đầu** | Vào menu "Mua hàng" ➜ "Nhà cung cấp" | GET `/NhaCungCap` | `Index()` nạp nhóm NCC, danh sách trang 1, tính tổng mua & nợ ➜ Render `Index.cshtml` |
| **2. Lọc & Tìm kiếm** | Gõ ô tìm kiếm (F3) / Chọn nhóm / Chọn thời gian / Chọn trạng thái | Debounce 300ms ➜ AJAX `GET /NhaCungCap/Filter` | `Filter(...)` lọc LINQ, tính toán nợ/tổng mua ➜ Render `_NhaCungCapTable.cshtml` |
| **3. Phân trang & Sắp xếp** | Click số trang hoặc click tiêu đề cột | Gán `pageIndex` / `sortCol` ➜ AJAX `GET /NhaCungCap/Filter` | `.OrderBy()`, `.Skip().Take()` ➜ Cập nhật bảng và thanh phân trang |
| **4. Xem chi tiết (Inline Drawer)** | Click vào 1 dòng NCC trên bảng | Bung mở dòng chi tiết `tr.product-detail-row` trượt êm ái (khớp Hàng hóa), highlight viền xanh `tr.product-row.selected`. Tab 1 nạp sẵn, Tab 2 & 3 nạp AJAX khi chuyển tab | Nạp thông tin NCC, lịch sử phiếu nhập, công nợ qua `GetDetail` khi cần |
| **5. Thêm mới NCC** | Bấm "+ Nhà cung cấp", điền form, bấm "Lưu" | Form validate ➜ AJAX `POST /NhaCungCap/Create` | Tự sinh `MaNcc`, lưu DB ➜ Trả JSON `{success: true}` ➜ Reload bảng |
| **6. Sửa NCC** | Bấm "Chỉnh sửa" trong chi tiết hoặc dòng | AJAX `GET /NhaCungCap/GetItem?id=X` ➜ Đổ vào modal sửa | AJAX `POST /NhaCungCap/Edit?id=X` ➜ Cập nhật DB ➜ Reload bảng & detail |
| **7. Xóa NCC** | Bấm nút Xóa trong panel chi tiết | Mở modal `KiotConfirm` xác nhận | Kiểm tra `PhieuNhaps.Any()`. Nếu đã có GD ➜ Báo không được xóa, gợi ý "Ngừng hoạt động". Nếu chưa có GD ➜ Xóa an toàn |
| **8. Quản lý Nhóm NCC** | Bấm "+ Tạo mới" hoặc ✎ sửa/xóa trong dropdown nhóm | Mở `KiotPrompt` nhập tên nhóm | `CreateGroupQuick`, `UpdateGroupQuick`, `DeleteGroupQuick` tương tự Nhóm hàng |

---

## 3. Khối Lego Tái sử dụng (Tuân thủ Luật 10 & 03-giao-dien-layout.md)
- [x] **Hiển thị Cột (`#colMenu`)**: Bật/tắt 12 cột, chuẩn `#productTableContainer`, lưu `localStorage` (`kiot_ncc_columns_v2`).
- [x] **Bộ lọc Thời gian**: `<partial name="_KiotDateFilter" ... />` kết hợp `KiotFilter.initDateFilter`.
- [x] **Bộ lọc Nhóm NCC**: `<partial name="_KiotMultiSelectFilter" ... />` hỗ trợ sửa/xóa ✎ tại chỗ.
- [x] **Bộ lọc Trạng thái**: `<partial name="_KiotStatusFilter" ... />` (Đang hoạt động / Ngừng hoạt động).
- [x] **Phân trang AJAX**: `<partial name="_Pagination" model="Model.PagedData" />`.
- [x] **Khối Accordion trong Form**: `.kiot-sec`, `.kiot-sec-h`, `.kiot-chev` cho 3 khối thông tin.
- [x] **Modal con KiotPrompt & KiotConfirm**: Thêm nhanh nhóm, sửa nhóm, xác nhận xóa NCC.
- [x] **Format tiền tệ**: class `.kiot-num` cho khoảng Tổng mua và Nợ hiện tại.
- [x] **Thông báo Toast**: `showToast(msg)`.

---

## 4. Quy tắc Nghiệp vụ Bất biến
1. **Mã nhà cung cấp**: Tự động sinh `NCC00001`, `NCC00002`... nếu người dùng bỏ trống. Nếu người dùng tự nhập, kiểm tra không được trùng lặp.
2. **Tên nhà cung cấp**: Bắt buộc nhập, độ dài tối đa 150 ký tự, không được trùng lặp trong hệ thống.
3. **Bảo vệ toàn vẹn dữ liệu chứng từ**: Tuyệt đối không xóa cứng Nhà cung cấp đã phát sinh phiếu nhập kho (`PhieuNhap`). Khi người dùng muốn ngừng hợp tác, chuyển `TrangThai = 'NGUNG_HOAT_DONG'`.
4. **Tính toán Công nợ & Tổng mua**:
   - `TongMua`: Tổng giá trị các phiếu nhập kho trạng thái hoàn thành (`DA_XAC_NHAN` / `DA_NHAN`) của nhà cung cấp này.
   - `NoCanTraHienTai`: Tổng tiền mua trừ đi tổng số tiền đã thanh toán (nếu có thanh toán) hoặc bằng `TongMua` nếu chưa có phân hệ sổ quỹ chi tiết.
