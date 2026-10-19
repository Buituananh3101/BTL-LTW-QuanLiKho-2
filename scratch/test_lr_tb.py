import urllib.request, zlib, base64, time, struct

def render_kroki(mermaid_code, out_name):
    comp = zlib.compress(mermaid_code.encode('utf-8'), 9)
    enc = base64.urlsafe_b64encode(comp).decode('utf-8')
    url = f'https://kroki.io/mermaid/png/{enc}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = resp.read()
                w, h = struct.unpack('>LL', data[16:24])
                print(f"[{out_name}] Success: {w}x{h}, aspect ratio w/h = {w/h:.2f}, h/w = {h/w:.2f}")
                with open(f'scratch/{out_name}.png', 'wb') as f:
                    f.write(data)
                return w, h
        except Exception as e:
            print(f"[{out_name}] Attempt {attempt+1} failed: {e}")
            time.sleep(2)
    return None

# Case A: flowchart LR với direction TB
case_a = '''flowchart LR
    subgraph Client["1. Thủ kho / Giao diện người dùng (Client UI)"]
        direction TB
        A1([Bắt đầu]) --> A2["Mở form 'Tạo phiếu nhập hàng'"]
        A2 --> A3["Chọn Nhà cung cấp và Chi nhánh kho đích"]
        A3 --> A4["F3 Tìm kiếm mặt hàng, nhập SL & Đơn giá"]
        A4 --> A5["Bấm nút 'Hoàn thành'"]
        A7["Hiển thị thông báo thành công<br>& Điều hướng danh sách chứng từ"] --> A8([Kết thúc: Nhập hàng thành công])
    end

    subgraph Server["2. Web App & CSDL (Backend Logic & Database)"]
        direction TB
        B1["Nhận Request POST Create"] --> B2{"Kiểm tra tính hợp lệ?<br>(Có NCC, Chi tiết >= 1 dòng, SL > 0)"}
        B2 -- Không hợp lệ --> B3["Trả về thông báo lỗi Validation"]
        B2 -- Hợp lệ --> B4["Mở Transaction CSDL (BeginTransactionAsync)"]
        B4 --> B5["Tính lại Giá vốn bình quân MAC:<br>GiaVonMoi = (TonCu*GiaCu + SL*GiaNhap) / (TonCu + SL)"]
        
        subgraph DB["Ghi dữ liệu & Tồn kho trong Transaction"]
            direction TB
            C1[("Master-Detail:<br>PhieuNhap & ChiTietPhieuNhap (DA_XAC_NHAN)")]
            C2[("Cập nhật Giá vốn mới<br>vào bảng HangHoa")]
            C3[("Tăng số lượng tồn kho<br>qua View vw_TonKhoHienTai")]
            C4[("Cập nhật Công nợ phải trả<br>bảng DonViCapHang")]
            C5[("Ghi Nhật ký thao tác<br>vào bảng NhatKyThaoTac")]
            C1 --> C2 --> C3 --> C4 --> C5
        end
        B5 --> DB
        DB --> B6["Commit Transaction & Khóa chứng từ vĩnh viễn"]
    end

    A5 --> B1
    B3 --> A4
    B6 --> A7
'''

render_kroki(case_a, 'case_a')
