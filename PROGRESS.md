# Tiến độ dự án

Cập nhật lần cuối: 2026-10-14 – Nâng cấp Form Thêm/Sửa Hàng hóa KiotViet 5 ảnh CSDL & Mô tả (Phiên 14)

---

## Đã xong
- **Nâng cấp Form Thêm/Sửa Hàng hóa chuẩn KiotViet (5 ảnh CSDL, Mô tả, ĐVT thay Thương hiệu)**:
  - CSDL: Tạo và thực thi migration script `migrations/sql/07_nang_cap_5_anh_va_mota_hanghoa.sql` bổ sung cột `MoTa NVARCHAR(MAX) NULL` cho `dbo.HangHoa` và tạo bảng `dbo.HinhAnhHangHoa` (`MaHinhAnh`, `MaHang`, `DuLieuAnh`, `ThuTu`, `LaAnhChinh`, `NgayTao`).
  - Backend: Tạo Model `HinhAnhHangHoa.cs`, cập nhật `HangHoa.cs` và `QuanLyKhoPhuQuocLtwContext.cs` (DbSet, quan hệ Cascade), ViewModels (`QuickDvtRequest.cs`, `HangHoaForm.cs`, `HangHoaItemVM.cs`), Controller (`HangHoaController.cs`: GetItem nạp 5 ảnh, Create/Edit lưu bảng ảnh + đồng bộ ảnh chính `HangHoa.HinhAnh`, API `CreateDvtQuick`, `GetImage` hỗ trợ index ảnh phụ).
  - Frontend: Tạo `_HangHoaModal.cshtml` theo chuẩn prototype KiotViet (2 tabs Thông tin & Mô tả, khu vực 5 ảnh với thumbnail + badge ảnh chính, bỏ bảng quy đổi đơn vị và thương hiệu, thay vị trí thương hiệu bằng Đơn vị tính + nút tạo nhanh, accordion mở rộng, modal gợi ý chọn nhanh đơn vị/vị trí, footer nút kép Lưu & Lưu và thêm mới); tách CSS module `hang-hoa-form.css` và JS logic `hang-hoa-form.js`; tích hợp vào `Index.cshtml` và đồng bộ `_HangHoaTable.cshtml`.
  - Đồng bộ đặc tả: Cập nhật `docs/specs/danh-sach-hang-hoa.md` tuân thủ Luật 12. – 2026-10-14
- **Bổ sung Thuộc tính Hàng hóa chuẩn KiotViet (Vị trí, Trọng lượng, Tồn cao nhất, Thuộc tính động)**:
  - CSDL: Tạo và thực thi migration script `migrations/sql/06_bo_sung_vitri_trongluong_thuoctinh_tontoida.sql` bổ sung `ViTri`, `TrongLuong`, `DonViTrongLuong`, `ThuocTinh` (JSON array) vào bảng `dbo.HangHoa`, bổ sung `TonCaoNhat` vào bảng `dbo.NguongTonKho`.
  - Backend: Cập nhật Models (`HangHoa.cs`, `NguongTonKho.cs`, `QuanLyKhoPhuQuocLtwContext.cs`), ViewModels (`HangHoaForm.cs`, `HangHoaItemVM`, `ThuocTinhItemVM`, `CapNhatThuocTinhRequest`), và Controller (`HangHoaController.cs`: Create, Edit, GetItem, UpdateThuocTinh, bọc Transaction).
  - Frontend: Cập nhật form modal Thêm/Sửa với section Tồn kho (3 cột: Tồn ban đầu, Định mức thấp nhất, Định mức cao nhất), Vị trí (input + prompt Tạo mới), Trọng lượng (số + g/kg), Thuộc tính động (thêm/xóa dòng Tên - Giá trị kèm gợi ý datalist); modal cập nhật nhanh `quickAttrModal`; cập nhật dòng chi tiết inline accordion hiển thị Định mức tồn Min-Max, Trọng lượng, Vị trí, badges thuộc tính kèm nút "+ Thêm thuộc tính" – [`Index.cshtml`](./BTL-LTW-QuanLiKho-2/Views/HangHoa/Index.cshtml), [`_HangHoaTable.cshtml`](./BTL-LTW-QuanLiKho-2/Views/HangHoa/_HangHoaTable.cshtml) – 2026-10-14
