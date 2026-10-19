# 📦 KhoPro – Hệ Thống Quản Lý Kho Hàng Nội Bộ Đa Chi Nhánh

> **Bài tập lớn môn Lập trình Web** – Xây dựng hệ thống quản trị kho hàng nội bộ chuyên nghiệp mô phỏng quy chuẩn thực tế (tương tự KiotViet/Sapo) cho chuỗi phân phối thiết bị gas, khí công nghiệp và phụ kiện tại Phú Quốc.

---

## 📌 Mục Lục
1. [Giới thiệu tổng quan](#-giới-thiệu-tổng-quan)
2. [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
3. [Các phân hệ & Tính năng cốt lõi](#-các-phân-hệ--tính-năng-cốt-lõi)
4. [Kiến trúc nghiệp vụ & Luồng vận hành](#-kiến-trúc-nghiệp-vụ--luồng-vận-hành)
5. [Hướng dẫn cài đặt & Chạy trên máy mới](#-hướng-dẫn-cài-đặt--chạy-trên-máy-mới)
6. [Tài khoản kiểm thử nghiệm thu](#-tài-khoản-kiểm-thử-nghiệm-thu)
7. [Cấu trúc mã nguồn](#-cấu-trúc-mã-nguồn)
8. [Quy ước kỹ thuật & Điểm nổi bật](#-quy-ước-kỹ-thuật--điểm-nổi-bật)

---

## 📖 Giới thiệu tổng quan

**KhoPro** là ứng dụng Web quản lý kho hàng nội bộ đa chi nhánh, giải quyết bài toán luân chuyển hàng hóa, theo dõi tồn kho theo thời gian thực và kiểm soát hao hụt thất thoát giữa các kho biệt lập trên đảo Phú Quốc:
- **Kho trung tâm** (Phường Dương Đông): Tổng kho tiếp nhận hàng hoá từ đất liền.
- **Kho An Thới** (Phường An Thới): Chi nhánh kho phía Nam đảo phục vụ bán lẻ và tàu bè.
- **Kho phụ kiện Tuna** (Xã Dương Tơ): Kho chuyên trách vật tư cơ khí, đồng hồ áp suất và thiết bị an toàn.

Hệ thống được thiết kế theo trải nghiệm giao diện **KiotViet UI**, tối ưu thao tác bàn phím (F1, F3, Esc), lọc dữ liệu không tải lại trang qua AJAX, phân trang động, và hỗ trợ trích xuất Excel/CSV chuyên nghiệp.

---

## 🛠 Công nghệ sử dụng

| Tầng công nghệ | Công nghệ / Thư viện | Mô tả |
|---|---|---|
| **Backend Framework** | **ASP.NET Core MVC (.NET 10)** | C# 13/14, Dependency Injection, Controller-View-ViewModel pattern |
| **Truy cập dữ liệu** | **Entity Framework Core 10** | Mô hình **Database-First**, tối ưu truy vấn AsNoTracking, Transactions |
| **Cơ sở dữ liệu** | **Microsoft SQL Server** | Indexed Views (`vw_TonKhoHienTai`, `vw_BienDongKho`), Filtered Indexes, Check Constraints |
| **Xác thực & Phân quyền** | **Cookie Authentication** | Claims-based Authorization: Phân quyền theo vai trò & Kho công tác |
| **Giao diện người dùng** | **HTML5, CSS3, Bootstrap 5, JS ES6** | Hệ thống Lego UI chuẩn KiotViet: Dropdown, DatePicker, Toast, Prompt, Modal đa tầng |
| **Biểu tượng (Icons)** | **Bootstrap Icons** | Icon trực quan, đồng bộ toàn hệ thống |
| **Xử lý Excel** | **ClosedXML** | Xuất/nhập file Excel `.xlsx` chuyên nghiệp theo chuẩn định dạng tiền tệ và ngày tháng VN |

---

## 🚀 Các phân hệ & Tính năng cốt lõi

### 1. Quản lý Hàng hóa & Danh mục (`/HangHoa`)
- Danh mục sản phẩm phân cấp theo Nhóm hàng (`Bình gas`, `Phụ kiện gas`, `Than sạch`, `Khí công nghiệp`, `Thiết bị an toàn`).
- Quản lý giá vốn, giá bán tham khảo, đơn vị tính, vị trí kệ hàng, trọng lượng.
- Thiết lập **Ngưỡng tồn tối thiểu / tối đa** cho từng kho riêng biệt để cảnh báo hết hàng/tồn thừa.
- Xem trực tiếp **Thẻ kho** và lịch sử biến động ngay trong Drawer chi tiết hàng hóa.
- Nhập/Xuất danh sách hàng hóa ra file Excel `.xlsx` chuẩn mẫu.

### 2. Nhập hàng (`/NhapHang`)
- Lập phiếu nhập từ nhà cung cấp, hỗ trợ cả 2 hình thức: *Nhập thông thường* và *Nhập số dư đầu kỳ*.
- Tự động tính toán chiết khấu, giảm giá phiếu nhập, tính tiền cần trả NCC.
- Đầy đủ 3 trạng thái: `NHAP` (Phiếu tạm), `DA_XAC_NHAN` (Đã nhập - cập nhật tồn kho), `HUY` (Đã hủy).
- In phiếu nhập kho A4/A5 và sao chép chứng từ nhanh.

### 3. Chuyển kho nội bộ (`/ChuyenKho`)
- Điều chuyển hàng hóa 2 chiều linh hoạt giữa 3 chi nhánh kho.
- Quy trình chuẩn 2 bước an toàn:
  1. **Kho xuất**: Lập phiếu và xác nhận xuất hàng (`DA_XUAT`) ➜ Trừ tồn kho nguồn ngay lập tức.
  2. **Kho nhận**: Kiểm đếm hàng cập cảng và xác nhận nhận (`DA_NHAN`) ➜ Cộng tồn kho đích.
- **Xử lý thất thoát trên đường vận chuyển**: Cho phép số lượng nhận nhỏ hơn số lượng xuất (ví dụ rò rỉ van trên phà biển), ghi chú lý do thất thoát và lưu vết kiểm định.

### 4. Trả hàng nhập (`/TraHangNhap`)
- Trả lại hàng cận date, vỏ bình hư hỏng hoặc phụ kiện trầy xước cho Nhà cung cấp.
- Quản lý chiết khấu trả hàng, tính số tiền cần thu lại từ NCC.
- Tự động trừ tồn kho khi phiếu hoàn tất (`DA_TRA_HANG`).

### 5. Xuất hủy (`/XuatHuy`)
- Thanh lý, tiêu hủy hàng hóa hư hại không thể tái sử dụng (bình gas rỉ sét chân đế, than ngấm nước mưa bão, kính bếp vỡ...).
- Ghi nhận chi tiết nguyên nhân xuất hủy và trừ trực tiếp vào giá trị sổ sách.

### 6. Kiểm kho & Cân bằng tồn (`/PhieuKiemKe`)
- Hỗ trợ kiểm đếm định kỳ theo từng kho: Ghi nhận số lượng sổ sách vs số lượng thực tế.
- Tự động tính lệch thừa / lệch thiếu và giá trị chênh lệch.
- **Cân bằng kho 1-click**: Sinh phiếu điều chỉnh (`PhieuDieuChinh`) trạng thái `DA_DUYET`, cập nhật tức thì tồn kho thực tế. Khóa vĩnh viễn phiếu kiểm sau khi đã cân bằng để chống gian lận.

### 7. Báo cáo Tồn kho & Thẻ kho (`/BaoCao/TonKho`, `/BaoCao/TheKho`)
- **Tồn kho hiện tại**: Báo cáo tổng hợp số lượng tồn, giá trị tồn kho theo từng kho hoặc toàn chuỗi.
- **Thẻ kho chi tiết**: Truy vết từng dòng biến động (Nhập, Xuất, Chuyển đi, Chuyển đến, Xuất hủy, Điều chỉnh kiểm kê) kèm tồn cuối sau mỗi giao dịch.

### 8. Quản trị & Nhật ký (`/NguoiDung`, `/NhaCungCap`, `/Kho`)
- Quản lý người dùng, phân quyền vai trò (`Quản lý`, `Thủ kho`, `Bán hàng`) và gán kho làm việc.
- Quản lý nhóm nhà cung cấp và thông tin đối tác KiotViet.
- **Nhật ký thao tác hệ thống (`NhatKyThaoTac`)**: Ghi nhận toàn bộ thao tác thêm, sửa, duyệt, hủy chứng từ phục vụ hậu kiểm.
- **Hệ thống trợ giúp KiotHelp (F1)**: Modal hướng dẫn quy trình và phím tắt chuyên biệt cho từng màn hình.

---

## 🔄 Kiến trúc nghiệp vụ & Luồng vận hành

```mermaid
flowchart TD
    NCC["Nhà cung cấp"] -->|1. Nhập hàng| Kho1["Kho trung tâm (Kho 1)"]
    
    subgraph "Luân chuyển nội bộ"
        Kho1 -->|2. Xuất chuyển (DA_XUAT)| Trans["Đang trung chuyển qua phà"]
        Trans -->|3. Nhận hàng (DA_NHAN)| Kho2["Kho An Thới (Kho 2)"]
        Trans -->|3. Nhận hàng (DA_NHAN)| Kho3["Kho phụ kiện Tuna (Kho 3)"]
    end
    
    Kho1 -->|4. Trả hàng lỗi| NCC
    Kho2 -->|5. Xuất hủy hàng hư hỏng| Disposal["Hủy bỏ / Thanh lý"]
    
    subgraph "Kiểm soát kho"
        Count["Kiểm kê định kỳ"] --> Diff{"Có chênh lệch?"}
        Diff -->|Có| Adj["Phiếu điều chỉnh cân bằng"]
        Diff -->|Khớp 100%| Done["Chốt kiểm kê"]
        Adj -->|Cập nhật sổ sách| Stock["vw_TonKhoHienTai"]
    end
    
    Kho1 -.-> Stock
    Kho2 -.-> Stock
    Kho3 -.-> Stock
```

---

## 💻 Hướng dẫn cài đặt & Chạy trên máy mới

### Yêu cầu môi trường
- **.NET 10 SDK** (kiểm tra bằng lệnh `dotnet --version`).
- **SQL Server 2019/2022** hoặc **SQL Server Express** / **LocalDB**.
- **SQL Server Management Studio (SSMS)** hoặc **Azure Data Studio**.

---

### Bước 1: Lấy mã nguồn
```bash
git clone https://github.com/your-repo/BTL-LTW-QuanLiKho-2.git
cd BTL-LTW-QuanLiKho-2
```

---

### Bước 2: Thiết lập Cơ sở dữ liệu (Chọn 1 trong 2 cách)

#### 👉 Cách 1: Phục hồi từ file Backup (Nhanh nhất - Khuyên dùng)
Dự án đã đính kèm sẵn file backup đầy đủ cấu trúc và dữ liệu mẫu kiểm thử:
📁 `docs/QuanLyKhoPhuQuocLTW.bak`

1. Mở **SQL Server Management Studio (SSMS)** và kết nối vào SQL Server của bạn.
2. Click chuột phải vào **Databases** ➜ Chọn **Restore Database...**
3. Ở mục **Source**, chọn **Device** ➜ Bấm dấu `...` ➜ Bấm **Add** và trỏ tới file `docs/QuanLyKhoPhuQuocLTW.bak`.
4. Bấm **OK**. Toàn bộ CSDL và dữ liệu mẫu sẽ được tạo xong trong 5 giây!

#### 👉 Cách 2: Chạy file Script SQL trọn gói
Nếu không dùng file backup, mở file sau trong SSMS và bấm **Execute (F5)**:
📄 `docs/QuanLyKhoPhuQuocLTW_FullScript.sql`

*Hoặc chạy nhanh qua PowerShell/CMD:*
```powershell
sqlcmd -S ".\SQLEXPRESS" -E -C -f 65001 -i "docs\QuanLyKhoPhuQuocLTW_FullScript.sql"
```

---

### Bước 3: Cấu hình chuỗi kết nối
Mở file `BTL-LTW-QuanLiKho-2/appsettings.json`, kiểm tra chuỗi kết nối phù hợp với tên máy chủ SQL Server của bạn:
```json
{
  "ConnectionStrings": {
    "QuanLyKhoPhuQuocLtwContext": "Server=.\\SQLEXPRESS;Database=QuanLyKhoPhuQuocLTW;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
  }
}
```
> [!NOTE]
> - Nếu máy của bạn dùng bản SQL Server mặc định (không phải bản Express), hãy đổi `Server=.\\SQLEXPRESS` thành `Server=.` hoặc `Server=localhost`.
> - Nếu dùng tài khoản `sa`: `Server=localhost;Database=QuanLyKhoPhuQuocLTW;User Id=sa;Password=MatKhau;TrustServerCertificate=True;MultipleActiveResultSets=true`.

---

### Bước 4: Khởi chạy ứng dụng
Mở terminal tại thư mục gốc dự án:
```bash
# Khôi phục package và biên dịch
dotnet build BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2.csproj

# Khởi chạy ứng dụng
dotnet run --project BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2.csproj
```

Mở trình duyệt và truy cập:
👉 **`https://localhost:5001`** hoặc **`http://localhost:5000`**

---

## 🔑 Tài khoản kiểm thử nghiệm thu

Hệ thống đã có sẵn 3 tài khoản nghiệp vụ với dữ liệu mẫu phong phú:

| Tên đăng nhập | Mật khẩu | Vai trò | Kho mặc định | Phạm vi quyền hạn |
|---|:---:|---|---|---|
| **`quanly`** | `123456` | **Quản lý** | Kho trung tâm | Toàn quyền toàn chuỗi kho: Nhập, xuất, chuyển, kiểm kê, duyệt cân bằng, xem báo cáo, quản lý người dùng & thiết lập hệ thống. |
| **`thukho`** | `123456` | **Nhân viên kho** | Kho An Thới | Lập phiếu nhập kho, thực hiện xuất/nhận chuyển kho, tạo phiếu xuất hủy, kiểm đếm kho. |
| **`banhang`** | `123456` | **Nhân viên bán hàng** | Kho trung tâm | Lập đơn bán hàng, tạo phiếu xuất bán hàng, tra cứu nhanh tồn kho. |

---

## 📂 Cấu trúc mã nguồn

```
BTL-LTW-QuanLiKho-2/
├── .agent/rules/                  # Quy chuẩn kiến trúc & nghiệp vụ kho (12 luật cốt lõi)
├── BTL-LTW-QuanLiKho-2/           # Project ASP.NET Core MVC chính
│   ├── Controllers/               # Các Controller nghiệp vụ (HangHoa, NhapHang, ChuyenKho...)
│   ├── Models/                    # Entity Models (Database First từ SQL Server)
│   ├── Services/                  # Business Logic Services (TonKhoService, TheKhoService...)
│   ├── ViewModels/                # ViewModels chuyên biệt theo từng phân hệ
│   ├── Views/                     # Razor Views & PartialViews
│   │   ├── Shared/                # Layout chính (_Layout.cshtml) và các Lego blocks dùng chung
│   │   ├── HangHoa/               # Danh sách hàng hóa, Drawer chi tiết, Modal thêm/sửa
│   │   ├── NhapHang/              # Danh sách & Form lập phiếu nhập hàng
│   │   ├── ChuyenKho/             # Danh sách & Form lập/nhận phiếu chuyển kho
│   │   ├── TraHangNhap/           # Danh sách & Form trả hàng cho NCC
│   │   ├── XuatHuy/               # Danh sách & Form xuất hủy hàng hỏng
│   │   ├── PhieuKiemKe/           # Kiểm kê kho & cân bằng chênh lệch
│   │   └── BaoCao/                # Báo cáo tồn kho & Thẻ kho
│   ├── wwwroot/                   # Tài nguyên tĩnh (CSS KiotViet, JS Lego, Icons, Ảnh)
│   ├── appsettings.json           # Cấu hình ConnectionString và ứng dụng
│   └── Program.cs                 # Cấu hình DI, Middleware, Authentication
├── docs/                          # Tài liệu đặc tả, quyết định kỹ thuật & CSDL
│   ├── QuanLyKhoPhuQuocLTW.bak   # File Backup CSDL trọn gói (phục hồi nhanh)
│   ├── QuanLyKhoPhuQuocLTW_FullScript.sql # Script SQL tạo toàn bộ CSDL và dữ liệu
│   ├── specs/                     # Tài liệu đặc tả chức năng chi tiết từng màn hình
│   └── quyet-dinh.md              # Sổ ghi chép quyết định kiến trúc dự án
├── migrations/sql/                # Lịch sử 15 file migration SQL từng bước
├── AGENTS.md                      # Bản quy ước vận hành cốt lõi của dự án
└── PROGRESS.md                    # Bảng theo dõi tiến độ chi tiết qua các phiên làm việc
```

---

## 💎 Quy ước kỹ thuật & Điểm nổi bật

1. **Quản lý tồn kho động qua View**: Không duy trì cột tồn kho tĩnh dễ gây sai lệch. Toàn bộ tồn kho thực tế được tính toán tức thì qua View `vw_TonKhoHienTai` dựa trên biến động của tất cả chứng từ đã xác nhận.
2. **Tính toàn vẹn dữ liệu qua Transaction**: Mọi thao tác lưu chứng từ kèm chi tiết, chuyển kho 2 bước, cân bằng kho đều được bọc trong `BeginTransactionAsync()`.
3. **Nguyên tắc bất biến của chứng từ**: Chứng từ đã hoàn thành (`DA_XAC_NHAN`, `DA_NHAN`, `DA_DIEU_CHINH`) bị khóa tuyệt đối, không cho phép sửa/xóa nhằm đảm bảo tính minh bạch kế toán kho.
4. **Hệ thống Lego UI tái sử dụng**:
   - Bộ lọc ngày nhanh `_KiotDateFilter` (Hôm nay, Hôm qua, Tuần này, Tháng này, Tùy chỉnh).
   - Combobox tìm kiếm và thêm nhanh đối tác `KiotFilter.initCombobox`.
   - Phân trang chuẩn KiotViet `_Pagination` hỗ trợ AJAX.
   - Hộp thoại xác nhận thay thế native alert `KiotPrompt`.
   - Thông báo Toast góc màn hình `KiotToast`.
5. **Kiến trúc Z-Index 6 tầng**: Ngăn chặn triệt để tình trạng dropdown in-page đè lên Header hoặc Modal bị giam cầm trong Stacking Context cục bộ.

---

*Dự án Bài tập lớn Lập trình Web – KhoPro Quản lý kho hàng nội bộ đa chi nhánh Phú Quốc.*
