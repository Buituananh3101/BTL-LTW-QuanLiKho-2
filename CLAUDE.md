# CLAUDE.md – Quy ước code cho Bài tập lớn: Hệ thống quản lý kho nhiều kho (ASP.NET Core MVC)

> **Dự án**: web quản lý kho có nhiều kho, giao diện và luồng nghiệp vụ lấy cảm hứng từ KiotViet (menu Hàng hóa, Mua hàng, Đơn hàng, Báo cáo...). Bán hàng (hóa đơn/POS) chỉ là phần phụ.
> **Công nghệ**: ASP.NET Core MVC + EF Core + SQL Server, viết theo phong cách các bài thực hành 1–5.
>
> File gồm hai phần:
> - **Phần A (mục 1–12)**: phong cách code chung rút ra từ các bài lab.
> - **Phần B (mục 13–21)**: đặc thù của dự án quản lý kho (CSDL, nghiệp vụ tồn kho, phân quyền, báo cáo).
>
> AI phải bám theo các quy ước này khi viết hoặc sửa code. Nếu yêu cầu của người dùng mâu thuẫn với file này, hỏi lại hoặc làm theo người dùng và nói rõ chỗ khác biệt.
> Trong các ví dụ ở Phần A, `MyWebApp`, `SchoolContext`, `Learner`, `Major` chỉ là **ví dụ về phong cách**; trong dự án thật dùng tên ở Phần B (`WarehouseContext`, `Product`, `Warehouse`...).
> Tài liệu tham chiếu trong repo: `database.sql` (script CSDL), `thiet-ke-csdl.md` (ERD, luồng tồn kho) và `dac-ta-kiem-kho.md` (đặc tả Kiểm kho, làm **mẫu cho mọi chứng từ có form nhiều dòng**). Khi có mâu thuẫn, **`database.sql` là nguồn đúng** cho cấu trúc bảng.

---

## 1. Công nghệ

- .NET 6, ASP.NET Core MVC (`AddControllersWithViews`), Razor View (`.cshtml`).
- Entity Framework Core **6.0.x** + SQL Server (SQL Authentication, chuỗi kết nối tên `SchoolContext`, lưu trong `Secrets.json` / User Secrets, không hardcode trong code).
- Giao diện: Bootstrap 5 + template admin (SB Admin: `sb-nav-fixed`, `sb-topnav`, `sb-sidenav`), FontAwesome 6.
- AJAX: jQuery (`$.ajax`), đặt tại `~/lib/jquery/dist/jquery.min.js`.
- Nullable reference types bật (`string?`, `Branch?`).
- Không dùng Razor Pages, Blazor hay API controller, trừ khi người dùng yêu cầu.

NuGet (đúng phiên bản):
```
Microsoft.AspNetCore.Diagnostics.EntityFrameworkCore  6.0.x
Microsoft.EntityFrameworkCore.SqlServer               6.0.x
Microsoft.EntityFrameworkCore.Design                  6.0.x   (khi cần scaffold)
```

---

## 2. Cấu trúc thư mục

```
MyWebApp/
├── Controllers/        XxxController.cs
├── Data/               SchoolContext.cs (DbContext), DbInitializer.cs
├── Models/             Entity + enum (Major.cs, Learner.cs, Course.cs, Enrollment.cs, Gender.cs, MenuItem.cs)
├── ViewComponents/     XxxViewComponent.cs
├── Views/
│   ├── Shared/
│   │   ├── MyLayout.cshtml          layout chính
│   │   ├── MyLayoutHelper.cshtml    layout dùng ViewComponent
│   │   ├── TopNav.cshtml, LeftMenu.cshtml, Footer.cshtml   (partial)
│   │   └── Components/<TênViewComponent>/<TênView>.cshtml
│   └── <TênController>/   Index, Create, Edit, Delete, XxxTable (partial)
├── wwwroot/ css/, js/, lib/
├── Program.cs
└── appsettings.json
```

Quy tắc:
- Một controller cho mỗi entity, tên số ít: `LearnerController`, `StudentController`.
- Thư mục view trùng tên controller bỏ hậu tố `Controller`.
- Thư mục `Components/<Tên>` trùng tên ViewComponent bỏ hậu tố `ViewComponent`.

---

## 3. Ngôn ngữ và đặt tên

- Tên class, property, method: **tiếng Anh**, PascalCase. Biến cục bộ camelCase (`learners`, `majors`, `pageSize`).
- Property khóa chính: `<Entity>ID` (`LearnerID`, `MajorID`, `CourseID`, `EnrollmentID`), riêng model không dùng EF thì `Id`.
- Navigation property đặt `virtual`. Collection khai báo `ICollection<T>` và khởi tạo bằng `HashSet<T>()` trong constructor.
- Comment trong code: **tiếng Việt**, ngắn, giải thích từng bước (ví dụ `//tính số trang`, `//lấy dữ liệu trang đầu`).
- Nhãn, tiêu đề cột, thông báo lỗi hiển thị cho người dùng: **tiếng Việt** (`Mã`, `Họ tên`, `Ngày sinh`, `Chức năng`, `Email bắt buộc phải được nhập`). Một số chỗ lab để tiếng Anh (`Create`, `Edit`, `Learner List`); giữ nhất quán trong từng màn hình.
- Namespace: `<TênProject>.Models`, `.Data`, `.Controllers`, `.ViewComponents`.
- Typo trong lab như `DateOfBorth`, `Learer`: **không sao chép** khi tạo model mới; dùng tên đúng (`DateOfBirth`).

