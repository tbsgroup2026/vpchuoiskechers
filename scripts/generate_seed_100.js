const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const salt = 'TBS_SALT_2026';
const defaultPassword = 'Pilot@2026';
const passwordHash = 'sha256:' + crypto.createHash('sha256').update(defaultPassword + salt).digest('hex');

// 7 Departments breakdown (Total 100 users):
// 1. BAN_GIAM_DOC (4)
// 2. KE_TOAN (13)
// 3. QC_QUALITY (15)
// 4. KHO_VAN (14)
// 5. PROD_MAY (20)
// 6. KY_THUAT_CHUYEN (16)
// 7. NS_HC (18)

const users = [];

// 1. Ban Giám Đốc (4)
users.push({
  emp_code: 'BGD-001',
  name: 'Nguyễn Văn Hùng',
  email: 'hung.nguyenvan@tbsgroup.vn',
  phone: '0903800001',
  title: 'Tổng Giám Đốc Chuỗi',
  department: 'Ban Giám Đốc',
  role_code: 'TONG_GIAM_DOC',
  role_level: 1,
  vtcv_hien_tai: 'TGĐ',
});
users.push({
  emp_code: 'BGD-002',
  name: 'Trần Thị Mai',
  email: 'mai.tranthi@tbsgroup.vn',
  phone: '0903800002',
  title: 'Phó Tổng Giám Đốc Vận Hành',
  department: 'Ban Giám Đốc',
  role_code: 'PHO_TONG_GIAM_DOC',
  role_level: 2,
  vtcv_hien_tai: 'PTGĐ',
});
users.push({
  emp_code: 'BGD-003',
  name: 'Lê Hoàng Nam',
  email: 'nam.lehoang@tbsgroup.vn',
  phone: '0903800003',
  title: 'Giám Đốc Chuỗi Skechers',
  department: 'Ban Giám Đốc',
  role_code: 'GIAM_DOC',
  role_level: 2,
  vtcv_hien_tai: 'GĐ',
});
users.push({
  emp_code: 'BGD-004',
  name: 'Đỗ Minh Tuấn',
  email: 'tuan.dominh@tbsgroup.vn',
  phone: '0903800004',
  title: 'Phó Giám Đốc Kỹ Thuật Sản Xuất',
  department: 'Ban Giám Đốc',
  role_code: 'PHO_GIAM_DOC',
  role_level: 2,
  vtcv_hien_tai: 'PGĐ',
});

// 2. Kế Toán (13)
users.push({
  emp_code: 'KT-001',
  name: 'Trần Thị Thu Hương',
  email: 'huong.tranthithu@tbsgroup.vn',
  phone: '0903810001',
  title: 'Trưởng Phòng Kế Toán',
  department: 'Phòng Kế Toán',
  role_code: 'TRUONG_PHONG',
  role_level: 3,
  vtcv_hien_tai: 'TP',
});
users.push({
  emp_code: 'KT-002',
  name: 'Phạm Thị Kim Loan',
  email: 'loan.phamthikim@tbsgroup.vn',
  phone: '0903810002',
  title: 'Phó Phòng Kế Toán',
  department: 'Phòng Kế Toán',
  role_code: 'PHO_PHONG',
  role_level: 3,
  vtcv_hien_tai: 'PP',
});
const ktStaff = [
  'Vũ Thị Bích Thủy', 'Lê Ngọc Yến', 'Đặng Thu Hằng', 'Bùi Văn Trí',
  'Nguyễn Thu Trang', 'Hoàng Minh Châu', 'Dương Quốc Thái', 'Ngô Bảo Ngọc',
  'Trịnh Thị Lan', 'Phan Văn Hiệp', 'Lâm Thúy Nga'
];
ktStaff.forEach((name, i) => {
  const num = String(i + 3).padStart(3, '0');
  users.push({
    emp_code: `KT-${num}`,
    name: name,
    email: `kt${num}@tbsgroup.vn`,
    phone: `0903810${num}`,
    title: 'Chuyên Viên Kế Toán',
    department: 'Phòng Kế Toán',
    role_code: 'CBCNV',
    role_level: 4,
    vtcv_hien_tai: 'CV_KE_TOAN',
  });
});

