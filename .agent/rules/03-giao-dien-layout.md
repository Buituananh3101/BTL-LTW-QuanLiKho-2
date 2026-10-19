# 03. Giao diện, Layout & Thành phần dùng chung

## 1. Cấu trúc Layout chuẩn KiotViet

Hệ thống sử dụng **duy nhất một Layout chính** cho toàn bộ các màn hình nghiệp vụ:
- Đường dẫn: [`Views/Shared/_Layout.cshtml`](../../BTL-LTW-QuanLiKho-2/Views/Shared/_Layout.cshtml)
- Cấu hình toàn cục tại: [`Views/_ViewStart.cshtml`](../../BTL-LTW-QuanLiKho-2/Views/_ViewStart.cshtml) (`@{ Layout = "_Layout"; }`).
- Các View con **tuyệt đối không khai báo lại `Layout = ...`**.

### 1.1. Khung trang trong `_Layout.cshtml`:
Gồm Topbar cố định (`_Header`, `_MainMenu`), vùng thân `@RenderBody()`, modal con dùng chung `<partial name="_KiotPromptModal" />` và các scripts `jquery`, `bootstrap`, `site.js` (chứa `KiotToast`, `KiotNumber`, `KiotPrompt`).

### 1.2. Các Layout ngoại lệ (Chỉ tạo khi khung trang khác biệt hoàn toàn):
- `_LoginLayout.cshtml`: Dành riêng cho trang Đăng nhập (không có topbar và menu).
- `_PrintLayout.cshtml` (dự kiến, chưa tạo): Dành riêng cho trang In ấn phiếu kho (chuẩn khổ giấy A4/A5, ẩn toàn bộ thanh điều hướng).

---

## 2. Thành phần Header & Bộ chọn Kho làm việc (`WarehouseSwitcher`)

- Vị trí: [`Views/Shared/_Header.cshtml`](../../BTL-LTW-QuanLiKho-2/Views/Shared/_Header.cshtml).
- Gồm có: Logo thương hiệu **KhoPro**, ô dropdown chuyển đổi kho làm việc, chuông thông báo, menu cài đặt và thông tin người dùng đang đăng nhập.

### 2.1. Cơ chế hoạt động của Warehouse Switcher:
1. `WarehouseSwitcherViewComponent`: Tự động nạp kho theo quyền người dùng (Quản lý: tất cả; Nhân viên: theo `TaiKhoanKho`).
2. Lưu kho đang chọn vào `Session["CurrentWarehouseId"]`, Controller đọc qua `CurrentWarehouseId`.
3. Khi đổi kho: gọi `POST /Account/SwitchWarehouse?warehouseId=X` rồi reload.
4. "Tất cả kho" chỉ dùng để tra cứu/báo cáo; khi tạo chứng từ biến động bắt buộc chọn kho cụ thể.

---

## 3. Mega-Menu ngang (`_MainMenu.cshtml`)
- Vị trí: [`Views/Shared/_MainMenu.cshtml`](../../BTL-LTW-QuanLiKho-2/Views/Shared/_MainMenu.cshtml).
- Cấu trúc thanh menu ngang chuẩn KiotViet:
  1. **Tổng quan** (`/Home/Index`)
  2. **Hàng hóa**: Danh sách hàng hóa (`/HangHoa/Index`), Kiểm kho (`/PhieuKiemKe/Index`), Chuyển kho, Xuất dùng nội bộ, Xuất hủy.
  3. **Mua hàng**: Nhà cung cấp (`/NhaCungCap/Index`), Nhập hàng, Trả hàng nhập.
  4. **Đơn hàng**, **Khách hàng**, **Báo cáo**, **Thiết lập** và Nút **Bán hàng** (POS).

---

## 4. Quy ước sử dụng Partial View, ViewComponent & Script Section

| Thành phần | Khi nào sử dụng | Ví dụ trong dự án |
|---|---|---|
| **Partial View** | Thành phần giao diện dùng chung hoặc tách khối HTML cho gọn, nhận model từ view cha. | `_Header.cshtml`, `_MainMenu.cshtml`, `_HangHoaTable.cshtml`, `_PhieuKiemKeTable.cshtml`, `_PhieuKiemKeForm.cshtml` |
| **ViewComponent** | Phần giao diện cần truy vấn CSDL độc lập, logic phức tạp, không muốn làm cồng kềnh Controller cha. | `WarehouseSwitcherViewComponent` (Dropdown chọn kho theo quyền tài khoản) |
| **`@section Scripts`** | Toàn bộ code JavaScript, jQuery, xử lý AJAX, phím tắt (F3...) của từng màn hình riêng. | Khối `@section Scripts { ... }` ở cuối file `Create.cshtml`, `Index.cshtml` |

---

## 5. Quy chuẩn bảng dữ liệu & Modal

