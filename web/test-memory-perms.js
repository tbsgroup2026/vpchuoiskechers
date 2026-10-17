import { getCardPermissions } from './src/lib/taskPermissions.js';

// Mock DB and Session
const mockDb = {
  prepare: (query) => ({
    bind: (...args) => ({
      first: async () => {
        if (query.includes('task_boards')) {
          return { id: args[0], owner_id: 'OWNER_EMP', department_id: 'DEPT_IT', type: 'department' };
        }
        if (query.includes('tasks') || query.includes('task_cards')) {
          return { 
            id: args[0], 
            board_id: 'BOARD_1',
            assignee_id: 'ASSIGNEE_EMP',
            assignee_emp_code: 'ASSIGNEE_EMP',
            created_by: 'CREATOR_EMP',
            reporter_emp_code: 'CREATOR_EMP'
          };
        }
        return null;
      }
    })
  })
};

const runTest = async () => {
  const scenarios = [
    { name: 'Admin', session: { empCode: 'ADMIN_EMP', roleLevel: 1 }, isManager: true },
    { name: 'Manager (Owner)', session: { empCode: 'OWNER_EMP', roleLevel: 3 }, isManager: true },
    { name: 'Assignee', session: { empCode: 'ASSIGNEE_EMP', roleLevel: 4 }, isManager: false },
    { name: 'Creator', session: { empCode: 'CREATOR_EMP', roleLevel: 4 }, isManager: false },
    { name: 'Other User', session: { empCode: 'OTHER_EMP', roleLevel: 4 }, isManager: false },
  ];

  let allPassed = true;
  for (const s of scenarios) {
    const card = {
      assignee_id: 'ASSIGNEE_EMP',
      created_by: 'CREATOR_EMP',
      reporter_emp_code: 'CREATOR_EMP'
    };

    // 1. Get from getCardPermissions (DB logic)
    const dbPerms = await getCardPermissions(mockDb, 'CARD_1', s.session, 'legacy');

    // 2. Compute in-memory (the new logic in route.ts)
    const isAssignee = card.assignee_id === s.session.empCode;
    const isReporter = card.created_by === s.session.empCode;
    
    // Note: getCardPermissions logic limits creator if assignee has higher role.
    // Let's assume they have same role for this test, so creatorCanOverride = true.
    const memoryPerms = {
      canMove: s.isManager || isAssignee || isReporter,
      canComplete: s.isManager || isAssignee || isReporter,
      canReview: s.isManager || isReporter,
      canEditMeta: s.isManager || isReporter
    };

    const hasAccess = s.isManager || isAssignee || isReporter || false; // Approximation
    
    // Check match
    if (dbPerms.hasAccess) {
      const match = JSON.stringify(dbPerms.permissions) === JSON.stringify(memoryPerms);
      console.log(`[${s.name}] Match: ${match}`);
      if (!match) {
        allPassed = false;
        console.log('DB:', dbPerms.permissions);
        console.log('Mem:', memoryPerms);
      }
    } else {
      console.log(`[${s.name}] No access. Match: ${!hasAccess}`);
    }
  }
  console.log('All matched:', allPassed);
};

runTest().catch(console.error);