// 3. QC - Chất lượng (15)
users.push({
  emp_code: 'QC-001',
  name: 'Bùi Thị Hằng',
  email: 'hang.buithi@tbsgroup.vn',
  phone: '0903820001',
  title: 'Trưởng Ban Chất Lượng (QC Lead)',
  department: 'Ban Chất Lượng (QC)',
  role_code: 'TRUONG_PHONG',
  role_level: 3,
  vtcv_hien_tai: 'TP',
});
users.push({
  emp_code: 'QC-002',
  name: 'Nguyễn Văn Đức',
  email: 'duc.nguyenvan@tbsgroup.vn',
  phone: '0903820002',
  title: 'Phó Ban Chất Lượng QC',
  department: 'Ban Chất Lượng (QC)',
  role_code: 'PHO_PHONG',
  role_level: 3,
  vtcv_hien_tai: 'PP',
});
users.push({
  emp_code: 'QC-003',
  name: 'Lê Tấn Phát',
  email: 'phat.letan@tbsgroup.vn',
  phone: '0903820003',
  title: 'Quản Đốc / Giám Sát QC Chuyền',
  department: 'Ban Chất Lượng (QC)',
  role_code: 'QUAN_DOC',
  role_level: 3,
  vtcv_hien_tai: 'QD_QC',
});
const qcStaff = [
  'Đinh Văn Thắng', 'Mai Thị Ánh', 'Trần Hữu Lộc', 'Nguyễn Thị Hoa',
  'Võ Thị Lệ', 'Cao Minh Trực', 'Hà Thị Thu', 'Phạm Hồng Sơn',
  'Ngô Thanh Tùng', 'Đặng Thảo Vy', 'Trương Quốc Bảo', 'Lê Thị Thu Thủy'
];
qcStaff.forEach((name, i) => {
  const num = String(i + 4).padStart(3, '0');
  users.push({
    emp_code: `QC-${num}`,
    name: name,
    email: `qc${num}@tbsgroup.vn`,
    phone: `0903820${num}`,
    title: 'Kỹ Thuật Viên Kiểm Hàng QC',
    department: 'Ban Chất Lượng (QC)',
    role_code: 'CBCNV',
    role_level: 4,
    vtcv_hien_tai: 'KTV_QC',
  });
});

// 4. Kho Vận & Logistics (14)
users.push({
  emp_code: 'KV-001',
  name: 'Võ Quốc Toàn',
  email: 'toan.voquoc@tbsgroup.vn',
  phone: '0903830001',
  title: 'Trưởng Phòng Kho Vận & Logistics',
  department: 'Phòng Kho Vận & Logistics',
  role_code: 'TRUONG_PHONG',
  role_level: 3,
  vtcv_hien_tai: 'TP',
});
users.push({
  emp_code: 'KV-002',
  name: 'Hoàng Đình Trọng',
  email: 'trong.hoangdinh@tbsgroup.vn',
  phone: '0903830002',
  title: 'Phó Phòng Kho Vận',
  department: 'Phòng Kho Vận & Logistics',
  role_code: 'PHO_PHONG',
  role_level: 3,
  vtcv_hien_tai: 'PP',
});
const kvStaff = [
  'Nguyễn Hùng Dũng', 'Trần Văn Kiên', 'Lê Thị Mỹ Linh', 'Phan Văn Hòa',
  'Đỗ Quốc Hùng', 'Bùi Văn Hưng', 'Ngô Gia Huy', 'Dương Văn Long',
  'Tạ Quang Minh', 'Lâm Văn Phước', 'Vũ Đức Thịnh', 'Hồ Xuân Hùng'
];
kvStaff.forEach((name, i) => {
  const num = String(i + 3).padStart(3, '0');
  users.push({
    emp_code: `KV-${num}`,
    name: name,
    email: `kv${num}@tbsgroup.vn`,
    phone: `0903830${num}`,
    title: 'Nhân Viên Điều Phối Kho Vận',
    department: 'Phòng Kho Vận & Logistics',
    role_code: 'CBCNV',
    role_level: 4,
    vtcv_hien_tai: 'NV_KHO',
  });
});

