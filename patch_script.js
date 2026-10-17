const fs = require('fs');
let code = fs.readFileSync('web/src/app/api/tasks/route.ts', 'utf8');

code = code.replace(/const DEFAULT_TASKS = \[\s*\{[\s\S]*?\n\];\s*\n\/\/ Fallback memory state if D1 DB is not bound\nlet inMemoryTasks = \[\.\.\.DEFAULT_TASKS\];/, '');

code = code.replace(
  'const session = token ? await verifyToken(token) : null;',
  `const session = token ? await verifyToken(token) : null;
    if (!session || !session.empCode) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }`
);

code = code.replace(
  '    if (allTasks.length === 0) {\n      allTasks = [...inMemoryTasks];\n    }',
  ''
);

code = code.replace(
  '  } catch (error: any) {\n    return NextResponse.json({ success: true, tasks: inMemoryTasks });\n  }',
  `  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 503 });
  }`
);

code = code.replace(
  `    let session = await getAuthUser(request);
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
    }`,
  `    let session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }`
);

code = code.replace(
  `    // Only use in-memory fallback if DB insert did NOT succeed
    if (!dbInsertOk) {
      inMemoryTasks = [newTask as any, ...inMemoryTasks];
    }`,
  `    if (!dbInsertOk) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }`
);

code = code.replace(
  /    \/\/ In-memory update[\s\S]*?help_notified_to: notifiedManager,\n    \}\);/,
  `    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });`
);

code = code.replace(
  '    inMemoryTasks = inMemoryTasks.filter((t) => t.id !== taskId);',
  ''
);

fs.writeFileSync('web/src/app/api/tasks/route.ts', code);
