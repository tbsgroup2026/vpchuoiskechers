import zipfile
import re

def fix_docx():
    fpath = r"d:\Work\TBS II\222480201738 _PhamNguyenAnhHuy (1).docx"
    with zipfile.ZipFile(fpath, 'r') as z:
        file_map = {name: z.read(name) for name in z.namelist()}

    doc_xml = file_map['word/document.xml'].decode('utf-8')
    # Replace unescaped & with &amp;
    fixed_xml = re.sub(r'&(?!(amp|lt|gt|quot|apos);)', '&amp;', doc_xml)
    file_map['word/document.xml'] = fixed_xml.encode('utf-8')

    with zipfile.ZipFile(fpath, 'w', zipfile.ZIP_DEFLATED) as z_out:
        for name, data in file_map.items():
            z_out.writestr(name, data)

    print("Fixed XML entity syntax error in docx!")

if __name__ == "__main__":
    fix_docx()
