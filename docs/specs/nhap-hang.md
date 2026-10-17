# Đặc tả Chức năng: Nhập hàng (Goods Receipt)

> **Mục tiêu**: Quản lý chứng từ Nhập hàng từ Nhà cung cấp chuẩn giao diện & nghiệp vụ KiotViet. Tái sử dụng 100% các khối LEGO đã đóng gói (`KiotFilter`, `KiotToast`, `f3-product-search`, `_KiotDateFilter`...).

---

## 1. Kiến trúc CSDL, ViewModel & Bản đồ File

### 1.1. Bảng CSDL tham gia:
- `PhieuNhap`: `MaPhieuNhap`, `MaPhieu` (`PN000047`), `MaKho`, `MaDonViCapHang`, `MaNvlap`, `MaNvxacNhan`, `NgayLap`, `NgayXacNhan`, `TrangThai` (`PHIEU_TAM` / `DA_XAC_NHAN` / `DA_HUY`), `GhiChu`, `DaDanhDau`, `SoHoaDon`, `GiamGia`, `TongTien`, `CanTraNcc`.
- `ChiTietPhieuNhap`: `MaCtphieuNhap`, `MaPhieuNhap`, `MaHang`, `SoLuong`, `DonGiaNhap`, `GiamGia`, `ThanhTien`.
- `DonViCapHang`: Nhà cung cấp cung cấp hàng (`TenDonVi`, `MaNcc`, `DienThoai`).
- `vw_BienDongKho`: Tự động cộng tồn kho khi `PhieuNhap.TrangThai = 'DA_XAC_NHAN'`.
- `NhatKyThaoTac`: Ghi log kiểm toán thao tác nhập hàng.

### 1.2. ViewModels sử dụng (`ViewModels/NhapHang/`):
- `NhapHangIndexVM`: Dữ liệu màn hình Index, `PagedData`, lọc sao `DaDanhDauFilter`, danh sách Người tạo & Người nhập.
- `NhapHangFilterVM`: Bộ lọc (`DateFilterType` mặc định `THANG_NAY`, `Statuses`, `NccIds`, `CreatorIds`, `ConfirmerIds`, `SoHoaDon`, `Q`, `DaDanhDau`).
- `NhapHangListItemVM`: Dòng danh sách (`MaPhieuHienThi`, `NgayLap`, `MaNcc`, `TenNcc`, `TongTien`, `GiamGia`, `CanTraNcc`, `TrangThai`, `DaDanhDau`).
- `NhapHangFormVM`: Dữ liệu form lập/sửa, danh sách `NhanViens`, `NhaCungCaps`, kho làm việc, `IsReadOnly`.
- `NhapHangLineVM`: Dòng hàng hóa (`MaHang`, `MaHangHienThi`, `TenHang`, `DonViTinh`, `SoLuong`, `DonGiaNhap`, `GiamGia`, `ThanhTien`, `TonKhoHienTai`).
- `SaveNhapHangRequest`: DTO nhận JSON submit ("Lưu tạm" hoặc "Hoàn thành").

### 1.3. Bản đồ File:
- **Controller**: `Controllers/NhapHangController.cs` (kế thừa `BaseKhoController`, DI `INhatKyThaoTacService`).
- **Views**:
  - `Views/NhapHang/Index.cshtml`: Màn hình danh sách (cột lọc trái + bảng).
  - `Views/NhapHang/_NhapHangFilterSidebar.cshtml`: 5 khối lọc (Trạng thái, Thời gian, Người tạo, Số hóa đơn, Người nhập).
  - `Views/NhapHang/_NhapHangTable.cshtml`: Bảng phiếu nhập, sao header, summary-row, accordion chi tiết inline.
  - `Views/NhapHang/Create.cshtml`, `Edit.cshtml`, `Details.cshtml`: Màn hình lập / sửa / xem chi tiết.
  - `Views/NhapHang/_NhapHangForm.cshtml`: Form 2 cột chuẩn KiotViet (bảng hàng, F3 autocomplete, F4 panel).
- **Styles & Scripts**:
  - `wwwroot/css/nhap-hang.css`: Kế thừa `kiem-kho.css` & `site.css`.
  - `wwwroot/js/nhap-hang-index.js`: Lọc AJAX, sao, Excel, LEGO `KiotFilter.initColumnToggle` & `initRowDetail`.
  - `wwwroot/js/nhap-hang-form.js`: LEGO `f3-product-search`, chọn NCC, import Excel, phím tắt F3/F4/F9/F10.

---

## 2. Luồng Nghiệp vụ & Giao diện (Theo 2 Ảnh KiotViet)

### 2.1. Màn hình 1: Danh sách Phiếu Nhập Hàng (`Index`)
- **Cột lọc trái (Sidebar)**:
  - Trạng thái: Checkbox `Phiếu tạm` (`PHIEU_TAM`), `Đã nhập hàng` (`DA_XAC_NHAN`), `Đã hủy` (`DA_HUY`).
  - Thời gian: `<partial name="_KiotDateFilter" />` (mặc định "Tháng này" + popup chọn nhanh / lịch tùy chỉnh).
  - Người tạo: Dropdown chọn người dùng lập phiếu.
  - Số hóa đơn đầu vào: Input tìm theo số hóa đơn.
  - Người nhập: Dropdown chọn nhân viên xác nhận nhập.