- **Tối ưu Responsive Phóng to & Thu nhỏ chuẩn KiotViet**: Xây dựng cơ chế responsive toàn diện khi zoom in (phóng to / màn hình hẹp < 992px) và zoom out (thu nhỏ / widescreen):
  - Zoom in: Tự động ẩn `_MainMenu`, Topbar thu gọn với nút Hamburger và Avatar tròn, Offcanvas navigation drawer đầy đủ tính năng; Sidebar bộ lọc chuyển sang dạng Drawer mở bằng nút Phễu cạnh tiêu đề "Hàng hóa"; thanh công cụ thu gọn nút thành icon (`+`, bảng tính, cài đặt, trợ giúp); bảng dữ liệu cuộn ngang độc lập.
  - Zoom out: Bảng hàng hóa và container giãn 100% cân đối, giữ nguyên tỷ lệ KiotViet chuẩn mực.
  - Files tác động: [`_Header.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_Header.cshtml), [`_MainMenu.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_MainMenu.cshtml), [`Index.cshtml`](./BTL-LTW-QuanLiKho-2/Views/HangHoa/Index.cshtml), [`site.css`](./BTL-LTW-QuanLiKho-2/wwwroot/css/site.css) – 2026-10-13
- **Kiểm toán Toàn diện & Chuẩn hóa Kiến trúc Lần cuối**: Khảo sát 4 hướng, gỡ bỏ backdoor `PasswordHelper`, chuẩn hóa `ClaimsPrincipalExtensions.GetVaiTro()`, dọn sạch dead code (`SwitchWarehouse` thừa, `SearchForDoc` thừa, `Logout` POST, `Privacy`), bọc Transaction `HangHoaController.Create`, chuyển `QuickGroupRequest` sang ViewModel, tinh gọn và đồng bộ 100% tài liệu luật/đặc tả/sổ quyết định – 2026-10-13
- **Chuẩn hóa Kiến trúc Mở rộng (4 Trụ cột Foundation)**: Xây dựng `BaseKhoController`, `INhatKyThaoTacService`, `MaChungTuHelper`, phân nhóm thư mục `ViewModels/` modular (`Common`, `HangHoa`, `KiemKho`, `Account`, `Components`), đóng gói `f3-product-search.js`, thêm API `HangHoaController.SearchForDoc` tái sử dụng cho các màn hình chứng từ – [`BaseKhoController.cs`](./BTL-LTW-QuanLiKho-2/Controllers/BaseKhoController.cs), [`NhatKyThaoTacService.cs`](./BTL-LTW-QuanLiKho-2/Services/NhatKyThaoTacService.cs), [`MaChungTuHelper.cs`](./BTL-LTW-QuanLiKho-2/Services/MaChungTuHelper.cs), [`f3-product-search.js`](./BTL-LTW-QuanLiKho-2/wwwroot/js/components/f3-product-search.js) – 2026-10-13
- **Giao diện Đăng nhập KhoPro**: Tích hợp giao diện đăng nhập chuẩn theo prototype, tách `_LoginLayout.cshtml`, `dang-nhap.css`, `dang-nhap.js`, tối ưu ảnh nền kho `login-bg.jpg` (1920px, ~391 KB < 500 KB), logo thương hiệu `logo.svg`, hỗ trợ ẩn/hiện mật khẩu, cảnh báo Caps Lock, validation client & server, gắn nhanh tài khoản mẫu – [`Login.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Account/Login.cshtml), [`_LoginLayout.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_LoginLayout.cshtml) – 2026-10-13
- **Chuẩn hóa ViewComponent cho Layout Header**: Triển khai `WarehouseSwitcherViewComponent`, xóa bỏ `@inject DbContext` trong `_Header.cshtml`, phân quyền kho theo tài khoản (`TaiKhoanKho`), bổ sung action `SwitchWarehouse` – [`WarehouseSwitcherViewComponent.cs`](./BTL-LTW-QuanLiKho-2/ViewComponents/WarehouseSwitcherViewComponent.cs) – 2026-10-13
- **Cấu trúc Giao diện & Layout KiotViet**: Dựng layout chuẩn với Topbar cố định, Warehouse Switcher, Mega menu ngang KiotViet – [`_Layout.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_Layout.cshtml), [`_Header.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_Header.cshtml), [`_MainMenu.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_MainMenu.cshtml) – 2026-10-12
- **Quản lý Hàng hóa**: Danh sách hàng hóa, lọc nhiều tiêu chí, phân trang AJAX, modal thêm/sửa qua JSON, upload ảnh base64, định mức tồn kho (Xem [`docs/specs/danh-sach-hang-hoa.md`](./docs/specs/danh-sach-hang-hoa.md)) – 2026-10-12
- **Quản lý Kiểm kho (Module mẫu)**: Lập phiếu kiểm kho, tìm hàng F3/autocomplete, nạp hàng theo nhóm, lưu tạm, cân bằng kho sinh `PhieuDieuChinh`, đọc tồn `vw_TonKhoHienTai`, ghi nhật ký (Xem [`docs/specs/kiem-kho.md`](./docs/specs/kiem-kho.md)) – 2026-10-12
- **Hệ thống Luật & Trí nhớ AI**: Khảo sát đối chiếu CSDL/code thật, thiết lập `AGENTS.md`, 5 file quy tắc trong `.agent/rules/`, đặc tả mẫu `docs/specs/`, sổ quyết định `docs/quyet-dinh.md` – 2026-10-13
- **Hoàn tất 100% Nhóm 1: Nghiêm trọng ([ISSUE-01] đến [ISSUE-05])**: Sửa view nuốt dữ liệu, chặn tồn âm (`TonKhoService`), tách `vw_BienDongKho`, tối ưu RAM ảnh, POS tự sinh phiếu xuất (`BanHangService`) – 2026-10-13
- **Hoàn tất 100% Nhóm 2: Quan trọng ([ISSUE-06] đến [ISSUE-13])**: DDL `migrations/sql/`, thêm `GiaVon`, đóng băng đơn giá kiểm kho, đổi tên `HangHoaController`, `TaiKhoanKho`, luật 1 ĐVT, retry chống trùng mã hàng, Cookie Auth (`AccountController`), nạp claims – 2026-10-13
- **Hoàn tất 100% Nhóm 3: Nhỏ & Dọn dẹp tài liệu ([ISSUE-14] đến [ISSUE-19])**: Chuyển toàn bộ link sang tương đối, chuẩn hóa hủy chứng từ theo kiến trúc View, chuẩn hóa `ApiResponse` JSON, dọn sạch 5 view lab rác, xóa `_ViewStart` thừa, xuất bản script seed demo chuẩn `05_dulieumau_seed.sql` – 2026-10-13
- **ĐÓNG HOÀN TOÀN 19/19 VẤN ĐỀ BACKLOG KỸ THUẬT (100%)** tại [`docs/van-de-can-xu-ly.md`](./docs/van-de-can-xu-ly.md) – 2026-10-13

---

## Đang làm
- **Chuẩn bị xây dựng Phân hệ Nhập kho**: Soạn thảo tài liệu đặc tả `docs/specs/nhap-kho.md` từ khuôn mẫu `_mau-dac-ta.md`, chuẩn bị các ViewModel và `PhieuNhapController`.

---

## Việc kế tiếp (Xếp theo thứ tự ưu tiên)
1. Lập tài liệu đặc tả chi tiết `docs/specs/nhap-kho.md` theo chuẩn Kiểm kho.
2. Xây dựng ViewModel cho Nhập kho (`NhapKhoIndexVM`, `NhapKhoFormVM`, `NhapKhoLineVM`, `SaveGoodsReceiptRequest`...).
3. Xây dựng `PhieuNhapController` (Index, Create, Details, In phiếu, Hủy phiếu) tích hợp `TonKhoService.KiemTraHuyPhieuNhapAsync`.
4. Dựng giao diện `Views/PhieuNhap/` (Index, Create, Details, `_PhieuNhapTable.cshtml`) chuẩn phong cách KiotViet.
5. Xây dựng phân hệ Xuất kho (Xuất bán POS, Xuất nội bộ, Xuất hủy) và Chuyển kho.

---

## Nợ kỹ thuật / cần dọn
- Chi tiết toàn bộ 19 vấn đề được theo dõi tập trung tại: [`docs/van-de-can-xu-ly.md`](./docs/van-de-can-xu-ly.md). Hiện đã hoàn thành **19/19 vấn đề (100% toàn bộ Backlog đã được giải quyết)**. Hệ thống sạch nợ kỹ thuật và sẵn sàng mở rộng các phân hệ nghiệp vụ tiếp theo!

---

## Nhật ký phiên
- **2026-10-14 (Phiên 15 - Chiều)**:
  - Khắc phục triệt để lỗi tìm kiếm theo Vị trí ở thanh menu lọc bên trái (Left Menu Filter):
    - **Backend**: Sửa lỗi truy vấn trong `HangHoaController.cs` khi lọc `viTri` trước đó truy vấn sai vào trường `HangHoa.QuyCach`. Chuyển toàn bộ Expression query sang trường chuẩn `HangHoa.ViTri`.
    - **Nạp động & Ô tìm kiếm nhanh**: Bổ sung `ViTris` vào `HangHoaIndexVM`, tự động nạp danh sách vị trí thực tế trong DB kết hợp vị trí mặc định; bổ sung ô input `.kiot-ms-search` ("Tìm vị trí...") trong dropdown `#dropdownViTri` giúp người dùng tìm kiếm nhanh khi danh sách vị trí dài.
  - Sửa lỗi xung đột ID và hoàn thiện Multi-select Vị trí trong Modal Tạo/Sửa Hàng hóa:
    - **Xung đột ID**: Đổi tên các ID trong Modal (`_HangHoaModal.cshtml`) thành `formViTriWrap`, `formViTriBox`, `formViTriTags`, `formViTriSearch`, `formViTriDropdown`, `formViTriList` nhằm cô lập hoàn toàn với dropdown `#boxViTri` của Leftmenu.
    - **Giao diện**: Đồng bộ chiều cao chuẩn `38px` cân bằng với ô Trọng lượng, hiển thị tag dạng chip `[ a × ] [ b × ]` kèm dấu tích xanh `✓` trong dropdown chọn theo mẫu KiotViet; thiết lập `z-index` và `overflow: visible` cho Section 3.
    - Kiểm tra cú pháp JS và biên dịch: Đạt chuẩn. Đồng bộ `docs/specs/danh-sach-hang-hoa.md`.
- **2026-10-14 (Phiên 14 - Chiều)**:
  - Tái thiết kế và nâng cấp toàn diện Modal Tạo/Sửa Hàng hóa theo prototype KiotViet `prototype-taohanghoa.html`:
    - CSDL: Nâng cấp lưu trữ từ 1 ảnh thành tối đa 5 ảnh lưu trực tiếp trong SQL Server qua bảng `dbo.HinhAnhHangHoa` (`migrations/sql/07_nang_cap_5_anh_va_mota_hanghoa.sql`) và bổ sung cột `MoTa` cho `dbo.HangHoa`.
    - Nghiệp vụ & Giao diện: Thay thế vị trí Thương hiệu bằng Đơn vị tính (combobox + prompt tạo nhanh); loại bỏ bảng quy đổi đơn vị phụ (giữ đúng nguyên tắc 1 ĐVT); thiết kế 2 tab (Thông tin chung & Mô tả); thanh công cụ đính kèm tối đa 5 ảnh (kèm đặt làm ảnh đại diện, xóa ảnh, upload kéo thả hoặc chọn file); các khối accordion Vị trí/Trọng lượng/Thuộc tính động; nút Lưu phân tách (Lưu / Lưu & thêm mới).
    - Backend: Viết API `CreateDvtQuick`, nạp và lưu trữ đồng bộ bảng `HinhAnhHangHoa` và ảnh chính `HangHoa.HinhAnh` đảm bảo tương thích ngược 100% với các View và query tồn kho; cập nhật ViewModels và Specs.
    - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-14 (Phiên 13 - Trưa)**:
  - Bổ sung và nâng cấp đầy đủ các thuộc tính còn thiếu trong Quản lý Hàng hóa theo mẫu thực tế KiotViet:
    - CSDL: Tạo và chạy migration script `06_bo_sung_vitri_trongluong_thuoctinh_tontoida.sql` bổ sung các trường `ViTri`, `TrongLuong`, `DonViTrongLuong`, `ThuocTinh` cho `dbo.HangHoa` và `TonCaoNhat` cho `dbo.NguongTonKho`.
    - Backend: Cập nhật Entity, DbContext Fluent API, `HangHoaForm`, `HangHoaItemVM`, `ThuocTinhItemVM`, `CapNhatThuocTinhRequest`, và `HangHoaController` (xử lý Create, Edit, GetItem, API `UpdateThuocTinh`).
    - Frontend: Cập nhật modal Thêm/Sửa với các khối Tồn kho (3 cột), Vị trí (input + link Tạo mới), Trọng lượng (số + g/kg), Thuộc tính động (dòng Tên - Giá trị kèm gợi ý datalist); bổ sung modal cập nhật nhanh thuộc tính `quickAttrModal`; cập nhật dòng chi tiết inline accordion hiển thị Định mức tồn Min-Max, Trọng lượng, Vị trí, badges thuộc tính kèm nút "+ Thêm thuộc tính".
    - Kiểm tra biên dịch: 0 lỗi. Đồng bộ tài liệu đặc tả `docs/specs/danh-sach-hang-hoa.md`.
- **2026-10-13 (Phiên 12 - Tối muộn)**:
  - Tối ưu giao diện đáp ứng (Responsive) khi Phóng to (Zoom in / màn hình hẹp < 992px) và Thu nhỏ (Zoom out / widescreen >= 1400px) mô phỏng chính xác mẫu KiotViet:
    - Khi Phóng to / Màn hình nhỏ: Ẩn thanh menu ngang xanh `_MainMenu`, Topbar thu gọn với nút Hamburger và Avatar; mở menu điều hướng qua Offcanvas drawer; Sidebar bộ lọc chuyển sang Drawer mở bằng nút Phễu (`bi-funnel`) cạnh tiêu đề "Hàng hóa"; thanh công cụ thu gọn nút thành icon (`+`, bảng tính, cài đặt, trợ giúp); bảng dữ liệu cuộn ngang độc lập không bị tràn.
    - Khi Thu nhỏ / Màn hình rộng: Bảng hàng hóa và container giãn 100% cân đối, giữ nguyên tỉ lệ phân bố giữa sidebar và danh sách bảng, không méo mó vỡ khung.
    - Biên dịch kiểm tra: 0 lỗi.
- **2026-10-13 (Phiên 11 - Đêm)**:
  - Khảo sát kiểm toán toàn diện kiến trúc 4 hướng qua subagents và xử lý dứt điểm toàn bộ tồn đọng:
    - Bảo mật: Gỡ bỏ backdoor bypass mật khẩu trong `PasswordHelper.cs`; dọn sạch chuỗi mojibake và logic lỏng lẻo trong `ClaimsPrincipalExtensions.GetVaiTro()`.
    - Chuẩn hóa BaseKhoController & Controller: Gỡ bỏ method `GetCurrentUserId()` gây nhầm lẫn tên gọi giữa MaNv và MaTaiKhoan; cập nhật `PhieuKiemKeController` dùng `CurrentNhanVienId`.
    - Dọn dẹp dead code: Xóa action `SwitchWarehouse` trùng lặp trong `PhieuKiemKeController`, xóa `SearchForDoc` thừa trong `HangHoaController`, xóa action `Logout` POST thừa trong `AccountController`, xóa `Privacy` và chuẩn hóa namespace file-scoped trong `HomeController`.
    - Tái cấu trúc & Quy tắc: Chuyển `QuickGroupRequest` vào `ViewModels/HangHoa/`; bọc `BeginTransactionAsync()` cho `HangHoaController.Create` tuân thủ Rule 7; đồng bộ `MaPhieuHienThi` dùng `MaChungTuHelper`.
    - Đồng bộ tài liệu: Tinh gọn `01-phong-cach-code.md` về 7.925 ký tự (< 8.000); đồng bộ 5 mâu thuẫn trong rules 02, 03, 04; sửa 100% link gãy trong specs; cập nhật đầy đủ `docs/quyet-dinh.md` từ Phiên 7 đến 11.
    - Biên dịch kiểm tra: 0 cảnh báo, 0 lỗi. Hệ thống đạt độ sạch và chuẩn hóa tối đa.
- **2026-10-13 (Phiên 10 - Tối)**:
  - Triển khai toàn diện 4 Trụ cột tối ưu hóa kiến trúc mở rộng:
    - Xây dựng [`BaseKhoController`](./BTL-LTW-QuanLiKho-2/Controllers/BaseKhoController.cs) quản lý tập trung `CurrentWarehouseId`, `CurrentUserId`, `CurrentNhanVienId`, `CurrentUserRole`, `IsQuanLy`. Refactor `HangHoaController` và `PhieuKiemKeController` kế thừa `BaseKhoController`.
    - Xây dựng [`INhatKyThaoTacService`](./BTL-LTW-QuanLiKho-2/Services/INhatKyThaoTacService.cs) & [`NhatKyThaoTacService`](./BTL-LTW-QuanLiKho-2/Services/NhatKyThaoTacService.cs), đăng ký DI, thay thế đoạn code ghi log kiểm toán thủ công tại `PhieuKiemKeController`.
    - Xây dựng [`MaChungTuHelper`](./BTL-LTW-QuanLiKho-2/Services/MaChungTuHelper.cs) chuẩn hóa quy tắc format mã KiotViet (`FormatMaKiemKe`, `FormatMaNhapKho`, `FormatMaHang`...).
    - Tái cấu trúc thư mục `ViewModels/` dạng modular (`Common`, `HangHoa`, `KiemKho`, `Account`, `Components`), bảo toàn 100% namespace và tương thích ngược.
    - Đóng gói component JS [`f3-product-search.js`](./BTL-LTW-QuanLiKho-2/wwwroot/js/components/f3-product-search.js) và action `HangHoaController.SearchForDoc` dùng chung cho các màn hình chứng từ.
    - Cập nhật quy chuẩn kỹ thuật tại [`.agent/rules/01-phong-cach-code.md`](./.agent/rules/01-phong-cach-code.md). Biên dịch kiểm tra: 0 lỗi.
- **2026-10-13 (Phiên 9 - Chiều)**:
  - Cập nhật chuẩn hóa toàn diện đặc tả [`docs/specs/danh-sach-hang-hoa.md`](./docs/specs/danh-sach-hang-hoa.md): bổ sung Bản đồ File liên quan (File Map) chỉ rõ từng file phụ trách và Bảng luồng tương tác chi tiết 4 bước (Sequence Matrix) giữa Frontend - Backend - DB.
  - Cài đặt quy tắc bắt buộc "Đồng bộ đặc tả chức năng" vào Mục 3 (Quy trình cuối phiên) và Luật 12 trong [`AGENTS.md`](./AGENTS.md), đảm bảo mọi AI ở các phiên sau khi sửa code sẽ tự động cập nhật đặc tả tương ứng. Tinh gọn `AGENTS.md` về mức 7.524 ký tự (< 8.000 ký tự).
- **2026-10-13 (Phiên 8 - Trưa)**:
  - Triển khai giao diện Đăng nhập chuẩn theo prototype `prototype-dangnhap.html`:
    - Tạo `wwwroot/images/login-bg.jpg` (ảnh nền kho chuyên nghiệp 1920px, kích thước 391 KB < 500 KB).
    - Tạo `wwwroot/images/logo.svg` (biểu tượng hộp 3D KhoPro).
    - Tạo `wwwroot/css/dang-nhap.css` chứa CSS giao diện theo mẫu thiết kế.
    - Tạo `wwwroot/js/dang-nhap.js` (ẩn/hiện mật khẩu, cảnh báo Caps Lock, client validation, double-click protection).
    - Tạo `Views/Shared/_LoginLayout.cshtml` theo Rule 03 (layout tối giản dành riêng cho đăng nhập).
    - Cập nhật `Views/Account/Login.cshtml` kết nối model `LoginVM`, CSRF token, validation error box và nút test tài khoản mẫu (`quanly`, `thukho`, `banhang`).
  - Kiểm tra biên dịch: 0 lỗi, giao diện sẵn sàng.
- **2026-10-13 (Phiên 7 - Trưa)**: Chuẩn hóa `WarehouseSwitcherViewComponent`, xóa `@inject DbContext` trong `_Header.cshtml`, lọc kho theo quyền, thêm action `SwitchWarehouse`.
- **2026-10-13 (Phiên 6 - Sáng)**: Đóng 6 lỗi Nhóm 3 ([ISSUE-14] đến [ISSUE-19]), dọn view lab cũ, chuẩn hóa `ApiResponse`, xuất bản `05_dulieumau_seed.sql`. Đóng hoàn toàn 19/19 Backlog.
- **2026-10-13 (Phiên 5 - Sáng)**: Đóng 8 lỗi Nhóm 2 ([ISSUE-06] đến [ISSUE-13]), DDL `migrations/sql/`, thêm `GiaVon`, đổi tên controller/table, Cookie Auth, claims.
- **2026-10-13 (Phiên 4 - Sáng)**: Đóng [ISSUE-05] (POS tự sinh phiếu xuất qua `BanHangService`, chặn âm kho, hoàn tồn khi hủy).
- **2026-10-13 (Phiên 3 - Sáng)**: Đánh dấu sao (Star) bảng hàng hóa; Đóng 4 lỗi nghiêm trọng [ISSUE-01] đến [ISSUE-04].
- **2026-10-13 (Phiên 1 & 2 - Sáng)**: Khởi tạo hệ thống luật AI (`AGENTS.md`, 5 file rules, specs, decisions), phân tích thiết lập 19 vấn đề kỹ thuật.
