import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')

doc = docx.Document(r'd:\Work\TBS II\222480201738 _PhamNguyenAnhHuy (1).docx')
t2 = doc.tables[2]

print('=== Row 10 cells ===')
for i, c in enumerate(t2.rows[10].cells):
    print(f'Cell [{i}]: "{c.text}"')

print('\n=== Row 11 cells ===')
for i, c in enumerate(t2.rows[11].cells):
    print(f'Cell [{i}]: "{c.text}"')

print('\n=== Row 12 cells ===')
for i, c in enumerate(t2.rows[12].cells):
    print(f'Cell [{i}]: "{c.text}"')
