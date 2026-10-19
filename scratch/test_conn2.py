import subprocess, struct

def test_code(code, name):
    with open(f'scratch/{name}.mmd', 'w', encoding='utf-8') as f:
        f.write(code)
    cmd = f'npx @mermaid-js/mermaid-cli -i scratch/{name}.mmd -o scratch/{name}.png -b white -s 2'
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    with open(f'scratch/{name}.png', 'rb') as f:
        f.seek(16)
        w, h = struct.unpack('>LL', f.read(8))
    print(f"[{name}] size: {w}x{h}, w/h={w/h:.2f}, h/w={h/w:.2f}")

# Test 2: Cả 2 hộp đều bắt đầu ở đỉnh, có liên kết chéo xuôi chiều
code2 = '''flowchart TD
    subgraph Left [1. Cột Trái: Thủ kho]
        L1[Bước 1] --> L2[Bước 2] --> L3[Bước 3] --> L4[Bước 4]
    end
    subgraph Right [2. Cột Phải: Server]
        R1[Lắng nghe] --> R2[Nhận request] --> R3[Xử lý] --> R4[Kết thúc]
    end

    L2 --> R2
'''
test_code(code2, 'td_conn2')
