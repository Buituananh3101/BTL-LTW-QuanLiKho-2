# Đặc tả Chức năng: Báo cáo Tồn kho theo kho (Pivot Kho)

> **Mã chức năng**: `BaoCao_TonKho`  
> **Đường dẫn**: `/BaoCao/TonKho`  
> **Menu**: Desktop: `Báo cáo` ➜ `Kho` ➜ `Tồn kho theo kho` | Mobile: `Báo cáo & Thiết lập` ➜ `Báo cáo tồn kho`  
> **Người dùng**: Quản lý (xem toàn bộ kho), Thủ kho / Bán hàng (xem các kho được phân quyền trong `TaiKhoanKho`)

---

## 1. Mục tiêu & Phạm vi nghiệp vụ

- **Mục tiêu**: Cung cấp bức tranh toàn diện và tức thời về lượng tồn kho, giá trị hàng hóa lưu kho theo từng chi nhánh kho và toàn hệ thống dưới dạng bảng **Pivot kho** đa chiều chuẩn chuyên nghiệp.
- **Tính năng chính**:
  1. Thống kê KPI tổng quan: Tổng SKU mặt hàng, Tổng số lượng tồn, Tổng giá trị tồn (Giá vốn * Tồn), Số mặt hàng cần lưu ý (Dưới định mức / Hết hàng).
  2. Bảng Pivot kho: Cột cố định thông tin hàng hóa & tài chính (Mã, Tên, ĐVT, Nhóm, Giá vốn, Giá trị tồn), các cột phân bổ số lượng tồn theo từng Chi nhánh kho, và cột Tổng tồn toàn hệ thống.
  3. Lọc đa chiều: Theo chi nhánh kho (Multi-select), Nhóm hàng (Tree Combobox), Tình trạng tồn (Tất cả, Còn tồn >0, Hết hàng =0, Tồn âm <0, Dưới định mức tối thiểu, Vượt định mức tối đa), Trạng thái hàng hóa (Đang KD / Ngừng KD), Từ khóa tìm kiếm F3.
  4. Xuất file Excel chuẩn chuyên nghiệp: Xuất báo cáo đa cột kèm format số lượng, tiền tệ và dòng tổng cộng qua Lego `ExcelHelper`.
  5. Chi tiết mặt hàng (Drawer): Xem ngưỡng tồn tối thiểu/tối đa từng kho, vị trí kệ và phân bổ chi tiết.

---

## 2. Bảng CSDL & Nguồn tính toán tồn kho

- **Nguồn tồn kho**: View SQL `vw_TonKhoHienTai` (`MaKho`, `MaHang`, `SoLuongTon`) - tuân thủ Luật 4 AGENTS.md.
- **Bảng danh mục**:
  - `HangHoa`: `MaHang`, `MaHangNoiBo`, `TenHang`, `MaDvt`, `MaNhom`, `GiaVon`, `GiaBanThamKhao`, `TrangThai`, `ViTri`.
  - `Kho`: `MaKho`, `TenKho`, `TrangThai`.
  - `NhomHang`: `MaNhom`, `TenNhom`, `MaNhomCha`.
  - `DonViTinh`: `MaDvt`, `TenDvt`.
  - `NguongTonKho`: `MaKho`, `MaHang`, `TonToiThieu`, `TonCaoNhat` (dùng cảnh báo định mức).
  - `TaiKhoanKho`: Xác định danh sách kho mà tài khoản được quyền truy cập.

---

## 3. ViewModels tham gia (`ViewModels/BaoCao/`)

1. **`BaoCaoTonKhoFilterParams`** (Kế thừa `BaseFilterParams`):
   - `SelectedKhoIds`: Danh sách mã kho đang chọn lọc (`List<int>`).
   - `MaNhom`: Mã nhóm hàng cần lọc (`int?`).
   - `TinhTrangTon`: Trạng thái tồn (`ALL`, `CON_TON`, `HET_HANG`, `TON_AM`, `DUOI_DINH_MUC`, `VUOT_DINH_MUC`).
   - `TrangThaiHang`: Trạng thái kinh doanh (`DANG_BAN`, `NGUNG_BAN`, `ALL`).
2. **`BaoCaoTonKhoItemVM`**:
   - `MaHang`, `MaHangNoiBo`, `TenHang`, `TenDvt`, `TenNhom`, `ViTri`.
   - `GiaVon`, `GiaTriTon` (`= TongTon * GiaVon`).
   - `TonTheoKho`: Từ điển `Dictionary<int, decimal>` lưu tồn kho của mặt hàng tại từng `MaKho`.
   - `TongTon`: Tổng số lượng tồn của mặt hàng trên các kho đang chọn.
   - `CoDuoiDinhMuc`: Cờ bool báo hiệu mặt hàng bị dưới định mức ở ít nhất 1 kho.
   - `CoVuotDinhMuc`: Cờ bool báo hiệu mặt hàng bị vượt định mức ở ít nhất 1 kho.
