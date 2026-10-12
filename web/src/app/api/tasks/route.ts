import { NextResponse } from 'next/server';
import { verifyToken, getAuthUser } from '@/lib/auth';
import { requireAuth } from '@/lib/require-auth';
import { logAudit } from '@/lib/auditLogger';
import { syncBackupToDrive } from '@/lib/driveBackup';
import { updateTaskAtomically, deleteTaskAtomically } from '@/lib/services/taskCardUpdater';
import { checkSelfApproval } from '@/lib/taskPermissions';

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
    status: "TO_DO",
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

let inMemoryTasks = [...DEFAULT_TASKS];

function getDepartmentManager(deptId: string): string {
  const managers: Record<string, string> = {
    "IT_DIGITAL": "Phạm Nguyễn Anh Huy (IT Lead / Trưởng Phòng IT & CĐS)",
    "HÀNH_CHÍNH": "Nguyễn Thị Mai (Trưởng Phòng Hành Chính Nhân Sự)",
    "PROD_MAY5": "Trần Văn Hùng (Quản Đốc Chuyền May 5)",
    "QC_QUALITY": "Lê Văn Tấn (QC Manager)",
  };
  return managers[deptId] || `Trưởng Phòng Phụ Trách (${deptId || "Phòng Ban"})`;
}

