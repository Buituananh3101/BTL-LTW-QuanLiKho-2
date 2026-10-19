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

# Test 1: Nối ngang L2 sang R2 và R3 sang L4
code1 = '''flowchart TD
    subgraph Left [1. Cột Trái: Client UI]
        L1[Bước 1: Mở form] --> L2[Bước 2: Bấm Gửi]
        L3[Bước 5: Nhận phản hồi] --> L4[Bước 6: Hoàn tất]
    end
    subgraph Right [2. Cột Phải: Server & DB]
        R1[Bước 3: Nhận Request] --> R2[Bước 4: Lưu CSDL]
    end

    L2 --> R1
    R2 --> L3
'''
test_code(code1, 'td_conn1')
