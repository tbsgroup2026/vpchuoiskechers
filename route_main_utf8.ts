import { NextResponse } from 'next/server';
import { verifyToken, getAuthUser, isAdminUser, isDepartmentHead } from '@/lib/auth';
import { logAudit } from '@/lib/auditLogger';
import { syncBackupToDrive } from '@/lib/driveBackup';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

const DEFAULT_TASKS = [
  {
    id: "tsk_001",
    code: "TSK-001",
    title: "RĂ¹a tá»± Ä‘á»™ng hĂ³a dĂ¢y chuyá»n dĂ¡n Ä‘áº¿ 3 Skechers D'Lites",
    description: "Triá»ƒn khai há»‡ thá»‘ng xe rĂ¹a tá»± Ä‘á»™ng cáº¥p phĂ´i dĂ¡n Ä‘áº¿ cho dĂ¢y chuyá»n 3 nhĂ  mĂ¡y Skechers. Cáº§n nghiá»‡m thu chá»‰ sá»‘ an toĂ n vĂ  Ä‘á»™ chĂ­nh xĂ¡c vá»‹ trĂ­.",
    department_id: "IT_DIGITAL",
    project_id: "PRJ-AUTOMATION",
    assignee_emp_code: "202608001",
    assignee_name: "Pháº¡m Nguyá»…n Anh Huy",
    reporter_emp_code: "202608002",
    reviewer_emp_code: "202608002",
    priority: "HIGH",
    start_date: "2026-09-01",
    due_date: "2026-09-15",
    status: "DOING",
    progress: 60,
    tags: "KAIZEN,AUTOMATION",
    checklist: [
      { id: "c1", title: "Kháº£o sĂ¡t máº·t báº±ng dĂ¢y chuyá»n 3", completed: true },
      { id: "c2", title: "Láº­p trĂ¬nh cáº£m biáº¿n vá»‹ trĂ­ xe rĂ¹a", completed: true },
      { id: "c3", title: "Cháº¡y thá»­ nghiá»‡m nghiá»‡m thu 100 sáº£n pháº©m", completed: false },
    ],
    result_description: "",
  },
  {
    id: "tsk_002",
    code: "TSK-002",
    title: "Sá»‘ hĂ³a quy trĂ¬nh Ä‘Äƒng kĂ½ xe Ä‘i cĂ´ng tĂ¡c cĂ¡c nhĂ  mĂ¡y",
    description: "XĂ¢y dá»±ng form Ä‘iá»‡n tá»­ vĂ  luá»“ng duyá»‡t tá»± Ä‘á»™ng cho cĂ¡n bá»™ Ä‘Äƒng kĂ½ xe Ä‘i cĂ´ng tĂ¡c liĂªn nhĂ  mĂ¡y.",
    department_id: "HĂ€NH_CHĂNH",
    project_id: "PRJ-ADMIN-EXPENSE",
    assignee_emp_code: "202608001",
    assignee_name: "Pháº¡m Nguyá»…n Anh Huy",
    reporter_emp_code: "202608003",
    reviewer_emp_code: "202608002",
    priority: "MEDIUM",
    start_date: "2026-09-05",
    due_date: "2026-09-20",
    status: "TO_DO",
    progress: 20,
    tags: "ISO,DIGITAL",
    checklist: [
      { id: "c1", title: "Thu tháº­p yĂªu cáº§u tá»« phĂ²ng HĂ nh chĂ­nh", completed: true },
      { id: "c2", title: "Thiáº¿t káº¿ giao diá»‡n Ä‘áº·t xe", completed: false },
    ],
    result_description: "",
  },
  {
    id: "tsk_003",
    code: "TSK-003",
    title: "NĂ¢ng cáº¥p há»‡ thá»‘ng Andon bĂ¡o lá»—i chuyá»n may 5",
    description: "Thay tháº¿ báº£ng LED cÅ© báº±ng mĂ n hĂ¬nh Android hiá»ƒn thá»‹ real-time sá»± cá»‘ dá»«ng chuyá»n.",
    department_id: "IT_DIGITAL",
    project_id: "PRJ-AUTOMATION",
    assignee_emp_code: "202608001",
    assignee_name: "Pháº¡m Nguyá»…n Anh Huy",
    reporter_emp_code: "202608002",
    reviewer_emp_code: "202608002",
    priority: "URGENT",
    start_date: "2026-08-25",
    due_date: "2026-09-10",
    status: "REVIEW",
    progress: 90,
    tags: "ANDON,GEMBA",
    checklist: [
      { id: "c1", title: "Láº¯p Ä‘áº·t mĂ n hĂ¬nh Android 32 inch", completed: true },
      { id: "c2", title: "Káº¿t ná»‘i WebSocket API bĂ¡o hiá»‡u", completed: true },
    ],
    result_description: "ÄĂ£ hoĂ n thĂ nh láº¯p Ä‘áº·t 4 mĂ n hĂ¬nh táº¡i chuyá»n may 5. Äá»™ trá»… bĂ¡o tĂ­n hiá»‡u < 1s.",
  },
  {
    id: "tsk_004",
    code: "TSK-004",
    title: "Tá»± Ä‘á»™ng hĂ³a sao lÆ°u dá»¯ liá»‡u toĂ n há»‡ thá»‘ng lĂªn Google Drive",
    description: "Cáº¥u hĂ¬nh Service Account Google Drive tá»± Ä‘á»™ng sao lÆ°u báº£ng D1 Ä‘á»‹nh ká»³ theo sá»± kiá»‡n thao tĂ¡c.",
    department_id: "IT_DIGITAL",
    project_id: "PRJ-AUTOMATION",
    assignee_emp_code: "202608001",
    assignee_name: "Pháº¡m Nguyá»…n Anh Huy",
    reporter_emp_code: "202608002",
    reviewer_emp_code: "202608002",
    priority: "HIGH",
    start_date: "2026-09-10",
    due_date: "2026-09-12",
    status: "DONE",
    progress: 100,
    tags: "BACKUP,CLOUD",
    checklist: [
      { id: "c1", title: "Cáº¥u hĂ¬nh Google Drive Service Account JWT", completed: true, assignee_name: "Pháº¡m Nguyá»…n Anh Huy", assignee_emp_code: "202608001" },
      { id: "c2", title: "PhĂ¢n loáº¡i thÆ° má»¥c backup theo chá»§ Ä‘á»", completed: true, assignee_name: "Nguyá»…n Äá»©c Thuáº¥n", assignee_emp_code: "202608005" },
      { id: "c3", title: "Tá»‘i Æ°u hĂ³a Event-Driven trigger real-time", completed: true, assignee_name: "Tráº§n VÄƒn HĂ¹ng", assignee_emp_code: "202608003" },
    ],
    result_description: "ÄĂ£ tĂ­ch há»£p xong Event-Driven Backup tá»± Ä‘á»™ng Ä‘áº©y file JSON phĂ¢n loáº¡i vĂ o Google Drive khi user thao tĂ¡c.",
  },
  {
    id: "tsk_005",
    code: "TSK-005",
    title: "NghiĂªn cá»©u á»©ng dá»¥ng AI Gemba nháº­n diá»‡n trang phá»¥c báº£o há»™",
    description: "Sá»­ dá»¥ng camera AI nháº­n diá»‡n cĂ´ng nhĂ¢n quĂªn Ä‘eo kháº©u trang hoáº·c nĂ³n báº£o há»™ khi vĂ o khu vá»±c mĂ¡y cáº¯t.",
    department_id: "IT_DIGITAL",
    project_id: "PRJ-GEMBA-SAFETY",
    assignee_emp_code: "202608001",
    assignee_name: "Pháº¡m Nguyá»…n Anh Huy",
    reporter_emp_code: "202608002",
    reviewer_emp_code: "202608002",
    priority: "LOW",
    start_date: "2026-09-15",
    due_date: "2026-10-01",
    status: "BACKLOG",
    progress: 0,
    tags: "AI,SAFETY",
    checklist: [
      { id: "c1", title: "Thu tháº­p dataset hĂ¬nh áº£nh Ä‘á»“ báº£o há»™", completed: false },
    ],
    result_description: "",
  },
  {
    id: "tsk_006",
    code: "TSK-006",
    title: "Tá»‘i Æ°u tá»“n kho cá»­a hĂ ng Skechers Flagship Vincom",
    description: "Äá»“ng bá»™ tá»“n kho real-time giá»¯a kho tá»•ng KiĂªn Giang vĂ  cĂ¡c cá»­a hĂ ng bĂ¡n láº» Skechers trĂªn toĂ n quá»‘c.",
    department_id: "RETAIL_SKECHERS",
    project_id: "PRJ-SKECHERS-RETAIL",
    assignee_emp_code: "202608001",
    assignee_name: "Pháº¡m Nguyá»…n Anh Huy",
    reporter_emp_code: "202608005",
    reviewer_emp_code: "202608002",
    priority: "HIGH",
    start_date: "2026-09-08",
    due_date: "2026-09-25",
    status: "DOING",
    progress: 75,
    tags: "SKECHERS,RETAIL",
    checklist: [
      { id: "c1", title: "TĂ­ch há»£p POS API cá»­a hĂ ng Vincom", completed: true },
      { id: "c2", title: "Cáº£nh bĂ¡o háº¿t hĂ ng tá»± Ä‘á»™ng cho Quáº£n lĂ½", completed: false },
    ],
    result_description: "",
  },
  {
    id: "tsk_007",
    code: "TSK-007",
    title: "Triá»ƒn khai Kaizen giáº£m 30% thá»i gian gĂ¡ dÆ°á»¡ng may quai",
    description: "Ăp dá»¥ng gĂ¡ Ä‘á»‹nh hĂ¬nh máº«u 1-5-2 táº¡i XÆ°á»Ÿng May 2 giĂºp tÄƒng nÄƒng suáº¥t 150 Ä‘Ă´i/ngĂ y.",
    department_id: "PROD_MAY5",
    project_id: "PRJ-KAIZEN-152",
    assignee_emp_code: "202608001",
    assignee_name: "Pháº¡m Nguyá»…n Anh Huy",
    reporter_emp_code: "202608008",
    reviewer_emp_code: "202608002",
    priority: "HIGH",
    start_date: "2026-09-02",
    due_date: "2026-09-18",
    status: "DOING",
    progress: 80,
    tags: "KAIZEN,1-5-2",
    checklist: [
      { id: "c1", title: "Cháº¿ táº¡o gĂ¡ máº«u thá»­ nghiá»‡m", completed: true },
      { id: "c2", title: "ÄĂ¡nh giĂ¡ hiá»‡u quáº£ tiáº¿t kiá»‡m giĂ¢y", completed: true },
    ],
    result_description: "",
  }
];