// 5. Xưởng Sản Xuất May (20)
users.push({
  emp_code: 'MAY-001',
  name: 'Trần Văn Hùng',
  email: 'hung.tranvan@tbsgroup.vn',
  phone: '0903840001',
  title: 'Quản Đốc Xưởng May 5',
  department: 'Xưởng May Sản Xuất',
  role_code: 'QUAN_DOC',
  role_level: 3,
  vtcv_hien_tai: 'QUAN_DOC',
});
users.push({
  emp_code: 'MAY-002',
  name: 'Lê Thị Tuyết',
  email: 'tuyet.lethi@tbsgroup.vn',
  phone: '0903840002',
  title: 'Phó Quản Đốc Xưởng May',
  department: 'Xưởng May Sản Xuất',
  role_code: 'PHO_PHONG',
  role_level: 3,
  vtcv_hien_tai: 'PHO_QUAN_DOC',
});
const toTruongNames = [
  'Nguyễn Thị Kim Chi', 'Phạm Văn Hậu', 'Trần Thị Bích Ngọc', 'Lê Hữu Nghĩa'
];
toTruongNames.forEach((name, i) => {
  const num = String(i + 3).padStart(3, '0');
  users.push({
    emp_code: `MAY-${num}`,
    name: name,
    email: `may${num}@tbsgroup.vn`,
    phone: `0903840${num}`,
    title: `Tổ Trưởng Chuyền May ${i + 1}`,
    department: 'Xưởng May Sản Xuất',
    role_code: 'TO_TRUONG',
    role_level: 4,
    vtcv_hien_tai: 'TO_TRUONG',
  });
});
const mayStaff = [
  'Đỗ Thị Mai', 'Hoàng Văn Nam', 'Bùi Thu Hằng', 'Vũ Quốc Việt',
  'Ngô Thị Thúy', 'Phan Văn Sang', 'Lý Thị Hồng', 'Đặng Văn Tiến',
  'Trịnh Thị Oanh', 'Nguyễn Hữu Tài', 'Dương Thị Loan', 'Mai Văn Cường',
  'Lê Thị Diệu', 'Hồ Văn Phước'
];
mayStaff.forEach((name, i) => {
  const num = String(i + 7).padStart(3, '0');
  users.push({
    emp_code: `MAY-${num}`,
    name: name,
    email: `may${num}@tbsgroup.vn`,
    phone: `0903840${num}`,
    title: 'Kỹ Thuật May & May Mẫu',
    department: 'Xưởng May Sản Xuất',
    role_code: 'CBCNV',
    role_level: 4,
    vtcv_hien_tai: 'KT_MAY',
  });
});

// 6. Kỹ Thuật Chuyền & IE (16)
users.push({
  emp_code: 'KTCN-001',
  name: 'Đặng Hữu Phúc',
  email: 'phuc.danghuu@tbsgroup.vn',
  phone: '0903850001',
  title: 'Trưởng Phòng Kỹ Thuật & MMTB',
  department: 'Phòng Kỹ Thuật Chuyền & IE',
  role_code: 'TRUONG_PHONG',
  role_level: 3,
  vtcv_hien_tai: 'TP',
});
users.push({
  emp_code: 'KTCN-002',
  name: 'Trần Thị Ngoan',
  email: 'ngoan.tranthi@tbsgroup.vn',
  phone: '0901234567',
  title: 'Kỹ Sư Trưởng IE & Cải Tiến Kaizen',
  department: 'Phòng Kỹ Thuật Chuyền & IE',
  role_code: 'IE',
  role_level: 3,
  vtcv_hien_tai: 'IE_LEAD',
});
users.push({
  emp_code: 'KTCN-003',
  name: 'Lê Khải',
  email: 'khai.le@tbsgroup.vn',
  phone: '0988000005',
  title: 'Chuyên Viên Vận Hành Kỹ Thuật',
  department: 'Phòng Kỹ Thuật Chuyền & IE',
  role_code: 'IE',
  role_level: 4,
  vtcv_hien_tai: 'IE_STAFF',
});
const ktcnStaff = [
  'Nguyễn Văn Thìn', 'Lê Hữu Dũng', 'Phạm Quốc Cường', 'Võ Minh Luân',
  'Đoàn Văn Tuyên', 'Bùi Văn Hào', 'Trần Văn Bảo', 'Hoàng Minh Trí',
  'Đỗ Thế Hùng', 'Lâm Văn Quý', 'Cao Xuân Trường', 'Hà Văn Bình', 'Tạ Duy Khánh'
];
ktcnStaff.forEach((name, i) => {
  const num = String(i + 4).padStart(3, '0');
  users.push({
    emp_code: `KTCN-${num}`,
    name: name,
    email: `ktcn${num}@tbsgroup.vn`,
    phone: `0903850${num}`,
    title: 'Kỹ Sư Cơ Điện & Cân Bằng Chuyền',
    department: 'Phòng Kỹ Thuật Chuyền & IE',
    role_code: 'CBCNV',
    role_level: 4,
    vtcv_hien_tai: 'KS_CO_DIEN',
  });
});

