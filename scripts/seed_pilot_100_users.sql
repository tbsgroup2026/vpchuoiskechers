-- Seed 100 Users for Pilot Trial (Môi trường Test)
-- Password mặc định: Pilot@2026 (hashed SHA-256 + salt)
-- Đánh dấu rõ: is_test_account = 1, ghi_chu = 'TEST_PILOT_100_USERS'

INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_001', 'BGD-001', 'Nguyễn Văn Hùng', 'hung.nguyenvan@tbsgroup.vn', '0903800001', 'Tổng Giám Đốc Chuỗi', 'Ban Giám Đốc', 'TONG_GIAM_DOC', 1,
  'ACTIVE', 'TGĐ', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_002', 'BGD-002', 'Trần Thị Mai', 'mai.tranthi@tbsgroup.vn', '0903800002', 'Phó Tổng Giám Đốc Vận Hành', 'Ban Giám Đốc', 'PHO_TONG_GIAM_DOC', 2,
  'ACTIVE', 'PTGĐ', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_003', 'BGD-003', 'Lê Hoàng Nam', 'nam.lehoang@tbsgroup.vn', '0903800003', 'Giám Đốc Chuỗi Skechers', 'Ban Giám Đốc', 'GIAM_DOC', 2,
  'ACTIVE', 'GĐ', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_004', 'BGD-004', 'Đỗ Minh Tuấn', 'tuan.dominh@tbsgroup.vn', '0903800004', 'Phó Giám Đốc Kỹ Thuật Sản Xuất', 'Ban Giám Đốc', 'PHO_GIAM_DOC', 2,
  'ACTIVE', 'PGĐ', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_005', 'KT-001', 'Trần Thị Thu Hương', 'huong.tranthithu@tbsgroup.vn', '0903810001', 'Trưởng Phòng Kế Toán', 'Phòng Kế Toán', 'TRUONG_PHONG', 3,
  'ACTIVE', 'TP', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_006', 'KT-002', 'Phạm Thị Kim Loan', 'loan.phamthikim@tbsgroup.vn', '0903810002', 'Phó Phòng Kế Toán', 'Phòng Kế Toán', 'PHO_PHONG', 3,
  'ACTIVE', 'PP', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_007', 'KT-003', 'Vũ Thị Bích Thủy', 'kt003@tbsgroup.vn', '0903810003', 'Chuyên Viên Kế Toán', 'Phòng Kế Toán', 'CBCNV', 4,
  'ACTIVE', 'CV_KE_TOAN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_008', 'KT-004', 'Lê Ngọc Yến', 'kt004@tbsgroup.vn', '0903810004', 'Chuyên Viên Kế Toán', 'Phòng Kế Toán', 'CBCNV', 4,
  'ACTIVE', 'CV_KE_TOAN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_009', 'KT-005', 'Đặng Thu Hằng', 'kt005@tbsgroup.vn', '0903810005', 'Chuyên Viên Kế Toán', 'Phòng Kế Toán', 'CBCNV', 4,
  'ACTIVE', 'CV_KE_TOAN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_010', 'KT-006', 'Bùi Văn Trí', 'kt006@tbsgroup.vn', '0903810006', 'Chuyên Viên Kế Toán', 'Phòng Kế Toán', 'CBCNV', 4,
  'ACTIVE', 'CV_KE_TOAN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_011', 'KT-007', 'Nguyễn Thu Trang', 'kt007@tbsgroup.vn', '0903810007', 'Chuyên Viên Kế Toán', 'Phòng Kế Toán', 'CBCNV', 4,
  'ACTIVE', 'CV_KE_TOAN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_012', 'KT-008', 'Hoàng Minh Châu', 'kt008@tbsgroup.vn', '0903810008', 'Chuyên Viên Kế Toán', 'Phòng Kế Toán', 'CBCNV', 4,
  'ACTIVE', 'CV_KE_TOAN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_013', 'KT-009', 'Dương Quốc Thái', 'kt009@tbsgroup.vn', '0903810009', 'Chuyên Viên Kế Toán', 'Phòng Kế Toán', 'CBCNV', 4,
  'ACTIVE', 'CV_KE_TOAN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_014', 'KT-010', 'Ngô Bảo Ngọc', 'kt010@tbsgroup.vn', '0903810010', 'Chuyên Viên Kế Toán', 'Phòng Kế Toán', 'CBCNV', 4,
  'ACTIVE', 'CV_KE_TOAN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_015', 'KT-011', 'Trịnh Thị Lan', 'kt011@tbsgroup.vn', '0903810011', 'Chuyên Viên Kế Toán', 'Phòng Kế Toán', 'CBCNV', 4,
  'ACTIVE', 'CV_KE_TOAN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_016', 'KT-012', 'Phan Văn Hiệp', 'kt012@tbsgroup.vn', '0903810012', 'Chuyên Viên Kế Toán', 'Phòng Kế Toán', 'CBCNV', 4,
  'ACTIVE', 'CV_KE_TOAN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_017', 'KT-013', 'Lâm Thúy Nga', 'kt013@tbsgroup.vn', '0903810013', 'Chuyên Viên Kế Toán', 'Phòng Kế Toán', 'CBCNV', 4,
  'ACTIVE', 'CV_KE_TOAN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_018', 'QC-001', 'Bùi Thị Hằng', 'hang.buithi@tbsgroup.vn', '0903820001', 'Trưởng Ban Chất Lượng (QC Lead)', 'Ban Chất Lượng (QC)', 'TRUONG_PHONG', 3,
  'ACTIVE', 'TP', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_019', 'QC-002', 'Nguyễn Văn Đức', 'duc.nguyenvan@tbsgroup.vn', '0903820002', 'Phó Ban Chất Lượng QC', 'Ban Chất Lượng (QC)', 'PHO_PHONG', 3,
  'ACTIVE', 'PP', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_020', 'QC-003', 'Lê Tấn Phát', 'phat.letan@tbsgroup.vn', '0903820003', 'Quản Đốc / Giám Sát QC Chuyền', 'Ban Chất Lượng (QC)', 'QUAN_DOC', 3,
  'ACTIVE', 'QD_QC', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_021', 'QC-004', 'Đinh Văn Thắng', 'qc004@tbsgroup.vn', '0903820004', 'Kỹ Thuật Viên Kiểm Hàng QC', 'Ban Chất Lượng (QC)', 'CBCNV', 4,
  'ACTIVE', 'KTV_QC', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_022', 'QC-005', 'Mai Thị Ánh', 'qc005@tbsgroup.vn', '0903820005', 'Kỹ Thuật Viên Kiểm Hàng QC', 'Ban Chất Lượng (QC)', 'CBCNV', 4,
  'ACTIVE', 'KTV_QC', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_023', 'QC-006', 'Trần Hữu Lộc', 'qc006@tbsgroup.vn', '0903820006', 'Kỹ Thuật Viên Kiểm Hàng QC', 'Ban Chất Lượng (QC)', 'CBCNV', 4,
  'ACTIVE', 'KTV_QC', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_024', 'QC-007', 'Nguyễn Thị Hoa', 'qc007@tbsgroup.vn', '0903820007', 'Kỹ Thuật Viên Kiểm Hàng QC', 'Ban Chất Lượng (QC)', 'CBCNV', 4,
  'ACTIVE', 'KTV_QC', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_025', 'QC-008', 'Võ Thị Lệ', 'qc008@tbsgroup.vn', '0903820008', 'Kỹ Thuật Viên Kiểm Hàng QC', 'Ban Chất Lượng (QC)', 'CBCNV', 4,
  'ACTIVE', 'KTV_QC', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_026', 'QC-009', 'Cao Minh Trực', 'qc009@tbsgroup.vn', '0903820009', 'Kỹ Thuật Viên Kiểm Hàng QC', 'Ban Chất Lượng (QC)', 'CBCNV', 4,
  'ACTIVE', 'KTV_QC', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_027', 'QC-010', 'Hà Thị Thu', 'qc010@tbsgroup.vn', '0903820010', 'Kỹ Thuật Viên Kiểm Hàng QC', 'Ban Chất Lượng (QC)', 'CBCNV', 4,
  'ACTIVE', 'KTV_QC', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_028', 'QC-011', 'Phạm Hồng Sơn', 'qc011@tbsgroup.vn', '0903820011', 'Kỹ Thuật Viên Kiểm Hàng QC', 'Ban Chất Lượng (QC)', 'CBCNV', 4,
  'ACTIVE', 'KTV_QC', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_029', 'QC-012', 'Ngô Thanh Tùng', 'qc012@tbsgroup.vn', '0903820012', 'Kỹ Thuật Viên Kiểm Hàng QC', 'Ban Chất Lượng (QC)', 'CBCNV', 4,
  'ACTIVE', 'KTV_QC', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_030', 'QC-013', 'Đặng Thảo Vy', 'qc013@tbsgroup.vn', '0903820013', 'Kỹ Thuật Viên Kiểm Hàng QC', 'Ban Chất Lượng (QC)', 'CBCNV', 4,
  'ACTIVE', 'KTV_QC', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_031', 'QC-014', 'Trương Quốc Bảo', 'qc014@tbsgroup.vn', '0903820014', 'Kỹ Thuật Viên Kiểm Hàng QC', 'Ban Chất Lượng (QC)', 'CBCNV', 4,
  'ACTIVE', 'KTV_QC', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_032', 'QC-015', 'Lê Thị Thu Thủy', 'qc015@tbsgroup.vn', '0903820015', 'Kỹ Thuật Viên Kiểm Hàng QC', 'Ban Chất Lượng (QC)', 'CBCNV', 4,
  'ACTIVE', 'KTV_QC', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_033', 'KV-001', 'Võ Quốc Toàn', 'toan.voquoc@tbsgroup.vn', '0903830001', 'Trưởng Phòng Kho Vận & Logistics', 'Phòng Kho Vận & Logistics', 'TRUONG_PHONG', 3,
  'ACTIVE', 'TP', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_034', 'KV-002', 'Hoàng Đình Trọng', 'trong.hoangdinh@tbsgroup.vn', '0903830002', 'Phó Phòng Kho Vận', 'Phòng Kho Vận & Logistics', 'PHO_PHONG', 3,
  'ACTIVE', 'PP', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_035', 'KV-003', 'Nguyễn Hùng Dũng', 'kv003@tbsgroup.vn', '0903830003', 'Nhân Viên Điều Phối Kho Vận', 'Phòng Kho Vận & Logistics', 'CBCNV', 4,
  'ACTIVE', 'NV_KHO', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_036', 'KV-004', 'Trần Văn Kiên', 'kv004@tbsgroup.vn', '0903830004', 'Nhân Viên Điều Phối Kho Vận', 'Phòng Kho Vận & Logistics', 'CBCNV', 4,
  'ACTIVE', 'NV_KHO', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_037', 'KV-005', 'Lê Thị Mỹ Linh', 'kv005@tbsgroup.vn', '0903830005', 'Nhân Viên Điều Phối Kho Vận', 'Phòng Kho Vận & Logistics', 'CBCNV', 4,
  'ACTIVE', 'NV_KHO', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_038', 'KV-006', 'Phan Văn Hòa', 'kv006@tbsgroup.vn', '0903830006', 'Nhân Viên Điều Phối Kho Vận', 'Phòng Kho Vận & Logistics', 'CBCNV', 4,
  'ACTIVE', 'NV_KHO', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_039', 'KV-007', 'Đỗ Quốc Hùng', 'kv007@tbsgroup.vn', '0903830007', 'Nhân Viên Điều Phối Kho Vận', 'Phòng Kho Vận & Logistics', 'CBCNV', 4,
  'ACTIVE', 'NV_KHO', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_040', 'KV-008', 'Bùi Văn Hưng', 'kv008@tbsgroup.vn', '0903830008', 'Nhân Viên Điều Phối Kho Vận', 'Phòng Kho Vận & Logistics', 'CBCNV', 4,
  'ACTIVE', 'NV_KHO', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_041', 'KV-009', 'Ngô Gia Huy', 'kv009@tbsgroup.vn', '0903830009', 'Nhân Viên Điều Phối Kho Vận', 'Phòng Kho Vận & Logistics', 'CBCNV', 4,
  'ACTIVE', 'NV_KHO', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_042', 'KV-010', 'Dương Văn Long', 'kv010@tbsgroup.vn', '0903830010', 'Nhân Viên Điều Phối Kho Vận', 'Phòng Kho Vận & Logistics', 'CBCNV', 4,
  'ACTIVE', 'NV_KHO', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_043', 'KV-011', 'Tạ Quang Minh', 'kv011@tbsgroup.vn', '0903830011', 'Nhân Viên Điều Phối Kho Vận', 'Phòng Kho Vận & Logistics', 'CBCNV', 4,
  'ACTIVE', 'NV_KHO', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_044', 'KV-012', 'Lâm Văn Phước', 'kv012@tbsgroup.vn', '0903830012', 'Nhân Viên Điều Phối Kho Vận', 'Phòng Kho Vận & Logistics', 'CBCNV', 4,
  'ACTIVE', 'NV_KHO', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_045', 'KV-013', 'Vũ Đức Thịnh', 'kv013@tbsgroup.vn', '0903830013', 'Nhân Viên Điều Phối Kho Vận', 'Phòng Kho Vận & Logistics', 'CBCNV', 4,
  'ACTIVE', 'NV_KHO', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_046', 'KV-014', 'Hồ Xuân Hùng', 'kv014@tbsgroup.vn', '0903830014', 'Nhân Viên Điều Phối Kho Vận', 'Phòng Kho Vận & Logistics', 'CBCNV', 4,
  'ACTIVE', 'NV_KHO', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_047', 'MAY-001', 'Trần Văn Hùng', 'hung.tranvan@tbsgroup.vn', '0903840001', 'Quản Đốc Xưởng May 5', 'Xưởng May Sản Xuất', 'QUAN_DOC', 3,
  'ACTIVE', 'QUAN_DOC', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_048', 'MAY-002', 'Lê Thị Tuyết', 'tuyet.lethi@tbsgroup.vn', '0903840002', 'Phó Quản Đốc Xưởng May', 'Xưởng May Sản Xuất', 'PHO_PHONG', 3,
  'ACTIVE', 'PHO_QUAN_DOC', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_049', 'MAY-003', 'Nguyễn Thị Kim Chi', 'may003@tbsgroup.vn', '0903840003', 'Tổ Trưởng Chuyền May 1', 'Xưởng May Sản Xuất', 'TO_TRUONG', 4,
  'ACTIVE', 'TO_TRUONG', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_050', 'MAY-004', 'Phạm Văn Hậu', 'may004@tbsgroup.vn', '0903840004', 'Tổ Trưởng Chuyền May 2', 'Xưởng May Sản Xuất', 'TO_TRUONG', 4,
  'ACTIVE', 'TO_TRUONG', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_051', 'MAY-005', 'Trần Thị Bích Ngọc', 'may005@tbsgroup.vn', '0903840005', 'Tổ Trưởng Chuyền May 3', 'Xưởng May Sản Xuất', 'TO_TRUONG', 4,
  'ACTIVE', 'TO_TRUONG', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_052', 'MAY-006', 'Lê Hữu Nghĩa', 'may006@tbsgroup.vn', '0903840006', 'Tổ Trưởng Chuyền May 4', 'Xưởng May Sản Xuất', 'TO_TRUONG', 4,
  'ACTIVE', 'TO_TRUONG', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_053', 'MAY-007', 'Đỗ Thị Mai', 'may007@tbsgroup.vn', '0903840007', 'Kỹ Thuật May & May Mẫu', 'Xưởng May Sản Xuất', 'CBCNV', 4,
  'ACTIVE', 'KT_MAY', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_054', 'MAY-008', 'Hoàng Văn Nam', 'may008@tbsgroup.vn', '0903840008', 'Kỹ Thuật May & May Mẫu', 'Xưởng May Sản Xuất', 'CBCNV', 4,
  'ACTIVE', 'KT_MAY', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_055', 'MAY-009', 'Bùi Thu Hằng', 'may009@tbsgroup.vn', '0903840009', 'Kỹ Thuật May & May Mẫu', 'Xưởng May Sản Xuất', 'CBCNV', 4,
  'ACTIVE', 'KT_MAY', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_056', 'MAY-010', 'Vũ Quốc Việt', 'may010@tbsgroup.vn', '0903840010', 'Kỹ Thuật May & May Mẫu', 'Xưởng May Sản Xuất', 'CBCNV', 4,
  'ACTIVE', 'KT_MAY', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_057', 'MAY-011', 'Ngô Thị Thúy', 'may011@tbsgroup.vn', '0903840011', 'Kỹ Thuật May & May Mẫu', 'Xưởng May Sản Xuất', 'CBCNV', 4,
  'ACTIVE', 'KT_MAY', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_058', 'MAY-012', 'Phan Văn Sang', 'may012@tbsgroup.vn', '0903840012', 'Kỹ Thuật May & May Mẫu', 'Xưởng May Sản Xuất', 'CBCNV', 4,
  'ACTIVE', 'KT_MAY', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_059', 'MAY-013', 'Lý Thị Hồng', 'may013@tbsgroup.vn', '0903840013', 'Kỹ Thuật May & May Mẫu', 'Xưởng May Sản Xuất', 'CBCNV', 4,
  'ACTIVE', 'KT_MAY', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_060', 'MAY-014', 'Đặng Văn Tiến', 'may014@tbsgroup.vn', '0903840014', 'Kỹ Thuật May & May Mẫu', 'Xưởng May Sản Xuất', 'CBCNV', 4,
  'ACTIVE', 'KT_MAY', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_061', 'MAY-015', 'Trịnh Thị Oanh', 'may015@tbsgroup.vn', '0903840015', 'Kỹ Thuật May & May Mẫu', 'Xưởng May Sản Xuất', 'CBCNV', 4,
  'ACTIVE', 'KT_MAY', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_062', 'MAY-016', 'Nguyễn Hữu Tài', 'may016@tbsgroup.vn', '0903840016', 'Kỹ Thuật May & May Mẫu', 'Xưởng May Sản Xuất', 'CBCNV', 4,
  'ACTIVE', 'KT_MAY', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_063', 'MAY-017', 'Dương Thị Loan', 'may017@tbsgroup.vn', '0903840017', 'Kỹ Thuật May & May Mẫu', 'Xưởng May Sản Xuất', 'CBCNV', 4,
  'ACTIVE', 'KT_MAY', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_064', 'MAY-018', 'Mai Văn Cường', 'may018@tbsgroup.vn', '0903840018', 'Kỹ Thuật May & May Mẫu', 'Xưởng May Sản Xuất', 'CBCNV', 4,
  'ACTIVE', 'KT_MAY', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_065', 'MAY-019', 'Lê Thị Diệu', 'may019@tbsgroup.vn', '0903840019', 'Kỹ Thuật May & May Mẫu', 'Xưởng May Sản Xuất', 'CBCNV', 4,
  'ACTIVE', 'KT_MAY', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_066', 'MAY-020', 'Hồ Văn Phước', 'may020@tbsgroup.vn', '0903840020', 'Kỹ Thuật May & May Mẫu', 'Xưởng May Sản Xuất', 'CBCNV', 4,
  'ACTIVE', 'KT_MAY', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_067', 'KTCN-001', 'Đặng Hữu Phúc', 'phuc.danghuu@tbsgroup.vn', '0903850001', 'Trưởng Phòng Kỹ Thuật & MMTB', 'Phòng Kỹ Thuật Chuyền & IE', 'TRUONG_PHONG', 3,
  'ACTIVE', 'TP', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_068', 'KTCN-002', 'Trần Thị Ngoan', 'ngoan.tranthi@tbsgroup.vn', '0901234567', 'Kỹ Sư Trưởng IE & Cải Tiến Kaizen', 'Phòng Kỹ Thuật Chuyền & IE', 'IE', 3,
  'ACTIVE', 'IE_LEAD', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_069', 'KTCN-003', 'Lê Khải', 'khai.le@tbsgroup.vn', '0988000005', 'Chuyên Viên Vận Hành Kỹ Thuật', 'Phòng Kỹ Thuật Chuyền & IE', 'IE', 4,
  'ACTIVE', 'IE_STAFF', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_070', 'KTCN-004', 'Nguyễn Văn Thìn', 'ktcn004@tbsgroup.vn', '0903850004', 'Kỹ Sư Cơ Điện & Cân Bằng Chuyền', 'Phòng Kỹ Thuật Chuyền & IE', 'CBCNV', 4,
  'ACTIVE', 'KS_CO_DIEN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_071', 'KTCN-005', 'Lê Hữu Dũng', 'ktcn005@tbsgroup.vn', '0903850005', 'Kỹ Sư Cơ Điện & Cân Bằng Chuyền', 'Phòng Kỹ Thuật Chuyền & IE', 'CBCNV', 4,
  'ACTIVE', 'KS_CO_DIEN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_072', 'KTCN-006', 'Phạm Quốc Cường', 'ktcn006@tbsgroup.vn', '0903850006', 'Kỹ Sư Cơ Điện & Cân Bằng Chuyền', 'Phòng Kỹ Thuật Chuyền & IE', 'CBCNV', 4,
  'ACTIVE', 'KS_CO_DIEN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_073', 'KTCN-007', 'Võ Minh Luân', 'ktcn007@tbsgroup.vn', '0903850007', 'Kỹ Sư Cơ Điện & Cân Bằng Chuyền', 'Phòng Kỹ Thuật Chuyền & IE', 'CBCNV', 4,
  'ACTIVE', 'KS_CO_DIEN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_074', 'KTCN-008', 'Đoàn Văn Tuyên', 'ktcn008@tbsgroup.vn', '0903850008', 'Kỹ Sư Cơ Điện & Cân Bằng Chuyền', 'Phòng Kỹ Thuật Chuyền & IE', 'CBCNV', 4,
  'ACTIVE', 'KS_CO_DIEN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_075', 'KTCN-009', 'Bùi Văn Hào', 'ktcn009@tbsgroup.vn', '0903850009', 'Kỹ Sư Cơ Điện & Cân Bằng Chuyền', 'Phòng Kỹ Thuật Chuyền & IE', 'CBCNV', 4,
  'ACTIVE', 'KS_CO_DIEN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_076', 'KTCN-010', 'Trần Văn Bảo', 'ktcn010@tbsgroup.vn', '0903850010', 'Kỹ Sư Cơ Điện & Cân Bằng Chuyền', 'Phòng Kỹ Thuật Chuyền & IE', 'CBCNV', 4,
  'ACTIVE', 'KS_CO_DIEN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_077', 'KTCN-011', 'Hoàng Minh Trí', 'ktcn011@tbsgroup.vn', '0903850011', 'Kỹ Sư Cơ Điện & Cân Bằng Chuyền', 'Phòng Kỹ Thuật Chuyền & IE', 'CBCNV', 4,
  'ACTIVE', 'KS_CO_DIEN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_078', 'KTCN-012', 'Đỗ Thế Hùng', 'ktcn012@tbsgroup.vn', '0903850012', 'Kỹ Sư Cơ Điện & Cân Bằng Chuyền', 'Phòng Kỹ Thuật Chuyền & IE', 'CBCNV', 4,
  'ACTIVE', 'KS_CO_DIEN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_079', 'KTCN-013', 'Lâm Văn Quý', 'ktcn013@tbsgroup.vn', '0903850013', 'Kỹ Sư Cơ Điện & Cân Bằng Chuyền', 'Phòng Kỹ Thuật Chuyền & IE', 'CBCNV', 4,
  'ACTIVE', 'KS_CO_DIEN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_080', 'KTCN-014', 'Cao Xuân Trường', 'ktcn014@tbsgroup.vn', '0903850014', 'Kỹ Sư Cơ Điện & Cân Bằng Chuyền', 'Phòng Kỹ Thuật Chuyền & IE', 'CBCNV', 4,
  'ACTIVE', 'KS_CO_DIEN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_081', 'KTCN-015', 'Hà Văn Bình', 'ktcn015@tbsgroup.vn', '0903850015', 'Kỹ Sư Cơ Điện & Cân Bằng Chuyền', 'Phòng Kỹ Thuật Chuyền & IE', 'CBCNV', 4,
  'ACTIVE', 'KS_CO_DIEN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_082', 'KTCN-016', 'Tạ Duy Khánh', 'ktcn016@tbsgroup.vn', '0903850016', 'Kỹ Sư Cơ Điện & Cân Bằng Chuyền', 'Phòng Kỹ Thuật Chuyền & IE', 'CBCNV', 4,
  'ACTIVE', 'KS_CO_DIEN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_083', 'NS-001', 'Nguyễn Thị Lan Anh', 'lananh.nguyen@tbsgroup.vn', '0903860001', 'Trưởng Phòng Nhân Sự - Hành Chính', 'Phòng Nhân Sự - Hành Chính', 'TRUONG_PHONG', 3,
  'ACTIVE', 'TP', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_084', 'NS-002', 'Đỗ Thị Bích Ngân', 'ngan.dothibich@tbsgroup.vn', '0903860002', 'Phó Phòng Nhân Sự', 'Phòng Nhân Sự - Hành Chính', 'PHO_PHONG', 3,
  'ACTIVE', 'PP', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_085', 'NS-003', 'Trần Thị Bích Trâm', 'tram.tranthibich@tbsgroup.vn', '0903860003', 'Trưởng Team Lễ Tân Văn Phòng', 'Phòng Nhân Sự - Hành Chính', 'LE_TAN', 4,
  'ACTIVE', 'T_LE_TAN', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_086', 'NS-004', 'Trương Bảo Ngọc', 'ngoc.truongbao@tbsgroup.vn', '0903860004', 'Nhân Viên Lễ Tân', 'Phòng Nhân Sự - Hành Chính', 'LE_TAN', 4,
  'ACTIVE', 'LT', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_087', 'NS-005', 'Nguyễn Kim Nguyên', 'nguyen.nguyenkim@tbsgroup.vn', '0903860005', 'Nhân Viên Lễ Tân', 'Phòng Nhân Sự - Hành Chính', 'LE_TAN', 4,
  'ACTIVE', 'LT', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_088', 'NS-006', 'Nguyễn Minh Hùng', 'ns006@tbsgroup.vn', '0903860006', 'Chuyên Viên Nhân Sự & Tiền Lương', 'Phòng Nhân Sự - Hành Chính', 'CBCNV', 4,
  'ACTIVE', 'CV_HR', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_089', 'NS-007', 'Ngô Hà Thanh An', 'ns007@tbsgroup.vn', '0903860007', 'Chuyên Viên Nhân Sự & Tiền Lương', 'Phòng Nhân Sự - Hành Chính', 'CBCNV', 4,
  'ACTIVE', 'CV_HR', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_090', 'NS-008', 'Lê Thúy Diễm', 'ns008@tbsgroup.vn', '0903860008', 'Chuyên Viên Nhân Sự & Tiền Lương', 'Phòng Nhân Sự - Hành Chính', 'CBCNV', 4,
  'ACTIVE', 'CV_HR', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_091', 'NS-009', 'Nguyễn Thị Đào', 'ns009@tbsgroup.vn', '0903860009', 'Chuyên Viên Nhân Sự & Tiền Lương', 'Phòng Nhân Sự - Hành Chính', 'CBCNV', 4,
  'ACTIVE', 'CV_HR', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_092', 'NS-010', 'Hồ Thị Thảo', 'ns010@tbsgroup.vn', '0903860010', 'Chuyên Viên Nhân Sự & Tiền Lương', 'Phòng Nhân Sự - Hành Chính', 'CBCNV', 4,
  'ACTIVE', 'CV_HR', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_093', 'NS-011', 'Đoàn Thị Trinh', 'ns011@tbsgroup.vn', '0903860011', 'Chuyên Viên Nhân Sự & Tiền Lương', 'Phòng Nhân Sự - Hành Chính', 'CBCNV', 4,
  'ACTIVE', 'CV_HR', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_094', 'NS-012', 'Nguyễn Văn Nguyện', 'ns012@tbsgroup.vn', '0903860012', 'Chuyên Viên Nhân Sự & Tiền Lương', 'Phòng Nhân Sự - Hành Chính', 'CBCNV', 4,
  'ACTIVE', 'CV_HR', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_095', 'NS-013', 'Phan Thu Hà', 'ns013@tbsgroup.vn', '0903860013', 'Chuyên Viên Nhân Sự & Tiền Lương', 'Phòng Nhân Sự - Hành Chính', 'CBCNV', 4,
  'ACTIVE', 'CV_HR', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_096', 'NS-014', 'Đặng Ngọc Mai', 'ns014@tbsgroup.vn', '0903860014', 'Chuyên Viên Nhân Sự & Tiền Lương', 'Phòng Nhân Sự - Hành Chính', 'CBCNV', 4,
  'ACTIVE', 'CV_HR', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_097', 'NS-015', 'Vũ Thị Thanh Tâm', 'ns015@tbsgroup.vn', '0903860015', 'Chuyên Viên Nhân Sự & Tiền Lương', 'Phòng Nhân Sự - Hành Chính', 'CBCNV', 4,
  'ACTIVE', 'CV_HR', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_098', 'NS-016', 'Trần Văn Quyết', 'ns016@tbsgroup.vn', '0903860016', 'Chuyên Viên Nhân Sự & Tiền Lương', 'Phòng Nhân Sự - Hành Chính', 'CBCNV', 4,
  'ACTIVE', 'CV_HR', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_099', 'NS-017', 'Hoàng Thị Hậu', 'ns017@tbsgroup.vn', '0903860017', 'Chuyên Viên Nhân Sự & Tiền Lương', 'Phòng Nhân Sự - Hành Chính', 'CBCNV', 4,
  'ACTIVE', 'CV_HR', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  'user_pilot_100', 'NS-018', 'Bùi Đức Anh', 'ns018@tbsgroup.vn', '0903860018', 'Chuyên Viên Nhân Sự & Tiền Lương', 'Phòng Nhân Sự - Hành Chính', 'CBCNV', 4,
  'ACTIVE', 'CV_HR', 'sha256:55a403a7dedcca87592b56f37fe320b9ac3764a06e8cd053e769ebfa64f73540', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