---

## 4. Models

```csharp
namespace MyWebApp.Models
{
    public class Major
    {
        public Major()
        {
            Learners = new HashSet<Learner>();
        }
        public int MajorID { get; set; }
        public string MajorName { get; set; }
        public virtual ICollection<Learner> Learners { get; set; }
    }
}
```

- Quan hệ 1–N: bên "nhiều" có FK (`int MajorID`) và navigation (`virtual Major? Major`); bên "một" có `virtual ICollection<>`.
- Khóa không tự tăng: `[DatabaseGenerated(DatabaseGeneratedOption.None)]` (ví dụ `Course.CourseID`).
- Enum đặt riêng file (`Gender`, `Branch`). Hiển thị tiếng Việt bằng `switch` hoặc toán tử `?:` trong View.
- Model dùng cho form có validation thì gắn Data Annotation (mục 9).

---

## 5. Data (EF Core, Code First)

`Data/SchoolContext.cs`:
```csharp
public class SchoolContext : DbContext
{
    public SchoolContext(DbContextOptions<SchoolContext> options) : base(options) { }
    public virtual DbSet<Course> Courses { get; set; }
    public virtual DbSet<Learner> Learners { get; set; }
    public virtual DbSet<Enrollment> Enrollments { get; set; }
    public virtual DbSet<Major> Majors { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Major>().ToTable(nameof(Major));
        modelBuilder.Entity<Course>().ToTable(nameof(Course));
        modelBuilder.Entity<Learner>().ToTable(nameof(Learner));
        modelBuilder.Entity<Enrollment>().ToTable(nameof(Enrollment));
    }
}
```
- `DbSet` tên số nhiều, `virtual`. Tên bảng số ít theo `nameof(Entity)`.

`Data/DbInitializer.cs`: class `static`, method `Initialize(IServiceProvider serviceProvider)`:
- Tạo context bằng `new SchoolContext(serviceProvider.GetRequiredService<DbContextOptions<SchoolContext>>())` trong `using`.
- Gọi `context.Database.EnsureCreated();`.
- Nếu `context.Majors.Any()` thì `return` (không seed lại).
- Seed theo thứ tự phụ thuộc: Major → Learner → Course → Enrollment. Mỗi bước là mảng `new X[] {...}`, `foreach` + `Add`, rồi `SaveChanges()`.

`Program.cs`:
```csharp
builder.Services.AddDbContext<SchoolContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("SchoolContext")));

builder.Services.AddControllersWithViews();
var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    DbInitializer.Initialize(services);
}
// ... pipeline mặc định, MapControllerRoute default {controller=Home}/{action=Index}/{id?}
```
- Tên trong `GetConnectionString("...")` phải khớp tên chuỗi kết nối đã tạo.

Database First (nếu cần): `Scaffold-DbContext "<connection>" Microsoft.EntityFrameworkCore.SqlServer -Project <Project> -OutputDir Models`.

---

## 6. Controller

Phong cách:
- Inject `SchoolContext` qua constructor, lưu vào field `private SchoolContext db;`.
- Action trả `IActionResult`.
- Tải kèm dữ liệu liên quan bằng `.Include(m => m.Major)`.
- Biến global `private int pageSize = 3;` cho phân trang.

CRUD (mỗi thao tác ghi gồm cặp GET/POST):

```csharp
public IActionResult Index(int? mid) { ... return View(learners); }

public IActionResult Create()
{
    ViewBag.MajorID = new SelectList(db.Majors, "MajorID", "MajorName");
    return View();
}

[HttpPost]
[ValidateAntiForgeryToken]
public IActionResult Create([Bind("FirstMidName,LastName,MajorID,EnrollmentDate")] Learner learner)
{
    if (ModelState.IsValid)
    {
        db.Learners.Add(learner);
        db.SaveChanges();
        return RedirectToAction(nameof(Index));
    }
    ViewBag.MajorID = new SelectList(db.Majors, "MajorID", "MajorName"); // nạp lại dropdown khi lỗi
    return View();
}
```

- **Edit**: GET dùng `Find(id)`, `NotFound()` nếu null, `SelectList(..., selectedValue)`. POST kiểm tra `id != learner.LearnerID` → `NotFound()`, dùng `db.Update` + `SaveChanges`, bắt `DbUpdateConcurrencyException` với hàm `LearnerExists(id)`.
- **Delete**: GET dùng `Include(Major).Include(Enrollments)`. Nếu còn bản ghi con thì `return Content("This learner has some enrollments, can't delete!")`. POST đặt `[HttpPost, ActionName("Delete")]` cho `DeleteConfirmed(int id)`, rồi `Remove` + `SaveChanges` + `RedirectToAction(nameof(Index))`.
- POST luôn có `[ValidateAntiForgeryToken]` và **luôn `[Bind(...)]` liệt kê field cho phép** (chống over-posting).
- Truyền dữ liệu phụ cho View (dropdown, radio) qua `ViewBag`.
- Trả partial cho AJAX bằng `return PartialView("LearnerTable", result);`.
- Controller demo không dùng DB (như `StudentController` bài 1) có thể dùng `List<T>` trong constructor. Bài tập lớn phải dùng EF.

---

## 7. View (Razor)

Đầu mỗi view:
```cshtml
@{
    ViewData["Title"] = "Index";
    Layout = "~/Views/Shared/MyLayout.cshtml";
}
@model IEnumerable<Learner>
```

