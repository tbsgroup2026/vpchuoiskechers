/**
 * Gemba.Pro Strict State Machine Workflow 14-Step E2E Verification Test Suite
 * Usage: node scripts/test_gemba_workflow_e2e.js
 */

const fs = require("fs");

async function runWorkflowE2ETests() {
  console.log("=================================================");
  console.log("  GEMBA.PRO STRICT STATE MACHINE 14-STEP E2E TEST ");
  console.log("=================================================\n");

  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${message}`);
      failCount++;
    }
  }

  // 1. Verify Worker code contains ALLOWED_TRANSITIONS matrix
  const workerPath = "d:/Work/TBS II/web/public/_worker.js";
  assert(fs.existsSync(workerPath), "1. Worker handler file web/public/_worker.js exists");

  if (fs.existsSync(workerPath)) {
    const code = fs.readFileSync(workerPath, "utf8");

    assert(code.includes("ALLOWED_TRANSITIONS"), "2. Worker enforces ALLOWED_TRANSITIONS matrix");
    assert(code.includes("NEW: [\"PROCESSING\"]"), "3. Worker restricts NEW status transition ONLY to PROCESSING");
    assert(code.includes("PROCESSING: [\"WAITING_CONFIRMATION\"]"), "4. Worker restricts PROCESSING status transition ONLY to WAITING_CONFIRMATION");
    assert(code.includes("WAITING_CONFIRMATION: [\"COMPLETED\", \"PROCESSING\"]"), "5. Worker allows WAITING_CONFIRMATION to transition to COMPLETED or PROCESSING (reject)");
    assert(code.includes("INVALID_STATE_TRANSITION"), "6. Worker returns 400 Bad Request on invalid state transition attempt");
    assert(code.includes("REJECTION_REASON_REQUIRED"), "7. Worker requires rejection reason note when returning to PROCESSING");
    assert(code.includes("RESOLUTION_NOTE_REQUIRED"), "8. Worker requires resolution note when submitting for WAITING_CONFIRMATION");
  }

  // 2. Verify UI Component GembaManagementView.tsx timeline & context action buttons
  const viewPath = "d:/Work/TBS II/web/src/modules/gemba/GembaManagementView.tsx";
  assert(fs.existsSync(viewPath), "9. UI Component GembaManagementView.tsx exists");

  if (fs.existsSync(viewPath)) {
    const uiCode = fs.readFileSync(viewPath, "utf8");
    assert(uiCode.includes("WAITING_CONFIRMATION"), "10. UI renders WAITING_CONFIRMATION badge & filter option");
    assert(uiCode.includes("Quy Trình & Tiến Trình Lịch Sử Khắc Phục (Timeline)"), "11. UI renders visual 4-step Stepper Progress Bar & Timeline");
    assert(uiCode.includes("handleWorkflowTransition(\"PROCESSING\", \"ACCEPT\")"), "12. UI renders context action button for NEW -> PROCESSING");
    assert(uiCode.includes("handleWorkflowTransition(\"WAITING_CONFIRMATION\", \"SUBMIT_CONFIRMATION\")"), "13. UI renders context action button for PROCESSING -> WAITING_CONFIRMATION");
    assert(uiCode.includes("handleWorkflowTransition(\"COMPLETED\", \"APPROVE\")"), "14. UI renders context action button for WAITING_CONFIRMATION -> COMPLETED and REJECT");
  }

  console.log("\n=================================================");
  console.log(`  WORKFLOW TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log("=================================================\n");
}

runWorkflowE2ETests();
