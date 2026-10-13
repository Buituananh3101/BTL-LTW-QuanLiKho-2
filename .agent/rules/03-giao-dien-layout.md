# 03. Giao diện, Layout & Thành phần dùng chung

## 1. Cấu trúc Layout chuẩn KiotViet

Hệ thống sử dụng **duy nhất một Layout chính** cho toàn bộ các màn hình nghiệp vụ:
- Đường dẫn: [`Views/Shared/_Layout.cshtml`](../../BTL-LTW-QuanLiKho-2/Views/Shared/_Layout.cshtml)
- Cấu hình toàn cục tại: [`Views/_ViewStart.cshtml`](../../BTL-LTW-QuanLiKho-2/Views/_ViewStart.cshtml) (`@{ Layout = "_Layout"; }`).
- Các View con **tuyệt đối không khai báo lại `Layout = ...`**.

### 1.1. Khung trang trong `_Layout.cshtml`:
```html
<header class="app-header-fixed">
    <partial name="_Header" />
    <partial name="_MainMenu" />
</header>

<main role="main" class="app-main-body">
    @RenderBody()
</main>

<partial name="_FloatingHelp" />

<!-- Scripts chung -->
<script src="~/lib/jquery/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
@await RenderSectionAsync("Scripts", required: false)
```

### 1.2. Các Layout ngoại lệ (Chỉ tạo khi khung trang khác biệt hoàn toàn):
- `_LoginLayout.cshtml`: Dành riêng cho trang Đăng nhập (không có topbar và menu).
- `_PrintLayout.cshtml`: Dành riêng cho trang In ấn phiếu kho (chuẩn khổ giấy A4/A5, ẩn toàn bộ thanh điều hướng).

---

## 2. Thành phần Header & Bộ chọn Kho làm việc (`WarehouseSwitcher`)

- Vị trí: [`Views/Shared/_Header.cshtml`](../../BTL-LTW-QuanLiKho-2/Views/Shared/_Header.cshtml).
- Gồm có: Logo thương hiệu **KhoPro**, ô dropdown chuyển đổi kho làm việc, chuông thông báo, menu cài đặt và thông tin người dùng đang đăng nhập.

### 2.1. Cơ chế hoạt động của Warehouse Switcher (ViewComponent):
1. **Triển khai qua ViewComponent**: `WarehouseSwitcherViewComponent` (`ViewComponents/WarehouseSwitcherViewComponent.cs`), render qua `Views/Shared/Components/WarehouseSwitcher/Default.cshtml`.
2. Tự động kiểm tra quyền kho:
   - Nếu là Quản lý hoặc chưa đăng nhập: Nạp tất cả kho đang hoạt động (`HOAT_DONG`).
   - Nếu là Nhân viên: Chỉ nạp các kho được cấp quyền trong bảng `TaiKhoanKho`.
3. Đọc kho đang chọn từ `Context.Session.GetInt32("CurrentWarehouseId")`.
4. Khi người dùng click chọn kho khác:
   ```javascript
   function switchWorkingWarehouse(whId) {
       fetch('/Account/SwitchWarehouse?warehouseId=' + whId, { method: 'POST' })
           .then(() => window.location.reload());
   }
   ```
5. Mọi Controller đọc kho hiện tại qua hàm tiện ích nội bộ:
   ```csharp
   private int GetCurrentWarehouseId()
   {
       var whId = HttpContext.Session.GetInt32("CurrentWarehouseId");
       if (whId.HasValue && whId.Value > 0) return whId.Value;

       var firstWh = _context.Khos.FirstOrDefault(k => k.TrangThai == "HOAT_DONG");
       int defaultId = firstWh?.MaKho ?? 1;
       HttpContext.Session.SetInt32("CurrentWarehouseId", defaultId);
       return defaultId;
   }
   ```
4. **Quy tắc "Tất cả kho" (Dành cho Admin)**:
   - Mục "Tất cả kho" (`whId = null` hoặc `0`) chỉ dùng cho màn hình **Xem danh sách, Tra cứu và Báo cáo**.
   - Khi thực hiện các thao tác biến động (Tạo phiếu nhập, Xuất kho, Kiểm kho), hệ thống bắt buộc người dùng chọn một kho làm việc cụ thể.

---

## 3. Mega-Menu ngang (`_MainMenu.cshtml`)

- Vị trí: [`Views/Shared/_MainMenu.cshtml`](../../BTL-LTW-QuanLiKho-2/Views/Shared/_MainMenu.cshtml).
- Cấu trúc thanh menu ngang phong cách KiotViet:
  1. **Tổng quan** (`/Home/Index`)
  2. **Hàng hóa**: Danh sách hàng hóa (`/HangHoas/Index`), Nhóm hàng, Tồn kho, Kiểm kho (`/PhieuKiemKe/Index`), Chuyển kho, Xuất dùng nội bộ, Xuất hủy.
  3. **Mua hàng**: Nhà cung cấp, Nhập hàng, Trả hàng nhập.
  4. **Đơn hàng**: Hóa đơn bán hàng.
  5. **Khách hàng**: Danh sách khách hàng.
  6. **Báo cáo**: Tồn kho theo kho, Nhập - Xuất - Tồn, Hàng dưới định mức, Thẻ kho.
  7. **Thiết lập**: Quản lý Kho, Người dùng & Phân quyền, Nhật ký thao tác.
  8. **Nút "Bán hàng" (POS)**: Nằm bên phải thanh menu.

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