- Danh sách: `<div class="ms-2 mx-2">`, `<h1>`, `<table class="table table-striped">`, `thead` + `tbody` với `@foreach (var s in Model)`.
- Cột "Chức năng": `<a asp-action="Edit" asp-route-id="@s.LearnerID">Edit</a>|<a asp-action="Delete" asp-route-id="@s.LearnerID">Delete</a>`.
- Nút tạo mới: `<a asp-action="Create" class="btn btn-primary">Create New Student</a>`.
- **Dùng Tag Helper**, không dùng `Html.BeginForm`/`ActionLink`:
  - Form: `<form asp-controller="Learner" asp-action="Create" method="post" class="mt-3">`
  - Label: `<label asp-for="FirstMidName" class="col-sm-2 col-form-label"></label>`
  - Input: `<input asp-for="FirstMidName" class="form-control" placeholder="First Mid Name">`
  - Dropdown: `<select asp-for="MajorID" class="custom-select mr-sm-2" asp-items="@ViewBag.MajorID"></select>` (enum: `asp-items="Html.GetEnumSelectList<Branch>()"`)
  - Radio từ enum: `@foreach (var gender in ViewBag.AllGenders) { <label class="radio-inline"><input type="radio" asp-for="Gender" value="@gender" /> @gender</label> }`
  - Checkbox: `<input type="checkbox" class="custom-control-input" asp-for="IsRegular">`
- Mỗi field bọc trong `<div style="margin-top:7px" class="form-group row">` → `label` + `<div class="col-sm-10">` chứa input + `<span asp-validation-for="X" class="text-danger"></span>`.
- Đầu form luôn có `<div asp-validation-summary="All" class="text-danger"></div>`.
- Nút submit: `<button type="submit" class="btn btn-primary">Create</button>`; xóa dùng `btn btn-danger`.
- Edit có `<input type="hidden" asp-for="LearnerID"/>` và `asp-route-id="@Model.LearnerID"` trên form.
- Delete dùng `@Html.DisplayNameFor(model => model.X)` và `@Html.DisplayFor(model => model.X)` trong `<dl class="row">` / `<dt class="col-sm-2">` / `<dd class="col-sm-10">`, kèm form xác nhận "Are you sure you want to delete this?".
- Cuối form (Create/Edit), thêm `<partial name="_ValidationScriptsPartial" />` trong `@section Scripts` để bật validation phía client (chuẩn MVC, lab chưa ghi nhưng cần thiết).

---

## 8. Layout, Partial, Section, ViewComponent

**Layout** (`Views/Shared/MyLayout.cshtml` trong lab; **trong dự án kho dùng `_Layout.cshtml` đặt mặc định ở `_ViewStart.cshtml`, xem mục 22**): tách từ template, đường dẫn tài nguyên dùng `~/`:
```html
<link href="~/css/styles.css" rel="stylesheet" />
<script src="~/js/scripts.js"></script>
<title>@ViewData["Title"] - Management System</title>
```
- Tách phần cố định thành partial: `<partial name="TopNav" />`, `<partial name="LeftMenu" />`, `<partial name="Footer" />`.
- Phần nội dung chính: `<main>@RenderBody()</main>`.
- Cuối `<body>`: nạp script chung, jQuery, rồi `@RenderSection("Scripts", required: false)`.
- View muốn thêm script riêng thì khai báo `@section Scripts { <script>...</script> }`.

**ViewComponent** (cho phần giao diện cần dữ liệu / strongly-typed partial, ví dụ menu động, danh sách ngành):
- Class đặt trong `ViewComponents/`, tên kết thúc `ViewComponent`, kế thừa `ViewComponent`.
- Inject `SchoolContext` qua constructor.
- Dùng `public async Task<IViewComponentResult> InvokeAsync()` và `return View("RenderMajor", majors);`.
- View đặt ở `Views/Shared/Components/<Tên>/<TênView>.cshtml`, khai báo `@model IEnumerable<Major>`.
- Gọi trong layout/view: `@await Component.InvokeAsync("Major")`.

---

## 9. Validation (Data Annotation)

```csharp
[Required(ErrorMessage = "Email bắt buộc phải được nhập")]
[RegularExpression(@"[A-Za-z0-9._%+-]+@gmail\.com", ErrorMessage = "Email phải có đuôi gmail.com")]
public string? Email { get; set; }

[Required, StringLength(100, MinimumLength = 4, ErrorMessage = "Họ tên từ 4 đến 100 ký tự")]
public string? Name { get; set; }

[Required, StringLength(100, MinimumLength = 8)]
[RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$", ErrorMessage = "...")]
public string? Password { get; set; }

[DataType(DataType.MultilineText)] public string? Address { get; set; }

[Range(typeof(DateTime), "1/1/1963", "12/31/2005")]
[DataType(DataType.Date)]
public DateTime DateOfBirth { get; set; }

[Range(0.0, 10.0, ErrorMessage = "Điểm từ 0.0 đến 10.0")]
public double Score { get; set; }
```
- **Thông báo lỗi và nhãn hiển thị bằng tiếng Việt**: `ErrorMessage = "..."` và `[Display(Name = "Họ tên")]`.
- Controller POST luôn kiểm tra `ModelState.IsValid`. Nếu sai, nạp lại `ViewBag` (dropdown, radio) rồi `return View(model)`.

---

## 10. Lọc, tìm kiếm, phân trang bằng AJAX

Mô hình: View chính chứa `<div id="content">` bọc bảng. Click → `$.ajax` gọi action trả **PartialView** → thay `html()` của `div#content`.

