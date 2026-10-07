import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('web/public/_worker.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

results = [(i+1, l.strip()) for i, l in enumerate(lines) if 'room' in l.lower()]
for n, l in results[:50]:
    print(n, l[:150])
