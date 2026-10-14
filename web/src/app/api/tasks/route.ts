import { NextResponse } from 'next/server';
import { verifyToken, getAuthUser, isAdminUser, isDepartmentHead, isExecutiveOrAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/auditLogger';
import { syncBackupToDrive } from '@/lib/driveBackup';
import { dispatchNotification } from '@/lib/serverNotificationService';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
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
        reject_reason TEXT,
        history_log TEXT,
        attachments TEXT,
        is_test_data INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    // Ensure columns in case table was created with older schema
    const migrations = [
      'ALTER TABLE sys_my_tasks ADD COLUMN project_id TEXT',
      'ALTER TABLE sys_my_tasks ADD COLUMN help_reason TEXT',
      'ALTER TABLE sys_my_tasks ADD COLUMN help_notified_to TEXT',
      'ALTER TABLE sys_my_tasks ADD COLUMN handover_status TEXT',
      'ALTER TABLE sys_my_tasks ADD COLUMN previous_department_id TEXT',
      'ALTER TABLE sys_my_tasks ADD COLUMN new_department_id TEXT',
      'ALTER TABLE sys_my_tasks ADD COLUMN reject_reason TEXT',
      'ALTER TABLE sys_my_tasks ADD COLUMN history_log TEXT',
      'ALTER TABLE sys_my_tasks ADD COLUMN attachments TEXT',
      'ALTER TABLE sys_my_tasks ADD COLUMN is_test_data INTEGER DEFAULT 0',
      'ALTER TABLE sys_my_tasks ADD COLUMN parent_task_id TEXT',
      'ALTER TABLE sys_my_tasks ADD COLUMN blocked_by_task_id TEXT',
      'ALTER TABLE sys_my_tasks ADD COLUMN assignee_department TEXT',
    ];

    for (const sql of migrations) {
      await db.prepare(sql).run().catch(() => {});
    }

    isTableEnsured = true;
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

    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Không thể kết nối cơ sở dữ liệu D1 (DB binding missing). Tuyệt đối không dùng bộ nhớ tạm.' },
        { status: 500 }
      );
    }

    await ensureTable(db);

    const { searchParams } = new URL(request.url);
    const filterScope = (searchParams.get('scope') || 'MY_ONLY').toUpperCase();
    const requestedDept = searchParams.get('department_id') || searchParams.get('dept');
    const requestedAssignee = searchParams.get('assignee_emp_code') || searchParams.get('empCode');
    const requestedProject = searchParams.get('project_id') || searchParams.get('project');

    let allTasks: any[] = [];
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
        history_log: (() => {
          if (Array.isArray(r.history_log)) return r.history_log;
          if (typeof r.history_log === 'string' && r.history_log.trim()) {
            try {
              let parsed = JSON.parse(r.history_log);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          }
          return [];
        })(),
        parent_task_id: r.parent_task_id || null,
        blocked_by_task_id: r.blocked_by_task_id || null,
        assignee_department: r.assignee_department || '',
      }));

      // Map dependencies to detect if task is blocked
      const taskLookup = new Map<string, any>();
      allTasks.forEach((t) => {
        taskLookup.set(t.id, t);
        if (t.code) taskLookup.set(t.code, t);
      });

      allTasks = allTasks.map((t) => {
        let isBlocked = false;
        let blockedByInfo = null;
        if (t.blocked_by_task_id) {
          const pred = taskLookup.get(t.blocked_by_task_id);
          if (pred && pred.status !== 'DONE') {
            isBlocked = true;
            blockedByInfo = { id: pred.id, code: pred.code, title: pred.title, status: pred.status };
          }
        }
        return {
          ...t,
          is_blocked: isBlocked,
          blocked_by: blockedByInfo,
        };
      });
    }

    // Role-based visibility scoping
    if (session) {
      const roleLevel = session.roleLevel || 4;
      const roleCode = (session.roleCode || '').toUpperCase();
      const isAdmin = roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN' || roleLevel === 1;
      const isExec = isAdmin || roleLevel <= 2;
      const isTP = !isExec && (roleCode === 'TRUONG_PHONG' || roleCode === 'TP' || roleCode === 'QUAN_DOC' || roleLevel === 3);
      const userDept = String(session.departmentCode || session.department || '').toUpperCase();
      const userEmp = session.empCode;

      allTasks = allTasks.map((t: any) => {
        const isPendingHandover = t.handover_status === 'PENDING_HANDOVER';
        return {
          ...t,
          is_pending_handover: isPendingHandover,
          handover_warning: isPendingHandover
            ? `⚠️ ĐANG BÀN GIAO: Từ ${t.previous_department_id || 'Phòng cũ'} sang ${t.new_department_id || 'Phòng mới'}`
            : null,
        };
      });

      if (!isExec && userEmp) {
        if (filterScope === 'MY_ONLY') {
          // Giai đoạn 3.1: Nhân viên chỉ thấy task mình được giao, mình tạo hoặc mình liên quan
          allTasks = allTasks.filter((t: any) => {
            const isAssignee = t.assignee_emp_code === userEmp;
            const isReporter = t.reporter_emp_code === userEmp;
            const isReviewer = t.reviewer_emp_code === userEmp;
            const isInChecklist = Array.isArray(t.checklist) && t.checklist.some((c: any) => c.assignee_emp_code === userEmp);
            return isAssignee || isReporter || isReviewer || isInChecklist;
          });
        } else if (filterScope === 'DEPT_ONLY' && isTP) {
          // Trưởng phòng xem toàn bộ task thuộc phòng ban mình + task thuộc dự án ngoài do nhân viên phòng mình phụ trách
          allTasks = allTasks.filter((t: any) => {
            const isOwnDept = userDept !== '' && t.department_id && String(t.department_id).toUpperCase().includes(userDept);
            const isHandoverOldDept = t.handover_status === 'PENDING_HANDOVER' && t.previous_department_id && String(t.previous_department_id).toUpperCase().includes(userDept);
            const isHandoverNewDept = t.handover_status === 'PENDING_HANDOVER' && t.new_department_id && String(t.new_department_id).toUpperCase().includes(userDept);
            const isExternalProjectTask = Boolean(t.project_id && t.assignee_department && String(t.assignee_department).toUpperCase().includes(userDept));
            return isOwnDept || isHandoverOldDept || isHandoverNewDept || isExternalProjectTask;
          });

          // Gắn nhãn hiển thị trực quan cho task thuộc dự án ngoài
          allTasks = allTasks.map((t: any) => {
            const isExternal = Boolean(t.project_id && t.department_id && !String(t.department_id).toUpperCase().includes(userDept));
            return {
              ...t,
              is_external_project_task: isExternal,
              external_project_label: isExternal ? `Dự án ngoài: ${t.project_id}` : null,
            };
          });
        }
      }
    }

    // Explicit query parameter filters
    if (requestedAssignee && requestedAssignee !== 'ALL') {
      allTasks = allTasks.filter((t: any) => t.assignee_emp_code === requestedAssignee || t.reporter_emp_code === requestedAssignee);
    }
    if (requestedDept && requestedDept !== 'ALL') {
      allTasks = allTasks.filter((t: any) => String(t.department_id || '').toUpperCase().includes(requestedDept.toUpperCase()));
    }
    if (requestedProject && requestedProject !== 'ALL') {
      allTasks = allTasks.filter((t: any) => String(t.project_id || '').toUpperCase() === requestedProject.toUpperCase());
    }

    let maxUpdatedAt = '';
    for (const t of allTasks) {
      if (t.updated_at && t.updated_at > maxUpdatedAt) {
        maxUpdatedAt = t.updated_at;
      }
    }

    const updatedSince = searchParams.get('updated_since') || request.headers.get('if-modified-since');
    if (updatedSince && maxUpdatedAt && maxUpdatedAt <= updatedSince) {
      return NextResponse.json({
        success: true,
        tasks: [],
        total: 0,
        notModified: true,
        latestUpdatedAt: maxUpdatedAt,
      });
    }

    return NextResponse.json({
      success: true,
      tasks: allTasks,
      total: allTasks.length,
      latestUpdatedAt: maxUpdatedAt || new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: `Lỗi truy vấn cơ sở dữ liệu D1: ${error?.message || error}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập để tạo công việc mới (401 Unauthorized)' },
        { status: 401 }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Dữ liệu JSON không hợp lệ' }, { status: 400 });
    }

    const title = (body.title || '').trim();
    if (!title) {
      return NextResponse.json({ success: false, error: 'Tiêu đề công việc là bắt buộc' }, { status: 400 });
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Không thể kết nối cơ sở dữ liệu D1. Tuyệt đối không lưu vào bộ nhớ tạm.' },
        { status: 500 }
      );
    }

    await ensureTable(db);

    const initialStatus = body.status || 'TO_DO';
    const taskId = `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const taskCode = body.code || `TSK-${Math.floor(100 + Math.random() * 900)}`;

    const initialHistory = [
      {
        action: 'CREATED',
        by: session.empCode,
        byName: session.name,
        at: new Date().toISOString(),
        status: initialStatus,
      },
    ];

    const newTask = {
      id: taskId,
      code: taskCode,
      title: title,
      description: (body.description || '').trim(),
      department_id: body.department_id || session.departmentCode || session.department || 'TBS',
      project_id: body.project_id || null,
      assignee_emp_code: body.assignee_emp_code || session.empCode,
      assignee_name: body.assignee_name || session.name,
      reporter_emp_code: session.empCode,
      reviewer_emp_code: body.reviewer_emp_code || null,
      priority: body.priority || 'MEDIUM',
      start_date: body.start_date || new Date().toISOString().substring(0, 10),
      due_date: body.due_date || new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
      status: initialStatus,
      progress: body.progress || 0,
      tags: body.tags || 'TASK',
      checklist: Array.isArray(body.checklist) ? body.checklist : [],
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      result_description: body.result_description || '',
      reject_reason: null,
      history_log: initialHistory,
      is_test_data: body.is_test_data ? 1 : 0,
      parent_task_id: body.parent_task_id || null,
      blocked_by_task_id: body.blocked_by_task_id || null,
      assignee_department: body.assignee_department || session.departmentCode || session.department || '',
    };

    await db.prepare(`
      INSERT INTO sys_my_tasks (
        id, code, title, description, department_id, project_id, assignee_emp_code, assignee_name,
        reporter_emp_code, reviewer_emp_code, priority, start_date, due_date, status, progress,
        tags, checklist, attachments, result_description, reject_reason, history_log, is_test_data, handover_status,
        parent_task_id, blocked_by_task_id, assignee_department
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NONE', ?, ?, ?)
    `).bind(
      newTask.id, newTask.code, newTask.title, newTask.description, newTask.department_id, newTask.project_id,
      newTask.assignee_emp_code, newTask.assignee_name, newTask.reporter_emp_code, newTask.reviewer_emp_code,
      newTask.priority, newTask.start_date, newTask.due_date, newTask.status, newTask.progress,
      newTask.tags, JSON.stringify(newTask.checklist), JSON.stringify(newTask.attachments),
      newTask.result_description, newTask.reject_reason, JSON.stringify(newTask.history_log), newTask.is_test_data,
      newTask.parent_task_id, newTask.blocked_by_task_id, newTask.assignee_department
    ).run();

    // Dispatch notification to Assignee across all enabled channels
    if (newTask.assignee_emp_code && newTask.assignee_emp_code !== session.empCode) {
      dispatchNotification(db, {
        recipientEmpCode: newTask.assignee_emp_code,
        recipientName: newTask.assignee_name,
        title: `Công việc mới: ${newTask.title}`,
        message: `${session.name} đã giao cho bạn công việc [${newTask.code}]. Hạn chót: ${newTask.due_date}`,
        eventType: 'TASK_ASSIGNED',
        type: 'TASK',
        link: `/work?dept=my-tasks&task=${newTask.id}`,
        actorEmpCode: session.empCode,
        actorName: session.name,
      }).catch(() => {});
    }

    logAudit(request, {
      empCode: session.empCode,
      empName: session.name,
      module: 'TASKS',
      action: 'CREATE_TASK',
      targetId: newTask.id,
      changesJson: newTask,
    }).catch(() => {});

    syncBackupToDrive('TASKS', { taskId: newTask.id, createdBy: session.empCode }, 'CREATE_TASK').catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Đã tạo công việc thành công',
      task: newTask,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: `Lỗi khi lưu công việc vào D1: ${error?.message || error}` },
      { status: 500 }
    );
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

    const { taskId, status, resultDescription, rejectReason, helpReason, checklistId, completed, progress, dueDate, dueDateReason } = body;

    if (!taskId) {
      return NextResponse.json({ success: false, error: 'taskId là bắt buộc' }, { status: 400 });
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Không thể kết nối cơ sở dữ liệu D1. Tuyệt đối không cập nhật bộ nhớ tạm.' },
        { status: 500 }
      );
    }

    await ensureTable(db);

    const existing: any = await db.prepare(`SELECT * FROM sys_my_tasks WHERE id = ?`).bind(taskId).first().catch(() => null);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy công việc cần cập nhật' }, { status: 404 });
    }

    // Optimistic Concurrency Control (OCC)
    const expectedUpdatedAt = body.expected_updated_at || body.last_updated_at;
    if (expectedUpdatedAt && existing.updated_at && !body.force) {
      const dbTime = new Date(existing.updated_at).getTime();
      const clientTime = new Date(expectedUpdatedAt).getTime();
      if (!isNaN(dbTime) && !isNaN(clientTime) && dbTime - clientTime > 2000) {
        return NextResponse.json(
          {
            success: false,
            conflict: true,
            error: `Dữ liệu công việc vừa được cập nhật bởi người khác lúc ${existing.updated_at}. Bạn có muốn nạp lại dữ liệu mới nhất không?`,
            currentTask: existing,
          },
          { status: 409 }
        );
      }
    }

    // Determine authorization level
    const roleLevel = session.roleLevel || 4;
    const roleCode = (session.roleCode || '').toUpperCase();
    const isAdmin = roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN' || roleLevel === 1;
    const isExec = isAdmin || roleLevel <= 2;
    const isTP = !isExec && (roleCode === 'TRUONG_PHONG' || roleCode === 'TP' || roleCode === 'QUAN_DOC' || roleLevel === 3);
    const isReporter = session.empCode === existing.reporter_emp_code;
    const isReviewer = session.empCode === existing.reviewer_emp_code;
    const isApprover = isAdmin || isExec || isTP || isReporter || isReviewer;

    let history: any[] = [];
    try {
      history = typeof existing.history_log === 'string' ? JSON.parse(existing.history_log || '[]') : (existing.history_log || []);
    } catch {
      history = [];
    }

    let newStatus = status !== undefined ? status : existing.status;
    let newResult = resultDescription !== undefined ? resultDescription : existing.result_description;
    let newRejectReason = existing.reject_reason;
    let newProgress = progress !== undefined ? progress : existing.progress;
    let newDueDate = dueDate !== undefined ? dueDate : existing.due_date;

    // Giai đoạn 7: Ràng buộc phụ thuộc công việc (Task Dependencies)
    // Một task có blocked_by_task_id KHÔNG THỂ chuyển sang DOING nếu task phụ thuộc chưa DONE
    const targetStatus = (newStatus || '').toUpperCase();
    if (targetStatus === 'DOING' && existing.status !== 'DOING' && existing.blocked_by_task_id) {
      const predTask: any = await db.prepare(
        `SELECT id, code, title, status FROM sys_my_tasks WHERE id = ? OR code = ?`
      ).bind(existing.blocked_by_task_id, existing.blocked_by_task_id).first().catch(() => null);

      if (predTask && predTask.status !== 'DONE') {
        return NextResponse.json(
          {
            success: false,
            error: `🔒 Nhiệm vụ này đang bị chặn bởi [${predTask.code || predTask.id}]: "${predTask.title}". Nhiệm vụ phụ thuộc phải được hoàn thành (DONE) trước khi bạn có thể bắt đầu (DOING).`,
            blocked_by: {
              id: predTask.id,
              code: predTask.code,
              title: predTask.title,
              status: predTask.status,
            },
          },
          { status: 400 }
        );
      }
    }

    // Giai đoạn 3.2: Kiểm soát luồng trạng thái nghiêm ngặt
    // 1. Chặn nhân viên tự ý chuyển sang DONE
    if (newStatus === 'DONE' && existing.status !== 'DONE') {
      if (!isApprover) {
        return NextResponse.json(
          {
            success: false,
            error: 'Bạn không có quyền Duyệt nghiệm thu (DONE) công việc này. Chỉ Trưởng/Phó phòng, Quản đốc hoặc Người giao việc mới có quyền bấm Duyệt đạt. Vui lòng chuyển thẻ sang Chờ duyệt (REVIEW).',
          },
          { status: 403 }
        );
      }

      const resultText = (newResult || '').trim();
      if (!resultText || resultText.length < 5) {
        return NextResponse.json(
          {
            success: false,
            error: 'Bắt buộc phải có mô tả kết quả thực hiện (tối thiểu 5 ký tự) trước khi Duyệt nghiệm thu hoàn thành (DONE)!',
          },
          { status: 400 }
        );
      }

      newProgress = 100;
      newRejectReason = null; // Clear previous rejection
      history.push({
        action: 'APPROVED_DONE',
        by: session.empCode,
        byName: session.name,
        at: new Date().toISOString(),
        resultDescription: resultText,
      });

      // Send approval notification across all channels
      if (existing.assignee_emp_code) {
        dispatchNotification(db, {
          recipientEmpCode: existing.assignee_emp_code,
          title: `Đã nghiệm thu: ${existing.title}`,
          message: `Công việc [${existing.code}] đã được ${session.name} Duyệt đạt (DONE).`,
          eventType: 'TASK_APPROVED',
          type: 'SUCCESS',
          link: `/work?dept=my-tasks&task=${existing.id}`,
          actorEmpCode: session.empCode,
          actorName: session.name,
        }).catch(() => {});
      }
    }

    // 1.1 Yêu cầu nghiệm thu (REVIEW)
    if (newStatus === 'REVIEW' && existing.status !== 'REVIEW') {
      const targetReviewer = existing.reviewer_emp_code || existing.reporter_emp_code;
      if (targetReviewer) {
        dispatchNotification(db, {
          recipientEmpCode: targetReviewer,
          title: `Yêu cầu nghiệm thu: ${existing.title}`,
          message: `${session.name} đã hoàn tất và yêu cầu bạn nghiệm thu công việc [${existing.code}].`,
          eventType: 'TASK_REVIEW_REQUEST',
          type: 'TASK',
          link: `/work?dept=my-tasks&task=${existing.id}`,
          actorEmpCode: session.empCode,
          actorName: session.name,
        }).catch(() => {});
      }
    }

    // 2. Luồng Bắt làm lại (Reject)
    const isRejectAction = body.action === 'REJECT' || Boolean(rejectReason) || (existing.status === 'REVIEW' && newStatus === 'DOING' && rejectReason);
    if (isRejectAction) {
      if (!isApprover) {
        return NextResponse.json(
          {
            success: false,
            error: 'Chỉ Trưởng phòng, Quản đốc hoặc Người giao việc mới có quyền Bắt làm lại công việc này.',
          },
          { status: 403 }
        );
      }

      const reasonText = (rejectReason || '').trim();
      if (!reasonText || reasonText.length < 5) {
        return NextResponse.json(
          {
            success: false,
            error: 'Bắt buộc phải nhập lý do bắt làm lại (tối thiểu 5 ký tự) để nhân viên biết cần sửa gì!',
          },
          { status: 400 }
        );
      }

      newStatus = 'DOING';
      newRejectReason = reasonText;
      history.push({
        action: 'REJECTED_REDO',
        by: session.empCode,
        byName: session.name,
        at: new Date().toISOString(),
        reason: reasonText,
      });

      // Send rejection notification across all channels
      if (existing.assignee_emp_code) {
        dispatchNotification(db, {
          recipientEmpCode: existing.assignee_emp_code,
          title: `Bắt làm lại: ${existing.title}`,
          message: `${session.name} yêu cầu làm lại công việc [${existing.code}]. Lý do: ${reasonText}`,
          eventType: 'TASK_REJECTED',
          type: 'WARNING',
          link: `/work?dept=my-tasks&task=${existing.id}`,
          actorEmpCode: session.empCode,
          actorName: session.name,
        }).catch(() => {});
      }
    }

    // 3. Giai đoạn 3.3: Ghi nhận thay đổi Due Date
    if (newDueDate && newDueDate !== existing.due_date) {
      history.push({
        action: 'DUE_DATE_CHANGED',
        by: session.empCode,
        byName: session.name,
        at: new Date().toISOString(),
        oldDueDate: existing.due_date,
        newDueDate: newDueDate,
        reason: (dueDateReason || '').trim(),
      });

      // Notify assignee about due date change across all channels
      if (existing.assignee_emp_code && existing.assignee_emp_code !== session.empCode) {
        dispatchNotification(db, {
          recipientEmpCode: existing.assignee_emp_code,
          title: `Dời hạn chót: ${existing.title}`,
          message: `Hạn chót công việc [${existing.code}] đã đổi từ ${existing.due_date} sang ${newDueDate}.`,
          eventType: 'TASK_DUE_WARNING',
          type: 'WARNING',
          link: `/work?dept=my-tasks&task=${existing.id}`,
          actorEmpCode: session.empCode,
          actorName: session.name,
        }).catch(() => {});
      }
    }

    // Checklist handling
    let checklistArr: any[] = [];
    try {
      checklistArr = typeof existing.checklist === 'string' ? JSON.parse(existing.checklist || '[]') : (existing.checklist || []);
    } catch {
      checklistArr = [];
    }

    if (checklistId !== undefined) {
      checklistArr = checklistArr.map((c: any) =>
        c.id === checklistId ? { ...c, completed: Boolean(completed) } : c
      );
      const doneCount = checklistArr.filter((c: any) => c.completed).length;
      newProgress = checklistArr.length > 0 ? Math.round((doneCount / checklistArr.length) * 100) : newProgress;
    }

    // Attachments handling
    let attachmentsArr: any[] = [];
    try {
      attachmentsArr = typeof existing.attachments === 'string' ? JSON.parse(existing.attachments || '[]') : (existing.attachments || []);
    } catch {
      attachmentsArr = [];
    }
    if (Array.isArray(body.attachments)) {
      attachmentsArr = body.attachments;
    }

    const newBlockedBy = body.blocked_by_task_id !== undefined ? body.blocked_by_task_id : existing.blocked_by_task_id;
    const newParentId = body.parent_task_id !== undefined ? body.parent_task_id : existing.parent_task_id;
    const newAssigneeCode = body.assignee_emp_code !== undefined ? body.assignee_emp_code : existing.assignee_emp_code;
    const newAssigneeName = body.assignee_name !== undefined ? body.assignee_name : existing.assignee_name;
    const newAssigneeDept = body.assignee_department !== undefined ? body.assignee_department : existing.assignee_department;

    // Update in D1
    await db.prepare(`
      UPDATE sys_my_tasks
      SET status = ?,
          result_description = ?,
          reject_reason = ?,
          progress = ?,
          due_date = ?,
          checklist = ?,
          attachments = ?,
          history_log = ?,
          blocked_by_task_id = ?,
          parent_task_id = ?,
          assignee_emp_code = ?,
          assignee_name = ?,
          assignee_department = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      newStatus,
      newResult,
      newRejectReason,
      newProgress,
      newDueDate,
      JSON.stringify(checklistArr),
      JSON.stringify(attachmentsArr),
      JSON.stringify(history),
      newBlockedBy,
      newParentId,
      newAssigneeCode,
      newAssigneeName,
      newAssigneeDept,
      taskId
    ).run();

    logAudit(request, {
      empCode: session.empCode,
      empName: session.name,
      module: 'TASKS',
      action: 'UPDATE_TASK',
      targetId: taskId,
      changesJson: { status: newStatus, progress: newProgress, rejectReason: newRejectReason, dueDate: newDueDate },
    }).catch(() => {});

    syncBackupToDrive('TASKS', { taskId, updatedBy: session.empCode, status: newStatus }, 'UPDATE_TASK').catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật công việc thành công trên D1',
      task: {
        id: taskId,
        status: newStatus,
        progress: newProgress,
        reject_reason: newRejectReason,
        due_date: newDueDate,
        history_log: history,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: `Lỗi cập nhật D1: ${error?.message || error}` },
      { status: 500 }
    );
  }
}

export const PUT = PATCH;

export async function DELETE(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập để xóa công việc (401 Unauthorized)' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ success: false, error: 'taskId là bắt buộc' }, { status: 400 });
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Không thể kết nối cơ sở dữ liệu D1. Tuyệt đối không xóa trên bộ nhớ tạm.' },
        { status: 500 }
      );
    }

    await ensureTable(db);

    await db.prepare(`DELETE FROM sys_my_tasks WHERE id = ?`).bind(taskId).run();

    logAudit(request, {
      empCode: session.empCode,
      empName: session.name,
      module: 'TASKS',
      action: 'DELETE_TASK',
      targetId: taskId,
      changesJson: { taskId },
    }).catch(() => {});

    syncBackupToDrive('TASKS', { taskId, deletedBy: session.empCode }, 'DELETE_TASK').catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Đã xóa công việc thành công khỏi D1',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: `Lỗi xóa công việc D1: ${error?.message || error}` },
      { status: 500 }
    );
  }
}
