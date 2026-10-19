import urllib.request, zlib, base64, struct

def render_code(mermaid_code, name):
    comp = zlib.compress(mermaid_code.encode('utf-8'), 9)
    enc = base64.urlsafe_b64encode(comp).decode('utf-8')
    url = f'https://kroki.io/mermaid/png/{enc}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = resp.read()
            w, h = struct.unpack('>LL', data[16:24])
            print(f"[{name}] w={w}, h={h}, ratio w/h={w/h:.2f}, h/w={h/w:.2f}")
            with open(f'scratch/{name}.png', 'wb') as f:
                f.write(data)
            return w, h
    except Exception as e:
        print(f"[{name}] Error: {e}")
        return None

# Case test: DAG thuần túy không cạnh ngược quấn quanh
code_dag = '''flowchart TD
    subgraph Client ["1. Thủ kho / Giao diện người dùng (Client UI)"]
        A1([Bắt đầu: Nhập hàng]) --> A2["Mở form 'Tạo phiếu nhập hàng'"]
        A2 --> A3["Chọn NCC & Chi nhánh kho đích"]
        A3 --> A4["F3 Tìm kiếm mặt hàng, nhập SL & Đơn giá"]
        A4 --> A5["Bấm nút 'Hoàn thành'"]
        
        A6["Nhận phản hồi từ Hệ thống"]
        A7{"Trạng thái xử lý?"}
        A8["Hiển thị thông báo thành công<br>& Điều hướng danh sách chứng từ"]
        A9([Kết thúc: Nhập hàng thành công])
        A10["Hiển thị thông báo lỗi Validation<br>& Giữ lại form để chỉnh sửa"]
        A11([Kết thúc luồng lỗi])
        
        A6 --> A7
        A7 -- Thành công --> A8 --> A9
        A7 -- Thất bại --> A10 --> A11
    end

    subgraph Server ["2. Web App & CSDL (Backend Logic & Database)"]
        B1["Nhận Request POST Create"]
        B2{"Kiểm tra tính hợp lệ?<br>(Có NCC, Chi tiết >= 1 dòng, SL > 0)"}
        B3["Trả về JSON/Redirect kèm lỗi Validation"]
        B4["Mở Transaction CSDL (BeginTransactionAsync)"]
        B5["Tính lại Giá vốn bình quân MAC:<br>GiaVonMoi = (TonCu*GiaCu + SL*GiaNhap) / (TonCu + SL)"]
        
        subgraph DB ["Ghi dữ liệu & Tồn kho trong Transaction"]
            C1[("Master-Detail: PhieuNhap & ChiTietPhieuNhap (DA_XAC_NHAN)")]
            C2[("Cập nhật Giá vốn mới vào bảng HangHoa")]
            C3[("Tăng số lượng tồn kho qua View vw_TonKhoHienTai")]
            C4[("Cập nhật Công nợ phải trả bảng DonViCapHang")]
            C5[("Ghi Nhật ký thao tác vào bảng NhatKyThaoTac")]
            C1 --> C2 --> C3 --> C4 --> C5
        end
        
        B6["Commit Transaction & Khóa chứng từ vĩnh viễn"]
        
        B1 --> B2
        B2 -- Không hợp lệ --> B3
        B2 -- Hợp lệ --> B4 --> B5 --> DB --> B6
    end

    %% Luồng giao tiếp giữa 2 khối
    A5 --> B1
    B3 --> A6
    B6 --> A6
'''

render_code(code_dag, 'test_dag')
