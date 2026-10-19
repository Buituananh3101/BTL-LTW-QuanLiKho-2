import urllib.request, zlib, base64, struct

def render_code(mermaid_code, name):
    comp = zlib.compress(mermaid_code.encode('utf-8'), 9)
    enc = base64.urlsafe_b64encode(comp).decode('utf-8')
    url = f'https://kroki.io/mermaid/png/{enc}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
            w, h = struct.unpack('>LL', data[16:24])
            print(f"[{name}] w={w}, h={h}, ratio w/h={w/h:.2f}, h/w={h/w:.2f}")
            with open(f'scratch/{name}.png', 'wb') as f:
                f.write(data)
            return w, h
    except Exception as e:
        print(f"[{name}] Error: {e}")
        return None

# Case 1: Dùng liên kết ẩn giữa các tầng song song để ép 2 cột nằm song song
code_2col = '''flowchart TD
    subgraph Client ["1. Thủ kho / Giao diện người dùng (Client UI)"]
        A1([Bắt đầu])
        A2["Mở form 'Tạo phiếu nhập hàng'"]
        A3["Chọn NCC và Chi nhánh kho đích"]
        A4["F3 Tìm kiếm mặt hàng, nhập SL & Giá"]
        A5["Bấm nút 'Hoàn thành'"]
        A6["Nhận phản hồi từ Hệ thống"]
        A7["Hiển thị thông báo thành công<br>& Điều hướng danh sách chứng từ"]
        A8([Kết thúc: Nhập hàng thành công])
        
        A1 --> A2 --> A3 --> A4 --> A5
        A6 --> A7 --> A8
    end

    subgraph Server ["2. Web App & CSDL (Backend Logic & Database)"]
        B1["Nhận Request POST Create"]
        B2{"Kiểm tra tính hợp lệ?<br>(Có NCC, Chi tiết >= 1 dòng, SL > 0)"}
        B3["Trả về thông báo lỗi Validation"]
        B4["Mở Transaction CSDL (BeginTransactionAsync)"]
        B5["Tính lại Giá vốn bình quân MAC"]
        
        subgraph DB ["Ghi dữ liệu & Tồn kho trong Transaction"]
            C1[("Master-Detail: PhieuNhap & ChiTietPhieuNhap")]
            C2[("Cập nhật Giá vốn mới vào bảng HangHoa")]
            C3[("Tăng tồn kho qua View vw_TonKhoHienTai")]
            C4[("Cập nhật Công nợ NCC bảng DonViCapHang")]
            C5[("Ghi Nhật ký vào bảng NhatKyThaoTac")]
            C1 --> C2 --> C3 --> C4 --> C5
        end
        
        B6["Commit Transaction & Khóa chứng từ"]
        
        B1 --> B2
        B2 -- Hợp lệ --> B4 --> B5 --> DB --> B6
        B2 -- Không hợp lệ --> B3
    end

    %% Ép 2 cột nằm cạnh nhau bằng liên kết ẩn ngang hàng
    A1 ~~~ B1
    A2 ~~~ B2
    A3 ~~~ B4
    A4 ~~~ B5
    A5 ~~~ DB
    A6 ~~~ B6

    %% Luồng nghiệp vụ liên cột
    A5 ==>|Gửi Form POST| B1
    B3 ==>|Trả lỗi Form| A4
    B6 ==>|HTTP 200 OK| A6
'''

render_code(code_2col, 'test_2col_aligned')
