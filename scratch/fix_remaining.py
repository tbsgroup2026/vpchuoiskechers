import docx
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

DOC_PATH = r'd:\Work\TBS II\222480201738 _PhamNguyenAnhHuy (1).docx'

def fix_remaining():
    doc = docx.Document(DOC_PATH)
    
    # 1. Paragraph 244 or similar paragraphs
    for p in doc.paragraphs:
        if 'Từ một đơn vị ban đầu hoạt động tại TP.HCM' in p.text or 'Bình Dương' in p.text and 'mạng lưới' in p.text:
            p.text = "Từ một tổ hợp nhà máy sản xuất ban đầu, Công ty Cổ phần Thái Bình Kiên Giang (TBS II) đã không ngừng mở rộng quy mô sản xuất với 3 nhà máy lớn (KG1, KG2, KG3) và Xưởng hoàn thiện phụ liệu đế PU/Cao su, phục vụ trực tiếp cho Chuỗi sản xuất sản phẩm Skechers xuất khẩu toàn cầu."

    # 2. Table 9 Rows 4 & 5
    if len(doc.tables) > 9:
        t9 = doc.tables[9]
        if len(t9.rows) > 5:
            # Row 4
            row4 = t9.rows[4]
            if len(row4.cells) >= 5:
                row4.cells[0].text = "Khu vực Tổ hợp Kiên Giang 1 (Nhà máy KG1 & KG2)"
                row4.cells[1].text = "Khu vực Tổ hợp Kiên Giang 1 (Nhà máy KG1 & KG2)"
                row4.cells[2].text = "Khu vực Tổ hợp Kiên Giang 2 (Nhà máy KG3 & Xưởng Đế)"
                row4.cells[3].text = "Khu vực Tổ hợp Kiên Giang 2 (Nhà máy KG3 & Xưởng Đế)"
                row4.cells[4].text = "Khối Quản trị Số hóa & IT (TBS II Workspace)"

            # Row 5
            row5 = t9.rows[5]
            if len(row5.cells) >= 5:
                row5.cells[0].text = "• Nhà máy KG1 – Chuyền gò ráp Giày Skechers\n• Nhà máy KG2 – Chuyền may Thể thao xuất khẩu\n• KCN Thạnh Lộc, Huyện Châu Thành, Tỉnh Kiên Giang\n• ĐT: (0297) 3922 888"
                row5.cells[1].text = row5.cells[0].text
                row5.cells[2].text = "• Nhà máy KG3 – Đóng gói & Kiểm định Skechers\n• Xưởng phụ liệu – Ép đế PU & Lưu hóa cao su\n• KCN Thạnh Lộc, Huyện Châu Thành, Tỉnh Kiên Giang\n• Fax: (0297) 3922 889"
                row5.cells[3].text = row5.cells[2].text
                row5.cells[4].text = "• Trung tâm Số hóa Vận hành & CĐS\n• Hệ thống TBS II Workspace & Kaizen Engine\n• Quản lý CĐS: Ngô Hà Thanh An\n• Website: https://www.tbsgroup.vn/"

    # Double check all paragraphs for any remaining Bình Dương / Đồng Nai / Sóng Thần
    for p in doc.paragraphs:
        if 'Bình Dương' in p.text or 'Đồng Nai' in p.text:
            p.text = p.text.replace('Bình Dương và Đồng Nai', 'tỉnh Kiên Giang (KCN Thạnh Lộc, Châu Thành)')
            p.text = p.text.replace('Bình Dương, Đồng Nai', 'Kiên Giang')
            p.text = p.text.replace('Bình Dương', 'Kiên Giang')
            p.text = p.text.replace('Đồng Nai', 'Kiên Giang')

    doc.save(DOC_PATH)
    print("Fixed remaining legacy terms in docx!")

if __name__ == '__main__':
    fix_remaining()