// 7. Nhân Sự - Hành Chính & Lễ Tân (18)
users.push({
  emp_code: 'NS-001',
  name: 'Nguyễn Thị Lan Anh',
  email: 'lananh.nguyen@tbsgroup.vn',
  phone: '0903860001',
  title: 'Trưởng Phòng Nhân Sự - Hành Chính',
  department: 'Phòng Nhân Sự - Hành Chính',
  role_code: 'TRUONG_PHONG',
  role_level: 3,
  vtcv_hien_tai: 'TP',
});
users.push({
  emp_code: 'NS-002',
  name: 'Đỗ Thị Bích Ngân',
  email: 'ngan.dothibich@tbsgroup.vn',
  phone: '0903860002',
  title: 'Phó Phòng Nhân Sự',
  department: 'Phòng Nhân Sự - Hành Chính',
  role_code: 'PHO_PHONG',
  role_level: 3,
  vtcv_hien_tai: 'PP',
});
users.push({
  emp_code: 'NS-003',
  name: 'Trần Thị Bích Trâm',
  email: 'tram.tranthibich@tbsgroup.vn',
  phone: '0903860003',
  title: 'Trưởng Team Lễ Tân Văn Phòng',
  department: 'Phòng Nhân Sự - Hành Chính',
  role_code: 'LE_TAN',
  role_level: 4,
  vtcv_hien_tai: 'T_LE_TAN',
});
users.push({
  emp_code: 'NS-004',
  name: 'Trương Bảo Ngọc',
  email: 'ngoc.truongbao@tbsgroup.vn',
  phone: '0903860004',
  title: 'Nhân Viên Lễ Tân',
  department: 'Phòng Nhân Sự - Hành Chính',
  role_code: 'LE_TAN',
  role_level: 4,
  vtcv_hien_tai: 'LT',
});
users.push({
  emp_code: 'NS-005',
  name: 'Nguyễn Kim Nguyên',
  email: 'nguyen.nguyenkim@tbsgroup.vn',
  phone: '0903860005',
  title: 'Nhân Viên Lễ Tân',
  department: 'Phòng Nhân Sự - Hành Chính',
  role_code: 'LE_TAN',
  role_level: 4,
  vtcv_hien_tai: 'LT',
});
const nsStaff = [
  'Nguyễn Minh Hùng', 'Ngô Hà Thanh An', 'Lê Thúy Diễm', 'Nguyễn Thị Đào',
  'Hồ Thị Thảo', 'Đoàn Thị Trinh', 'Nguyễn Văn Nguyện', 'Phan Thu Hà',
  'Đặng Ngọc Mai', 'Vũ Thị Thanh Tâm', 'Trần Văn Quyết', 'Hoàng Thị Hậu', 'Bùi Đức Anh'
];
nsStaff.forEach((name, i) => {
  const num = String(i + 6).padStart(3, '0');
  users.push({
    emp_code: `NS-${num}`,
    name: name,
    email: `ns${num}@tbsgroup.vn`,
    phone: `0903860${num}`,
    title: 'Chuyên Viên Nhân Sự & Tiền Lương',
    department: 'Phòng Nhân Sự - Hành Chính',
    role_code: 'CBCNV',
    role_level: 4,
    vtcv_hien_tai: 'CV_HR',
  });
});

console.log(`Total users generated: ${users.length}`);

// Generate SQL statements
let sql = `-- Seed 100 Users for Pilot Trial (Môi trường Test)
-- Password mặc định: Pilot@2026 (hashed SHA-256 + salt)
-- Đánh dấu rõ: is_test_account = 1, ghi_chu = 'TEST_PILOT_100_USERS'

`;

users.forEach((u, idx) => {
  const id = `user_pilot_${String(idx + 1).padStart(3, '0')}`;
  sql += `INSERT INTO sys_users (
  id, emp_code, name, email, phone, title, department, role_code, role_level,
  status, vtcv_hien_tai, password_hash, must_change_pwd, is_test_account, ghi_chu
) VALUES (
  '${id}', '${u.emp_code}', '${u.name}', '${u.email}', '${u.phone}', '${u.title}', '${u.department}', '${u.role_code}', ${u.role_level},
  'ACTIVE', '${u.vtcv_hien_tai}', '${passwordHash}', 1, 1, 'TEST_PILOT_100_USERS'
) ON CONFLICT(emp_code) DO UPDATE SET
  name=excluded.name, email=excluded.email, phone=excluded.phone, title=excluded.title, department=excluded.department,
  role_code=excluded.role_code, role_level=excluded.role_level, vtcv_hien_tai=excluded.vtcv_hien_tai,
  password_hash=excluded.password_hash, must_change_pwd=1, is_test_account=1, ghi_chu='TEST_PILOT_100_USERS';
`;
});

fs.writeFileSync(path.join(__dirname, 'seed_pilot_100_users.sql'), sql, 'utf8');
console.log('Successfully wrote scripts/seed_pilot_100_users.sql');

// Cleanup script
let cleanSql = `-- Cleanup Script for Pilot 100 Users
DELETE FROM sys_users WHERE is_test_account = 1 OR ghi_chu = 'TEST_PILOT_100_USERS';
`;
fs.writeFileSync(path.join(__dirname, 'clean_pilot_100_users.sql'), cleanSql, 'utf8');
console.log('Successfully wrote scripts/clean_pilot_100_users.sql');