Action (đặt trong controller):
```csharp
public IActionResult LearnerFilter(int? mid, string? keyword, int? pageIndex)
{
    var learners = (IQueryable<Learner>)db.Learners;
    int page = (int)(pageIndex == null || pageIndex <= 0 ? 1 : pageIndex);
    if (mid != null)
    {
        learners = learners.Where(l => l.MajorID == mid);
        ViewBag.mid = mid;               // gửi lại view để giữ trên thanh phân trang
    }
    if (keyword != null)
    {
        learners = learners.Where(l => l.FirstMidName.ToLower().Contains(keyword.ToLower()));
        ViewBag.keyword = keyword;
    }
    int pageNum = (int)Math.Ceiling(learners.Count() / (float)pageSize);
    ViewBag.pageNum = pageNum;
    var result = learners.Skip(pageSize * (page - 1)).Take(pageSize).Include(m => m.Major);
    return PartialView("LearnerTable", result);
}
```
- `Index(int? mid)` tải trang đầu: `Take(pageSize)`, đặt `ViewBag.pageNum`.
- Partial `LearnerTable.cshtml` chứa bảng và thanh phân trang:
  ```cshtml
  <ul class="pagination">
      @for (int i = 1; i <= ViewBag.pageNum; i++)
      {
          <li class="page-item" page="@i"
              @(ViewBag.mid != null ? "mid=" + ViewBag.mid : "")
              @(ViewBag.keyword != null ? "keyword=" + ViewBag.keyword : "")>
              <a class="page-link">@i</a>
          </li>
      }
  </ul>
  ```
- Script (trong `@section Scripts`): gắn sự kiện `click` cho `li.page-item` (dùng `$('body').on('click', ...)` vì phần tử được nạp động), cho `.nav li` (lọc theo ngành, lấy `id` của `li`), và `button#btnSearch` (đọc `#keyword`). Gọi `$.ajax({ url: "LearnerFilter", data: data, success: function (response) { $("div#content").html(response); } })`.
- Chú ý khi sinh code: ViewBag trong attribute của `li` phải dùng `@(...)` và nối chuỗi đúng cú pháp (lab có chỗ thiếu `@`).

---

## 11. Quy trình thêm một chức năng mới (checklist cho AI)

1. Tạo/sửa **Model** (+ annotation) trong `Models/`, thêm `DbSet` và `ToTable` trong `SchoolContext`.
2. Cập nhật `DbInitializer` nếu cần dữ liệu mẫu.
3. Tạo **Controller** (inject `SchoolContext`) với đủ action Index/Create/Edit/Delete theo mục 6.
4. Tạo **View** tương ứng, dùng Tag Helper, `Layout = "~/Views/Shared/MyLayout.cshtml"`, giao diện Bootstrap.
5. Phần giao diện dùng chung có dữ liệu → **ViewComponent**. Phần tĩnh → **partial**.
6. Cần lọc/tìm/phân trang → AJAX + PartialView theo mục 10.
7. Thêm link vào menu trái (`LeftMenu` hoặc `MenuItem` của ViewComponent).
8. Kiểm tra: project build được, `ModelState` được xử lý, dropdown nạp lại khi lỗi, có `[ValidateAntiForgeryToken]` + `[Bind]`.

---

## 12. Không làm

- Không thêm thư viện hoặc kiến trúc ngoài phạm vi lab (Repository pattern, AutoMapper, ASP.NET Core Identity, API, SPA) trừ khi được yêu cầu. Ngoại lệ có chủ đích của dự án kho: một lớp `InventoryService` (mục 16) và đăng nhập bằng Cookie Authentication tự viết trên bảng `AppUser` (mục 18).
- Không hardcode connection string hay mật khẩu trong code hoặc `appsettings.json`; dùng `Secrets.json`/User Secrets.
- Không dùng `Html.BeginForm`/`Html.TextBoxFor` thay cho Tag Helper.
- Không bỏ `Include()` khi View truy cập navigation property (tránh `NullReferenceException`).
- Không sao chép lỗi của lab: typo tên (`DateOfBorth`, `Learer`), `id == null` với `int` không nullable, `'ViewBag.mid'` thiếu `@`, `LearnerTable` thiếu `@` trước ViewBag.
- Không viết comment hoặc nhãn UI bằng ngôn ngữ khác ngoài tiếng Việt/tiếng Anh như quy ước ở mục 3.
- Không đổi cấu trúc thư mục ở mục 2 khi chưa hỏi người dùng.

---
---

# PHẦN B – ĐẶC THÙ DỰ ÁN QUẢN LÝ KHO

## 13. CSDL và truy cập dữ liệu

- CSDL: SQL Server, tên `WarehouseDB`, tạo từ `database.sql`.
- DbContext: **`WarehouseContext`** trong `Data/`. Chuỗi kết nối tên **`WarehouseContext`** (Secrets.json), đăng ký ở `Program.cs` như mục 5.
- Cách tạo model: **Code First** (người dùng đã chọn). Viết model bằng tay theo phong cách mục 4 (property `virtual`, navigation, constructor khởi tạo `HashSet`), tên bảng/cột/kiểu dữ liệu khớp `database.sql`. Khi thêm cột hoặc bảng mới, vẫn theo quy ước đặt tên bên dưới.
- **Dùng EF Migrations, không dùng `EnsureCreated()`** như bài lab (vì `EnsureCreated` không cập nhật được schema khi thêm cột sau này). Quy trình: sửa model → `Add-Migration <Tên>` → `Update-Database`. `DbInitializer` gọi `context.Database.Migrate();` thay cho `EnsureCreated();`.
- Cấu hình bằng **Fluent API trong `OnModelCreating`** (không nhồi attribute vào model): khóa kép của `Inventory` và `UserWarehouse`, `ToTable(nameof(...))`, `HasCheckConstraint` (Quantity >= 0, FromWarehouse <> ToWarehouse...), chỉ mục unique cho `Code`, `Username`, và cột computed:
  `entity.Property(e => e.Code).HasComputedColumnSql("N'PN' + RIGHT(N'000000' + CAST([ReceiptID] AS NVARCHAR(10)), 6)", stored: true);`
  Tương tự `LineTotal` (`[Quantity] * [UnitPrice]`) và `DiffQty` (`[ActualQty] - [SystemQty]`).
