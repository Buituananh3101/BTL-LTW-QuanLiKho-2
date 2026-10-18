# Đặc tả Chức năng: Kiểm kho (Stock Take)

> **Mục tiêu**: Chuẩn hóa toàn diện phân hệ Kiểm kho theo khuôn mẫu LEGO KiotViet của module Danh sách Hàng hóa.

---

## 1. Các bảng CSDL, ViewModel & Cấu trúc File

### 1.1. Bảng CSDL tham gia:
- [`PhieuKiemKe`](../../BTL-LTW-QuanLiKho-2/Models/PhieuKiemKe.cs): Thông tin phiếu (`MaPhieuKiemKe`, `MaKho`, `MaNvlap`, `ThoiDiemChot`, `TrangThai: NHAP / DA_DIEU_CHINH / HUY`, `GhiChu`).
- [`ChiTietPhieuKiemKe`](../../BTL-LTW-QuanLiKho-2/Models/ChiTietPhieuKiemKe.cs): Dòng kiểm (`MaHang`, `SoLuongTheoSo`, `SoLuongThucTe`, `DonGia`).
- [`PhieuDieuChinh`](../../BTL-LTW-QuanLiKho-2/Models/PhieuDieuChinh.cs) & [`ChiTietPhieuDieuChinh`](../../BTL-LTW-QuanLiKho-2/Models/ChiTietPhieuDieuChinh.cs): Tự sinh khi cân bằng kho (`DA_DUYET`).
- [`NhatKyThaoTac`](../../BTL-LTW-QuanLiKho-2/Models/NhatKyThaoTac.cs): Ghi log kiểm toán thao tác.

### 1.2. ViewModels sử dụng:
- [`PhieuKiemKeIndexVM`](../../BTL-LTW-QuanLiKho-2/ViewModels/KiemKho/KiemKhoViewModels.cs): Dữ liệu danh sách, cung cấp `PagedData` (`PagedResult<PhieuKiemKeListItemVM>`) cho component `_Pagination.cshtml`.
- [`PhieuKiemKeFilterVM`](../../BTL-LTW-QuanLiKho-2/ViewModels/KiemKho/KiemKhoViewModels.cs): Bộ lọc tìm kiếm (`CreatorIds`, `DateFilterType`, `Statuses`, `Q`).
- [`PhieuKiemKeListItemVM`](../../BTL-LTW-QuanLiKho-2/ViewModels/KiemKho/KiemKhoViewModels.cs): Dữ liệu dòng và mảng `Lines` chi tiết.
- [`PhieuKiemKeFormVM`](../../BTL-LTW-QuanLiKho-2/ViewModels/KiemKho/KiemKhoViewModels.cs): Dữ liệu form lập/sửa/xem chi tiết.
- [`SaveStockTakeRequest`](../../BTL-LTW-QuanLiKho-2/ViewModels/KiemKho/KiemKhoViewModels.cs): DTO nhận JSON lưu tạm/cân bằng.
- [`UpdateNoteRequest`](../../BTL-LTW-QuanLiKho-2/ViewModels/KiemKho/KiemKhoViewModels.cs): DTO cập nhật nhanh ghi chú inline.

### 1.3. Cấu trúc View & Script (Khuôn mẫu LEGO Hàng hóa):
- `Views/PhieuKiemKe/Index.cshtml`: Trang chủ layout `.kiot-container`, `.kiot-main-col`, `.kiot-toolbar-row`, nút `#btnToggleSidebar` (F4).
- `Views/PhieuKiemKe/_PhieuKiemKeFilterSidebar.cshtml`: Partial `.kiot-sidebar-col` (thời gian, 3 trạng thái, chip người tạo).
- `Views/PhieuKiemKe/_PhieuKiemKeTable.cshtml`: Partial bảng bọc trong `.kiot-table-scroll-body`, chi tiết inline `tr.dtl`, phân trang qua `_Pagination.cshtml`.
- `Views/PhieuKiemKe/Create.cshtml` & `Edit.cshtml`: Màn hình lập và sửa phiếu.
- `Views/PhieuKiemKe/Details.cshtml`: Màn hình xem chi tiết phiếu (chỉ đọc).
- `Views/PhieuKiemKe/_PhieuKiemKeForm.cshtml`: Partial layout 2 cột KiotViet dùng chung.
- `wwwroot/css/kiem-kho.css`: CSS bổ trợ cho popup lịch và form 2 cột, kế thừa `site.css`.
- `wwwroot/js/phieu-kiem-ke-index.js`: Script lọc AJAX, toggle F4, F3 debounce, mở rộng dòng `tr.dtl`.
- `wwwroot/js/phieu-kiem-ke-form.js`: Script tính lệch realtime, F3/F9/F10, nạp nhóm, kiểm gần đây, nhập file.

---

## 2. Luồng màn hình & Tương tác

### 2.1. Màn hình Danh sách (`Index`)
- **Toolbar (`.kiot-toolbar-row`)**: Ô tìm kiếm `#keywordSearch` (F3 debounce), nút `+ Kiểm kho` (`btn-primary`), nút `Xuất file` (dropdown danh sách/chi tiết), nút `Hiển thị cột`, tải lại bảng (`bi-arrow-clockwise`), trợ giúp.
- **Sidebar (`.kiot-sidebar-col`)**:
  - Tiêu đề "Phiếu kiểm kho", nút tròn F4 ở ranh giới giữa 2 cột thu gọn/mở rộng sidebar.
  - Thời gian: Chuẩn 100% Danh sách Hàng hóa với 2 radio (Toàn thời gian / Tùy chỉnh), popup chọn nhanh 3 cột (Ngày, Tuần, Tháng + pill Toàn thời gian) và popup lịch 2 tháng Dual Calendar.
  - Trạng thái: Checkbox Phiếu tạm (`NHAP`), Đã cân bằng (`DA_DIEU_CHINH`), Đã hủy (`HUY`).
  - Người tạo: Multi-select chuẩn KiotViet (`.kiot-multiselect-box`, thẻ `.kiot-pill-tag`, badge `+N khác`, checkbox và tìm kiếm sticky `.kiot-ms-search`).
  - Hỗ trợ responsive mobile drawer qua `#btnMobileFilter` và `#sidebarBackdrop`.
