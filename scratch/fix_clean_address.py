import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')

DOC_PATH = r'd:\Work\TBS II\222480201738 _PhamNguyenAnhHuy (1).docx'

def clean_address():
    doc = docx.Document(DOC_PATH)
    
    for p in doc.paragraphs:
        if 'Châu Thành' in p.text or 'Thạnh Lộc' in p.text or 'tỉnh Thành phố Hồ Chí Minh' in p.text:
            p.text = p.text.replace('tỉnh Thành phố Hồ Chí Minh', 'Thành phố Hồ Chí Minh')
            p.text = p.text.replace('Châu Thành', 'Bình Hòa')
            p.text = p.text.replace('Thạnh Lộc', 'Bình Đáng')

    doc.save(DOC_PATH)
    print("Cleaned up remaining address text.")

if __name__ == '__main__':
    clean_address()