function parseJsonField(val: any) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim()) {
    try {
      let parsed = JSON.parse(val);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function buildTaskScopeWhereClause(session: any, url: string) {
  const params: any[] = [];
  const clauses: string[] = ["status != 'DELETED'"]; // Basic filter
  
  if (session) {
    const roleLevel = session.roleLevel || 4;
    const roleCode = (session.roleCode || '').toUpperCase();
    
    // Level 1: BGĐ / Admin (Sees everything)
    const isAdmin = roleLevel === 1 || roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN';
    
    // Level 2: Trưởng phòng (Sees their own dept tasks + assigned)
    const isTP = !isAdmin && (roleLevel === 2 || roleCode === 'TRUONG_PHONG' || roleCode === 'TP');
    
    const userDept = session.departmentCode || session.department || '';
    const userEmp = session.empCode;

    if (!isAdmin && userEmp) {
      if (isTP) {
        // Trưởng phòng can see their whole department OR tasks they are part of
        clauses.push(`(department_id = ? OR assignee_emp_code = ? OR reporter_emp_code = ?)`);
        params.push(userDept, userEmp, userEmp);
      } else {
        // Level 3+: Staff (Only sees tasks they are assigned/reported)
        clauses.push(`(assignee_emp_code = ? OR reporter_emp_code = ?)`);
        params.push(userEmp, userEmp);
      }
    }
  }

  const { searchParams } = new URL(url);
  const status = searchParams.get('status');
  if (status) {
    clauses.push(`status = ?`);
    params.push(status);
  }

  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  return { whereSql, params };
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie') || '';
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    
    if (!pageParam && !limitParam && !searchParams.has('taskId') && !searchParams.has('export')) {
       return NextResponse.json({ success: false, error: 'Thiếu tham số page và limit' }, { status: 400 });
    }

    let token = authHeader?.replace('Bearer ', '');
    if (!token) {
      const match = cookieHeader.match(/tbs_token=([^;]+)/);
      if (match && match[1]) {
        token = match[1];
      }
    }

    const session = token ? await verifyToken(token) : null;
    const db = getDbBinding();
    const tasksSource = (process.env as any).TASKS_SOURCE || 'V2';

    // If TASKS_SOURCE === 'V2' (default), query from unified `tasks` table
    if (db && tasksSource !== 'legacy') {
      try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.max(1, Math.min(1000, parseInt(searchParams.get('limit') || '50', 10)));
        const offset = (page - 1) * limit;

        const { whereSql, params } = buildTaskScopeWhereClause(session, request.url);
        
        // Fix N+1: query total count and page tasks in one go
        const countQuery = `SELECT COUNT(*) as total FROM tasks ${whereSql}`;
        const totalResult: any = await db.prepare(countQuery).bind(...params).first().catch(() => ({ total: 0 }));
        const total = totalResult?.total || 0;

        const query = `SELECT * FROM tasks ${whereSql} ORDER BY updated_at DESC, created_at DESC, id DESC LIMIT ? OFFSET ?`;
        const { results } = await db.prepare(query).bind(...params, limit, offset).all();

        if (results) {
          const tasks = results.map((r: any) => ({
            ...r,
            checklist: parseJsonField(r.checklist),
            attachments: parseJsonField(r.attachments),
            is_pending_handover: r.handover_status === 'PENDING_HANDOVER',
            handover_warning: r.handover_status === 'PENDING_HANDOVER'
              ? `⚠️ ĐANG BÀN GIAO: Từ ${r.previous_department_id || 'Phòng cũ'} sang ${r.new_department_id || 'Phòng mới'}`
              : null,
          }));

          return NextResponse.json({
            success: true,
            tasks,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            source: 'V2_tasks_table',
          });
        }
      } catch (err) {
        console.warn('Fallback to legacy query due to V2 error:', err);
      }
    }

    // Fallback or Legacy mode: read from sys_my_tasks
    let allTasks: any[] = [];
    if (db) {
      const { results } = await db.prepare(`SELECT * FROM sys_my_tasks ORDER BY created_at DESC`).all().catch(() => ({ results: [] }));
      if (results && results.length > 0) {
        allTasks = results.map((r: any) => ({
          ...r,
          checklist: parseJsonField(r.checklist),
          attachments: parseJsonField(r.attachments),
        }));
      }
    }

    if (allTasks.length === 0) {
      allTasks = [...inMemoryTasks];
    }

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
      source: 'V1_sys_my_tasks',
    });
  } catch (error: any) {
    return NextResponse.json({ success: true, tasks: inMemoryTasks, source: 'in_memory' });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;
    const session = auth.session;

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
      scope = 'DEPARTMENT',
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

    const taskId = id || `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const taskCode = code || `TSK-${Math.floor(100 + Math.random() * 900)}`;
    const startDate = new Date().toISOString().substring(0, 10);
    const dueDate = due_date || new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10);

    const newTask = {
      id: taskId,
      code: taskCode,
      title: title.trim(),
      description: description.trim(),
      scope: scope || (project_id ? 'CROSS_DEPT' : 'DEPARTMENT'),
      department_id: department_id || 'IT_DIGITAL',
      project_id: project_id || null,
      assignee_emp_code: assignee_emp_code || session.empCode,
      assignee_name: assignee_name || session.name,
      reporter_emp_code: session.empCode,
      reviewer_emp_code: session.empCode,
      priority: priority,
      start_date: startDate,
      due_date: dueDate,
      status: 'TO_DO',
      progress: 0,
      tags: tags || 'TASK',
      checklist: Array.isArray(checklist) ? checklist : [],
      attachments: Array.isArray(attachments) ? attachments : [],
      result_description: '',
      handover_status: 'NONE',
    };

    const db = getDbBinding();
    const tasksSource = (process.env as any).TASKS_SOURCE || 'V2';

    if (db && tasksSource !== 'legacy') {
      try {
        await db.prepare(`
          INSERT INTO tasks (
            id, code, title, description, scope, department_id, project_id,
            assignee_emp_code, assignee_name, reporter_emp_code, reviewer_emp_code,
            priority, start_date, due_date, status, progress, tags, checklist, attachments,
            result_description, handover_status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'TO_DO', 0, ?, ?, ?, '', 'NONE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(
          newTask.id, newTask.code, newTask.title, newTask.description, newTask.scope,
          newTask.department_id, newTask.project_id, newTask.assignee_emp_code, newTask.assignee_name,
          newTask.reporter_emp_code, newTask.reviewer_emp_code, newTask.priority,
          newTask.start_date, newTask.due_date, newTask.tags,
          JSON.stringify(newTask.checklist), JSON.stringify(newTask.attachments)
        ).run();

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
          message: 'Tạo công việc thành công (bảng tasks)',
          task: newTask,
        });
      } catch (err) {
        console.warn('Failed insert into tasks table, trying sys_my_tasks:', err);
      }
    }

    // Fallback insert to sys_my_tasks
    if (db) {
      try {
        await db.prepare(`
          INSERT INTO sys_my_tasks (
            id, code, title, description, department_id, project_id, assignee_emp_code, assignee_name,
            reporter_emp_code, priority, start_date, due_date, status, progress, tags, checklist, attachments, result_description, handover_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'TO_DO', 0, ?, ?, ?, '', 'NONE')
        `).bind(
          newTask.id, newTask.code, newTask.title, newTask.description, newTask.department_id, newTask.project_id,
          newTask.assignee_emp_code, newTask.assignee_name, newTask.reporter_emp_code,
          newTask.priority, newTask.start_date, newTask.due_date, newTask.tags,
          JSON.stringify(newTask.checklist), JSON.stringify(newTask.attachments)
        ).run();
      } catch {}
    } else {
      inMemoryTasks = [newTask as any, ...inMemoryTasks];
    }

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

    const { taskId, status, resultDescription, helpReason, checklistId, completed, progress, version } = body;

    if (version === undefined || typeof version !== 'number') {
      return NextResponse.json({ success: false, error: 'Thiếu hoặc sai kiểu dữ liệu phiên bản (version)' }, { status: 428 });
    }

    if (!taskId) {
      return NextResponse.json({ success: false, error: 'taskId là bắt buộc' }, { status: 400 });
    }

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

    const db = getDbBinding();
    const tasksSource = (process.env as any).TASKS_SOURCE || 'V2';

    if (db && tasksSource !== 'legacy') {
      try {
        const existing: any = await db.prepare(`SELECT * FROM tasks WHERE id = ?`).bind(taskId).first();
        if (existing) {
          let newStatus = status !== undefined ? status : existing.status;
          let newResult = resultDescription !== undefined ? resultDescription : existing.result_description;
          let newHelpReason = helpReason !== undefined ? helpReason : existing.help_reason;
          let newHelpNotifiedTo = existing.help_notified_to;

          // Block self-approval for tasks using common service
          const checkApproval = checkSelfApproval(session.empCode, existing, newStatus);
          if (!checkApproval.allowed) {
               return NextResponse.json({ success: false, error: checkApproval.error }, { status: 403 });
          }

          if (newStatus === 'NEED_HELP') {
            newHelpNotifiedTo = getDepartmentManager(existing.department_id || 'IT_DIGITAL');
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
          let checklistArr = parseJsonField(existing.checklist);

          if (body.checklist !== undefined && Array.isArray(body.checklist)) {
            checklistArr = body.checklist;
            const doneCount = checklistArr.filter((c: any) => c.completed).length;
            newProgress = checklistArr.length > 0 ? Math.round((doneCount / checklistArr.length) * 100) : newProgress;
          } else if (checklistId !== undefined) {
            checklistArr = checklistArr.map((c: any) => c.id === checklistId ? { ...c, completed: Boolean(completed) } : c);
            const doneCount = checklistArr.filter((c: any) => c.completed).length;
            newProgress = checklistArr.length > 0 ? Math.round((doneCount / checklistArr.length) * 100) : newProgress;
          }

          let attachmentsArr = parseJsonField(existing.attachments);
          if (body.attachments !== undefined && Array.isArray(body.attachments)) {
            attachmentsArr = body.attachments;
          }

          if (newStatus === 'DONE') {
            newProgress = 100;
          }

          const updates = {
            tasksSet: `status = ?, result_description = ?, help_reason = ?, help_notified_to = ?, progress = ?, checklist = ?, attachments = ?, updated_at = CURRENT_TIMESTAMP`,
            tasksParams: [newStatus, newResult, newHelpReason || '', newHelpNotifiedTo || '', newProgress, JSON.stringify(checklistArr), JSON.stringify(attachmentsArr)]
          };

          const updateResult = await updateTaskAtomically(db, { empCode: session.empCode } as any, taskId, version, updates, 'tasks');

          if (updateResult.type === 'NOT_FOUND') {
            return NextResponse.json({ success: false, error: updateResult.error }, { status: 404 });
          }
          if (updateResult.type === 'FORBIDDEN') {
            return NextResponse.json({ success: false, error: updateResult.error }, { status: 403 });
          }
          if (updateResult.type === 'SYNC_ERROR') {
            return NextResponse.json({ success: false, error: updateResult.error }, { status: 500 });
          }
          if (updateResult.type === 'CONFLICT') {
            return NextResponse.json(
              {
                success: false,
                error: 'CONFLICT',
                message: updateResult.error,
                currentTask: updateResult.latestCard,
              },
              { status: 409 }
            );
          }

          return NextResponse.json({
            success: true,
            message: 'Đã cập nhật công việc (bảng tasks)',
            help_notified_to: newHelpNotifiedTo,
            version: updateResult.newVersion
          });
        }
      } catch (err) {
        console.warn('Failed update in tasks table, trying sys_my_tasks:', err);
      }
    }

    // Fallback update sys_my_tasks
    if (db) {
      const existing: any = await db.prepare(`SELECT * FROM sys_my_tasks WHERE id = ?`).bind(taskId).first().catch(() => null);

      if (existing) {
        let newStatus = status !== undefined ? status : existing.status;
        let newResult = resultDescription !== undefined ? resultDescription : existing.result_description;
        let newHelpReason = helpReason !== undefined ? helpReason : existing.help_reason;
        let newHelpNotifiedTo = existing.help_notified_to;

        if (newStatus === 'NEED_HELP') {
          newHelpNotifiedTo = getDepartmentManager(existing.department_id || 'IT_DIGITAL');
        }

        let newProgress = progress !== undefined ? progress : existing.progress;
        let checklistArr = parseJsonField(existing.checklist);

        if (body.checklist !== undefined && Array.isArray(body.checklist)) {
          checklistArr = body.checklist;
          const doneCount = checklistArr.filter((c: any) => c.completed).length;
          newProgress = checklistArr.length > 0 ? Math.round((doneCount / checklistArr.length) * 100) : newProgress;
        } else if (checklistId !== undefined) {
          checklistArr = checklistArr.map((c: any) => c.id === checklistId ? { ...c, completed: Boolean(completed) } : c);
          const doneCount = checklistArr.filter((c: any) => c.completed).length;
          newProgress = checklistArr.length > 0 ? Math.round((doneCount / checklistArr.length) * 100) : newProgress;
        }

        let attachmentsArr = parseJsonField(existing.attachments);
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

    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật công việc',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;
    const session = auth.session;

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const versionStr = searchParams.get('version');
    const version = versionStr ? Number(versionStr) : undefined;

    if (!taskId) {
      return NextResponse.json({ success: false, error: 'taskId là bắt buộc' }, { status: 400 });
    }

    if (version === undefined || isNaN(version)) {
      return NextResponse.json({ success: false, error: 'Thiếu hoặc sai kiểu dữ liệu phiên bản (version)' }, { status: 428 });
    }

    const db = getDbBinding();
    if (db) {
      // Kiểm tra quyền xóa: chỉ người tạo (reporter_emp_code / created_by) hoặc cấp quản lý (roleLevel <= 2)
      const task = await db
        .prepare('SELECT reporter_emp_code, assignee_emp_code FROM tasks WHERE id = ?')
        .bind(taskId)
        .first<{ reporter_emp_code?: string; assignee_emp_code?: string }>()
        .catch(() => null);

      const tc = !task ? await db
        .prepare('SELECT created_by, assignee_id FROM task_cards WHERE id = ?')
        .bind(taskId)
        .first<{ created_by?: string; assignee_id?: string }>()
        .catch(() => null) : null;

      if (!task && !tc) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy công việc' }, { status: 404 });
      }

      const taskOwner = task?.reporter_emp_code || tc?.created_by;
      const isOwner = taskOwner === session.empCode;
      const isManager = (session.roleLevel ?? 99) <= 2;
      if (!isOwner && !isManager) {
        return NextResponse.json({ success: false, error: 'Bạn không có quyền xóa công việc này' }, { status: 403 });
      }

      logAudit(request, {
        empCode: session.empCode,
        empName: session.name || 'Người dùng',
        module: 'TASKS',
        action: 'DELETE_TASK',
        targetId: taskId,
        changesJson: { taskId },
      }).catch(() => {});

      syncBackupToDrive('TASKS', { taskId, deletedBy: session.empCode }, 'DELETE_TASK').catch(() => {});

      const deleteResult = await deleteTaskAtomically(db, session as any, taskId, version, 'tasks');
      
      if (deleteResult.type === 'NOT_FOUND') {
        return NextResponse.json({ success: false, error: deleteResult.error }, { status: 404 });
      }
      if (deleteResult.type === 'FORBIDDEN') {
        return NextResponse.json({ success: false, error: deleteResult.error }, { status: 403 });
      }
      if (deleteResult.type === 'SYNC_ERROR') {
        return NextResponse.json({ success: false, error: deleteResult.error }, { status: 500 });
      }
      if (deleteResult.type === 'CONFLICT') {
        return NextResponse.json({ success: false, error: deleteResult.error, currentTask: deleteResult.latestCard }, { status: 409 });
      }

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
