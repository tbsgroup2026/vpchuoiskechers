import { SYSTEM_USERS } from '@/lib/userProfiles';

export async function getSessionUser(session: any) {
  if (!session || (!session.empCode && !session.userId)) return null;
  const empCode = session.empCode || session.userId || '';
  const userProfile = SYSTEM_USERS[empCode] || null;
  const roleLevel = userProfile?.roleLevel ?? (session.roleLevel ?? 4);
  const departmentCode = userProfile?.managedDepartmentId || userProfile?.departmentCode || session.departmentCode || '';
  return { empCode, roleLevel, departmentCode, userProfile };
}

export async function getTaskBoardPermissions(db: any, boardId: string, session: any) {
  const user = await getSessionUser(session);
  if (!user) return { hasAccess: false, status: 401, error: 'UNAUTHORIZED' };
  const { empCode, roleLevel, departmentCode } = user;

  // Admin/BQT
  if (roleLevel <= 2) {
    return { hasAccess: true, isManager: true, departmentCode, empCode, roleLevel };
  }

  const board: any = await db.prepare('SELECT * FROM task_boards WHERE id = ?').bind(boardId).first();
  if (!board) {
    return { hasAccess: false, status: 404, error: 'Không tìm thấy bảng công việc' };
  }

  const isOwner = board.owner_id === empCode;
  const isDeptMatch = board.department_id && board.department_id === departmentCode;
  
  if (board.id.startsWith('PROJ') || board.id.startsWith('PRJ')) {
    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(board.id).first().catch(() => null);
    if (project) {
      const member = await db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND emp_code = ?').bind(project.id, empCode).first().catch(() => null);
      const isProjectMember = !!member;
      const isProjectDeptMatch = project.scope === 'DEPARTMENT' && project.department_id === departmentCode;
      
      if (isProjectMember || isProjectDeptMatch) {
        const isManager = roleLevel === 3 || project.manager_emp_code === empCode;
        return { hasAccess: true, isManager, departmentCode, empCode, roleLevel, board };
      }
      return { hasAccess: false, status: 403, error: 'FORBIDDEN: Bạn không có quyền truy cập dự án này' };
    }
  }

  // User has access if it's their personal board, owner, in their department
  if (isOwner || isDeptMatch || board.type === 'personal') {
    const isManager = roleLevel === 3 && (isOwner || isDeptMatch);
    return { hasAccess: true, isManager, departmentCode, empCode, roleLevel, board };
  }

  return { hasAccess: false, status: 403, error: 'FORBIDDEN: Không có quyền truy cập' };
}

export async function getCardPermissions(db: any, cardId: string, session: any, tasksSource = 'V2') {
  const user = await getSessionUser(session);
  if (!user) return { hasAccess: false, status: 401, error: 'UNAUTHORIZED' };
  const { empCode, roleLevel } = user;
  
  let card: any;
  if (tasksSource !== 'legacy') {
    card = await db.prepare('SELECT * FROM tasks WHERE id = ?').bind(cardId).first();
  } else {
    card = await db.prepare('SELECT * FROM task_cards WHERE id = ?').bind(cardId).first();
  }

  if (!card) {
    return { hasAccess: false, status: 404, error: 'Không tìm thấy thẻ công việc' };
  }

  const boardId = card.board_id || card.project_id || card.department_id;
  const boardPerm = await getTaskBoardPermissions(db, boardId, session);
  if (!boardPerm.hasAccess) return boardPerm;

  const assignee = card.assignee_id || card.assignee_emp_code;
  const creator = card.created_by || card.reporter_emp_code;
  
  const assigneeProfile = assignee ? SYSTEM_USERS[assignee] : null;
  const assigneeRoleLevel = assigneeProfile?.roleLevel ?? 4;
  
  let canMove = false;
  let canComplete = false;
  let canReview = false;
  let canEditMeta = false;

  if (boardPerm.isManager) {
    canMove = true;
    canComplete = true;
    canReview = true;
    canEditMeta = true;
  } else {
    const isAssignee = assignee === empCode;
    const isCreator = creator === empCode;
    // Creator can act ONLY if assignee does not have a higher role (lower roleLevel number)
    const creatorCanOverride = isCreator && (!assignee || assigneeRoleLevel >= roleLevel);

    if (isAssignee || creatorCanOverride) {
      canMove = true;
      canComplete = true; 
    }
  }

  return {
    hasAccess: true,
    card,
    boardId,
    permissions: { canMove, canComplete, canReview, canEditMeta },
    isManager: boardPerm.isManager,
    empCode,
    roleLevel
  };
}
