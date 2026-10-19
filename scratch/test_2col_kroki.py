import urllib.request, zlib, base64, struct

mermaid_code = '''flowchart TD
    subgraph Client["1. Thủ kho / Giao diện người dùng (Client UI)"]
        A1([Bắt đầu]) --> A2["Mở form 'Tạo phiếu nhập hàng'"]
        A2 --> A3["Chọn Nhà cung cấp và Chi nhánh kho đích"]
        A3 --> A4["F3 Tìm kiếm mặt hàng, nhập SL & Đơn giá"]
        A4 --> A5["Bấm nút 'Hoàn thành'"]
        A7["Hiển thị thông báo thành công<br>& Điều hướng danh sách chứng từ"] --> A8([Kết thúc: Nhập hàng thành công])
    end

    subgraph Server["2. Web App & CSDL (Backend Logic & Database)"]
        B1["Nhận Request POST Create"]
        B2{"Kiểm tra tính hợp lệ?<br>(Có NCC, Chi tiết >= 1 dòng, SL > 0)"}
        B3["Trả về thông báo lỗi Validation"]
        B4["Mở Transaction CSDL (BeginTransactionAsync)"]
        B5["Tính lại Giá vốn bình quân MAC:<br>GiaVonMoi = (TonCu*GiaCu + SL*GiaNhap) / (TonCu + SL)"]
        
        subgraph DB["Ghi dữ liệu & Tồn kho trong Transaction"]
            C1[("Master-Detail:<br>PhieuNhap & ChiTietPhieuNhap (DA_XAC_NHAN)")]
            C2[("Cập nhật Giá vốn mới<br>vào bảng HangHoa")]
            C3[("Tăng số lượng tồn kho<br>qua View vw_TonKhoHienTai")]
            C4[("Cập nhật Công nợ phải trả<br>bảng DonViCapHang")]
            C5[("Ghi Nhật ký thao tác<br>vào bảng NhatKyThaoTac")]
        end
        
        B6["Commit Transaction & Khóa chứng từ vĩnh viễn"]
    end

    %% Cân bằng vị trí 2 cột Trái - Phải ngang hàng
    A1 ~~~ B1
    
    A5 --> B1
    B1 --> B2
    B2 -- Không hợp lệ --> B3
    B3 --> A4
    B2 -- Hợp lệ --> B4
    B4 --> B5
    B5 --> C1
    C1 --> C2
    C2 --> C3
    C3 --> C4
    C4 --> C5
    C5 --> B6
    B6 --> A7
'''

compressed = zlib.compress(mermaid_code.encode('utf-8'), 9)
encoded = base64.urlsafe_b64encode(compressed).decode('utf-8')
url = f'https://kroki.io/mermaid/png/{encoded}'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = resp.read()
        w, h = struct.unpack('>LL', data[16:24])
        print(f'Rendered size: {w}x{h}, aspect ratio w/h = {w/h:.2f}, h/w = {h/w:.2f}')
        with open('scratch/test_2col_side.png', 'wb') as f:
            f.write(data)
except Exception as e:
    print('Error:', e)
