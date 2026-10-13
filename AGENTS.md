# AGENTS.md – Quy chuẩn vận hành cho AI Assistant

## 1. Mô tả dự án & Công nghệ
- **Dự án**: Website Quản lý kho hàng nhiều kho (Bài tập lớn Lập trình Web).
- **Giao diện & Nghiệp vụ**: Mô phỏng theo chuẩn thực tế của KiotViet (menu Hàng hóa, Kho, Mua hàng, Bán hàng, Báo cáo, Thiết lập).
- **Nền tảng kỹ thuật**: ASP.NET Core MVC trên .NET 10 (`net10.0`), Entity Framework Core 10.
- **Cơ sở dữ liệu**: SQL Server (`QuanLyKhoPhuQuocLTW`), kết nối qua Windows Authentication / Local SQL Server Express.
- **Quy ước ngôn ngữ code**: Lớp Model, DbContext, Controller, View, Bảng CSDL và Thuộc tính đều đặt bằng **TIẾNG VIỆT KHÔNG DẤU** (`HangHoa`, `Kho`, `PhieuKiemKe`, `ChiTietPhieuNhap`...).

---

## 2. Quy trình đầu phiên (Bắt buộc trước khi viết code)
1. **Đọc `AGENTS.md` và `PROGRESS.md`**: Nắm rõ luật cốt lõi, tiến độ hiện tại, việc đang dở và nợ kỹ thuật.
2. **Đọc đặc tả chức năng**: Nếu người dùng yêu cầu làm chức năng X, đọc file `docs/specs/<chức-năng>.md`. Nếu chưa có đặc tả, tạo file nháp từ `docs/specs/_mau-dac-ta.md` và hỏi người dùng xác nhận trước khi code.
3. **Tóm tắt đầu phiên (3–5 dòng)**: Báo cáo với người dùng: *"Tôi hiểu phiên này làm gì, dự kiến tác động vào các file nào"*. Chờ người dùng đồng ý nếu có chỉnh sửa các file dùng chung (`_Layout.cshtml`, `QuanLyKhoPhuQuocLtwContext`, các Service dùng chung...).

---

## 3. Quy trình cuối phiên (Khi người dùng nói "kết thúc phiên" / "chốt")
1. **Kiểm tra biên dịch**: Chạy build kiểm tra dự án, báo cáo rõ nếu có cảnh báo hoặc lỗi.
2. **Cập nhật `PROGRESS.md`**:
   - Chuyển việc đã làm từ "Đang làm" sang "Đã xong".
   - Cập nhật mục "Đang làm" và "Việc kế tiếp".
   - Thêm dòng vào "Nhật ký phiên" (ngày – tóm tắt 2–4 dòng).
3. **Cập nhật quyết định**: Nếu trong phiên có quyết định kiến trúc/nghiệp vụ mới, ghi thêm dòng vào `docs/quyet-dinh.md`.
4. **Cập nhật tài liệu luật**: Nếu tạo mới partial, ViewComponent, Service, cấu trúc CSDL thì cập nhật file luật tương ứng trong `.agent/rules/`.
5. **Đề xuất Git commit**: Đưa ra gợi ý thông điệp commit ngắn gọn, chuẩn mực để người dùng tự commit.

---

## 4. 12 Luật cốt lõi không được vi phạm
1. **Tên tiếng Việt trong code**: Toàn bộ Model, DbContext, Controller, Action, View, ViewModel, Bảng và Cột phải dùng tiếng Việt không dấu PascalCase (`HangHoa`, `MaKho`, `SoLuong`). Không tự ý đặt tên tiếng Anh.
2. **Chỉ một Layout chính**: Dùng duy nhất `Views/Shared/_Layout.cshtml` qua `_ViewStart.cshtml`. Không dùng và không khôi phục lại các file lab cũ (`MyLayout.cshtml`, `LeftMenu.cshtml`...).
3. **Quản lý biến động kho tập trung**: Mọi biến động tồn kho (nhập, xuất, chuyển, cân bằng kiểm kho) phải tuân theo đúng quy tắc nghiệp vụ kho trong `.agent/rules/02-nghiep-vu-kho.md`.
4. **Tồn kho thực tế tính qua `vw_TonKhoHienTai`**: Tồn kho sổ sách hiện thời được tính toán từ View `vw_TonKhoHienTai` (dựa trên `PhieuNhap`, `PhieuXuat`, `PhieuChuyenKho`, `PhieuDieuChinh`), không tạo bảng tồn kho tĩnh làm lệch số liệu.
5. **Cấm sửa/xóa chứng từ đã hoàn thành**: Phiếu tạm (`NHAP`) được phép sửa/xóa. Phiếu đã hoàn thành (`DA_XAC_NHAN`, `DA_DIEU_CHINH`, `DA_NHAN`) **tuyệt đối không được sửa hay xóa**.
6. **Phiếu kiểm kho đã cân bằng KHÔNG được hủy**: Khi đã sinh `PhieuDieuChinh` trạng thái `DA_DUYET`, phiếu kiểm kho bị khóa vĩnh viễn. Sai lệch sau đó phải lập phiếu kiểm mới.
7. **Luôn dùng giao dịch (Transaction)**: Mọi thao tác lưu chứng từ kèm chi tiết và cân bằng kho phải bọc trong `using var trans = await _context.Database.BeginTransactionAsync();`.
8. **3 Nguyên tắc vàng khi sửa CSDL**: (1) Chỉ cộng thêm cột/bảng mới, không DROP/đổi tên cột cũ; (2) Khi sửa Model trong C# phải đồng bộ câu lệnh SQL tương ứng; (3) Phải báo rõ lý do trước khi chạm CSDL.
9. **Chống Over-posting & Validation**: Action POST xử lý dữ liệu form phải có validation rõ ràng, thông báo lỗi tiếng Việt thân thiện.
10. **Lọc và phân trang bằng AJAX**: Các trang danh sách dữ liệu dùng mô hình tìm kiếm, lọc sidebar và phân trang bằng AJAX trả về PartialView (không reload toàn trang).
11. **Không tự ý thêm thư viện ngoài**: Không cài thêm NuGet package hoặc thư viện JS mới khi chưa hỏi ý kiến người dùng.
12. **Bảo toàn tài liệu**: Không để file tài liệu luật nào vượt quá 8.000 ký tự. Khi sửa luật phải nêu rõ nội dung thay đổi.

