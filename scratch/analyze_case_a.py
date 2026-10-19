import urllib.request, zlib, base64, re

with open('scratch/test_lr_tb.py', 'r', encoding='utf-8') as f:
    text = f.read()

code = text.split("case_a = '''")[1].split("'''")[0]
comp = zlib.compress(code.encode('utf-8'), 9)
enc = base64.urlsafe_b64encode(comp).decode('utf-8')
url = f'https://kroki.io/mermaid/svg/{enc}'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=30) as resp:
    svg = resp.read().decode('utf-8')
    with open('scratch/case_a.svg', 'w', encoding='utf-8') as sf:
        sf.write(svg)

print('ViewBox:', re.findall(r'viewBox="[^"]+"', svg))
clusters = re.findall(r'<g class="cluster[^"]*" id="([^"]+)"[^>]*>', svg)
print('Clusters:', clusters)

# Kiểm tra vị trí các rect của cluster
for m in re.finditer(r'<g class="cluster[^"]*" id="([^"]+)"[^>]*transform="([^"]+)"', svg):
    print(f"Cluster {m.group(1)}: transform={m.group(2)}")
