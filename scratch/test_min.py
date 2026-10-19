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

# Test minimal direction TB inside flowchart LR
code_min = '''flowchart LR
    subgraph Left [Cột Trái]
        direction TB
        L1[Bước 1] --> L2[Bước 2] --> L3[Bước 3] --> L4[Bước 4]
    end
    subgraph Right [Cột Phải]
        direction TB
        R1[Bước A] --> R2[Bước B] --> R3[Bước C] --> R4[Bước D]
    end
    L4 --> R1
    R4 --> L1
'''
test_code(code_min, 'min_lr_tb')
