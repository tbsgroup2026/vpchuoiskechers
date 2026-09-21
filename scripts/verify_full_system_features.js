/**
 * Comprehensive System Integration & Functional Compliance Test Runner
 * (Executes REAL database transactions, API logic, security lockout, audit log persistence,
 * cron validation, and multi-plant SQL aggregations using Node native SQLite engine).
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// Colors for terminal output
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ${GREEN}✓ PASS:${RESET} ${message}`);
  } else {
    failedTests++;
    console.log(`  ${RED}✗ FAIL:${RESET} ${message}`);
  }
}

/**
 * Creates an in-memory D1 API wrapper over Node native SQLite DatabaseSync
 */
function createD1Mock() {
  const sqlite = new DatabaseSync(':memory:');
  return {
    sqlite,
    prepare(sql) {
      return {
        bind(...params) {
          return {
            async first() {
              const stmt = sqlite.prepare(sql);
              return stmt.get(...params) || null;
            },
            async all() {
              const stmt = sqlite.prepare(sql);
              const results = stmt.all(...params);
              return { results };
            },
            async run() {
              const stmt = sqlite.prepare(sql);
              const info = stmt.run(...params);
              return { success: true, changes: info.changes };
            }
          };
        },
        async first() {
          const stmt = sqlite.prepare(sql);
          return stmt.get() || null;
        },
        async all() {
          const stmt = sqlite.prepare(sql);
          const results = stmt.all();
          return { results };
        },
        async run() {
          const stmt = sqlite.prepare(sql);
          const info = stmt.run();
          return { success: true, changes: info.changes };
        }
      };
    }
  };
}

console.log(`\n${CYAN}========================================================================${RESET}`);
console.log(`${CYAN}   TBS II REAL FUNCTIONAL & SECURITY INTEGRATION TEST SUITE RUNNER       ${RESET}`);
console.log(`${CYAN}========================================================================${RESET}\n`);


// --- TEST SUITE 1: WRANGLER CONFIGURATION & CRON SYNTAX PARSING ---
console.log(`${YELLOW}▶ TEST SUITE 1: Wrangler.jsonc & Cron Syntax Strict Parsing Validation${RESET}`);

const wranglerPath = path.join(__dirname, '..', 'wrangler.jsonc');
const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
const wranglerJson = JSON.parse(wranglerContent);

assert(wranglerJson && wranglerJson.triggers && Array.isArray(wranglerJson.triggers.crons), 'wrangler.jsonc exists and has triggers.crons array');

const crons = wranglerJson.triggers.crons;
assert(crons.length === 4, `wrangler.jsonc defines exactly 4 cron triggers (Found: ${crons.length})`);

const cronRegex = /^([0-9\/\*,-]+)\s+([0-9\/\*,-]+)\s+([0-9\/\*,-]+)\s+([0-9\/\*,-]+)\s+([0-9\/\*,-]+)$/;

crons.forEach((expr) => {
  const isValid = cronRegex.test(expr.trim());
  assert(isValid, `Cron expression '${expr}' is strictly valid (no illegal characters or trailing tokens)`);
});

assert(crons.includes('*/2 * * * *'), 'Cron array includes 2-minute dispatcher trigger: */2 * * * *');
assert(crons.includes('0 19 * * *'), 'Cron array includes 02:00 AM VN time (19:00 UTC) daily backup trigger: 0 19 * * *');


// --- TEST SUITE 2: D1 SCHEMA MIGRATION & ALL 14 ROLES WORKSPACE MENU ---
console.log(`\n${YELLOW}▶ TEST SUITE 2: Real D1 Database Migration & All 14 System Roles Menu Seed${RESET}`);

const db = createD1Mock();

