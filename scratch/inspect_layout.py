import urllib.request, zlib, base64, re

def check_layout(code, name):
    comp = zlib.compress(code.encode('utf-8'), 9)
    enc = base64.urlsafe_b64encode(comp).decode('utf-8')
    url = f'https://kroki.io/mermaid/svg/{enc}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        svg = resp.read().decode('utf-8')
        with open(f'scratch/{name}.svg', 'w', encoding='utf-8') as f:
            f.write(svg)
    # Tìm bounding box hoặc transform của các cluster
    clusters = re.findall(r'<g class="cluster[^"]*" id="([^"]+)"[^>]*transform="translate\(([^,]+),([^)]+)\)"', svg)
    print(f"--- {name} ---")
    for cid, x, y in clusters:
        print(f"Cluster {cid}: x={x}, y={y}")
    # Tìm viewBox của svg
    vb = re.search(r'viewBox="([^"]+)"', svg)
    if vb:
        print("viewBox:", vb.group(1))

# Thử nghiệm 1:
code1 = '''flowchart TD
    subgraph Left [1. Thủ kho / Client UI]
        L1[Bắt đầu] --> L2[Chọn NCC] --> L3[Nhập hàng] --> L4[Bấm Lưu]
        L5[Hiển thị kết quả] --> L6([Kết thúc])
    end
    subgraph Right [2. Web App & CSDL]
        R1[Nhận POST] --> R2{Hợp lệ?}
        R2 -- Hợp lệ --> R3[Mở Transaction] --> R4[Lưu DB] --> R5[Commit]
        R2 -- Lỗi --> R6[Thông báo lỗi]
    end
    L4 --> R1
    R5 --> L5
    R6 --> L3
'''
check_layout(code1, 'case1')
