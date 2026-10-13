# Danh sách Vấn đề & Nợ kỹ thuật cần xử lý (Backlog)

> **Quy tắc vận hành**:
> - Danh sách này do Chủ dự án (Tuấn Anh) phê duyệt và quản lý.
> - AI khi thực hiện chỉ nhận nhiệm vụ từ danh sách này, sửa đúng lỗi được giao.
> - Sau khi sửa xong và kiểm tra build thành công, AI đánh dấu `[x]` và cập nhật vào `PROGRESS.md`.
> - Tuyệt đối không tự ý xóa bỏ lỗi hoặc sửa lan sang các phần khác khi chưa được yêu cầu.

---

## NHÓM 1: CỰC KỲ NGHIÊM TRỌNG (Lỗi sai số liệu & Hiệu năng)

- [x] **[ISSUE-01] Lỗ hổng nuốt dữ liệu âm thầm trong `vw_TonKhoHienTai`**
  - *Hiện trạng*: Trong View CSDL, trừ tồn xuất dùng `WHERE COALESCE(px.MaKho, db.MaKho) IS NOT NULL AND COALESCE(ctpx.MaHang, ctdb.MaHang) IS NOT NULL`. Nếu phiếu xuất thiếu dữ liệu, dòng xuất bị bỏ qua, tồn không bị trừ mà không báo lỗi.
  - *Giải pháp đã xử lý*: Ràng buộc `NOT NULL` cho `MaKho` ở `PhieuXuat` và `MaHang` ở `ChiTietPhieuXuat`. Bỏ mệnh đề lọc ẩn này trong View để bảo đảm dữ liệu xuất luôn được tính toán chính xác 100%.

- [x] **[ISSUE-02] Không có ràng buộc và kiểm tra chặn tồn âm**
  - *Hiện trạng*: Nếu hủy phiếu nhập sau khi hàng đã xuất bán, hoặc 2 giao dịch xuất cùng lúc vượt quá tồn, CSDL sẽ bị tồn kho âm.
  - *Giải pháp đã xử lý*: Tạo dịch vụ dùng chung `ITonKhoService` / `TonKhoService`, đóng gói các phương thức `KiemTraXuatKhoAsync`, `KiemTraHuyPhieuNhapAsync`, `KiemTraKiemKeAsync` kiểm tra tồn trước giao dịch, chặn đứng việc xuất/hủy/cân bằng gây âm kho và quăng thông báo tiếng Việt thân thiện.

- [x] **[ISSUE-03] View không có cột ngày tháng, không làm được Báo cáo Nhập-Xuất-Tồn theo kỳ**
  - *Hiện trạng*: `vw_TonKhoHienTai` gom toàn bộ lịch sử không có ngày, không xem được Thẻ kho hay báo cáo theo khoảng ngày.
  - *Giải pháp đã xử lý*: Tách làm 2 View:
    1. `vw_BienDongKho`: Lưu từng dòng biến động kèm `NgayGiaoDich`, `MaKho`, `MaHang`, `LoaiChungTu`, `MaChungTu`, `SoLuongTang`, `SoLuongGiam`.
    2. `vw_TonKhoHienTai`: `SELECT MaKho, MaHang, CAST(SUM(SoLuongTang - SoLuongGiam) AS DECIMAL(18,2)) AS SoLuongTon FROM vw_BienDongKho GROUP BY MaKho, MaHang;`. Đã đồng bộ Model C# `VwBienDongKho` vào DbContext.

- [x] **[ISSUE-04] Lỗ hổng tràn RAM khi nạp ảnh binary `VARBINARY(MAX)` trong `HangHoasController`**
  - *Hiện trạng*: `query.OrderBy(...).ToListAsync()` nạp toàn bộ entity `HangHoa` gồm mảng byte ảnh `HinhAnh` vào RAM server trước khi phân trang.
  - *Giải pháp đã xử lý*: Dùng LINQ Projection `.Select(...)` chỉ lấy cờ `HasImage = x.HinhAnh != null`, loại bỏ triệt để việc đọc và chuyển dữ liệu mảng byte `VARBINARY(MAX)` qua RAM khi lấy danh sách. Giảm 99% dung lượng bộ nhớ server.

- [ ] **[ISSUE-05] Luồng Bán hàng (POS) đứt gãy với biến động tồn kho**
  - *Hiện trạng*: View tồn chỉ trừ kho theo `PhieuXuat`, không trừ theo `DonBan`. Nếu bán tại quầy mà không tự sinh `PhieuXuat` thì kho không giảm.
  - *Giải pháp*: Quy định rõ: Đơn bán tại quầy (POS) tự động sinh kèm 1 `PhieuXuat` trạng thái `DA_XAC_NHAN` trong cùng 1 transaction.

---

## NHÓM 2: QUAN TRỌNG (Kiến trúc, CSDL & Quy tắc nghiệp vụ)

- [ ] **[ISSUE-06] Chốt phương pháp phát triển CSDL & Quản lý Script**
  - *Hiện trạng*: Thực tế đang chạy Database First nhưng chưa có script schema nền đánh số, chưa có backup trước khi chạy.
  - *Giải pháp*: Chốt **Database First có kiểm soát**. Mọi thay đổi lưu vào `migrations/sql/` đánh số thứ tự (`01_init.sql`, `02_update_schema.sql`...).