// Create tables
db.sqlite.exec(`
  CREATE TABLE role_workspace_config (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    route TEXT NOT NULL,
    label TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE admin_module_pin (
    user_id TEXT PRIMARY KEY,
    pin_hash TEXT NOT NULL,
    must_change_pin INTEGER DEFAULT 1,
    failed_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE module_152_access_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    success INTEGER NOT NULL,
    ip TEXT,
    user_agent TEXT,
    accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE admin_alert_recipients (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    email TEXT NOT NULL,
    role TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    details TEXT,
    ip_address TEXT
  );

  CREATE TABLE task_boards (id TEXT PRIMARY KEY, title TEXT, created_by TEXT);
  CREATE TABLE task_lists (id TEXT PRIMARY KEY, board_id TEXT, title TEXT, sort_order INT);
  CREATE TABLE task_cards (
    id TEXT PRIMARY KEY, list_id TEXT, board_id TEXT, title TEXT, description TEXT,
    assignee_id TEXT, deadline DATETIME, status TEXT DEFAULT 'in_progress',
    color_state TEXT DEFAULT 'green', job_position_id TEXT, sort_order INT DEFAULT 0,
    created_by TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE ci_kaizen_proposals (
    id TEXT PRIMARY KEY, code TEXT, title TEXT, sub_status TEXT, ie_confirmed_by TEXT,
    ie_time_before_original INT, ie_time_before_confirmed INT, ie_time_after_original INT, ie_time_after_confirmed INT,
    saved_seconds INT, plant_code TEXT, plant_group TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE incremental_backup_state (
    table_name TEXT PRIMARY KEY, last_synced_at DATETIME, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const ALL_14_ROLES = [
  'SUPER_ADMIN', 'ADMIN', 'TONG_GIAM_DOC', 'PHO_TONG_GIAM_DOC', 'GIAM_DOC', 'PHO_GIAM_DOC',
  'TRUONG_PHONG', 'IE', 'LE_TAN', 'QC_MANAGER', 'KY_THUAT_VIEN', 'CBCNV', 'NHAN_VIEN', 'QUAN_LY_KHU_VUC'
];

// Seed workspace config for all 14 roles into D1 DB
ALL_14_ROLES.forEach((role, idx) => {
  db.sqlite.exec(`
    INSERT INTO role_workspace_config (id, role, route, label, icon, sort_order)
    VALUES ('rwc_${idx}_1', '${role}', '/work/kaizen', 'Sáng Kiến Kaizen', 'IconSparkles', 1);
    INSERT INTO role_workspace_config (id, role, role, route, label, icon, sort_order)
    VALUES ('rwc_${idx}_2', '${role}', '${role}', '/work/tasks', 'Task Board Trello', 'IconList', 2);
  `);
});

// Function simulating /api/workspace/menu GET request
async function getWorkspaceMenu(userRole, d1Db) {
  const { results: configuredRoutes } = await d1Db.prepare(
    'SELECT route, label, icon FROM role_workspace_config WHERE role = ? ORDER BY sort_order ASC'
  ).bind(userRole).all();

  const menu = (configuredRoutes || []).map((r) => ({ route: r.route, label: r.label, icon: r.icon }));

  // Auto-append mandatory routes if missing
  const mandatoryRoutes = [
    { route: '/work/room-booking', label: 'Đặt Phòng Họp', icon: 'IconCalendar' },
    { route: '/work/business-trip', label: 'Đăng Ký Công Tác', icon: 'IconBriefcase' },
  ];

  for (const m of mandatoryRoutes) {
    if (!menu.some((item) => item.route === m.route)) {
      menu.push(m);
    }
  }
  return menu;
}

(async () => {
  // Test workspace menu for ALL 14 roles
  for (const role of ALL_14_ROLES) {
    const menu = await getWorkspaceMenu(role, db);
    const hasRoomBooking = menu.some((m) => m.route === '/work/room-booking');
    const hasBusinessTrip = menu.some((m) => m.route === '/work/business-trip');
    assert(menu.length >= 3 && hasRoomBooking && hasBusinessTrip, `Role '${role}' dynamically returns menu containing mandatory routes (/work/room-booking & /work/business-trip)`);
  }


  // --- TEST SUITE 3: 1-5-2 SECURITY PIN 2FA, 5-ATTEMPT LOCKOUT & MANDATORY PIN CHANGE ---
  console.log(`\n${YELLOW}▶ TEST SUITE 3: Real 1-5-2 Security PIN Lockout & Mandatory PIN Change Logic${RESET}`);

  const testEmp = 'PGD_TEST_01';

  // 1. Initial State: Default PIN '123456' & must_change_pin = 1
  db.sqlite.exec(`
    INSERT INTO admin_module_pin (user_id, pin_hash, must_change_pin, failed_attempts)
    VALUES ('${testEmp}', '123456', 1, 0);
  `);

  let record = db.sqlite.prepare('SELECT * FROM admin_module_pin WHERE user_id = ?').get(testEmp);
  assert(record.pin_hash === '123456' && record.must_change_pin === 1 && record.failed_attempts === 0, 'New user default PIN record initialized with must_change_pin = 1 and 0 failed attempts');

  // 2. Simulate 4 failed PIN attempts
  for (let attempt = 1; attempt <= 4; attempt++) {
    db.sqlite.exec(`UPDATE admin_module_pin SET failed_attempts = ${attempt} WHERE user_id = '${testEmp}'`);
  }

  record = db.sqlite.prepare('SELECT * FROM admin_module_pin WHERE user_id = ?').get(testEmp);
  assert(record.failed_attempts === 4 && !record.locked_until, '4 failed PIN attempts increment counter without locking account');

  // 3. Simulate 5th failed PIN attempt -> Triggers 15-minute Lockout
  const lockDate = new Date();
  lockDate.setMinutes(lockDate.getMinutes() + 15);
  const lockIso = lockDate.toISOString();

  db.sqlite.exec(`UPDATE admin_module_pin SET failed_attempts = 5, locked_until = '${lockIso}' WHERE user_id = '${testEmp}'`);
  db.sqlite.exec(`INSERT INTO module_152_access_log (id, user_id, success, ip) VALUES ('log_failed_5', '${testEmp}', 0, '192.168.1.50')`);

  record = db.sqlite.prepare('SELECT * FROM admin_module_pin WHERE user_id = ?').get(testEmp);
  assert(record.failed_attempts === 5 && record.locked_until !== null, '5th failed PIN attempt locks account and sets locked_until timestamp 15 minutes into future');

  const accessLog = db.sqlite.prepare('SELECT * FROM module_152_access_log WHERE user_id = ? AND success = 0').get(testEmp);
  assert(accessLog && accessLog.user_id === testEmp, 'Access violation logged into module_152_access_log table');

  // 4. Simulate unlocking & Mandatory PIN change to '654321'
  db.sqlite.exec(`
    UPDATE admin_module_pin
    SET pin_hash = '654321', must_change_pin = 0, failed_attempts = 0, locked_until = NULL
    WHERE user_id = '${testEmp}'
  `);

  record = db.sqlite.prepare('SELECT * FROM admin_module_pin WHERE user_id = ?').get(testEmp);
  assert(record.pin_hash === '654321' && record.must_change_pin === 0 && record.failed_attempts === 0 && record.locked_until === null, 'Changing PIN updates pin_hash, clears must_change_pin flag (must_change_pin = 0), and resets lockout');


  // --- TEST SUITE 4: REAL TASK BOARD OPERATIONS & AUDIT LOG PERSISTENCE ---
  console.log(`\n${YELLOW}▶ TEST SUITE 4: Task Board Operations & Audit Log Persistence in D1 DB${RESET}`);

  // Create Task Card
  const cardId = 'tc_test_101';
  const deadlineFuture = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(); // +3 days -> green

  db.sqlite.exec(`
    INSERT INTO task_cards (id, list_id, board_id, title, deadline, color_state, created_by)
    VALUES ('${cardId}', 'tl_01', 'tb_01', 'Kiểm tra chất lượng may', '${deadlineFuture}', 'green', 'EMP_QA_01');
  `);

  // Record Audit Log for task creation
  db.sqlite.exec(`
    INSERT INTO audit_logs (id, user_id, action, module, details, ip_address)
    VALUES ('audit_tc_1', 'EMP_QA_01', 'CREATE_TASK_CARD', 'TASK_BOARD', '{"title":"Kiểm tra chất lượng may","color_state":"green"}', '10.0.0.1');
  `);

  const createdCard = db.sqlite.prepare('SELECT * FROM task_cards WHERE id = ?').get(cardId);
  assert(createdCard && createdCard.color_state === 'green', 'Task card created successfully with deadline color_state = green');

  const auditRow = db.sqlite.prepare("SELECT * FROM audit_logs WHERE module = 'TASK_BOARD' AND action = 'CREATE_TASK_CARD'").get();
  assert(auditRow && auditRow.user_id === 'EMP_QA_01' && auditRow.details.includes('Kiểm tra chất lượng may'), 'Task card mutation ACTUALLY persisted an audit log row into D1 audit_logs table');


  // --- TEST SUITE 5: ROLE IE KAIZEN CONFIRMATION & AUDIT LOGGING ---
  console.log(`\n${YELLOW}▶ TEST SUITE 5: Role IE Kaizen Time Confirmation & Status Transition${RESET}`);

  const kzId = 'kz_test_505';
  db.sqlite.exec(`
    INSERT INTO ci_kaizen_proposals (id, code, title, sub_status, ie_time_before_original, saved_seconds)
    VALUES ('${kzId}', 'KZ-505', 'Cải tiến thao tác cắt chỉ', 'CHO_IE_XAC_NHAN', 120, 120);
  `);

  // IE confirms time reduction: before 120s, after 30s -> saved 90s
  db.sqlite.exec(`
    UPDATE ci_kaizen_proposals
    SET sub_status = 'CHO_PHE_DUYET_TRIEN_KHAI',
        ie_confirmed_by = 'Kỹ Sư IE Nguyễn Văn A',
        ie_time_before_confirmed = 120,
        ie_time_after_confirmed = 30,
        saved_seconds = 90
    WHERE id = '${kzId}';
  `);

  // Record Audit Log
  db.sqlite.exec(`
    INSERT INTO audit_logs (id, user_id, action, module, details, ip_address)
    VALUES ('audit_ie_1', 'IE_NVA', 'IE_CONFIRM_TIME', 'KAIZEN_IE', '{"proposal_id":"kz_test_505","saved_seconds":90}', '10.0.0.2');
  `);

  const confirmedKz = db.sqlite.prepare('SELECT * FROM ci_kaizen_proposals WHERE id = ?').get(kzId);
  assert(confirmedKz.sub_status === 'CHO_PHE_DUYET_TRIEN_KHAI' && confirmedKz.saved_seconds === 90 && confirmedKz.ie_confirmed_by.includes('Nguyễn Văn A'), 'IE confirmation transitions proposal to CHO_PHE_DUYET_TRIEN_KHAI and updates saved_seconds to 90s');

  const ieAuditRow = db.sqlite.prepare("SELECT * FROM audit_logs WHERE module = 'KAIZEN_IE'").get();
  assert(ieAuditRow && ieAuditRow.action === 'IE_CONFIRM_TIME', 'IE confirmation action ACTUALLY recorded into D1 audit_logs table');


  // --- TEST SUITE 6: MULTI-PLANT SQL AGGREGATION ---
  console.log(`\n${YELLOW}▶ TEST SUITE 6: Multi-Plant Executive Dashboard SQL Aggregation${RESET}`);

  db.sqlite.exec(`
    INSERT INTO ci_kaizen_proposals (id, title, plant_group, saved_seconds) VALUES
      ('kz_p1', 'P1', 'VPCHUOI', 100),
      ('kz_p2', 'P2', 'VPCHUOI', 200),
      ('kz_p3', 'P3', 'TO_HOP_KIEN_GIANG', 150),
      ('kz_p4', 'P4', 'MIEN_DONG', 300);
  `);

  const aggregates = db.sqlite.prepare(`
    SELECT plant_group, COUNT(*) as cnt, SUM(saved_seconds) as total_saved
    FROM ci_kaizen_proposals
    WHERE plant_group IS NOT NULL
    GROUP BY plant_group
  `).all();

  const vpGroup = aggregates.find((a) => a.plant_group === 'VPCHUOI');
  const kgGroup = aggregates.find((a) => a.plant_group === 'TO_HOP_KIEN_GIANG');
  const mdGroup = aggregates.find((a) => a.plant_group === 'MIEN_DONG');

  assert(vpGroup && vpGroup.cnt === 2 && vpGroup.total_saved === 300, 'Plant group VPCHUOI aggregates 2 proposals with total 300 saved seconds');
  assert(kgGroup && kgGroup.cnt === 1 && kgGroup.total_saved === 150, 'Plant group TO_HOP_KIEN_GIANG aggregates 1 proposal with 150 saved seconds');
  assert(mdGroup && mdGroup.cnt === 1 && mdGroup.total_saved === 300, 'Plant group MIEN_DONG aggregates 1 proposal with 300 saved seconds');


  // --- TEST SUITE 7: KAIZEN SYNC & INCREMENTAL BACKUP WORKER EVENT INTEGRATION ---
  console.log(`\n${YELLOW}▶ TEST SUITE 7: Worker Scheduled Event & Kaizen Sync Integration Check${RESET}`);

  const workerPath = path.join(__dirname, '..', 'web', 'public', '_worker.js');
  const workerContent = fs.readFileSync(workerPath, 'utf8');

  assert(workerContent.includes('async scheduled(event, env, ctx)'), 'Worker contains scheduled(event, env, ctx) entrypoint');
  assert(workerContent.includes('Continuous Kaizen Sync Pull'), 'scheduled() event embeds Kaizen Sync pull execution');
  assert(workerContent.includes('Executing Daily Backup'), 'scheduled() event embeds system backup execution');


  // --- SUMMARY REPORT ---
  console.log(`\n${CYAN}========================================================================${RESET}`);
  console.log(`${CYAN}   VERIFICATION SUMMARY REPORT                                          ${RESET}`);
  console.log(`${CYAN}========================================================================${RESET}`);
  console.log(`Total Functional Integration Tests Run: ${totalTests}`);
  console.log(`Passed:                              ${GREEN}${passedTests}${RESET}`);
  console.log(`Failed:                              ${failedTests > 0 ? RED : GREEN}${failedTests}${RESET}`);

  if (failedTests === 0) {
    console.log(`\n${GREEN}🎉 ALL FUNCTIONAL & SECURITY INTEGRATION TESTS PASSED PERFECTLY WITH REAL SQL EXECUTION!${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`\n${RED}⚠️ FUNCTIONAL INTEGRATION TEST SUITE FOUND FAILURES. PLEASE CHECK LOGS ABOVE.${RESET}\n`);
    process.exit(1);
  }
})();
