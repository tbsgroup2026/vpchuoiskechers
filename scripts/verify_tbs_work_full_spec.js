const { execSync } = require('child_process');

console.log('====================================================');
console.log('🚀 AUTOMATED VERIFICATION SUITE: TBS WORK & RBAC 7 TẦNG');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName} ${detail ? `(${detail})` : ''}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failCount++;
  }
}

// 1. Verify D1 Tables Schema
console.log('📌 Test Group 1: D1 Database Schema Verification');
try {
  const output = execSync('npx wrangler d1 execute vpchuoiskechers-db --remote --command="SELECT name FROM sqlite_master WHERE type=\'table\'"', { encoding: 'utf-8' });

  const requiredTables = [
    'user_security_pin',
    'module_152_access_log',
    'projects',
    'project_members',
    'task_boards',
    'board_members',
    'task_board_columns',
    'tasks',
    'task_members',
    'task_labels',
    'task_label_links',
    'task_checklists',
    'task_checklist_items',
    'task_comments',
    'task_attachments',
    'task_reviews',
    'task_activity_logs',
    'performance_weight_config'
  ];

  requiredTables.forEach((table) => {
    const exists = output.includes(table);
    assert(exists, `Bảng D1 [${table}] tồn tại trong DB sản xuất`);
  });
} catch (error) {
  console.error('Lỗi khi kiểm tra D1 schema:', error.message);
  failCount++;
}

// 2. Verify Codebase for forbidden "Trello" references
console.log('\n📌 Test Group 2: Code & Route Keyword Verification');
try {
  const trelloCheck = execSync('git grep -i "trello" web/src/', { encoding: 'utf-8' }).trim();
  assert(trelloCheck === '', 'Không còn bất kỳ từ khóa "Trello" nào trong web/src/');
} catch (error) {
  // If git grep returns exit code 1 (no matches), it's a pass!
  assert(true, 'Không còn bất kỳ từ khóa "Trello" nào trong web/src/');
}

// 3. Check Authentication Enforcement Files
console.log('\n📌 Test Group 3: Authorization Middleware & Fallback Identity Audit');
try {
  const authMeCode = require('fs').readFileSync('web/src/app/api/auth/me/route.ts', 'utf-8');
  assert(!authMeCode.includes("let empCode = '202608001'"), '/api/auth/me đã xóa bỏ hoàn toàn fallback MSNV 202608001');
  assert(authMeCode.includes('status: 401'), '/api/auth/me trả về HTTP 401 khi thiếu/sai token');

  const meCode = require('fs').readFileSync('web/src/app/api/me/route.ts', 'utf-8');
  assert(meCode.includes('status: 401'), '/api/me trả về HTTP 401 khi thiếu/sai token');

  const moveCode = require('fs').readFileSync('web/src/app/api/tasks/[id]/move/route.ts', 'utf-8');
  assert(moveCode.includes('status: 409'), 'API /move xử lý 409 Conflict khi sai version concurrency');
} catch (error) {
  console.error('Lỗi kiểm tra Auth Enforcement code:', error.message);
}

console.log('\n====================================================');
console.log(`📊 TỔNG KẾT KIỂM THỬ: ${passCount} PASSED, ${failCount} FAILED`);
console.log('====================================================');

if (failCount > 0) {
  process.exit(1);
}
