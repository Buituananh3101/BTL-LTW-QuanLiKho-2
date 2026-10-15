# Đặc tả Chức năng: Kiểm kho (Stock Take)

> **Mục tiêu**: Nâng cấp và chuẩn hóa phân hệ Kiểm kho khớp 100% bản vẽ thiết kế mẫu tại `prototype-kiemkho-full.html` theo chuẩn giao diện KiotViet.

---

## 1. Các bảng CSDL, ViewModel & Thành phần liên quan

### 1.1. Bảng CSDL tham gia:
- [`PhieuKiemKe`](../../BTL-LTW-QuanLiKho-2/Models/PhieuKiemKe.cs): Thông tin chung (`MaPhieuKiemKe`, `MaKho`, `MaNvlap`, `ThoiDiemChot`, `TrangThai: NHAP / DA_DIEU_CHINH / HUY`, `GhiChu`).
- [`ChiTietPhieuKiemKe`](../../BTL-LTW-QuanLiKho-2/Models/ChiTietPhieuKiemKe.cs): Chi tiết từng mặt hàng (`MaCTKiemKe`, `MaPhieuKiemKe`, `MaHang`, `SoLuongTheoSo`, `SoLuongThucTe`, `DonGia`).
- [`PhieuDieuChinh`](../../BTL-LTW-QuanLiKho-2/Models/PhieuDieuChinh.cs): Tự động sinh khi cân bằng kho (`MaPhieuDieuChinh`, `MaPhieuKiemKe`, `NgayDuyet`, `TrangThai: DA_DUYET`).
- [`ChiTietPhieuDieuChinh`](../../BTL-LTW-QuanLiKho-2/Models/ChiTietPhieuDieuChinh.cs): Chứa số lượng chênh lệch (`SoLuongDieuChinh = ThucTe - SoSach`).
- [`NhatKyThaoTac`](../../BTL-LTW-QuanLiKho-2/Models/NhatKyThaoTac.cs): Ghi log hành động lập, sửa, cân bằng và hủy phiếu.

### 1.2. ViewModels sử dụng:
- [`PhieuKiemKeIndexVM`](../../BTL-LTW-QuanLiKho-2/ViewModels/KiemKho/KiemKhoViewModels.cs): Dữ liệu trang danh sách.
- [`PhieuKiemKeFilterVM`](../../BTL-LTW-QuanLiKho-2/ViewModels/KiemKho/KiemKhoViewModels.cs): Bộ lọc tìm kiếm (kế thừa hỗ trợ `CreatorIds`, `DateFilterType`, `Statuses`).
- [`PhieuKiemKeListItemVM`](../../BTL-LTW-QuanLiKho-2/ViewModels/KiemKho/KiemKhoViewModels.cs): Dữ liệu hiển thị từng dòng phiếu kiểm và mảng `Lines` chi tiết.
- [`PhieuKiemKeFormVM`](../../BTL-LTW-QuanLiKho-2/ViewModels/KiemKho/KiemKhoViewModels.cs): Dữ liệu form lập/sửa/xem chi tiết phiếu.
- [`SaveStockTakeRequest`](../../BTL-LTW-QuanLiKho-2/ViewModels/KiemKho/KiemKhoViewModels.cs): DTO nhận JSON lưu tạm hoặc cân bằng kho.
- [`UpdateNoteRequest`](../../BTL-LTW-QuanLiKho-2/ViewModels/KiemKho/KiemKhoViewModels.cs): DTO cập nhật nhanh ghi chú trực tiếp từ dòng chi tiết.

### 1.3. Cấu trúc View & Script:
- `Views/PhieuKiemKe/Index.cshtml`: Trang chủ danh sách phiếu kiểm kho.
- `Views/PhieuKiemKe/_PhieuKiemKeFilterSidebar.cshtml`: Partial cột lọc bên trái (thời gian nhanh, lịch 2 tháng, trạng thái, chips người tạo).
- `Views/PhieuKiemKe/_PhieuKiemKeTable.cshtml`: Partial bảng dữ liệu (bung mở chi tiết dòng `tr.dtl`, phân trang, badge trạng thái).
- `Views/PhieuKiemKe/Create.cshtml`: Màn hình lập và sửa phiếu kiểm kho.
- `Views/PhieuKiemKe/Details.cshtml`: Màn hình xem chi tiết phiếu kiểm (chế độ chỉ đọc).
- `Views/PhieuKiemKe/_PhieuKiemKeForm.cshtml`: Partial layout 2 cột KiotViet dùng chung.
- `wwwroot/css/kiem-kho.css`: CSS độc lập bóc tách 100% từ prototype.
- `wwwroot/js/phieu-kiem-ke-index.js`: Script xử lý lọc AJAX, mở rộng dòng `tr.dtl`, lưu ghi chú, modal hủy phiếu.
- `wwwroot/js/phieu-kiem-ke-form.js`: Script tính toán lệch realtime, F3/F9/F10, nạp nhóm hàng, widget kiểm gần đây, nhập file Excel/CSV.

---

## 2. Luồng màn hình & Tương tác

