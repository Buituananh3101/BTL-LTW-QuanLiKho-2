import urllib.request, base64, zlib, json, struct

mermaid_code = '''flowchart TD
    subgraph LeftSide["1. Thủ kho / Giao diện (Client UI)"]
        direction TB
        A1([Bắt đầu]) --> A2["Mở form Tạo phiếu"]
        A2 --> A3["Chọn NCC & Kho đích"]
        A3 --> A4["F3 Tìm hàng, nhập SL & Giá"]
        A4 --> A5["Bấm Hoàn thành"]
        A6([Kết thúc: Thành công])
    end

    subgraph RightSide["2. Web App / Logic Backend & CSDL"]
        direction TB
        B1["Nhận Request POST Create"]
        B2{"Kiểm tra hợp lệ?"}
        B3["Báo lỗi Validation"]
        B4["Mở Transaction (BeginTransactionAsync)"]
        B5["Tính Giá vốn bình quân MAC"]
        B6[("Lưu PhieuNhap & ChiTiet")]
        B7[("Tăng tồn kho qua View")]
        B8[("Cập nhật Công nợ NCC")]
        B9["Commit Transaction"]
    end

    A5 --> B1
    B1 --> B2
    B2 -- Lỗi --> B3 --> A4
    B2 -- Hợp lệ --> B4 --> B5
    B5 --> B6 & B7 & B8
    B6 & B7 & B8 --> B9
    B9 --> A6
'''

j = json.dumps({"code": mermaid_code, "mermaid": {"theme": "default"}})
# pako deflate in JS is raw deflate (no zlib wrapper, wbits=-15) or zlib deflate
compressed = zlib.compress(j.encode('utf-8'))[2:-4] # raw deflate
b64 = base64.urlsafe_b64encode(compressed).decode('utf-8')
url = f'https://mermaid.ink/img/pako:{b64}'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read()
        w, h = struct.unpack('>LL', data[16:24])
        print(f'Rendered: {w}x{h}, len={len(data)}')
        with open('scratch/test_2col.png', 'wb') as f:
            f.write(data)
except Exception as e:
    print('Raw deflate error:', e)
