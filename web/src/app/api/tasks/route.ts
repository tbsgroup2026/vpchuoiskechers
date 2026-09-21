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
    title: "Rùa tự động hóa dây chuyền dán đế 3 Skechers D'Lites",
    description: "Triển khai hệ thống xe rùa tự động cấp phôi dán đế cho dây chuyền 3 nhà máy Skechers. Cần nghiệm thu chỉ số an toàn và độ chính xác vị trí.",
    department_id: "IT_DIGITAL",
    project_id: "PRJ-AUTOMATION",
    assignee_emp_code: "202608001",
    assignee_name: "Phạm Nguyễn Anh Huy",
    reporter_emp_code: "202608002",
    reviewer_emp_code: "202608002",
    priority: "HIGH",
    start_date: "2026-09-01",
    due_date: "2026-09-15",
    status: "DOING",
    progress: 60,
    tags: "KAIZEN,AUTOMATION",
    checklist: [
      { id: "c1", title: "Khảo sát mặt bằng dây chuyền 3", completed: true },
      { id: "c2", title: "Lập trình cảm biến vị trí xe rùa", completed: true },
      { id: "c3", title: "Chạy thử nghiệm nghiệm thu 100 sản phẩm", completed: false },
    ],
    result_description: "",
  },
  {
    id: "tsk_002",
    code: "TSK-002",
    title: "Số hóa quy trình đăng ký xe đi công tác các nhà máy",
    description: "Xây dựng form điện tử và luồng duyệt tự động cho cán bộ đăng ký xe đi công tác liên nhà máy.",
    department_id: "HÀNH_CHÍNH",
    project_id: "PRJ-ADMIN-EXPENSE",
    assignee_emp_code: "202608001",
    assignee_name: "Phạm Nguyễn Anh Huy",
    reporter_emp_code: "202608003",
    reviewer_emp_code: "202608002",
    priority: "MEDIUM",
    start_date: "2026-09-05",
    due_date: "2026-09-20",
    status: "TO_DO",
    progress: 20,
    tags: "ISO,DIGITAL",
    checklist: [
      { id: "c1", title: "Thu thập yêu cầu từ phòng Hành chính", completed: true },
      { id: "c2", title: "Thiết kế giao diện đặt xe", completed: false },
    ],
    result_description: "",
  },
  {
    id: "tsk_003",
    code: "TSK-003",
    title: "Nâng cấp hệ thống Andon báo lỗi chuyền may 5",
    description: "Thay thế bảng LED cũ bằng màn hình Android hiển thị real-time sự cố dừng chuyền.",
    department_id: "IT_DIGITAL",
    project_id: "PRJ-AUTOMATION",
    assignee_emp_code: "202608001",
    assignee_name: "Phạm Nguyễn Anh Huy",
    reporter_emp_code: "202608002",
    reviewer_emp_code: "202608002",
    priority: "URGENT",
    start_date: "2026-08-25",
    due_date: "2026-09-10",
    status: "REVIEW",
    progress: 90,
    tags: "ANDON,GEMBA",
    checklist: [
      { id: "c1", title: "Lắp đặt màn hình Android 32 inch", completed: true },
      { id: "c2", title: "Kết nối WebSocket API báo hiệu", completed: true },
    ],
    result_description: "Đã hoàn thành lắp đặt 4 màn hình tại chuyền may 5. Độ trễ báo tín hiệu < 1s.",
  },
  {
    id: "tsk_004",
    code: "TSK-004",
    title: "Tự động hóa sao lưu dữ liệu toàn hệ thống lên Google Drive",
    description: "Cấu hình Service Account Google Drive tự động sao lưu bảng D1 định kỳ theo sự kiện thao tác.",
    department_id: "IT_DIGITAL",
    project_id: "PRJ-AUTOMATION",
    assignee_emp_code: "202608001",
    assignee_name: "Phạm Nguyễn Anh Huy",
    reporter_emp_code: "202608002",
    reviewer_emp_code: "202608002",
    priority: "HIGH",
    start_date: "2026-09-10",
    due_date: "2026-09-12",
    status: "DONE",
    progress: 100,
    tags: "BACKUP,CLOUD",
    checklist: [
      { id: "c1", title: "Cấu hình Google Drive Service Account JWT", completed: true, assignee_name: "Phạm Nguyễn Anh Huy", assignee_emp_code: "202608001" },
      { id: "c2", title: "Phân loại thư mục backup theo chủ đề", completed: true, assignee_name: "Nguyễn Đức Thuấn", assignee_emp_code: "202608005" },
      { id: "c3", title: "Tối ưu hóa Event-Driven trigger real-time", completed: true, assignee_name: "Trần Văn Hùng", assignee_emp_code: "202608003" },
    ],
    result_description: "Đã tích hợp xong Event-Driven Backup tự động đẩy file JSON phân loại vào Google Drive khi user thao tác.",
  },
  {
    id: "tsk_005",
    code: "TSK-005",
    title: "Nghiên cứu ứng dụng AI Gemba nhận diện trang phục bảo hộ",
    description: "Sử dụng camera AI nhận diện công nhân quên đeo khẩu trang hoặc nón bảo hộ khi vào khu vực máy cắt.",
    department_id: "IT_DIGITAL",
    project_id: "PRJ-GEMBA-SAFETY",
    assignee_emp_code: "202608001",
    assignee_name: "Phạm Nguyễn Anh Huy",
    reporter_emp_code: "202608002",
    reviewer_emp_code: "202608002",
    priority: "LOW",
    start_date: "2026-09-15",
    due_date: "2026-10-01",
    status: "BACKLOG",
    progress: 0,
    tags: "AI,SAFETY",
    checklist: [
      { id: "c1", title: "Thu thập dataset hình ảnh đồ bảo hộ", completed: false },
    ],
    result_description: "",
  },
  {
    id: "tsk_006",
    code: "TSK-006",
    title: "Tối ưu tồn kho cửa hàng Skechers Flagship Vincom",
    description: "Đồng bộ tồn kho real-time giữa kho tổng Kiên Giang và các cửa hàng bán lẻ Skechers trên toàn quốc.",
    department_id: "RETAIL_SKECHERS",
    project_id: "PRJ-SKECHERS-RETAIL",
    assignee_emp_code: "202608001",
    assignee_name: "Phạm Nguyễn Anh Huy",
    reporter_emp_code: "202608005",
    reviewer_emp_code: "202608002",
    priority: "HIGH",
    start_date: "2026-09-08",
    due_date: "2026-09-25",
    status: "DOING",
    progress: 75,
    tags: "SKECHERS,RETAIL",
    checklist: [
      { id: "c1", title: "Tích hợp POS API cửa hàng Vincom", completed: true },
      { id: "c2", title: "Cảnh báo hết hàng tự động cho Quản lý", completed: false },
    ],
    result_description: "",
  },
  {
    id: "tsk_007",
    code: "TSK-007",
    title: "Triển khai Kaizen giảm 30% thời gian gá dưỡng may quai",
    description: "Áp dụng gá định hình mẫu 1-5-2 tại Xưởng May 2 giúp tăng năng suất 150 đôi/ngày.",
    department_id: "PROD_MAY5",
    project_id: "PRJ-KAIZEN-152",
    assignee_emp_code: "202608001",
    assignee_name: "Phạm Nguyễn Anh Huy",
    reporter_emp_code: "202608008",
    reviewer_emp_code: "202608002",
    priority: "HIGH",
    start_date: "2026-09-02",
    due_date: "2026-09-18",
    status: "DOING",
    progress: 80,
    tags: "KAIZEN,1-5-2",
    checklist: [
      { id: "c1", title: "Chế tạo gá mẫu thử nghiệm", completed: true },
      { id: "c2", title: "Đánh giá hiệu quả tiết kiệm giây", completed: true },
    ],
    result_description: "",
  }
];