### 2.1. Màn hình Danh sách (`Index`)
- **Topbar**: Tìm kiếm mã phiếu `#q` (debounce), nút `+ Kiểm kho`, nút `Xuất file` (danh sách / chi tiết), nút `Hiển thị cột`, cài đặt, trợ giúp.
- **Sidebar bộ lọc**:
  - Thời gian: Chọn nhanh (Hôm nay, Hôm qua, Tuần này, Tháng này, Quý, Năm) hoặc popup lịch 2 tháng tùy chỉnh.
  - Trạng thái: Checkbox Phiếu tạm (`NHAP`), Đã cân bằng (`DA_DIEU_CHINH`), Đã hủy (`HUY`).
  - Người tạo: Multi-select dạng chip tag, tìm kiếm nhân viên theo tên.
  - Nút thu gọn / mở rộng sidebar ở mép phải.
- **Bảng dữ liệu & Bung mở chi tiết (`tr.dtl`)**:
  - Click vào dòng phiếu kiểm: Bung mở accordion inline hiển thị bảng hàng hóa kiểm kê, bộ lọc tìm mã/tên hàng ngay trong dòng, ô ghi chú, tổng kết số lượng và các nút thao tác:
    + **Hủy phiếu**: Chỉ khả dụng với phiếu tạm (`NHAP`), mở modal xác nhận, gọi API `HuyPhieu`.
    + **Sao chép**: Điều hướng sang `/PhieuKiemKe/Create?copyId={id}` nạp lại các sản phẩm ở trạng thái Chưa kiểm.
    + **Xuất file**: Xuất CSV chi tiết cho riêng phiếu này.
    + **Mở phiếu**: Mở form chỉnh sửa `/PhieuKiemKe/Edit/{id}` (phiếu tạm).
    + **Lưu**: Lưu nhanh ghi chú qua API `SaveNote`.
    + **In**: In phiếu kiểm.

### 2.2. Màn hình Lập / Sửa phiếu (`Create` / `Edit`)
- **Cột trái (Lưới kiểm hàng)**:
  - Ô tìm kiếm F3: Autocomplete gợi ý hàng hóa kèm ảnh, tên, mã, giá và tồn kho. Nếu quét trùng hàng đã có thì tự động `+1` vào số Thực tế.
  - Nút **Chọn theo nhóm**: Modal chọn nhóm hàng nạp hàng loạt sản phẩm ở trạng thái Chưa kiểm (`act = null`).
  - 4 Tab lọc dòng kiểm: Tất cả, Khớp, Lệch, Chưa kiểm (hiển thị số lượng tương ứng trên từng tab).
  - Lưới hàng hóa: STT, Mã, Tên, ĐVT, Tồn sổ sách, Thực tế (input `.qty`, nền vàng khi chưa kiểm), SL lệch (tô màu xanh/đỏ), Giá trị lệch, Nút xóa dòng.
  - Nhập file Excel/CSV: Đọc trực tiếp từ file đưa vào số Thực tế.
- **Cột phải (Panel thông tin & Thao tác)**:
  - Nút gập mở panel tròn xanh.
  - Người tạo, Ngày giờ kiểm (hỗ trợ chọn ngày và giờ), Mã phiếu, Kho kiểm, Trạng thái.
  - Tổng kết: Tổng số lượng thực tế, hoặc khi ở tab Lệch thì hiện Tổng lệch tăng, Tổng lệch giảm, Tổng chênh lệch.
  - Ô ghi chú phiếu kiểm.
  - Widget **Kiểm gần đây**: Lưu vết danh sách các mặt hàng vừa thao tác.
  - 2 Nút hành động lớn: **LƯU TẠM (F9)** và **CÂN BẰNG KHO (F10)**.

---

## 3. Nghiệp vụ Backend & Cân bằng kho (`Complete`)
1. **Lưu tạm (`SaveDraft`)**: Lưu/cập nhật phiếu ở trạng thái `'NHAP'`, bọc Transaction, đóng băng đơn giá, không sinh phiếu điều chỉnh và không thay đổi tồn kho sổ sách.
2. **Cân bằng kho (`Complete`)**:
   - Chặn tồn âm nghiệp vụ qua `_tonKhoService.KiemTraKiemKeAsync`.
   - Mở giao dịch `Database.BeginTransactionAsync`.
   - Đọc lại tồn sổ sách hiện thời từ view `vw_TonKhoHienTai`.
   - Chốt giá vốn và cập nhật `ChiTietPhieuKiemKe`.
   - Lọc các dòng đã kiểm có chênh lệch (`SoLuongThucTe.HasValue && (SoLuongThucTe - SoLuongTheoSo != 0)`): Tự động sinh `PhieuDieuChinh` trạng thái `'DA_DUYET'` và các bản ghi `ChiTietPhieuDieuChinh`.
   - Chuyển trạng thái phiếu kiểm sang `'DA_DIEU_CHINH'`.
   - Ghi nhật ký vào `NhatKyThaoTac` qua `_nhatKyService.GhiNhatKyAsync`.
   - Commit transaction.
3. **Khóa phiếu vĩnh viễn (Luật 6)**:
   - Phiếu đã cân bằng (`DA_DIEU_CHINH`) bị khóa vĩnh viễn: không cho phép sửa, xóa hoặc hủy.
   - Endpoint `HuyPhieu` từ chối xử lý nếu phiếu ở trạng thái `DA_DIEU_CHINH`.
   - Chỉ cho phép hủy phiếu ở trạng thái tạm (`NHAP`).