- Quy ước tên đã chốt (không đổi): bảng số ít, khóa chính `<Entity>ID`, bảng chi tiết `<Entity>Detail` với khóa `DetailID`.

| Nhóm | Entity |
|---|---|
| Hệ thống | `Role`, `AppUser`, `UserWarehouse`, `AuditLog` |
| Danh mục | `Warehouse`, `ProductCategory`, `Product`, `Supplier`, `Customer` |
| Tồn kho | `Inventory` (khóa kép `WarehouseID`+`ProductID`), `StockCard` |
| Nhập | `GoodsReceipt`/`GoodsReceiptDetail`, `PurchaseReturn`/`PurchaseReturnDetail` |
| Xuất | `StockIssue`/`StockIssueDetail` (`IssueType`: 1 nội bộ, 2 hủy) |
| Chuyển kho | `StockTransfer`/`StockTransferDetail` |
| Kiểm kho | `StockTake`/`StockTakeDetail` |
| Bán hàng (phụ) | `Invoice`/`InvoiceDetail` |

- Cột computed (không gán giá trị từ code, EF phải coi là chỉ đọc): `Code` của mọi chứng từ (`PN`, `THN`, `PX`, `CK`, `KK`, `HD` + 6 chữ số), `LineTotal`, `DiffQty`. Cấu hình `ValueGeneratedOnAddOrUpdate()` hoặc `[DatabaseGenerated(DatabaseGeneratedOption.Computed)]`. Không bao giờ đưa các cột này vào `[Bind]`.
- `Inventory` có `RowVersion` (ROWVERSION): đánh dấu `[Timestamp]` để EF phát hiện xung đột, bắt `DbUpdateConcurrencyException` như bài Edit ở mục 6.
- Số lượng là `int`, tiền là `decimal` (không dùng `float`/`double`, dù bài lab dùng `float` cho điểm).

## 14. Trạng thái chứng từ (dùng `enum`, lưu `byte`)

Đặt enum trong `Models/` (mỗi enum một file), không dùng số "ma thuật" trong code.

| Chứng từ | Giá trị |
|---|---|
| `GoodsReceipt`, `PurchaseReturn`, `StockIssue`, `Invoice` | 0 = Phiếu tạm, 1 = Hoàn thành, 2 = Đã hủy |
| `StockTransfer` | 0 = Phiếu tạm, 1 = Đang chuyển, 2 = Đã nhận, 3 = Đã hủy |
| `StockTake` | 0 = Phiếu tạm, 1 = Đã cân bằng kho (khóa, **không hủy được**), 2 = Đã hủy (chỉ phiếu tạm) |

Hiển thị tiếng Việt ở View bằng `switch` hoặc extension method, giống cách hiển thị `Branch` ở mục 7. Thêm màu badge Bootstrap (tạm = `bg-secondary`, hoàn thành = `bg-success`, đang chuyển = `bg-warning`, hủy = `bg-danger`).

## 15. Quy tắc nghiệp vụ (bắt buộc tuân thủ)

1. **Chỉ chứng từ ở trạng thái Hoàn thành/Đã nhận/Đã cân bằng mới làm thay đổi tồn kho.** Phiếu tạm không đụng tới `Inventory`.
2. **Phiếu tạm** được sửa và xóa. **Phiếu đã hoàn thành không sửa, không xóa**, chỉ được **hủy**. Hủy một phiếu đã hoàn thành sinh bút toán đảo ngược trong `StockCard` (cùng `DocType`, `QtyChange` ngược dấu), không xóa dòng cũ. **Ngoại lệ: phiếu kiểm kho đã cân bằng không được hủy** (tồn đã bị các giao dịch sau đó thay đổi nên không đảo được); muốn sửa sai thì lập phiếu kiểm mới. Phiếu kiểm tạm vẫn được xóa hoặc hủy.
3. **Không cho tồn âm**: trước khi trừ kho phải kiểm tra đủ hàng, nếu thiếu thì báo lỗi tiếng Việt và không ghi gì. CSDL cũng có `CHECK (Quantity >= 0)` làm lưới an toàn thứ hai.
4. **Giá vốn bình quân gia quyền** (lưu ở `Product.CostPrice`), cập nhật khi nhập hàng:
   `giá vốn mới = (tồn tổng hiện tại × giá vốn cũ + SL nhập × giá nhập) / (tồn tổng hiện tại + SL nhập)`, trong đó tồn tổng = tổng `Inventory.Quantity` của hàng hóa ở mọi kho. Xuất kho, bán hàng, chuyển kho dùng giá vốn hiện tại và không làm đổi giá vốn.