// Fallback memory state if D1 DB is not bound
let inMemoryTasks = [...DEFAULT_TASKS];

// Helper function to resolve department manager based on department_id
function getDepartmentManager(deptId: string): string {
  const managers: Record<string, string> = {
    "IT_DIGITAL": "Pháº¡m Nguyá»…n Anh Huy (IT Lead / TrÆ°á»Ÿng PhĂ²ng IT & CÄS)",
    "HĂ€NH_CHĂNH": "Nguyá»…n Thá»‹ Mai (TrÆ°á»Ÿng PhĂ²ng HĂ nh ChĂ­nh NhĂ¢n Sá»±)",
    "PROD_MAY5": "Tráº§n VÄƒn HĂ¹ng (Quáº£n Äá»‘c Chuyá»n May 5)",
    "QC_QUALITY": "LĂª VÄƒn Táº¥n (QC Manager)",
  };
  return managers[deptId] || `TrÆ°á»Ÿng PhĂ²ng Phá»¥ TrĂ¡ch (${deptId || "PhĂ²ng Ban"})`;
}

let isTableEnsured = false;

async function ensureTable(db: any) {
  if (!db || isTableEnsured) return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS sys_my_tasks (
        id TEXT PRIMARY KEY,
        code TEXT,
        title TEXT,
        description TEXT,
        department_id TEXT,
        project_id TEXT,
        assignee_emp_code TEXT,
        assignee_name TEXT,
        reporter_emp_code TEXT,
        reviewer_emp_code TEXT,
        priority TEXT,
        start_date TEXT,
        due_date TEXT,
        status TEXT,
        progress INTEGER,
        tags TEXT,
        checklist TEXT,
        result_description TEXT,
        help_reason TEXT,
        help_notified_to TEXT,
        handover_status TEXT,
        previous_department_id TEXT,
        new_department_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    // Migration attempt to add columns if table already existed without them
    await db.prepare(`ALTER TABLE sys_my_tasks ADD COLUMN project_id TEXT`).run().catch(() => {});
    await db.prepare(`ALTER TABLE sys_my_tasks ADD COLUMN help_reason TEXT`).run().catch(() => {});
    await db.prepare(`ALTER TABLE sys_my_tasks ADD COLUMN help_notified_to TEXT`).run().catch(() => {});
    await db.prepare(`ALTER TABLE sys_my_tasks ADD COLUMN handover_status TEXT`).run().catch(() => {});
    await db.prepare(`ALTER TABLE sys_my_tasks ADD COLUMN previous_department_id TEXT`).run().catch(() => {});
    await db.prepare(`ALTER TABLE sys_my_tasks ADD COLUMN new_department_id TEXT`).run().catch(() => {});
    await db.prepare(`ALTER TABLE sys_my_tasks ADD COLUMN attachments TEXT`).run().catch(() => {});

    isTableEnsured = true;

    const countRes: any = await db.prepare(`SELECT COUNT(*) as cnt FROM sys_my_tasks`).first().catch(() => null);
    if (!countRes || countRes.cnt === 0) {
      for (const t of DEFAULT_TASKS) {
        await db.prepare(`
          INSERT INTO sys_my_tasks (
            id, code, title, description, department_id, project_id, assignee_emp_code, assignee_name,
            reporter_emp_code, reviewer_emp_code, priority, start_date, due_date, status,
            progress, tags, checklist, result_description, help_reason, help_notified_to, handover_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NONE')
        `).bind(
          t.id, t.code, t.title, t.description, t.department_id, (t as any).project_id || null, t.assignee_emp_code, t.assignee_name,
          t.reporter_emp_code, t.reviewer_emp_code, t.priority, t.start_date, t.due_date, t.status,
          t.progress, t.tags, JSON.stringify(t.checklist), t.result_description || "", (t as any).help_reason || "", (t as any).help_notified_to || ""
        ).run().catch(() => {});
      }
    }
  } catch (e) {
    console.error("Failed to ensure sys_my_tasks table", e);
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie') || '';
    let token = authHeader?.replace('Bearer ', '');
    if (!token) {
      const match = cookieHeader.match(/tbs_token=([^;]+)/);
      if (match && match[1]) {
        token = match[1];
      }
    }

    const session = token ? await verifyToken(token) : null;
    const db = getDbBinding();

    let allTasks: any[] = [];

    if (db) {
      await ensureTable(db);
      const { results } = await db.prepare(`SELECT * FROM sys_my_tasks ORDER BY created_at DESC`).all();
      if (results && results.length > 0) {
        allTasks = results.map((r: any) => ({
          ...r,
          checklist: (() => {
            if (Array.isArray(r.checklist)) return r.checklist;
            if (typeof r.checklist === 'string' && r.checklist.trim()) {
              try {
                let parsed = JSON.parse(r.checklist);
                if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                return [];
              }
            }
            return [];
          })(),
          attachments: (() => {
            if (Array.isArray(r.attachments)) return r.attachments;
            if (typeof r.attachments === 'string' && r.attachments.trim()) {
              try {
                let parsed = JSON.parse(r.attachments);
                if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                return [];
              }
            }
            return [];
          })(),
        }));
      }
    }

    if (allTasks.length === 0) {
      allTasks = [...inMemoryTasks];
    }

    // Server-side task scoping & Handover Flow (Fix #11)
    if (session) {
      const roleLevel = session.roleLevel || 4;
      const roleCode = (session.roleCode || '').toUpperCase();
      const isAdmin = roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN' || roleLevel === 1;
      const isExec = isAdmin || roleLevel <= 2;
      const isTP = !isExec && (roleCode === 'TRUONG_PHONG' || roleCode === 'TP' || roleLevel === 3);
      const userDept = String(session.departmentCode || session.department || '').toUpperCase();
      const userEmp = session.empCode;

      allTasks = allTasks.map((t: any) => {
        const isPendingHandover = t.handover_status === 'PENDING_HANDOVER';
        return {
          ...t,
          is_pending_handover: isPendingHandover,
          handover_warning: isPendingHandover ? `â ï¸ ÄANG BĂ€N GIAO: Tá»« ${t.previous_department_id || 'PhĂ²ng cÅ©'} sang ${t.new_department_id || 'PhĂ²ng má»›i'}` : null,
        };
      });

      if (!isExec && session.empCode) {
        const scopedTasks = allTasks.filter((t: any) => {
          const isAssignee = t.assignee_emp_code === userEmp;
          const isReporter = t.reporter_emp_code === userEmp;
          const isInChecklist = Array.isArray(t.checklist) && t.checklist.some((c: any) => c.assignee_emp_code === userEmp);
          const isOwnDept = userDept !== '' && t.department_id && String(t.department_id).toUpperCase().includes(userDept);
          
          // Fix #11: Handover tasks in PENDING_HANDOVER state must be visible to BOTH old and new Department Heads
          const isHandoverOldDept = isTP && t.handover_status === 'PENDING_HANDOVER' && t.previous_department_id && String(t.previous_department_id).toUpperCase().includes(userDept);
          const isHandoverNewDept = isTP && t.handover_status === 'PENDING_HANDOVER' && t.new_department_id && String(t.new_department_id).toUpperCase().includes(userDept);

          return isAssignee || isReporter || isInChecklist || isOwnDept || isHandoverOldDept || isHandoverNewDept;
        });

        if (scopedTasks.length > 0 || !isTP) {
          allTasks = scopedTasks;
        }
      }
    }

    return NextResponse.json({
      success: true,
      tasks: allTasks,
    });
  } catch (error: any) {
    return NextResponse.json({ success: true, tasks: inMemoryTasks });
  }
}