- **Bảng dữ liệu & Bung mở chi tiết (`tr.dtl`)**:
  - Dòng chính `tr.tbl-row`: Hiển thị thông tin tổng hợp dạng chữ thường tiêu chuẩn (Mã kiểm kho, các cột số lượng), sao (`bi-star`), checkbox chọn, soft badge KiotViet.
  - Click dòng: Bung mở accordion inline `tr.dtl` chuẩn KiotViet với 5 cột (Mã hàng, Tên hàng, Tồn kho, Thực tế, SL lệch), ô lọc mã/tên hàng, textarea ghi chú, 4 chỉ số tổng kết số lượng và các nút thao tác:
    + **Hủy**: Nút outline `Hủy` (chỉ hủy phiếu tạm `NHAP`; cảnh báo không được phép hủy phiếu đã cân bằng kho theo Luật 6).
    + **Sao chép**: Điều hướng sang `/PhieuKiemKe/Create?copyId={id}` nạp lại các sản phẩm.
    + **Xuất file**: Xuất CSV chi tiết cho riêng phiếu này.
    + **Mở phiếu**: Mở form chỉnh sửa `/PhieuKiemKe/Edit/{id}` (chỉ áp dụng với phiếu tạm `NHAP`).
    + **Lưu**: Lưu nhanh ghi chú qua API `SaveNote`.
    + **In**: In phiếu kiểm (`window.print()`).
  - **Phân trang**: Tái sử dụng component `_Pagination.cshtml` dùng chung qua AJAX.

### 2.2. Màn hình Lập / Sửa phiếu (`Create` / `Edit`)
- **Cột trái (Lưới kiểm hàng)**:
  - Ô tìm kiếm F3: Autocomplete gợi ý hàng hóa (ảnh, tên, mã, giá, tồn). Quét trùng hàng tự động `+1` số Thực tế.
  - Nút **Chọn theo nhóm**: Modal chọn nhóm nạp hàng loạt sản phẩm ở trạng thái Chưa kiểm (`act = null`).
  - 4 Tab lọc: Tất cả, Khớp, Lệch, Chưa kiểm (hiển thị số lượng trên tab), màu xanh KiotViet `#0070f4`.
  - Lưới hàng hóa: STT, Mã (font chữ thường tiêu chuẩn), Tên, ĐVT, Tồn sổ sách, Thực tế (input `.qty`), SL lệch, Giá trị lệch, Nút xóa (`bi-trash`). Header nền `#f8fafc`, viền `#e2e8f0`, chữ xám `#475569`, font 13px weight 600 giống Hàng hóa.
  - Nhập file Excel/CSV: Đọc file nạp trực tiếp vào số Thực tế; Empty State với icon `bi-file-earmark-spreadsheet` và nút chọn file.
- **Cột phải (Panel thông tin & Thao tác)**:
  - Nút gập mở panel tròn xanh (`bi-chevron-right` / `bi-chevron-left`).
  - Người tạo, Bộ chọn Ngày giờ kiểm trực quan (`#fDate` & `#dtPop` tích hợp popup lịch tháng và khung giờ), Mã phiếu, Kho kiểm, Trạng thái (Soft Badges).
  - Tổng kết: Tổng số thực tế, lệch tăng, lệch giảm, chênh lệch.
  - Ô ghi chú và widget **Kiểm gần đây**.
  - 2 Nút hành động đáy: **Lưu tạm (F9)** và **Cân bằng kho (F10)** bo góc 6px, chiều cao 56px, màu xanh KiotViet `#0070f4` và xanh lá `#10b981`.

---

## 3. Nghiệp vụ Backend & Cân bằng kho (`Complete`)
1. **Lưu tạm (`SaveDraft`)**: Lưu phiếu trạng thái `'NHAP'`, bọc Transaction, đóng băng đơn giá, không đổi tồn kho sổ sách.
2. **Cân bằng kho (`Complete`)**:
   - Chặn tồn âm qua `_tonKhoService.KiemTraKiemKeAsync`.
   - Bọc trong `Database.BeginTransactionAsync`.
   - Đọc lại tồn sổ sách hiện thời từ view `vw_TonKhoHienTai`.
   - Chốt giá vốn và cập nhật `ChiTietPhieuKiemKe`.
   - Lọc các dòng đã kiểm có chênh lệch: Tự động sinh `PhieuDieuChinh` trạng thái `'DA_DUYET'` và các bản ghi `ChiTietPhieuDieuChinh`.
   - Chuyển trạng thái phiếu kiểm sang `'DA_DIEU_CHINH'`.
   - Ghi nhật ký vào `NhatKyThaoTac` qua `_nhatKyService.GhiNhatKyAsync`.
   - Commit transaction.
3. **Khóa phiếu vĩnh viễn (Luật 6)**:
   - Phiếu đã cân bằng (`DA_DIEU_CHINH`) bị khóa vĩnh viễn: cấm sửa, xóa hoặc hủy.
   - Endpoint `HuyPhieu` chỉ cho phép hủy phiếu ở trạng thái tạm (`NHAP`).