5. **Chuyển kho hai bước**: Phiếu tạm → *Đang chuyển* (trừ kho nguồn, ghi `TransferOut`) → *Đã nhận* (cộng kho đích theo `QtyReceived`, ghi `TransferIn`). Kho nguồn khác kho đích. Nhận thiếu thì phần chênh lệch `QtySent − QtyReceived` phải ghi vào `Note` hoặc `AuditLog`.
6. **Kiểm kho** (chi tiết ở `dac-ta-kiem-kho.md`): khi cân bằng, **đọc lại tồn hiện tại** để chốt `SystemQty`, chốt `UnitCost` = giá vốn hiện tại, đặt tồn bằng `ActualQty`, ghi `StockCard` với `QtyChange = DiffQty`, đồng thời tính `TotalActual`, `TotalDiff`, `IncreaseQty` (tổng chênh lệch dương), `DecreaseQty` (tổng chênh lệch âm, lưu giá trị dương), `BalancedAt`. Dòng có `ActualQty = NULL` (Chưa kiểm) **bỏ qua**: giữ nguyên tồn, không tính vào tổng. Mỗi hàng chỉ một dòng trong phiếu; thêm lại cùng hàng thì cộng +1 vào `ActualQty`.
7. **Hóa đơn bán**: lưu `UnitCost` lúc bán vào `InvoiceDetail`; trừ kho của `Invoice.WarehouseID`. `CustomerID = null` nghĩa là khách lẻ.
8. **Công nợ**: nhập hàng làm tăng `Supplier.Debt` bằng `TotalAmount − PaidAmount`; hóa đơn tăng `Customer.Debt` tương tự. Hủy phiếu đảo lại.
9. **Hàng ngừng kinh doanh** (`IsActive = false`) và **kho ngừng hoạt động** không xuất hiện trong dropdown khi tạo chứng từ mới, nhưng vẫn hiện trong lịch sử.
10. Xóa danh mục (hàng hóa, NCC, kho...) đã phát sinh chứng từ: **không xóa**, chỉ cho ngừng hoạt động (giống cách chặn xóa `Learner` có `Enrollments` ở mục 6).

## 16. `InventoryService` – nơi duy nhất thay đổi tồn kho

Đặt tại `Services/InventoryService.cs`, đăng ký `builder.Services.AddScoped<InventoryService>();`, inject vào controller qua constructor (phong cách giống inject `SchoolContext` ở mục 6).

**Quy tắc cứng: controller và view không bao giờ tự sửa `Inventory`, `StockCard` hay `Product.CostPrice`. Mọi biến động tồn phải đi qua `InventoryService`.**

Các hàm (đồng bộ, đặt tên tiếng Anh, comment tiếng Việt như mục 3):

```csharp
public class InventoryService
{
    private readonly WarehouseContext db;
    public InventoryService(WarehouseContext context) { db = context; }

    // Nhập kho: cộng tồn, cập nhật giá vốn bình quân, ghi thẻ kho
    public void Increase(int warehouseId, int productId, int qty, decimal unitCost,
                         string docType, int docId, string? note = null) { ... }

    // Xuất kho: kiểm tra đủ hàng (ném InvalidOperationException với thông báo tiếng Việt nếu thiếu)
    public void Decrease(int warehouseId, int productId, int qty,
                         string docType, int docId, string? note = null) { ... }

    // Cân bằng kiểm kho: đặt tồn = actualQty, ghi thẻ kho chênh lệch
    public void SetQuantity(int warehouseId, int productId, int actualQty,
                            int docId) { ... }

    // Tồn hiện tại (0 nếu chưa có dòng Inventory)
    public int GetQuantity(int warehouseId, int productId) { ... }
}
```

Nội bộ mỗi hàm: tìm dòng `Inventory` (tạo mới nếu chưa có khi cộng) → đổi `Quantity` → thêm một dòng `StockCard` với `QtyAfter` → **không gọi `SaveChanges()`** (để controller gói nhiều thao tác vào một transaction).

**Mẫu xử lý hoàn thành một phiếu** (áp dụng cho mọi chứng từ):

```csharp
[HttpPost]
[ValidateAntiForgeryToken]
public IActionResult Complete(int id)
{
    var receipt = db.GoodsReceipts.Include(r => r.GoodsReceiptDetails)
                    .FirstOrDefault(r => r.ReceiptID == id);
    if (receipt == null) return NotFound();
    if (receipt.Status != (byte)DocStatus.Draft) return BadRequest("Chỉ phiếu tạm mới được hoàn thành.");
    if (!UserCanAccessWarehouse(receipt.WarehouseID)) return Forbid();   // mục 18

    using var tran = db.Database.BeginTransaction();
    try
    {
        foreach (var d in receipt.GoodsReceiptDetails)
            inventory.Increase(receipt.WarehouseID, d.ProductID, d.Quantity, d.UnitPrice,
                               "GoodsReceipt", receipt.ReceiptID);
        receipt.Status = (byte)DocStatus.Completed;
        AuditLog("Complete", "GoodsReceipt", receipt.ReceiptID);
        db.SaveChanges();
        tran.Commit();
    }
    catch (InvalidOperationException ex)   // lỗi nghiệp vụ (thiếu hàng...)
    {
        tran.Rollback();
        ModelState.AddModelError("", ex.Message);
        return RedirectToAction(nameof(Details), new { id });
    }
    return RedirectToAction(nameof(Index));
}
```

- Mọi hành động Hoàn thành, Hủy, Nhận hàng, Cân bằng đều dùng `BeginTransaction`, `SaveChanges` một lần, rồi `Commit`.
- Hành động đổi trạng thái là **POST** + `[ValidateAntiForgeryToken]`, không bao giờ là GET.

