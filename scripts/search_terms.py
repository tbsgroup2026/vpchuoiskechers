import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('docx_paragraphs_dump.txt', 'r', encoding='utf-8') as f:
    for line in f:
        l_lower = line.lower()
        if any(w in l_lower for w in ['xanh', 'kiệt', 'kiet', 'cung ứng', 'cung ung', 'dual', 'express', 'tổng quan về công ty', 'tổng quan về hệ thống', 'lời cảm ơn', 'báo cáo thực tập']):
            print(line.strip())
