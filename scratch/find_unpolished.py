import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')

DOC_PATH = r'd:\Work\TBS II\222480201738 _PhamNguyenAnhHuy (1).docx'

def find_unpolished():
    doc = docx.Document(DOC_PATH)
    print("Searching for paragraphs to polish...")
    
    unpolished_keywords = [
        'tuyển dụng',
        'tìm việc',
        'môi giới trung gian',
        'bảng tin giấy',
        'thị trường lao động',
        'nghiệm thu & duyệt kết quả công việc và tuyển dụng',
        'nghiệm thu & duyệt kết quả công việc',
        'interview',
        'phê duyệt tuyển dụng'
    ]
    
    for i, p in enumerate(doc.paragraphs):
        t_lower = p.text.lower()
        if any(k in t_lower for k in unpolished_keywords):
            print(f'[{i:3d}] {p.text[:130]}')

if __name__ == '__main__':
    find_unpolished()
