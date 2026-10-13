# 01. Phong cách code & Quy ước lập trình

## 1. Ngôn ngữ & Quy ước đặt tên

### 1.1. Tên thực thể & Thuộc tính (C# & CSDL)
- **Class Entity & Model**: Dùng **tiếng Việt không dấu**, PascalCase.
  - Ví dụ: `HangHoa`, `Kho`, `PhieuKiemKe`, `ChiTietPhieuKiemKe`, `PhieuNhap`, `DonBan`.
- **Khóa chính**: Đặt theo định dạng `Ma<TênEntity>`.
  - Ví dụ: `MaHang`, `MaKho`, `MaPhieuKiemKe`, `MaDonBan`.
  - Khóa chính bảng chi tiết: `MaCT<TênEntity>` (ví dụ: `MaCTPhieuNhap`, `MaCTKiemKe`).
- **Thuộc tính & Cột CSDL**: PascalCase tiếng Việt không dấu mô tả rõ nghĩa.
  - Ví dụ: `TenHang`, `MaHangNoiBo`, `GiaBanThamKhao`, `SoLuongTheoSo`, `ThoiDiemChot`, `TrangThai`.
- **Navigation Properties**: Khai báo `virtual`. Với quan hệ 1-N, bên "1" dùng `virtual ICollection<T>` (khởi tạo bằng `HashSet<T>()` trong constructor), bên "N" có khóa ngoại `MaXxx` và navigation property `virtual Xxx? MaXxxNavigation`.
- **Biến cục bộ & tham số**: camelCase tiếng Việt không dấu hoặc tiếng Anh ngắn gọn.
  - Ví dụ: `hangHoa`, `currentWhId`, `query`, `pagedList`, `page`, `pageSize`.

### 1.2. Comment & Giao diện
- **Comment trong code**: Tiếng Việt ngắn gọn, giải thích từng bước xử lý logic phức tạp (ví dụ: `// 1. Lọc theo kho hiện tại`, `// 2. Chốt số tồn sổ sách tại thời điểm cân bằng`).
- **Nhãn, tiêu đề, thông báo lỗi UI**: 100% **tiếng Việt có dấu**, lịch sự, rõ ràng (ví dụ: `Vui lòng nhập tên hàng hóa`, `Cân bằng kho thành công!`, `Hàng đã phát sinh chứng từ, không thể xóa`).

---

## 2. Cấu trúc Controller & BaseKhoController

Mọi Controller nghiệp vụ kho đều kế thừa từ `BaseKhoController` để dùng chung tiện ích Session kho, thông tin người dùng và phân quyền:

```csharp
namespace BTL_LTW_QuanLiKho_2.Controllers;

[Authorize]
public class PhieuNhapController : BaseKhoController
{
    private readonly ITonKhoService _tonKhoService;
    private readonly INhatKyThaoTacService _nhatKyService;

    public PhieuNhapController(
        QuanLyKhoPhuQuocLtwContext context,
        ITonKhoService tonKhoService,
        INhatKyThaoTacService nhatKyService) : base(context)
    {
        _tonKhoService = tonKhoService;
        _nhatKyService = nhatKyService;
    }
    // Dùng sẵn: CurrentWarehouseId, CurrentUserId, CurrentNhanVienId, CurrentUserRole, IsQuanLy
}
```

### 2.1. Cặp Action cho màn hình Danh sách & Lọc AJAX
Mỗi màn hình danh sách lớn (Hàng hóa, Phiếu kiểm...) đều có 2 action song hành:
1. `Index(...)`: Đọc tham số lọc, dựng Index ViewModel và trả về View toàn trang.
2. `Filter(...)`: Cùng logic lọc nhưng chỉ trả về `PartialView` chứa bảng dữ liệu và thanh phân trang để giao diện cập nhật mượt qua AJAX mà không reload trang.

```csharp
// GET: PhieuKiemKe/Index
public async Task<IActionResult> Index(PhieuKiemKeFilterVM filter)
{
    var model = await BuildIndexViewModel(filter);
    return View(model);
}

// GET: PhieuKiemKe/Filter (AJAX Partial)
public async Task<IActionResult> Filter(PhieuKiemKeFilterVM filter)
{
    var model = await BuildIndexViewModel(filter);
    return PartialView("_PhieuKiemKeTable", model);
}
```

### 2.2. Xử lý form chứng từ phức tạp (Form nhiều dòng chi tiết)
- Form chứng từ (như Lập phiếu kiểm kho, Nhập hàng, Xuất hàng) có bảng chi tiết nhiều dòng → gửi dữ liệu lên server dưới dạng JSON thông qua `[FromBody] <Tên>Request`.
- Luôn kiểm tra tính hợp lệ của dữ liệu đầu vào.
- Luôn bọc các thao tác ghi nhiều bảng trong `BeginTransactionAsync()`.

---

## 3. Cấu trúc ViewModel & Form Validation

