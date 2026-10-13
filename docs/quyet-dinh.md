# Sổ Quyết định Kỹ thuật & Nghiệp vụ (Architecture & Business Decisions)

> **Mục đích**: Ghi lại mọi quyết định quan trọng đã được thống nhất để các phiên làm việc tiếp theo không hỏi lại hoặc làm mâu thuẫn với các quyết định trước. Mỗi dòng ghi theo định dạng: `[Ngày] – [Quyết định] – [Lý do]`.

---

- **2026-10-12** – Chọn phong cách giao diện KiotViet cho toàn bộ hệ thống – Mang lại trải nghiệm thực tế, chuyên nghiệp, quen thuộc với người quản lý kho và đáp ứng đầy đủ yêu cầu bài tập lớn.
- **2026-10-12** – Sử dụng duy nhất một Layout chính `_Layout.cshtml` qua `_ViewStart.cshtml` – Tránh lặp lại mã trong các View con, giữ khung trang cố định (Topbar + Menu + Body). Chỉ tạo thêm `_LoginLayout` và `_PrintLayout` khi khung trang khác biệt hoàn toàn.
- **2026-10-12** – Thiết kế bộ chọn kho làm việc `WarehouseSwitcher` ở Header lưu trong Session – Cho phép người dùng chuyển đổi kho làm việc nhanh chóng. Tùy chọn "Tất cả kho" chỉ dùng để tra cứu/báo cáo; khi tạo chứng từ biến động bắt buộc phải chọn một kho cụ thể.
- **2026-10-12** – Phiếu kiểm kho đã cân bằng KHÔNG bao giờ được hủy – Tồn kho sau đó đã được các giao dịch bán hàng, xuất kho sử dụng làm căn cứ. Hủy phiếu cũ sẽ làm sai lệch chuỗi số liệu; nếu kiểm sai phải lập phiếu kiểm mới.
- **2026-10-12** – Khi bấm Hoàn thành/Cân bằng phiếu kiểm phải đọc lại tồn sổ sách tại thời điểm cân bằng – Đảm bảo số lượng chênh lệch phản ánh đúng sai lệch giữa thực tế đếm được và tồn hệ thống mới nhất.
- **2026-10-12** – Kiểm kho dùng giá vốn (hoặc giá tham khảo) để tính giá trị chênh lệch – Giúp chủ kho nắm được chính xác giá trị tài sản thiếu hụt hoặc dư thừa tính bằng tiền VNĐ.
- **2026-10-13** – Tạm giữ nguyên tên `HangHoasController` (dạng số nhiều) và ghi vào Nợ kỹ thuật – Tuân thủ quy tắc không tự ý đổi tên các file C# đang chạy ổn định của dự án.
- **2026-10-13** – Chuẩn hóa nghiệp vụ tính tồn kho dựa trên View `vw_TonKhoHienTai` thật của CSDL – Đồng bộ code và CSDL thực tế, loại bỏ phụ thuộc vào các bảng `Inventory` và `StockCard` ảo trong tài liệu cũ.
- **2026-10-13** – Áp dụng 3 "Nguyên tắc vàng" khi AI sửa/nâng cấp CSDL – Đảm bảo CSDL có thể mở rộng linh hoạt theo tính năng mới nhưng luôn tuân thủ nguyên tắc "Chỉ cộng, không phá", đồng bộ script SQL tức thì và báo cáo trước khi sửa.
- **2026-10-13** – Nâng cấp CSDL Schema đợt 1 (GiaVon, PhieuXuat, TaiKhoan_Kho) qua file `docs/database_update.sql` – Mở rộng tính năng định giá vốn cho hàng hóa, cho phép xuất kho nội bộ/hủy không phụ thuộc đơn bán, phân quyền kho theo tài khoản và cập nhật View tồn kho tương thích.
- **2026-10-13** – Tách View CSDL thành 2 tầng: `vw_BienDongKho` (chi tiết có ngày tháng) và `vw_TonKhoHienTai` (tổng hợp) – Giải quyết trọn vẹn [ISSUE-01] và [ISSUE-03], chống nuốt dữ liệu xuất kho âm thầm và cung cấp nền tảng chuẩn để lập Thẻ kho / Báo cáo Nhập-Xuất-Tồn theo kỳ.
- **2026-10-13** – Xây dựng dịch vụ `ITonKhoService` đóng gói kiểm tra chặn tồn âm nghiệp vụ kho – Giải quyết [ISSUE-02], ngăn chặn mọi giao dịch xuất, hủy nhập hoặc cân bằng kiểm kê dẫn đến âm kho; cung cấp thông báo tiếng Việt thân thiện, rõ ràng.
- **2026-10-13** – Sử dụng LINQ Projection loại bỏ việc nạp byte[] `VARBINARY(MAX)` vào RAM server khi tra cứu danh sách hàng hóa – Giải quyết [ISSUE-04], giảm 99% RAM server khi hiển thị danh sách hàng hóa có hình ảnh.
