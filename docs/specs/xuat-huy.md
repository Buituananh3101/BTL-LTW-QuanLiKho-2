# Đặc tả Chức năng: Xuất hủy (Waste-Disposal Export)

> **Mục tiêu**: Chuẩn hóa toàn diện phân hệ Xuất hủy theo khuôn mẫu LEGO KiotViet dựa trên 2 ảnh chụp thực tế từ hệ thống KiotViet.

---

## 1. Các bảng CSDL, ViewModel & Cấu trúc File

### 1.1. Bảng CSDL tham gia:
- [`PhieuXuat`](../../BTL-LTW-QuanLiKho-2/Models/PhieuXuat.cs): Thông tin phiếu (`MaPhieuXuat`, `MaPhieu`, `LoaiPhieuXuat: 'XUAT_HUY'`, `MaKho`, `MaNvlap`, `MaNvxacNhan`, `NgayLap`, `NgayXacNhan`, `TrangThai: NHAP / DA_XAC_NHAN / HUY`, `GhiChu`, `DaDanhDau`).
- [`ChiTietPhieuXuat`](../../BTL-LTW-QuanLiKho-2/Models/ChiTietPhieuXuat.cs): Dòng xuất hủy (`MaCtphieuXuat`, `MaPhieuXuat`, `MaHang`, `SoLuongXuat`, `DonGiaXuat`).
- [`vw_BienDongKho`](../../migrations/sql/01_init_schema.sql): View biến động kho tự động trừ tồn kho khi `LoaiPhieuXuat = 'XUAT_HUY'` và `TrangThai = 'DA_XAC_NHAN'`.
- [`NhatKyThaoTac`](../../BTL-LTW-QuanLiKho-2/Models/NhatKyThaoTac.cs): Ghi log kiểm toán thao tác xuất hủy.

### 1.2. ViewModels sử dụng:
- [`XuatHuyIndexVM`](../../BTL-LTW-QuanLiKho-2/ViewModels/XuatHuy/XuatHuyViewModels.cs): Dữ liệu màn hình Index, `PagedData`, lọc sao `DaDanhDauFilter`, danh sách Người tạo & Người xuất hủy.
- [`XuatHuyFilterVM`](../../BTL-LTW-QuanLiKho-2/ViewModels/XuatHuy/XuatHuyViewModels.cs): Bộ lọc (`DateFilterType` mặc định `THANG_NAY`, `Statuses`, `CreatorIds`, `ConfirmerIds`, `Q`, `DaDanhDau`).
- [`XuatHuyListItemVM`](../../BTL-LTW-QuanLiKho-2/ViewModels/XuatHuy/XuatHuyViewModels.cs): Dòng danh sách, `MaPhieuHienThi` (`XH00000X`), `TongSoLuong`, `TongGiaTriHuy`, `Lines`.
- [`XuatHuyFormVM`](../../BTL-LTW-QuanLiKho-2/ViewModels/XuatHuy/XuatHuyViewModels.cs): Dữ liệu form lập/sửa, danh sách `NhanViens`, `IsReadOnly`.
- [`SaveXuatHuyRequest`](../../BTL-LTW-QuanLiKho-2/ViewModels/XuatHuy/XuatHuyViewModels.cs): DTO nhận JSON lưu tạm/hoàn thành.
- [`UpdateXuatHuyNoteRequest`](../../BTL-LTW-QuanLiKho-2/ViewModels/XuatHuy/XuatHuyViewModels.cs): DTO cập nhật nhanh ghi chú inline.

### 1.3. Cấu trúc View & Script:
- `Views/XuatHuy/Index.cshtml`: Layout `.kiot-container`, `.kiot-main-col`, toolbar KiotViet, nút F4.
- `Views/XuatHuy/_XuatHuyFilterSidebar.cshtml`: Sidebar lọc thời gian (Tháng này), trạng thái, người tạo, người xuất hủy.
- `Views/XuatHuy/_XuatHuyTable.cshtml`: Bảng chứng từ xuất hủy, sao bookmark, accordion `tr.dtl`, `_Pagination.cshtml`.
- `Views/XuatHuy/Create.cshtml`, `Edit.cshtml`, `Details.cshtml`: Màn hình tạo, sửa và xem chi tiết (read-only) phiếu xuất hủy.
- `Views/XuatHuy/_XuatHuyForm.cshtml`: Partial form 2 cột chuẩn `kiem-kho.css` (bảng lưới, F3 autocomplete, F4 panel, F9/F10).
- `wwwroot/css/xuat-huy.css` & `kiem-kho.css`: CSS bảng xuất hủy, panel thông tin F4, trạng thái active row `.open`.
- `wwwroot/js/xuat-huy-index.js`: Script lọc AJAX, sao bookmark, phím tắt F3/F4, accordion `tr.dtl`, in ấn, xuất Excel.
- `wwwroot/js/xuat-huy-form.js`: Script tìm kiếm hàng F3, bảng hàng xuất hủy, import Excel, phím tắt F3/F4/F9/F10.

---

## 2. Luồng màn hình & Tương tác