1. **Bảng dữ liệu**:
   - Bọc trong class `table table-hover align-middle`.
   - Header bảng có màu nền xám nhạt `table-light`, cố định cột nếu cần.
   - Luôn đi kèm thanh phân trang AJAX (`.pagination`) và hiển thị tổng số bản ghi (ví dụ: `Hiển thị 1 - 15 trên 48 mặt hàng`).
2. **Modal thêm/sửa nhanh**:
   - Dùng Modal chuẩn của Bootstrap 5 (`modal fade`).
   - Gửi dữ liệu bằng `fetch` hoặc `$.ajax` dạng JSON, nhận phản hồi `{ success: true, message: "..." }`, hiển thị toast/alert và cập nhật bảng mà không reload trang.

---

## 6. Các Khối Giao Diện & Tiện Ích Dùng Chung (Lego Framework)

Hệ thống đóng gói các thành phần lặp lại thành các "mảnh ghép Lego" độc lập, gọi 1 dòng:

1. **Bộ lọc Ngày tháng (`_KiotDateFilter.cshtml` & `KiotDateFilterVM`)**:
   - Razor: `<partial name="_KiotDateFilter" model='new KiotDateFilterVM { TargetId = "date", Label = "Thời gian", PresetVal = "ALL", DateType = "past" }' />`
   - Client JS: `KiotFilter.initDateFilter("date", (from, to, text, val) => { ... })`
   - Backend: `var (from, to) = DateRangeHelper.Resolve(filter.DateFilterType, filter.FromDate, filter.ToDate);`
2. **Phân trang AJAX (`_Pagination.cshtml` & `PagedResult<T>`)**:
   - Razor: `<partial name="_Pagination" model="Model.PagedData" />` (kết hợp `BaseFilterParams`).
3. **Hệ thống Toast KiotViet (`site.js` & `site.css`)**:
   - Cú pháp: `KiotToast.success("..."), KiotToast.error("..."), KiotToast.warning("..."), KiotToast.info("...")`.
4. **Ẩn / Hiện Cột bảng (`KiotFilter.initColumnToggle`)**:
   - Cú pháp: `KiotFilter.initColumnToggle('#colMenu', '#myTable', 'storage_key');`
5. **Đánh dấu Sao Bookmark (`KiotFilter.bindStarToggle`)**:
   - Cú pháp: `KiotFilter.bindStarToggle('#myTable', '/Controller/ToggleFavorite', callback);`
6. **Ô nhập số tự định dạng (`.kiot-num` / `KiotNumber`)**:
   - Cú pháp: Input gắn class `kiot-num` tự format `1,000,000`, select all khi focus; đọc số sạch qua `KiotNumber.get('#input')`.
7. **Khối gập mở Accordion (`.kiot-sec` / `KiotCollapsible`)**:
   - Cấu trúc: Khối `.kiot-sec` chứa `.kiot-sec-h` (tiêu đề + icon `.kiot-chev`) và `.kiot-sec-b` (nội dung), click tự động đóng/mở.
8. **Nút lưu đa năng Split Button (`.kiot-split`)**:
   - Cấu trúc: Nút chính `.btn-main` + nút mũi tên `.caret` xổ menu `.kiot-menu`, tự đóng khi click ngoài.
9. **Dropdown Combobox có bút chì ✎ sửa/xóa trực tiếp (`KiotFilter.initCombobox`)**:
   - Cú pháp: `KiotFilter.initCombobox({ wrapSelector: '#wrap', items: [...], onEditItem: ... })` (vừa gõ tìm kiếm, vừa chọn, hover hiện icon bút chì ✎ sửa trực tiếp).
10. **Modal con dùng chung (`_KiotPromptModal.cshtml` / `KiotPrompt`)**:
    - Cú pháp: `KiotPrompt.open({ title, label, value, showDelete, onSave, onDelete })` (tạo mới nhanh / sửa ✎ / xóa dùng chung toàn hệ thống).
11. **Bộ lọc Khoảng giá trị Từ - Tới (`_KiotValueFilter.cshtml` & `KiotValueFilterVM`)**:
    - Razor: `<partial name="_KiotValueFilter" model='new KiotValueFilterVM("TongMua", "Tổng mua", "Giá trị")' />`
    - Client JS: `KiotFilter.initValueFilter("TongMua", (from, to) => { ... })`
    - Giao diện: Cụm 2 ô nhập `.fromto` (badge `<b>Từ</b>` và `<b>Tới</b>`), class `.money` tự format hàng nghìn `1,000,000`, chấm xanh `.filter-dot` tự bật khi có giá trị.
12. **Bộ lọc Trạng thái Checkbox / Pills (`_KiotStatusFilter.cshtml` & `KiotStatusFilterVM`)**:
    - Razor: `<partial name="_KiotStatusFilter" model='new KiotStatusFilterVM("Trạng thái", "dotSt", options, KiotStatusRenderMode.Pills)' />`
    - Client JS: `KiotFilter.initStatusFilter('#pillsStatus', val => { ... })`
    - Hỗ trợ 2 chế độ: `Checkbox` (danh sách hộp kiểm) và `Pills` (hàng nút viên thuốc KiotViet).

