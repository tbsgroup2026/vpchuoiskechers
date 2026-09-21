import docx

def verify():
    doc = docx.Document(r"d:\Work\TBS II\222480201738 _PhamNguyenAnhHuy (1).docx")
    all_text = []
    for p in doc.paragraphs:
        all_text.append(p.text)
    for t in doc.tables:
        for r in t.rows:
            for c in r.cells:
                all_text.append(c.text)

    full = "\n".join(all_text)

    old_terms = [
        "Nhân Kiệt", "NHÂN KIỆT", "Vieclamxanh", "vieclamxanh", "Việc Làm Xanh", "VIỆC LÀM XANH",
        "Nguyễn Quốc Trung", "Ngô Hồng Minh", "Hồng Minh", "nhankiet.vn", "nhankiet.org", "0308022768"
    ]
    new_terms = [
        "TBS Group", "Skechers", "TBS Work Hub", "TBS II", "Phạm Nguyễn Anh Huy", "Ngô Hà Thanh An", "Trần Bá Minh Sơn", "2224802010738", "D22CNTT02"
    ]

    out_lines = []
    out_lines.append("--- OLD TERMS COUNT ---")
    for term in old_terms:
        out_lines.append(f"'{term}': {full.count(term)}")

    out_lines.append("\n--- NEW TERMS COUNT ---")
    for term in new_terms:
        out_lines.append(f"'{term}': {full.count(term)}")

    with open("d:/Work/TBS II/verify_results.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(out_lines))

if __name__ == "__main__":
    verify()
