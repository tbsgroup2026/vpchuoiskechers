import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')

DOC_PATH = r'd:\Work\TBS II\222480201738 _PhamNguyenAnhHuy (1).docx'

def fix_row11():
    doc = docx.Document(DOC_PATH)
    t2 = doc.tables[2]
    r11 = t2.rows[11]

    # Assign distinct values to every cell in row 11
    r11.cells[0].text = "11"
    r11.cells[1].text = "26/10 – 31/10"
    r11.cells[2].text = "26/10 – 31/10"
    r11.cells[3].text = "Tổng kết dự án, bàn giao mã nguồn & hệ thống TBS II Workspace, hoàn thiện và nộp báo cáo thực tập"
    r11.cells[4].text = "Kế hoạch"

    doc.save(DOC_PATH)
    print("Fixed Row 11 in Table 2!")

if __name__ == '__main__':
    fix_row11()
