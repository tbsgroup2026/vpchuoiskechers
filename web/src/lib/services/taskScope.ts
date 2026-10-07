/**
 * taskScope.ts – Phân quyền truy cập dữ liệu Task.
 *
 * Mục đích: Trả về điều kiện SQL WHERE (+ bind params) phù hợp với vai trò
 * của user hiện tại. Dùng D1 prepare/bind parameters để đảm bảo an toàn
 * hoàn toàn.
 *
 * KHÔNG trả chuỗi SQL nối tay từ dữ liệu người dùng.
 * Kiểm quyền PHẢI được thực thi ở BACKEND (API route), không phụ thuộc UI.
 *
 * Ma trận quyền ĐỌC (READ):
 * - Level 1-2 (Ban quản trị): Toàn bộ task.
 * - Level 3 (Trưởng phòng):   Task có assignee_department_id = phòng mình quản lý,
 *                             HOẶC là assignee/reporter,
 *                             HOẶC là PM của dự án.
 * - Level 4 (Nhân viên):      Task được giao (assignee), do mình tạo (reporter),
 *                             hoặc thuộc dự án mình là thành viên.
 *
 * Ma trận quyền GHI (WRITE):
 * - Assignee:        Cập nhật status, progress, checklist, attachments.
 * - Reporter:        Cập nhật nội dung (title, description, due_date).
 * - PM dự án:        Tạo/giao/sửa/xóa task thuộc dự án của mình.
 * - Trưởng phòng:    Toàn quyền với task của phòng mình.
 * - Ban quản trị:    Toàn quyền.
 */

import type { JWTPayload } from '@/lib/auth';
import { getSystemUser } from '@/lib/userProfiles';

// Whitelist status hợp lệ – validate trước khi nhận từ client
export const VALID_STATUSES = ['TO_DO', 'DOING', 'REVIEW', 'DONE', 'CANCELLED'] as const;
export type TaskStatus = typeof VALID_STATUSES[number];

export function isValidStatus(s: unknown): s is TaskStatus {
  return typeof s === 'string' && (VALID_STATUSES as readonly string[]).includes(s);
}

// ──────────────────────────────────────────────────────────────────────────────
// SCOPE FILTER (READ)
// ──────────────────────────────────────────────────────────────────────────────

export interface ScopeFilter {
  /** Mệnh đề WHERE (không bao gồm từ khóa WHERE) */
  sql: string;
  /** Bind params tương ứng với ? trong sql */
  params: unknown[];
}

/**
 * Lấy phòng ban mà user (Trưởng phòng) đang quản lý từ session (server-side).
 * KHÔNG nhận từ tham số client gửi lên.
 */
function getManagedDeptId(user: JWTPayload): string | null {
  // Ưu tiên từ SYSTEM_USERS (nguồn chính thống)
  const sysUser = getSystemUser(user.empCode);
  if (sysUser?.managedDepartmentId) return sysUser.managedDepartmentId;
  // Fallback từ JWT payload (đã ký, không bị giả mạo)
  return (user as any).managedDepartmentId || null;
}

/**
 * Trả về điều kiện WHERE + params cho truy vấn READ tasks.
 * Gọi trước mọi SELECT * FROM tasks.
 */
