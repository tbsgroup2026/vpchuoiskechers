const assert = require('assert');
const { checkSelfApproval } = require('../src/lib/taskPermissions');

function runCheckSelfApprovalTests() {
  console.log('--- STARTING CHECK_SELF_APPROVAL UNIT TESTS ---');
  let passed = 0;
  let failed = 0;

  function testAssert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Test 1: Assignee attempts to self-approve
  const task1 = { id: 't1', assignee_emp_code: 'EMP-101', reporter_emp_code: 'EMP-102', status: 'REVIEW' };
  const res1 = checkSelfApproval('EMP-101', task1, 'APPROVED');
  testAssert(!res1.allowed && res1.error.includes('SEGREGATION_OF_DUTIES'), 'Assignee cannot self-approve task');

  // Test 2: Delegated recipient attempts to self-approve
  const task2 = { id: 't2', assignee_emp_code: 'EMP-101', delegated_to_emp_code: 'EMP-103', reporter_emp_code: 'EMP-102', status: 'REVIEW' };
  const res2 = checkSelfApproval('EMP-103', task2, 'DONE');
  testAssert(!res2.allowed && res2.error.includes('SEGREGATION_OF_DUTIES'), 'Delegated employee cannot self-approve task');

  // Test 3: Reviewer set as Assignee (blocking)
  const task3 = { id: 't3', assignee_emp_code: 'EMP-101', reviewer_emp_code: 'EMP-101', reporter_emp_code: 'EMP-102', status: 'REVIEW' };
  const res3 = checkSelfApproval('EMP-102', task3, 'APPROVED');
  testAssert(!res3.allowed && res3.error.includes('Reviewer là người thực hiện'), 'Blocking setting reviewer as assignee');

  // Test 4: Department Head (Creator) approves task of staff
  const task4 = { id: 't4', assignee_emp_code: 'EMP-101', reporter_emp_code: 'HEAD-001', status: 'REVIEW' };
  const res4 = checkSelfApproval('HEAD-001', task4, 'APPROVED');
  testAssert(res4.allowed === true, 'Department head (Creator) can approve staff task');

  // Test 5: Empty reviewer + no dept manager -> Fallback assigned reviewer without getting stuck
  const task5 = { id: 't5', assignee_emp_code: 'EMP-UNKNOWN', reporter_emp_code: 'HEAD-002', status: 'REVIEW' };
  const res5 = checkSelfApproval('HEAD-002', task5, 'APPROVED');
  testAssert(res5.allowed === true && res5.assignedReviewer !== undefined, 'Empty reviewer falls back safely without stuck workflow');

  // Test 6: Department Head who is ALSO the assignee attempts to self-approve
  const task6 = { id: 't6', assignee_emp_code: 'HEAD-001', reporter_emp_code: 'HEAD-001', status: 'REVIEW' };
  const res6 = checkSelfApproval('HEAD-001', task6, 'APPROVED');
  testAssert(!res6.allowed && res6.error.includes('SEGREGATION_OF_DUTIES'), 'Department Head who is Assignee CANNOT self-approve');

  // Test 7: Handover confirm then recipient (new assignee) attempts to self-approve
  const task7 = {
    id: 't7',
    assignee_emp_code: 'NEW-EMP-200',
    previous_assignee_emp_code: 'OLD-EMP-100',
    handover_status: 'CONFIRMED',
    reporter_emp_code: 'HEAD-001',
    status: 'REVIEW'
  };
  const res7 = checkSelfApproval('NEW-EMP-200', task7, 'APPROVED');
  testAssert(!res7.allowed && res7.error.includes('SEGREGATION_OF_DUTIES'), 'Handover recipient cannot self-approve task after handover');

  console.log(`\n--- RESULT: ${passed} Passed | ${failed} Failed ---`);
}

runCheckSelfApprovalTests();