## 17. Cấu trúc controller / view cho chứng từ

Thêm vào cây thư mục mục 2:

```
Services/           InventoryService.cs
Models/             DocStatus.cs, TransferStatus.cs, StockTakeStatus.cs (enum)
ViewModels/         <Chứng từ>ViewModel.cs (form nhiều dòng chi tiết)
Controllers/        WarehouseController, ProductController, SupplierController, CustomerController,
                    GoodsReceiptController, PurchaseReturnController, StockIssueController,
                    StockTransferController, StockTakeController, InvoiceController,
                    InventoryController (tồn kho + thẻ kho), ReportController, AccountController, HomeController
```

- Form chứng từ có **nhiều dòng chi tiết** → dùng `ViewModel` (header + `List<DetailItem>`), thêm dòng bằng jQuery/AJAX theo phong cách mục 10 (tìm hàng hóa, thêm vào bảng chi tiết, tính thành tiền bằng JS). Đây là chỗ duy nhất được dùng `ViewModel`; màn hình CRUD danh mục vẫn bind thẳng entity như lab.
- Luồng màn hình mỗi chứng từ: `Index` (danh sách có lọc theo trạng thái, khoảng ngày, kho, tìm theo mã + phân trang AJAX như mục 10) → `Create`/`Edit` (lưu phiếu tạm) → `Details` (có nút *Hoàn thành*, *Hủy*, in) .
- Bộ lọc `Index` bám theo KiotViet: **Ngày tạo** (Tháng này / Tùy chỉnh), **Trạng thái** (checkbox), **Người tạo**, ô tìm theo mã phiếu. Cột bảng theo từng phiếu giống màn hình mẫu (ví dụ kiểm kho: Mã kiểm kho, Thời gian, Tổng thực tế, Tổng chênh lệch, SL lệch tăng, SL lệch giảm, Ngày cân bằng).
- Menu trái/trên (layout) theo nhóm KiotViet: **Tổng quan · Hàng hóa (Danh sách hàng hóa, Kiểm kho, Xuất dùng nội bộ, Xuất hủy, Chuyển kho) · Mua hàng (Nhà cung cấp, Nhập hàng, Trả hàng nhập) · Đơn hàng (Hóa đơn) · Khách hàng · Báo cáo · Thiết lập (Kho, Người dùng)**. Dựng bằng `ViewComponent` (mục 8), ẩn mục theo vai trò.

## 18. Đăng nhập và phân quyền

- **Cookie Authentication** trên bảng `AppUser` (không dùng ASP.NET Core Identity). Cấu hình `AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(...)` và `app.UseAuthentication()` **trước** `app.UseAuthorization()`.
- Mật khẩu: **băm** (BCrypt.Net hoặc `PasswordHasher<AppUser>`), tuyệt đối không lưu/so sánh mật khẩu thô. Cột `PasswordHash` trong dữ liệu mẫu là `CHANGE_ME`, ứng dụng phải có cách tạo/đặt lại mật khẩu admin.
- Claims lúc đăng nhập: `UserID`, `Username`, `FullName`, `Role` (tên role), và danh sách `WarehouseID` được phép (từ `UserWarehouse`).
- Vai trò: **Admin** (mọi quyền, mọi kho), **Thủ kho** (nhập, xuất, chuyển, kiểm, tồn kho), **Nhân viên bán hàng** (hóa đơn, khách hàng, xem tồn), **Kế toán** (báo cáo, công nợ, xem chứng từ).
- Dùng `[Authorize]` toàn controller (mặc định đăng nhập mới vào được), `[Authorize(Roles = "Admin,Thủ kho")]` cho từng nhóm chức năng, `[AllowAnonymous]` cho `AccountController.Login`.
- **Giới hạn theo kho** (quan trọng): mọi truy vấn chứng từ/tồn kho của người không phải Admin phải lọc `WarehouseID` thuộc danh sách kho được gán. Viết một helper dùng chung (ví dụ `BaseController` hoặc extension `ForUser(IQueryable<T>)`) thay vì lặp lại. Mọi action sửa/hoàn thành/hủy phải kiểm tra quyền trên kho của phiếu đó (xem `UserCanAccessWarehouse` ở mục 16). Chuyển kho: người tạo phải có quyền kho nguồn, người nhận phải có quyền kho đích.
- Dropdown chọn kho chỉ liệt kê các kho người dùng được gán.

## 19. Nhật ký thao tác

Ghi `AuditLog` (cùng transaction với thao tác chính) cho: tạo, sửa, hoàn thành, hủy, nhận hàng, cân bằng kho, xóa phiếu tạm, đổi quyền. Trường `Action` dùng tiếng Anh (`Create`, `Update`, `Complete`, `Cancel`, `Receive`, `Balance`, `Delete`), `EntityName` là tên entity, `Detail` mô tả ngắn tiếng Việt (ví dụ "Hủy phiếu nhập PN000012").

## 20. Báo cáo và Tổng quan

- Dùng view `vw_InventoryByWarehouse` và `vw_LowStock` (hoặc LINQ tương đương) cho tồn kho và cảnh báo hết hàng.
- Báo cáo tối thiểu: **Tồn kho theo kho** (có tổng giá trị = `Quantity × CostPrice`), **Nhập–Xuất–Tồn theo kỳ** (tính từ `StockCard`), **Hàng dưới định mức**, **Thẻ kho theo hàng hóa**, **Chuyển kho**, **Hàng hủy**, **Doanh thu & lãi gộp** (từ `Invoice`, dùng `UnitCost`).
- Báo cáo đọc từ `StockCard`/view, không tính lại từ phiếu. Truy vấn chỉ đọc dùng `AsNoTracking()`.
- Xuất Excel/in phiếu: dùng thư viện nhẹ (ví dụ ClosedXML) và chỉ thêm khi người dùng yêu cầu.
- Trang Tổng quan: giá trị tồn kho, số phiếu hôm nay theo loại, số mặt hàng dưới định mức, phiếu chuyển kho đang chờ nhận.

