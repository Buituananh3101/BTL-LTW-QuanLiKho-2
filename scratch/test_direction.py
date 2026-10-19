import urllib.request, zlib, base64, struct

# Let's test why flowchart LR was wide
code = '''flowchart LR
    subgraph S1["User"]
        A1 --> A2 --> A3
    end
    subgraph S2["Server"]
        B1 --> B2 --> B3
    end
    A3 --> B1
'''
compressed = zlib.compress(code.encode('utf-8'), 9)
encoded = base64.urlsafe_b64encode(compressed).decode('utf-8')
url = f'https://kroki.io/mermaid/png/{encoded}'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=15) as resp:
    data = resp.read()
    w, h = struct.unpack('>LL', data[16:24])
    print(f'LR without direction: {w}x{h}')

code2 = '''flowchart LR
    subgraph S1["User"]
        direction TB
        A1 --> A2 --> A3
    end
    subgraph S2["Server"]
        direction TB
        B1 --> B2 --> B3
    end
    A3 --> B1
'''
compressed = zlib.compress(code2.encode('utf-8'), 9)
encoded = base64.urlsafe_b64encode(compressed).decode('utf-8')
url = f'https://kroki.io/mermaid/png/{encoded}'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=15) as resp:
    data = resp.read()
    w, h = struct.unpack('>LL', data[16:24])
    print(f'LR with direction TB: {w}x{h}')