### 3.1. Phân loại ViewModel (đặt theo thư mục con trong `ViewModels/`)
- `ViewModels/Common/`: Các ViewModel dùng chung (`ApiResponse.cs`, `PagingFilterVM.cs`...).
- `ViewModels/HangHoa/`: Dành cho phân hệ Hàng hóa (`HangHoaForm.cs`, `HangHoaIndexVM.cs`...).
- `ViewModels/KiemKho/`: Dành cho phân hệ Kiểm kho (`KiemKhoViewModels.cs`...).
- `ViewModels/NhapKho/`: Dành cho phân hệ Nhập kho (`NhapKhoIndexVM.cs`, `NhapKhoFormRequest.cs`...).
- `ViewModels/Account/`: Dành cho phân hệ Tài khoản & Đăng nhập (`AccountViewModels.cs`...).
- `ViewModels/Components/`: Dành cho các ViewComponent (`WarehouseSwitcherVM.cs`...).

- **IndexVM**: Chứa danh sách dữ liệu hiển thị trên trang, thông tin kho hiện tại, các danh mục phục vụ bộ lọc.
- **FilterVM**: Chứa các tiêu chí lọc (từ khóa `Q`, ngày bắt đầu, ngày kết thúc, trạng thái, người tạo, phân trang).
- **FormVM / Request**: Chứa dữ liệu form thêm/sửa, có gắn Data Annotations để kiểm tra dữ liệu.
- **LineVM / ItemVM**: Đại diện cho một dòng chi tiết trong bảng hoặc chứng từ.

### 3.2. Data Annotations (Tiếng Việt)
```csharp
public class HangHoaForm
{
    public int MaHang { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập tên hàng hóa.")]
    [StringLength(150, ErrorMessage = "Tên hàng không vượt quá 150 ký tự.")]
    [Display(Name = "Tên hàng")]
    public string TenHang { get; set; } = "";

    [Range(1, int.MaxValue, ErrorMessage = "Vui lòng chọn nhóm hàng.")]
    [Display(Name = "Nhóm hàng")]
    public int MaNhom { get; set; }

    [Range(typeof(decimal), "0", "999999999999999", ErrorMessage = "Giá bán phải lớn hơn hoặc bằng 0.")]
    [Display(Name = "Giá bán")]
    public decimal GiaBanThamKhao { get; set; }
}
```

### 3.3. Chuẩn hóa Phản hồi JSON (`ApiResponse` [ISSUE-16])
Toàn bộ Action AJAX trả về dữ liệu JSON phải tuân thủ khuôn mẫu từ [`ApiResponse`](../../BTL-LTW-QuanLiKho-2/ViewModels/ApiResponse.cs):
- Cấu trúc: `{ success: true/false, message: "...", data: ... }`
- Thành công: `Ok(ApiResponse.Ok("Thông báo thành công", data))`
- Thất bại: `BadRequest(ApiResponse.Fail("Thông báo lỗi"))` hoặc `NotFound(ApiResponse.Fail("Không tìm thấy"))`

---

## 4. Cấu trúc View & Razor

- **Layout mặc định**: Khai báo tại `Views/_ViewStart.cshtml` (`Layout = "_Layout";`). Trong các View con **không viết lại dòng `Layout = ...`**.
- **Tiêu đề trang**: Mỗi view luôn đặt `ViewData["Title"] = "Tên trang";` ở đầu file.
- **Sử dụng Tag Helper chuẩn**:
  - Link/Nút: `<a asp-controller="HangHoa" asp-action="Index">Danh sách</a>`
  - Form: `<form asp-action="Create" method="post">`
  - Input/Select: `<input asp-for="TenHang" class="form-control" />`
  - Validation: `<span asp-validation-for="TenHang" class="text-danger"></span>`
- **Tách Partial View**:
  - Bảng dữ liệu danh sách tách thành `_<Entity>Table.cshtml`.
  - Khung form phức tạp tách thành `_<Entity>Form.cshtml`.
- **Scripts riêng của View**: Đặt toàn bộ code JavaScript trong block:
  ```cshtml
  @section Scripts {
      <script>
          // Code jQuery / AJAX thao tác riêng cho màn hình này
      </script>
  }
  ```

---

## 5. Dịch vụ & Helper dùng chung (Shared Domain Services)

- **`BaseKhoController`**: Lớp Controller cơ sở quản lý kho, cung cấp `CurrentWarehouseId`, `CurrentUserId`, `CurrentNhanVienId`, `CurrentUserRole`, `IsQuanLy`.
- **`MaChungTuHelper`** (`Services/MaChungTuHelper.cs`): Format chuẩn mã KiotViet (`FormatMaKiemKe`, `FormatMaNhapKho`, `FormatMaXuatKho`, `FormatMaHang`...).
- **`INhatKyThaoTacService`** (`Services/INhatKyThaoTacService.cs`): Tự động ghi nhật ký kiểm toán thao tác hệ thống không làm chặn transaction chính.
- **`f3-product-search.js`** (`wwwroot/js/components/f3-product-search.js`): Component Autocomplete tìm kiếm hàng hóa chuẩn KiotViet phím F3 dùng chung cho Nhập, Xuất, Kiểm kho.