## 21. Checklist riêng cho chức năng kho

Trước khi coi một chức năng chứng từ là xong, AI phải tự kiểm tra:

1. Mọi thay đổi tồn đi qua `InventoryService` và nằm trong **một transaction**.
2. Có kiểm tra **trạng thái hợp lệ** (chỉ phiếu tạm mới Hoàn thành; không sửa phiếu đã hoàn thành).
3. Có kiểm tra **đủ tồn** trước khi trừ, thông báo lỗi tiếng Việt, không để lọt tồn âm.
4. Có kiểm tra **quyền theo kho** (kể cả với id truyền trên URL).
5. Hủy phiếu đã hoàn thành sinh **bút toán đảo**, không xóa lịch sử.
6. Có ghi `StockCard` (đúng `DocType`, `QtyAfter`) và `AuditLog`.
7. Các cột computed (`Code`, `LineTotal`, `DiffQty`) không bị gán hay `Bind`.
8. Dropdown chỉ liệt kê kho/hàng hóa đang hoạt động và kho người dùng được phép.
9. Giao diện tiếng Việt, bám layout và phong cách Bootstrap ở Phần A.

## 22. Layout của dự án (khác bài lab)

- **Chỉ một layout chính: `Views/Shared/_Layout.cshtml`** (thay file mặc định của template). Khai báo mặc định **một lần** trong `Views/_ViewStart.cshtml`: `@{ Layout = "_Layout"; }`. Các View thường **không** tự ghi `Layout = ...` (lab ghi ở từng view chỉ để học; dự án thật không lặp lại).
- Chỉ thêm layout khác khi **khung trang khác hẳn**:
  - `_LoginLayout.cshtml`: trang đăng nhập (không header, không menu). View Login ghi đè `Layout = "_LoginLayout";`.
  - `_PrintLayout.cshtml`: trang in phiếu (không menu, khổ giấy). Chỉ tạo khi làm chức năng in.
- **Không** tạo layout riêng cho từng chức năng (nhập hàng, kiểm kho...). Khác nhau giữa các trang thì dùng View, partial, ViewComponent hoặc `@section`.
- Phân chia trách nhiệm trong `_Layout.cshtml`: Layout chỉ giữ **khung chung** (head, `<partial name="_Header" />`, `@await Component.InvokeAsync("MainMenu")`, `<main>@RenderBody()</main>`, `<partial name="_FloatingHelp" />`, nạp `site.js`, `@await RenderSectionAsync("Scripts", required: false)`). Tiêu đề trang, thanh tìm kiếm, bộ lọc, bảng nằm trong **View** của từng trang.
- Tiêu đề tab trình duyệt: `<title>@ViewData["Title"] - KhoPro</title>`, mỗi View đặt `ViewData["Title"]`.

## 23. Kho đang làm việc (WarehouseSwitcher)

- Header có ô chọn kho (ViewComponent `WarehouseSwitcherViewComponent`, đặt trong `_Header`), giống cách KiotViet chọn chi nhánh. Chỉ liệt kê các kho người dùng được gán (`UserWarehouse`); **Admin** có thêm mục "Tất cả kho".
- Kho đang chọn lưu trong **claim hoặc Session** (`CurrentWarehouseId`), đổi bằng `POST Account/SwitchWarehouse` rồi quay lại trang trước. Mỗi request phải **kiểm tra lại** kho đó còn thuộc danh sách được gán.
- `BaseController` cung cấp thuộc tính `CurrentWarehouseId` (null = tất cả kho, chỉ Admin). Mọi danh sách, tồn kho, phiếu mới đều theo kho này.
- "Tất cả kho" chỉ dùng để **xem, báo cáo**. Tạo phiếu hoặc thao tác thay đổi tồn mà đang ở "Tất cả kho" thì bắt người dùng chọn một kho cụ thể trước.
- Chuyển kho: kho nguồn = kho đang làm việc, kho đích chọn trong form (khác kho nguồn).
- Đổi kho khi đang lập phiếu dở: cảnh báo và xóa các dòng đang nhập (tồn mỗi kho khác nhau), hoặc yêu cầu lưu tạm trước.

## 24. Kiểm kho là chức năng mẫu

- Làm Kiểm kho trước các chứng từ khác, theo đúng `dac-ta-kiem-kho.md`. Cách làm form nhiều dòng ở đó (ViewModel + JS tính toán phía client + gửi JSON) là **khuôn mẫu** cho Nhập hàng, Xuất, Chuyển kho, Hóa đơn.
- Các quyết định đã chốt: có WarehouseSwitcher (mục 23); phiếu đã cân bằng không hủy; tồn tại thời điểm lập phiếu chỉ để hiển thị, tồn chính thức được chốt lại khi Hoàn thành; dòng Chưa kiểm bị bỏ qua; giá trị lệch = SL lệch × giá vốn.
- Bản mẫu giao diện tĩnh: `prototype-kiemkho-lapphieu.html` (logic JS tính lệch, tab, nhật ký là phần sẽ chuyển vào `@section Scripts`).