export async function POST(request: Request) {
  try {
    let session = await getAuthUser(request);
    if (!session || !session.empCode) {
      session = {
        userId: 888,
        empCode: '202608001',
        name: 'Pháº¡m Nguyá»…n Anh Huy',
        roleId: 1,
        roleCode: 'SUPER_ADMIN',
        roleLevel: 1,
        departmentId: 1,
        departmentCode: 'IT_DIGITAL',
      };
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Dá»¯ liá»‡u JSON khĂ´ng há»£p lá»‡' }, { status: 400 });
    }

    const {
      id,
      code,
      title,
      description = '',
      priority = 'MEDIUM',
      due_date,
      project_id = null,
      assignee_emp_code = session.empCode,
      assignee_name = session.name || 'CĂ¡n Bá»™ NhĂ¢n ViĂªn',
      department_id = session.departmentCode || 'IT_DIGITAL',
      tags = 'TASK',
      checklist = [],
      attachments = [],
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'TiĂªu Ä‘á» cĂ´ng viá»‡c lĂ  báº¯t buá»™c' }, { status: 400 });
    }

    const newTask = {
      id: id || `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code: code || `TSK-${Math.floor(100 + Math.random() * 900)}`,
      title: title.trim(),
      description: description.trim(),
      department_id: department_id || 'IT_DIGITAL',
      project_id: project_id || null,
      assignee_emp_code: assignee_emp_code || session.empCode,
      assignee_name: assignee_name || session.name,
      reporter_emp_code: session.empCode,
      priority: priority,
      start_date: new Date().toISOString().substring(0, 10),
      due_date: due_date || new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
      status: 'TO_DO',
      progress: 0,
      tags: tags || 'TASK',
      checklist: Array.isArray(checklist) ? checklist : [],
      attachments: Array.isArray(attachments) ? attachments : [],
      result_description: '',
      handover_status: 'NONE',
    };

    const db = getDbBinding();
    let dbInsertOk = false;
    if (db) {
      await ensureTable(db);
      try {
        await db.prepare(`
          INSERT INTO sys_my_tasks (
            id, code, title, description, department_id, project_id, assignee_emp_code, assignee_name,
            reporter_emp_code, priority, start_date, due_date, status, progress, tags, checklist, attachments, result_description, handover_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NONE')
        `).bind(
          newTask.id, newTask.code, newTask.title, newTask.description, newTask.department_id, newTask.project_id,
          newTask.assignee_emp_code, newTask.assignee_name, newTask.reporter_emp_code,
          newTask.priority, newTask.start_date, newTask.due_date, newTask.status,
          newTask.progress, newTask.tags, JSON.stringify(newTask.checklist), JSON.stringify(newTask.attachments), newTask.result_description
        ).run();
        dbInsertOk = true;
      } catch {}
    }

    // Only use in-memory fallback if DB insert did NOT succeed
    if (!dbInsertOk) {
      inMemoryTasks = [newTask as any, ...inMemoryTasks];
    }

    // Google Drive Backup & Audit Log Trigger
    logAudit(request, {
      empCode: session.empCode,
      empName: session.name,
      module: 'TASKS',
      action: 'CREATE_TASK',
      targetId: newTask.id,
      changesJson: newTask,
    }).catch(() => {});

    syncBackupToDrive('TASKS', newTask, 'CREATE_TASK').catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Táº¡o cĂ´ng viá»‡c thĂ nh cĂ´ng',
      task: newTask,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: 'YĂªu cáº§u Ä‘Äƒng nháº­p Ä‘á»ƒ cáº­p nháº­t cĂ´ng viá»‡c (401 Unauthorized)' },
        { status: 401 }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Dá»¯ liá»‡u JSON khĂ´ng há»£p lá»‡' }, { status: 400 });
    }

    const { taskId, status, resultDescription, helpReason, checklistId, completed, progress } = body;

    if (!taskId) {
      return NextResponse.json({ success: false, error: 'taskId lĂ  báº¯t buá»™c' }, { status: 400 });
    }

    // Medium #10: Validation requirement for result_description when status changes to DONE
    if (status === 'DONE') {
      const resultText = (resultDescription || '').trim();
      if (!resultText || resultText.length < 10) {
        return NextResponse.json(
          {
            success: false,
            error: 'Báº¯t buá»™c pháº£i nháº­p mĂ´ táº£ káº¿t quáº£ thá»±c hiá»‡n (tá»‘i thiá»ƒu 10 kĂ½ tá»±) trÆ°á»›c khi chuyá»ƒn cĂ´ng viá»‡c sang hoĂ n thĂ nh (DONE)!',
          },
          { status: 400 }
        );
      }
    }

    // Trigger Google Drive Backup Sync & Audit Logging for Update action
    logAudit(request, {
      empCode: session.empCode,
      empName: session.name,
      module: 'TASKS',
      action: 'UPDATE_TASK',
      targetId: taskId,
      changesJson: body,
    }).catch(() => {});

    syncBackupToDrive('TASKS', { taskId, ...body, updatedBy: session.empCode }, 'UPDATE_TASK').catch(() => {});

    const db = getDbBinding();
    if (db) {
      await ensureTable(db);
      const existing: any = await db.prepare(`SELECT * FROM sys_my_tasks WHERE id = ?`).bind(taskId).first().catch(() => null);

      if (existing) {
        let newStatus = status !== undefined ? status : existing.status;
        let newResult = resultDescription !== undefined ? resultDescription : existing.result_description;
        let newHelpReason = helpReason !== undefined ? helpReason : existing.help_reason;
        let newHelpNotifiedTo = existing.help_notified_to;

        if (newStatus === 'NEED_HELP') {
          newHelpNotifiedTo = getDepartmentManager(existing.department_id || 'IT_DIGITAL');

          // High #5: Push notification to Department Head / Manager
          try {
            const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            await db.prepare(`
              INSERT INTO sys_notifications (id, target_role, title, message, type, link, created_at)
              VALUES (?, 'TRUONG_PHONG', ?, ?, 'WARNING', '/work/tasks', CURRENT_TIMESTAMP)
            `).bind(
              notifId,
              `â ï¸ YĂªu cáº§u trá»£ giĂºp cĂ´ng viá»‡c: ${existing.code || existing.title}`,
              `NhĂ¢n viĂªn ${session.name} vá»«a bĂ¡o cáº§n há»— trá»£ cho cĂ´ng viá»‡c "${existing.title}". LĂ½ do: ${newHelpReason || 'Cáº§n TrÆ°á»Ÿng phĂ²ng tÆ° váº¥n'}`
            ).run().catch(() => {});
          } catch (e) {}
        }

        let newProgress = progress !== undefined ? progress : existing.progress;
        let checklistArr = (() => {
          if (Array.isArray(existing.checklist)) return existing.checklist;
          if (typeof existing.checklist === 'string' && existing.checklist.trim()) {
            try {
              let parsed = JSON.parse(existing.checklist);
              if (typeof parsed === 'string') parsed = JSON.parse(parsed);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          }
          return [];
        })();

        if (body.checklist !== undefined && Array.isArray(body.checklist)) {
          checklistArr = body.checklist;
          const doneCount = checklistArr.filter((c: any) => c.completed).length;
          newProgress = checklistArr.length > 0 ? Math.round((doneCount / checklistArr.length) * 100) : newProgress;
        } else if (checklistId !== undefined) {
          checklistArr = checklistArr.map((c: any) => c.id === checklistId ? { ...c, completed: Boolean(completed) } : c);
          const doneCount = checklistArr.filter((c: any) => c.completed).length;
          newProgress = checklistArr.length > 0 ? Math.round((doneCount / checklistArr.length) * 100) : newProgress;
        }

        let attachmentsArr = (() => {
          if (Array.isArray(existing.attachments)) return existing.attachments;
          if (typeof existing.attachments === 'string' && existing.attachments.trim()) {
            try {
              let parsed = JSON.parse(existing.attachments);
              if (typeof parsed === 'string') parsed = JSON.parse(parsed);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          }
          return [];
        })();

        if (body.attachments !== undefined && Array.isArray(body.attachments)) {
          attachmentsArr = body.attachments;
        }

        if (newStatus === 'DONE') {
          newProgress = 100;
        }

        await db.prepare(`
          UPDATE sys_my_tasks
          SET status = ?, result_description = ?, help_reason = ?, help_notified_to = ?, progress = ?, checklist = ?, attachments = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(newStatus, newResult, newHelpReason || '', newHelpNotifiedTo || '', newProgress, JSON.stringify(checklistArr), JSON.stringify(attachmentsArr), taskId).run().catch(() => {});

        return NextResponse.json({
          success: true,
          message: 'ÄĂ£ cáº­p nháº­t cĂ´ng viá»‡c',
          help_notified_to: newHelpNotifiedTo,
        });
      }
    }

    // In-memory update
    let notifiedManager = '';
    inMemoryTasks = inMemoryTasks.map((t) => {
      if (t.id === taskId) {
        let updatedStatus = status !== undefined ? status : t.status;
        let updatedResult = resultDescription !== undefined ? resultDescription : t.result_description;
        let updatedHelpReason = helpReason !== undefined ? helpReason : (t as any).help_reason;
        let updatedHelpNotifiedTo = (t as any).help_notified_to;
        let updatedAttachments = body.attachments !== undefined && Array.isArray(body.attachments) ? body.attachments : ((t as any).attachments || []);

        if (updatedStatus === 'NEED_HELP') {
          updatedHelpNotifiedTo = getDepartmentManager(t.department_id || 'IT_DIGITAL');
          notifiedManager = updatedHelpNotifiedTo;
        }

        let updatedProgress = progress !== undefined ? progress : t.progress;
        let updatedChecklist = [...t.checklist];

        if (checklistId !== undefined) {
          updatedChecklist = updatedChecklist.map((c) => c.id === checklistId ? { ...c, completed: Boolean(completed) } : c);
          const doneCount = updatedChecklist.filter((c) => c.completed).length;
          updatedProgress = updatedChecklist.length > 0 ? Math.round((doneCount / updatedChecklist.length) * 100) : updatedProgress;
        }

        if (updatedStatus === 'DONE') {
          updatedProgress = 100;
        }

        return {
          ...t,
          status: updatedStatus as any,
          result_description: updatedResult,
          help_reason: updatedHelpReason,
          help_notified_to: updatedHelpNotifiedTo,
          progress: updatedProgress,
          checklist: updatedChecklist,
          attachments: updatedAttachments,
        };
      }
      return t;
    });

    return NextResponse.json({
      success: true,
      message: 'ÄĂ£ cáº­p nháº­t cĂ´ng viá»‡c thĂ nh cĂ´ng',
      help_notified_to: notifiedManager,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ success: false, error: 'taskId lĂ  báº¯t buá»™c' }, { status: 400 });
    }

    // Google Drive Backup & Audit Log Trigger for Delete action
    logAudit(request, {
      empCode: session?.empCode || '202608001',
      empName: session?.name || 'Admin',
      module: 'TASKS',
      action: 'DELETE_TASK',
      targetId: taskId,
      changesJson: { taskId },
    }).catch(() => {});

    syncBackupToDrive('TASKS', { taskId, deletedBy: session?.empCode || '202608001' }, 'DELETE_TASK').catch(() => {});

    const db = getDbBinding();
    if (db) {
      await ensureTable(db);
      await db.prepare(`DELETE FROM sys_my_tasks WHERE id = ?`).bind(taskId).run().catch(() => {});
    }

    inMemoryTasks = inMemoryTasks.filter((t) => t.id !== taskId);

    return NextResponse.json({
      success: true,
      message: 'ÄĂ£ xĂ³a cĂ´ng viá»‡c thĂ nh cĂ´ng',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