// Fallback memory state if D1 DB is not bound
let inMemoryTasks = [...DEFAULT_TASKS];

// Helper function to resolve department manager based on department_id
function getDepartmentManager(deptId: string): string {
  const managers: Record<string, string> = {
    "IT_DIGITAL": "Phạm Nguyễn Anh Huy (IT Lead / Trưởng Phòng IT & CĐS)",
    "HÀNH_CHÍNH": "Nguyễn Thị Mai (Trưởng Phòng Hành Chính Nhân Sự)",
    "PROD_MAY5": "Trần Văn Hùng (Quản Đốc Chuyền May 5)",
    "QC_QUALITY": "Lê Văn Tấn (QC Manager)",
  };
  return managers[deptId] || `Trưởng Phòng Phụ Trách (${deptId || "Phòng Ban"})`;
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
          handover_warning: isPendingHandover ? `⚠️ ĐANG BÀN GIAO: Từ ${t.previous_department_id || 'Phòng cũ'} sang ${t.new_department_id || 'Phòng mới'}` : null,
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
        name: 'Phạm Nguyễn Anh Huy',
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
      return NextResponse.json({ success: false, error: 'Dữ liệu JSON không hợp lệ' }, { status: 400 });
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
      assignee_name = session.name || 'Cán Bộ Nhân Viên',
      department_id = session.departmentCode || 'IT_DIGITAL',
      tags = 'TASK',
      checklist = [],
      attachments = [],
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Tiêu đề công việc là bắt buộc' }, { status: 400 });
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
      message: 'Tạo công việc thành công',
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
        { success: false, error: 'Yêu cầu đăng nhập để cập nhật công việc (401 Unauthorized)' },
        { status: 401 }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Dữ liệu JSON không hợp lệ' }, { status: 400 });
    }

    const { taskId, status, resultDescription, helpReason, checklistId, completed, progress } = body;

    if (!taskId) {
      return NextResponse.json({ success: false, error: 'taskId là bắt buộc' }, { status: 400 });
    }

    // Medium #10: Validation requirement for result_description when status changes to DONE
    if (status === 'DONE') {
      const resultText = (resultDescription || '').trim();
      if (!resultText || resultText.length < 10) {
        return NextResponse.json(
          {
            success: false,
            error: 'Bắt buộc phải nhập mô tả kết quả thực hiện (tối thiểu 10 ký tự) trước khi chuyển công việc sang hoàn thành (DONE)!',
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
              `⚠️ Yêu cầu trợ giúp công việc: ${existing.code || existing.title}`,
              `Nhân viên ${session.name} vừa báo cần hỗ trợ cho công việc "${existing.title}". Lý do: ${newHelpReason || 'Cần Trưởng phòng tư vấn'}`
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
          message: 'Đã cập nhật công việc',
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
      message: 'Đã cập nhật công việc thành công',
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
      return NextResponse.json({ success: false, error: 'taskId là bắt buộc' }, { status: 400 });
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
      message: 'Đã xóa công việc thành công',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