export function getTaskScopeFilter(user: JWTPayload): ScopeFilter {
  const roleLevel = user.roleLevel ?? 4;
  const empCode = user.empCode;

  // ── Ban quản trị (Level 1-2): Toàn bộ ──────────────────────────────────
  if (roleLevel <= 2) {
    return { sql: '1=1', params: [] };
  }

  // ── Trưởng phòng (Level 3) ───────────────────────────────────────────────
  if (roleLevel === 3) {
    const managedDept = getManagedDeptId(user);
    if (managedDept) {
      // Thấy tất cả task mà assignee thuộc phòng mình
      // HOẶC mình là assignee/reporter
      // (PM quyền xử lý ở mệnh đề project_id riêng nếu cần)
      return {
        sql: `(
          assignee_department_id = ?
          OR assignee_emp_code = ?
          OR reporter_emp_code = ?
          OR id IN (
            SELECT t2.id FROM tasks t2
            INNER JOIN project_members pm
              ON pm.project_id = t2.project_id
              AND pm.emp_code = ?
              AND pm.project_role = 'PROJECT_MANAGER'
          )
        )`,
        params: [managedDept, empCode, empCode, empCode],
      };
    }
    // Trưởng phòng không có managedDepartmentId → chỉ thấy task của mình
    return {
      sql: '(assignee_emp_code = ? OR reporter_emp_code = ?)',
      params: [empCode, empCode],
    };
  }

  // ── Nhân viên (Level 4) ──────────────────────────────────────────────────
  return {
    sql: `(
      assignee_emp_code = ?
      OR reporter_emp_code = ?
      OR id IN (
        SELECT t3.id FROM tasks t3
        INNER JOIN project_members pm3
          ON pm3.project_id = t3.project_id
          AND pm3.emp_code = ?
      )
    )`,
    params: [empCode, empCode, empCode],
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// WRITE AUTHORIZATION
// ──────────────────────────────────────────────────────────────────────────────

export type WriteAction = 'UPDATE_STATUS' | 'UPDATE_CONTENT' | 'DELETE' | 'CREATE' | 'ASSIGN';

/**
 * Kiểm tra user có quyền thực hiện action trên task không.
 * task là row từ bảng tasks (đã fetch từ DB, không từ client).
 *
 * @returns true nếu được phép, false nếu bị từ chối (trả 403)
 */
export async function canWriteTask(
  user: JWTPayload,
  task: Record<string, any>,
  action: WriteAction,
  db?: any
): Promise<boolean> {
  const roleLevel = user.roleLevel ?? 4;
  const empCode = user.empCode;

  // Ban quản trị: toàn quyền
  if (roleLevel <= 2) return true;

  const isAssignee = task.assignee_emp_code === empCode;
  const isReporter = task.reporter_emp_code === empCode;

  // Trưởng phòng: toàn quyền với task của phòng mình
  if (roleLevel === 3) {
    const managedDept = getManagedDeptId(user);
    if (managedDept && task.assignee_department_id === managedDept) return true;
    // Nếu là PM của dự án chứa task này
    if (db && task.project_id) {
      const pmRow = await db.prepare(
        'SELECT 1 FROM project_members WHERE project_id = ? AND emp_code = ? AND project_role = ?'
      ).bind(task.project_id, empCode, 'PROJECT_MANAGER').first().catch(() => null);
      if (pmRow) return true;
    }
    // Vẫn là assignee/reporter thì cho sửa phần của mình
    return isAssignee || isReporter;
  }

  // Nhân viên (Level 4)
  switch (action) {
    case 'UPDATE_STATUS':
      // Assignee: cập nhật trạng thái, tiến độ, checklist, attachments
      return isAssignee;

    case 'UPDATE_CONTENT':
      // Reporter: sửa nội dung
      return isReporter || isAssignee;

    case 'DELETE':
      // Nhân viên không được xóa
      return false;

    case 'CREATE':
      // Nhân viên được tạo task cho chính mình
      return true;

    case 'ASSIGN':
      // Nhân viên không được giao task cho người khác
      // (chỉ PM và Trưởng phòng)
      return false;

    default:
      return false;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PROJECT SCOPE (READ) cho Nhân viên
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Nhân viên là MEMBER của dự án chỉ được xem Overview dự án (không xem task chi tiết
 * của thành viên khác). Hàm này trả về thông tin project mà user được phép xem overview.
 */
export function getProjectOverviewFilter(user: JWTPayload): ScopeFilter {
  const roleLevel = user.roleLevel ?? 4;
  const empCode = user.empCode;

  if (roleLevel <= 2) {
    return { sql: '1=1', params: [] };
  }

  if (roleLevel === 3) {
    const managedDept = getManagedDeptId(user);
    if (managedDept) {
      return {
        sql: '(department_id = ? OR id IN (SELECT project_id FROM project_members WHERE emp_code = ?))',
        params: [managedDept, empCode],
      };
    }
  }

  // Nhân viên: chỉ thấy project mình tham gia
  return {
    sql: 'id IN (SELECT project_id FROM project_members WHERE emp_code = ?)',
    params: [empCode],
  };
}