- **Thanh công cụ (Topbar)**:
  - Tiêu đề: "Nhập hàng", ô tìm kiếm "Theo mã phiếu nhập (F3)".
  - Nút: `+ Nhập hàng` (chuyển sang `/NhapHang/Create`), `Xuất file ▾`, `Tùy chọn hiển thị cột`, `Cài đặt`, `Trợ giúp`.
- **Bảng dữ liệu (`_NhapHangTable`)**:
  - Dòng tổng hợp `summary-row`: Căn phải tổng `Cần trả NCC`.
  - Cột: ☐ Chọn, ☆ Đánh dấu sao, Mã nhập hàng (`PN000047`), Thời gian, Mã NCC, Nhà cung cấp, Cần trả NCC, Trạng thái (`Phiếu tạm` vàng/cam, `Đã nhập hàng` xanh lá, `Đã hủy` xám/đỏ).
  - Click dòng bung chi tiết `tr.product-detail-row` trượt mượt mà 150ms, viền xanh `#0070f3` khép kín hình chữ nhật, có bảng chi tiết hàng hóa, nút In, Hủy phiếu, Mở sửa phiếu tạm.

### 2.2. Màn hình 2: Lập / Sửa Phiếu Nhập Hàng (`Create` / `Edit`)
- **Khu vực bên trái (Vùng bảng hàng hóa)**:
  - Nút quay lại `← Nhập hàng`.
  - Ô tìm kiếm hàng hóa: F3 autocomplete, nút lưới chọn theo nhóm, nút `+` thêm nhanh hàng hóa.
  - Trạng thái rỗng: Khối "Thêm sản phẩm từ file excel" (Tải file mẫu, Chọn file dữ liệu).
  - Bảng hàng hóa: STT, Mã hàng, Tên hàng, ĐVT, Số lượng (format .kiot-num), Đơn giá nhập, Giảm giá, Thành tiền, nút Xóa.
- **Panel bên phải (Thông tin phiếu nhập)**:
  - Người tạo + Bộ chọn ngày giờ nhập.
  - Tìm nhà cung cấp: Ô autocomplete tìm NCC + nút `+` mở nhanh modal tạo NCC.
  - Mã phiếu nhập: Placeholder "Mã phiếu tự động", cho phép nhập tay hoặc sinh `PN000001`.
  - Mã đặt hàng nhập.
  - Trạng thái: "Phiếu tạm".
  - Số hóa đơn đầu vào: Input nhập số HĐ.
  - Tổng tiền hàng: Tính tổng thành tiền các dòng.
  - Giảm giá: Input giảm giá tổng phiếu.
  - Cần trả nhà cung cấp = Tổng tiền hàng - Giảm giá.
  - Ghi chú: Textarea.
  - 2 Nút thao tác đáy:
    - **"Lưu tạm"** (`PHIEU_TAM`): Chưa tăng tồn kho, cho phép sửa/xóa.
    - **"Hoàn thành"** (`DA_XAC_NHAN`): Tăng tồn kho ngay lập tức, ghi nợ NCC, khóa chứng từ.

---

## 3. Khối Lego Tái sử dụng BẮT BUỘC (Tuân thủ Luật 10)
- [x] **`_KiotDateFilter.cshtml` & `KiotFilter.initDateFilter`**: Lọc ngày 5 nhóm preset + 2 lịch kép.
- [x] **`_Pagination.cshtml`**: Phân trang AJAX và chọn số dòng hiển thị (15 dòng).
- [x] **`KiotFilter.initColumnToggle`**: Tùy biến cột, tự động tính `colspan`, gán `.last-visible-col`.
- [x] **`KiotFilter.initRowDetail`**: Quản lý accordion Master-Detail, trượt mở 150ms, viền xanh khép kín.
- [x] **`KiotFilter.initEntityActions`**: Quản lý hành động xóa / hủy phiếu.
- [x] **`f3-product-search.js`**: Tìm kiếm hàng hóa qua phím tắt F3, quét mã vạch hoặc gõ tên.
- [x] **`KiotToast`**: Thông báo capsule tối màu không kẻ dọc, có icon phân loại.
- [x] **`KiotNumber` & `.kiot-num`**: Tự động định dạng số tiền hàng nghìn (100,000).
- [x] **`BaseKhoController` & `INhatKyThaoTacService`**: Quản lý kho hiện tại và audit log.

---

## 4. Quy tắc Nghiệp vụ & CSDL
1. **Mã phiếu nhập**: Tiền tố `PN` + 6 chữ số (`PN000001`). Cho phép nhập mã tùy biến nếu không trùng.
2. **Biến động tồn kho**: Tự động tăng tồn kho qua `vw_TonKhoHienTai` khi phiếu ở trạng thái `DA_XAC_NHAN`.
3. **Tính toán Công nợ**: Tăng tổng tiền mua và công nợ của Nhà cung cấp tương ứng.
4. **Quy tắc bất biến**: Phiếu đã hoàn thành (`DA_XAC_NHAN`) **tuyệt đối không được sửa hay xóa**; nếu có sai sót phải lập phiếu trả hàng hoặc kiểm kê cân bằng. Phiếu tạm (`PHIEU_TAM`) được phép sửa hoặc xóa.
5. **Giao dịch**: Mọi thao tác lưu chứng từ bọc trong `using var trans = await _context.Database.BeginTransactionAsync();`.
