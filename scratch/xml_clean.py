import zipfile

def xml_clean():
    fpath = r"d:\Work\TBS II\222480201738 _PhamNguyenAnhHuy (1).docx"
    
    with zipfile.ZipFile(fpath, 'r') as z:
        file_map = {name: z.read(name) for name in z.namelist()}

    replacements = [
        ("Nhân Kiệt", "TBS Group — VP Chuỗi Skechers"),
        ("NHÂN KIỆT", "TBS GROUP — VP CHUỖI SKECHERS"),
        ("nhankiet.vn", "tbsgroup.vn"),
        ("nhankiet.org", "vpchuoiskechers.tbsgroup2026.workers.dev"),
        ("nhankiet", "tbsgroup"),
        ("Vieclamxanh", "TBS Work Hub (TBS II)"),
        ("vieclamxanh", "tbs-work-hub"),
        ("Việc Làm Xanh", "TBS Work Hub & Gemba Kaizen (TBS II)"),
        ("VIỆC LÀM XANH", "TBS WORK HUB & GEMBA KAIZEN (TBS II)"),
        ("Nguyễn Quốc Trung", "Ngô Hà Thanh An"),
        ("Ngô Hồng Minh", "Trần Bá Minh Sơn"),
    ]

    modified_map = {}
    for name, data in file_map.items():
        if name.endswith(".xml") or name.endswith(".rels"):
            text = data.decode("utf-8")
            orig_text = text
            for old_s, new_s in replacements:
                text = text.replace(old_s, new_s)
            if text != orig_text:
                print(f"Replaced terms in zip entry: {name}")
                modified_map[name] = text.encode("utf-8")
            else:
                modified_map[name] = data
        else:
            modified_map[name] = data

    with zipfile.ZipFile(fpath, 'w', zipfile.ZIP_DEFLATED) as z_out:
        for name, data in modified_map.items():
            z_out.writestr(name, data)

    print("Zip XML replacement complete!")

if __name__ == "__main__":
    xml_clean()