- [ ] **[ISSUE-07] Bổ sung `GiaVon` và lưu đơn giá chốt tại thời điểm kiểm kho**
  - *Hiện trạng*: `HangHoa` chưa có `GiaVon`. Bảng `ChiTietPhieuKiemKe` không lưu đơn giá lúc kiểm, làm giá trị chênh lệch bị nhảy theo giá mới tương lai.
  - *Giải pháp*: Thêm cột `GiaVon` vào `HangHoa`. Thêm cột `DonGia` vào `ChiTietPhieuKiemKe` để "đóng băng" giá trị thất thoát tại thời điểm cân bằng.

- [ ] **[ISSUE-08] Đổi tên `HangHoasController` -> `HangHoaController` ngay khi còn ít Controller**
  - *Hiện trạng*: `HangHoasController` (số nhiều) lệch chuẩn với `PhieuKiemKeController` (số ít).
  - *Giải pháp*: Đổi tên Controller và thư mục `Views/HangHoas` thành `Views/HangHoa`.

- [ ] **[ISSUE-09] Đổi tên bảng `TaiKhoan_Kho` thành `TaiKhoanKho`**
  - *Hiện trạng*: Tên bảng chứa dấu gạch dưới lệch quy ước PascalCase. Logic seed mặc định đang cấp toàn bộ kho cho mọi tài khoản.
  - *Giải pháp*: Đổi tên thành `TaiKhoanKho`, xây dựng logic gán kho theo tài khoản thực tế.

- [ ] **[ISSUE-10] Quy định rõ về Đơn vị tính (Không có hệ số quy đổi)**
  - *Hiện trạng*: Không có bảng quy đổi ĐVT (Thùng -> Lon/Chai).
  - *Giải pháp*: Ghi rõ luật: Hệ thống chỉ quản lý theo 1 ĐVT cơ bản duy nhất; chứng từ nhập/xuất/kiểm chỉ dùng ĐVT cơ bản.

- [ ] **[ISSUE-11] Khắc phục Race Condition khi sinh mã tự động `MaHangNoiBo`**
  - *Hiện trạng*: Đọc `MaxAsync` rồi cộng 1 ở client dễ bị đụng độ khi nhiều người lưu cùng lúc.
  - *Giải pháp*: Bắt lỗi `DbUpdateException` trùng mã để thử lại, hoặc dùng Sequence trong SQL Server.

- [ ] **[ISSUE-12] Bảo mật Controller & Xóa bỏ dữ liệu giả lập (Hardcode User/Kho)**
  - *Hiện trạng*: `PhieuKiemKeController` đang hardcode `MaNV = 2` và `MaTaiKhoan = 1`, không có `[Authorize]`.
  - *Giải pháp*: Tích hợp Cookie Authentication, đọc ID nhân viên và quyền kho từ Claims.

- [ ] **[ISSUE-13] Sắp xếp lại thứ tự ưu tiên các module trong `PROGRESS.md`**
  - *Hiện trạng*: Đăng nhập đang xếp trước Nhập kho, trong khi không có Nhập kho thì không có hàng để thử Xuất, Chuyển, Kiểm.
  - *Giải pháp*: Đưa phân hệ Nhập kho lên làm trước.

---

## NHÓM 3: NHỎ & DỌN DẸP TÀI LIỆU

- [ ] **[ISSUE-14] Thay toàn bộ đường dẫn tuyệt đối `file:///d:/...` bằng đường dẫn tương đối**
  - *Hiện trạng*: Khoảng 30 link `file:///d:/...` trong các file .md sẽ hỏng khi đổi máy hoặc đưa cho người khác.
  - *Giải pháp*: Chuyển thành link tương đối dạng `./...` hoặc `../...`.

- [ ] **[ISSUE-15] Xóa bỏ khái niệm "bút toán đảo" trong `docs/specs/_mau-dac-ta.md`**
  - *Hiện trạng*: File mẫu còn ghi "bút toán đảo", sai lệch với kiến trúc View tính toán hiện tại.
  - *Giải pháp*: Cập nhật lại thành "Chuyển trạng thái chứng từ sang HUY".

- [ ] **[ISSUE-16] Chuẩn hóa ApiResponse dạng JSON cho các Controller**
  - *Hiện trạng*: Các action AJAX đang trả về định dạng JSON lộn xộn.
  - *Giải pháp*: Tạo class `ApiResponse` `{ success, message, data }` dùng chung.

- [ ] **[ISSUE-17] Dọn dẹp các file rác của template Lab cũ trong `Views/Shared/`**
  - *Hiện trạng*: Còn `MyLayout.cshtml`, `Main.cshtml`, `LeftMenu.cshtml`, `TopNav.cshtml`, `Footer.cshtml`.
  - *Giải pháp*: Xóa bỏ hoàn toàn các file này.

- [ ] **[ISSUE-18] Xóa file `Views/HangHoas/_ViewStart.cshtml` thừa**
  - *Hiện trạng*: Trùng lặp với `Views/_ViewStart.cshtml`.
  - *Giải pháp*: Xóa bỏ file này.

- [ ] **[ISSUE-19] Tạo file dữ liệu mẫu chuẩn `DuLieuMau.sql` để demo**
  - *Hiện trạng*: Chưa có script tạo sẵn hàng hóa, nhà cung cấp, kho và phiếu mẫu để chạy thử 1 click.
  - *Giải pháp*: Xuất bản script `DuLieuMau.sql` hoàn chỉnh kèm tài khoản admin.
