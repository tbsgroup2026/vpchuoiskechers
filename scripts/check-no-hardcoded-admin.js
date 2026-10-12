// scripts/check-no-hardcoded-admin.js
const fs = require('fs');
const path = require('path');

const API_DIR = path.resolve(__dirname, '../web/src/app/api');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(function (file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== '__tests__' && file !== 'node_modules') {
        getAllFiles(fullPath, arrayOfFiles);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.tsx')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(API_DIR);
let errorsFound = 0;

console.log(`==> [CI Guard] Quét ${files.length} tệp trong web/src/app/api để tìm fallback quyền ẩn...`);

const patterns = [
  {
    regex: /roleCode\s*:\s*['"]SUPER_ADMIN['"][^}]*empCode\s*:\s*['"]202608001['"]/s,
    desc: 'Fallback gán ngầm SUPER_ADMIN và 202608001 khi thiếu session'
  },
  {
    regex: /x-user-emp-code.*202608001/i,
    desc: 'Fallback tin tưởng header x-user-emp-code giả mạo'
  },
  {
    regex: /session\??\.empCode\s*\|\|\s*['"]202608001['"]/,
    desc: 'Fallback session.empCode || "202608001"'
  }
];

files.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf-8');
  patterns.forEach(p => {
    if (p.regex.test(content)) {
      console.error(`❌ LỖI tại ${path.relative(process.cwd(), filePath)}: ${p.desc}`);
      errorsFound++;
    }
  });
});

if (errorsFound > 0) {
  console.error(`\n🚫 [CI Guard FAILED] Phát hiện ${errorsFound} vị trí fallback trái phép. Yêu cầu sửa trước khi commit/deploy.`);
  process.exit(1);
} else {
  console.log('✅ [CI Guard PASSED] Không phát hiện bất kỳ fallback xác thực ngầm nào trong web/src/app/api.');
  process.exit(0);
}
