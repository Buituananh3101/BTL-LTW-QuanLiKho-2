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
- `Views/XuatHuy/Create.cshtml` & `Edit.cshtml`: Màn hình tạo và sửa phiếu xuất hủy.
- `Views/XuatHuy/_XuatHuyForm.cshtml`: Partial form 2 cột KiotViet matching Screenshot 2.
- `wwwroot/css/xuat-huy.css`: CSS bảng xuất hủy, empty state tải file Excel, panel thông tin F4.
- `wwwroot/js/xuat-huy-index.js`: Script lọc AJAX, sao bookmark, phím tắt F3/F4, accordion `tr.dtl`, in ấn, xuất Excel.
- `wwwroot/js/xuat-huy-form.js`: Script tìm kiếm hàng F3, bảng hàng xuất hủy, import Excel, phím tắt F3/F4/F9/F10.

---

## 2. Luồng màn hình & Tương tác

### 2.1. Màn hình Danh sách (`Index`)
- **Toolbar (`.kiot-toolbar-row`)**: Ô tìm kiếm `#keywordSearch` ("Theo mã xuất hủy (F3)"), nút `+ Xuất hủy`, nút `Xuất file` (Danh sách / Chi tiết), nút `Tùy chọn hiển thị cột`, nút tải lại bảng.
- **Sidebar (`.kiot-sidebar-col`)**:
  - Tiêu đề "Xuất hủy", nút tròn F4 thu gọn/mở rộng sidebar.
  - Trạng thái: Checkbox `Phiếu tạm` (`NHAP`), `Hoàn thành` (`DA_XAC_NHAN`), `Đã hủy` (`HUY`).
  - Thời gian: Mặc định `Tháng này` (`THANG_NAY`), hỗ trợ Dual Calendar tùy chỉnh ngày.
  - Người tạo: Multi-select dropdown (`_KiotMultiSelectFilter.cshtml`).
  - Người xuất hủy: Multi-select dropdown (`_KiotMultiSelectFilter.cshtml`).
- **Đánh dấu Sao Bookmark**:
  - Header: Lọc các phiếu có sao (`DaDanhDau`).
  - Dòng: Click sao ⭐ lưu trực tiếp trạng thái vào CSDL qua AJAX `ToggleFavorite`.
- **Bung mở chi tiết (`tr.dtl`)**:
  - Click dòng mở accordion thông tin chứng từ: Người tạo, Thời gian, Người xuất hủy, Chi nhánh.
  - Bảng dòng hàng: Có ô tìm kiếm inline `Tìm mã hàng`, `Tìm tên hàng`.
  - Hàng nút hành động:
    + `Hủy bỏ`: Mở modal xác nhận `KiotConfirm`, cập nhật `TrangThai = 'HUY'`. Nếu phiếu đã hoàn thành, tồn kho sổ sách tự động phục hồi trong `vw_TonKhoHienTai`.
    + `Mở phiếu`: Chuyển sang màn hình sửa (nếu là phiếu tạm).
    + `Sao chép`: Tạo phiếu xuất hủy mới kế thừa toàn bộ danh sách hàng từ phiếu cũ.
    + `Xuất file`: Xuất Excel chi tiết riêng cho phiếu này.
    + `Lưu`: Cập nhật ghi chú trực tiếp qua AJAX `UpdateNote`.
    + `In`: In phiếu xuất hủy chuẩn layout giấy in.

### 2.2. Màn hình Lập / Sửa phiếu (`Create` / `Edit`)
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