### 2.1. Màn hình Danh sách (`Index`)
- **Toolbar (`.kiot-toolbar-row`)**: Ô tìm kiếm `#keywordSearch` ("Theo mã xuất hủy (F3)"), nút `+ Xuất hủy`, nút `Xuất file` (Danh sách / Chi tiết), nút `Tùy chọn hiển thị cột` (hỗ trợ 9 cột), nút tải lại bảng.
- **Sidebar (`.kiot-sidebar-col`)**:
  - Tiêu đề "Xuất hủy", nút tròn F4 thu gọn/mở rộng sidebar.
  - Trạng thái: Checkbox `Phiếu tạm` (`NHAP`), `Hoàn thành` (`DA_XAC_NHAN`), `Đã hủy` (`HUY`).
  - Thời gian: Mặc định `Tháng này` (`THANG_NAY`), hỗ trợ Dual Calendar tùy chỉnh ngày.
  - Người tạo: Multi-select dropdown (`_KiotMultiSelectFilter.cshtml`).
  - Người xuất hủy: Multi-select dropdown (`_KiotMultiSelectFilter.cshtml`).
- **Đánh dấu Sao Bookmark**:
  - Header: Lọc các phiếu có sao (`DaDanhDau`).
  - Dòng: Click sao ⭐ lưu trực tiếp trạng thái vào CSDL qua AJAX `ToggleFavorite`.
- **Cấu trúc Cột bảng (`_XuatHuyTable`)**:
  - Checkbox, Sao bookmark.
  - Mã xuất hủy, Tổng giá trị hủy (căn phải), Thời gian, Thời gian tạo (tùy chọn), Chi nhánh, Người xuất hủy (tùy chọn), Người tạo (tùy chọn), Ghi chú, Trạng thái.
- **Bung mở chi tiết (`tr.dtl`)**:
  - Click dòng thêm class `.open` vào `tr.tbl-row`, tạo đường viền xanh 4px bên trái kết nối dòng và bảng chi tiết `.dp`.
  - Thông tin chứng từ: Người tạo, Người xuất hủy, Ngày xuất hủy, Chi nhánh (định dạng divider `|` chuẩn).
  - Bảng dòng hàng (`dtl-tbl`): 5 cột chuẩn KiotViet: `Mã hàng`, `Tên hàng`, `SL hủy`, `Giá vốn`, `Giá trị hủy` kèm ô tìm kiếm inline `Tìm mã hàng`, `Tìm tên hàng`.
  - Khối dưới: Ô textarea ghi chú (placeholder "Chưa có") và tổng kết `Tổng số lượng hủy`, `Tổng giá trị hủy`.
  - Hàng nút hành động:
    + Cụm trái: `Hủy` (mở modal `KiotConfirm`), `Sao chép`, `Xuất file`.
    + Spacer `ms-auto`.
    + Cụm phải: `Lưu` ghi chú AJAX, `In` (`window.print()`), `Mở phiếu` (nếu phiếu tạm).

### 2.2. Màn hình Lập / Sửa / Xem chi tiết (`Create` / `Edit` / `Details`)
- Tự động điều hướng: Truy cập `Edit/{id}` với phiếu đã hoàn thành/hủy sẽ chuyển tiếp sang `Details/{id}`.
- Chế độ chỉ đọc (`IsReadOnly = true`): Ẩn thanh tìm kiếm F3, khóa các trường nhập liệu, hiển thị banner thông tin xác nhận thời điểm và người duyệt.
- **Header**: Nút `← Xuất hủy` quay lại trang danh sách, ô tìm kiếm `Tìm mặt hàng (F3)` với gợi ý xổ xuống tức thì, nút tải file mẫu và import Excel.
- **Bảng hàng hóa (Cột trái)**:
  - Trạng thái rỗng: Hiện khối thân thiện "Thêm sản phẩm từ file excel" với 2 nút: `Tải về file mẫu` và `Chọn file dữ liệu`.
  - Trạng thái có hàng: Hiển thị bảng STT, Mã hàng, Tên hàng, ĐVT, Số lượng hủy (input số), Giá vốn (input số), Giá trị hủy (thành tiền), nút Xóa dòng.
  - Chọn trùng hàng: Tự động tăng số lượng hủy lên 1.
- **Panel bên phải (F4)**:
  - Dropdown `Người xuất hủy`: Chọn nhân viên phụ trách xuất hủy.
  - `Ngày giờ`: Chọn ngày giờ giao dịch.
  - `Mã xuất hủy`: Tự động sinh `XH{0:D6}` nếu để trống, hoặc hỗ trợ nhập tay (kiểm tra trùng lặp).
  - `Trạng thái`: Badge "Phiếu tạm" hoặc "Hoàn thành".
  - `Tổng giá trị hủy`: Huy hiệu đếm số lượng mặt hàng `[N]` và tổng số tiền đỏ đậm.
  - `Ghi chú`: Ô nhập ghi chú xuất hủy.
  - Hai nút hành động đáy form:
    + `Lưu tạm (F9)`: Lưu phiếu ở trạng thái `NHAP` (chưa trừ tồn kho).
    + `Hoàn thành (F10)`: Modal xác nhận -> Cập nhật `TrangThai = 'DA_XAC_NHAN'` (tự động trừ tồn kho qua View CSDL).

---

## 3. Quy chuẩn nghiệp vụ & Bảo mật
1. Mọi thao tác lưu và hoàn thành phiếu đều bọc trong giao dịch `Database.BeginTransactionAsync()`.
2. Phiếu đã hoàn thành (`DA_XAC_NHAN`) bị khóa chỉnh sửa nội dung chi tiết.
3. Hủy phiếu hoàn thành tự động hoàn lại tồn kho sổ sách thông qua view `vw_BienDongKho`.
4. Không tạo bảng tồn kho tĩnh; tuân thủ triệt để 12 luật cốt lõi trong `AGENTS.md`.
