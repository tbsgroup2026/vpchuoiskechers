import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('docx_paragraphs_dump.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("=== COVER PAGES [0..50] ===")
for line in lines[:52]:
    if line.strip():
        print(line.strip())

print("\n=== BODY [135..324] ===")
for line in lines[135:]:
    if line.strip():
        print(line.strip())