3. **`BaoCaoTonKhoSummaryVM`**:
   - TongSoMatHang, TongSoLuongTon, TongGiaTriTon, SoMatHangCanLuuY, TongTonTheoKho (Dictionary<int, decimal> lưu tổng tồn từng kho trên toàn bộ tập dữ liệu đã lọc).
4. **`BaoCaoTonKhoIndexVM`**:
   - `PagedData`: `PagedResult<BaoCaoTonKhoItemVM>`.
   - `Summary`: `BaoCaoTonKhoSummaryVM`.
   - `DanhSachKho`: Danh sách các kho người dùng được quyền xem (`List<Kho>`).
   - `SelectedKhoIds`: Các kho đang chọn hiển thị cột (`List<int>`).
   - `Filter`: `BaoCaoTonKhoFilterParams`.

---

## 4. Luồng màn hình & Giao diện (Pivot đa chiều)

1. **Bố cục chính (`Views/BaoCao/TonKho.cshtml`)**:
   - Cột trái: Sidebar bộ lọc hệ thống (`_TonKhoFilterSidebar.cshtml`), nút gập mở F4.
   - Cột phải: Topbar tìm kiếm F3 + Nút ẩn/hiện cột + Nút tải lại bảng + Xuất Excel + In báo cáo + Bảng Pivot kho + Phân trang AJAX.
2. **Bảng Pivot AJAX (`_TonKhoTable.cshtml`)**:
   - Thead: Cố định thông tin mặt hàng, sinh động các cột `<th>` theo danh sách kho đang chọn lọc, cột cuối là `Tổng tồn`. Hỗ trợ sắp xếp 3 trạng thái.
   - Dòng tổng hợp (Summary Row): Đặt ngay đầu bảng `<tbody>`, hiển thị tổng số mặt hàng, tổng giá trị tồn, tổng tồn từng kho và toàn hệ thống, cuộn tự nhiên cùng nội dung bảng (đồng bộ Danh sách Hàng hóa).
   - Tbody: Từng dòng hàng hóa hiển thị số lượng tồn tại từng kho. Nếu tồn < 0 bôi đỏ, = 0 màu xám; cảnh báo định mức dùng mũi tên thanh cơ bản không màu: dưới định mức hiển thị mũi tên xuống ↓ (i-arrow-down text-secondary), vượt định mức hiển thị mũi tên lên ↑ (i-arrow-up text-secondary).
3. **Chi tiết mở rộng Inline Subrow (Master - Detail)**:
   - Hiển thị khi click vào dòng sản phẩm: Mở rộng dòng phụ dạng accordion ngay bên dưới gồm 3 tab: (1) Tồn kho chi nhánh & Định mức; (2) Thông tin hàng hóa; (3) Thẻ kho gần đây (nạp qua `/BaoCao/GetTheKhoQuick`).

### 4.1. Khối Lego tái sử dụng (Luật 10 AGENTS.md):
- [x] Multi-select Dropdown Kho: `_MultiSelectFilter.cshtml` (mặc định "Tất cả các kho", chọn kho cụ thể thì sinh tag chip lọc và hiện nút "Bỏ chọn").
- [x] Phân trang AJAX: `_Pagination.cshtml` + `AppFilter.createListPage`.
- [x] Multi-select Dropdown Nhóm hàng: `_MultiSelectFilter.cshtml` (mặc định "Chọn nhóm hàng").
- [x] Status Filter Checkbox: `_StatusFilter.cshtml`.
- [x] Format số tiền & số lượng: class `.kp-num` + format tiền tệ `#,##0`.
- [x] Xuất Excel ClosedXML: `ExcelHelper.ExportToExcel`.
- [x] Hotkeys toàn cục: F3 (Tìm kiếm), F4 (Sidebar).

---

## 5. Quy tắc nghiệp vụ & Phân quyền

1. **Quyền truy cập kho**:
   - Quản lý: Mặc định có toàn quyền trên toàn bộ các kho đang hoạt động.
   - Thủ kho / Bán hàng: Hệ thống đọc từ bảng `TaiKhoanKho`. Nếu không có kho nào được gán, fallback về kho hiện tại trong Session.
2. **Hiển thị cột tài chính**:
   - Cả Quản lý, Thủ kho và Bán hàng đều được quyền xem Giá vốn và Giá trị tồn (theo yêu cầu người dùng).
3. **Xuất Excel**:
   - Tự động sinh các cột kho động tương ứng với bộ lọc hiện hành, có header xanh `#0066cc`, kẻ viền bảng và dòng tổng cộng.