---

## 5. Mục lục hệ thống tài liệu & Khi nào cần đọc

| Đường dẫn file | Nội dung tóm tắt | Khi nào đọc file này |
|---|---|---|
| [`.agent/rules/01-phong-cach-code.md`](./.agent/rules/01-phong-cach-code.md) | Quy ước đặt tên, cấu trúc Controller/View/ViewModel | Khi tạo hoặc sửa Controller, View, ViewModel mới |
| [`.agent/rules/02-nghiep-vu-kho.md`](./.agent/rules/02-nghiep-vu-kho.md) | Nghiệp vụ tồn kho, trạng thái chứng từ, View tồn kho | Khi code các chức năng liên quan đến nhập, xuất, chuyển, kiểm kho |
| [`.agent/rules/03-giao-dien-layout.md`](./.agent/rules/03-giao-dien-layout.md) | Chuẩn giao diện KiotViet, `_Layout`, Header, Menu, Modal | Khi dựng giao diện màn hình mới hoặc sửa menu/topbar |
| [`.agent/rules/04-xac-thuc-phan-quyen.md`](./.agent/rules/04-xac-thuc-phan-quyen.md) | Phân quyền vai trò, quản lý Kho qua Session/Claim | Khi làm tính năng đăng nhập, bảo vệ Controller, chọn kho |
| [`.agent/rules/05-co-so-du-lieu.md`](./.agent/rules/05-co-so-du-lieu.md) | Quy tắc Database First, DbContext, 3 Nguyên tắc vàng sửa CSDL | Khi cần thêm bảng, thêm cột hoặc cấu hình Entity |
| [`docs/specs/danh-sach-hang-hoa.md`](./docs/specs/danh-sach-hang-hoa.md) | Đặc tả Quản lý Hàng hóa (Khuôn mẫu cho Danh mục CRUD) | Khi tham khảo khuôn mẫu làm các danh mục Kho, NCC, Khách hàng |
| [`docs/specs/kiem-kho.md`](./docs/specs/kiem-kho.md) | Đặc tả Kiểm kho (Khuôn mẫu cho Chứng từ nhiều dòng) | Khi tham khảo khuôn mẫu làm form Nhập hàng, Xuất kho, Chuyển kho |
| [`docs/specs/_mau-dac-ta.md`](./docs/specs/_mau-dac-ta.md) | Mẫu khung tài liệu đặc tả chức năng mới | Khi bắt đầu thiết kế chức năng mới chưa có tài liệu |
| [`docs/quyet-dinh.md`](./docs/quyet-dinh.md) | Sổ ghi chép các quyết định kỹ thuật & nghiệp vụ đã chốt | Khi cần tra cứu lý do tại sao dự án chọn cách làm hiện tại |
| [`docs/van-de-can-xu-ly.md`](./docs/van-de-can-xu-ly.md) | Danh sách 19 vấn đề & nợ kỹ thuật cần xử lý (Backlog) | Khi nhận nhiệm vụ sửa lỗi hoặc dọn nợ kỹ thuật |
| [`PROGRESS.md`](./PROGRESS.md) | Bảng theo dõi tiến độ, nợ kỹ thuật, việc cần làm kế tiếp | Đọc ở đầu mọi phiên làm việc và cập nhật cuối phiên |
