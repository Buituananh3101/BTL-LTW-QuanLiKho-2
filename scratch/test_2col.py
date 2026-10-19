import urllib.request, base64, struct

# Let's test a 2-column Mermaid flowchart
# Left column: Client UI
# Right column: Backend & Database

mermaid_code = '''flowchart TD
    subgraph LeftSide["1. Thủ kho / Giao diện người dùng (Client UI)"]
        direction TB
        A1([Bắt đầu]) --> A2["Mở form 'Tạo phiếu nhập hàng'"]
        A2 --> A3["Chọn Nhà cung cấp & Chi nhánh nhập"]
        A3 --> A4["F3 Tìm kiếm mặt hàng, nhập SL & Giá"]
        A4 --> A5["Bấm nút 'Hoàn thành'"]
        A6([Kết thúc: Nhập hàng thành công])
    end

    subgraph RightSide["2. Web App / Logic Xử lý & Giao dịch CSDL (Backend & Database)"]
        direction TB
        B1["Nhận Request POST Create"]
        B2{"Kiểm tra hợp lệ?<br>(Có NCC, Chi tiết >= 1, SL > 0)"}
        B3["Trả về thông báo lỗi Validation"]
        
        subgraph Trans["Giao dịch Database Transaction (ACID)"]
            B4["Mở Transaction (BeginTransactionAsync)"]
            B5["Tính Giá vốn bình quân gia quyền MAC:<br>GiaVon = (TonCu*GiaCu + SL*GiaNhap) / (TonCu + SL)"]
            
            subgraph DB_Ops["Cập nhật đồng bộ trong CSDL"]
                C1[("Lưu PhieuNhap & ChiTiet<br>(Trạng thái DA_XAC_NHAN)")]
                C2[("Cập nhật Giá vốn mới<br>vào bảng HangHoa")]
                C3[("Tăng tồn kho qua View<br>vw_TonKhoHienTai")]
                C4[("Cập nhật Công nợ NCC<br>bảng DonViCapHang")]
            end
            
            B6[("Ghi Nhật ký thao tác<br>bảng NhatKyThaoTac")]
            B7["Commit Transaction"]
        end
        B8["Trả kết quả thành công & Điều hướng"]
    end

    %% Liên kết giữa 2 khối Trái - Phải
    A5 --> B1
    B1 --> B2
    B2 -- Không hợp lệ --> B3
    B3 --> A4
    B2 -- Hợp lệ --> B4
    B4 --> B5
    B5 --> DB_Ops
    DB_Ops --> B6
    B6 --> B7
    B7 --> B8
    B8 --> A6
'''

import zlib
compressed = zlib.compress(mermaid_code.encode('utf-8'), 9)
pako_b64 = base64.urlsafe_b64encode(compressed).decode('utf-8')
url = f'https://mermaid.ink/img/pako:{pako_b64}'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read()
        w, h = struct.unpack('>LL', data[16:24])
        print(f'Rendered: {w}x{h}, aspect ratio w/h={w/h:.2f}, h/w={h/w:.2f}, bytes={len(data)}')
        with open('scratch/test_2col.png', 'wb') as f:
            f.write(data)
except Exception as e:
    print('Error:', e)
