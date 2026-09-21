import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')

doc = docx.Document(r'd:\Work\TBS II\222480201738 _PhamNguyenAnhHuy (1).docx')
t2 = doc.tables[2]
row11 = t2.rows[11]

for i, c in enumerate(row11.cells):
    print(f'Cell [{i}]: "{c.text}"')
