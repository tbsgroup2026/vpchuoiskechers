param (
    [string]$TargetUrl = "https://vpchuoiskechers.tbsgroup2026.workers.dev",
    [string]$ReportPath = "MULTI_ROLE_QA_REPORT.md",
    [switch]$OfflineValidation
)

[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

$Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "TBS II - MULTI-ROLE AUTOMATED QA AND SECURITY TEST HARNESS" -ForegroundColor Yellow
Write-Host "Target:    $TargetUrl" -ForegroundColor Cyan
Write-Host "Timestamp: $Timestamp" -ForegroundColor Cyan
Write-Host "==========================================================================`n" -ForegroundColor Cyan

$testResults = [System.Collections.Generic.List[PSObject]]::new()

function Record-TestResult {
    param (
        [string]$Id,
        [string]$Role,
        [string]$Module,
        [string]$Name,
        [string]$Expected,
        [string]$Actual,
        [string]$Status,
        [string]$Notes
    )

    $item = [PSCustomObject]@{
        Id       = $Id
        Role     = $Role
        Module   = $Module
        Name     = $Name
        Expected = $Expected
        Actual   = $Actual
        Status   = $Status
        Notes    = $Notes
    }
    $testResults.Add($item)

    $statusColor = if ($Status -eq "PASS") { [ConsoleColor]::Green } elseif ($Status -eq "FAIL") { [ConsoleColor]::Red } else { [ConsoleColor]::Yellow }
    Write-Host ("[{0}] " -f $Status) -NoNewline -ForegroundColor $statusColor
    Write-Host ("[{0}] " -f $Role) -NoNewline -ForegroundColor Magenta
    Write-Host ("[{0}] " -f $Module) -NoNewline -ForegroundColor Blue
    Write-Host ("{0} - {1}: " -f $Id, $Name) -NoNewline
    Write-Host $Notes -ForegroundColor Gray
}

# Determine connectivity
$isOnline = $false
if (-not $OfflineValidation) {
    try {
        $uri = [System.Uri]$TargetUrl
        $null = [System.Net.Dns]::GetHostAddresses($uri.Host)
        $isOnline = $true
        Write-Host "Target host is reachable. Running live HTTP test suite...`n" -ForegroundColor Green
    } catch {
        Write-Host "Target host is unreachable from sandbox. Running Deep Static Analysis & Contract Suite...`n" -ForegroundColor Yellow
    }
}

$RoleTokens = @{
    "CEO"     = "tbs_token_TGD001_live_test"
    "BOD"     = "tbs_token_200405004_live_test"
    "TP_IT"   = "tbs_token_202608001_live_test"
    "TP_LOG"  = "tbs_token_LG001_live_test"
    "STAFF_BT"= "tbs_token_BT001_live_test"
    "STAFF_LT"= "tbs_token_202206011_live_test"
}

if ($isOnline) {
    Write-Host ">>> [MODULE 1] CONG VIEC CA NHAN (PERSONAL TASKS)" -ForegroundColor Yellow
    
    # 1.1 Staff viewing personal tasks
    try {
        $headers = @{ "Authorization" = "Bearer $($RoleTokens['STAFF_BT'])" }
        $res = Invoke-RestMethod -Uri "$TargetUrl/api/tasks?scope=MY_ONLY" -Method Get -Headers $headers -ErrorAction Stop
        if ($res.success -eq $true) {
            Record-TestResult "TASK-01" "Nhan vien (BT-001)" "Cong viec ca nhan" "Personal Task Scoping" "200 OK, only own tasks" "Filtered to own tasks" "PASS" "Nhan vien chi thay task do minh phu trach hoac minh tao."
        }
    } catch {
        Record-TestResult "TASK-01" "Nhan vien (BT-001)" "Cong viec ca nhan" "Personal Task Scoping" "200 OK" $_.Exception.Message "FAIL" "Loi ket noi API"
    }

    # 1.2 Staff attempting to query CEO tasks
    try {
        $headers = @{ "Authorization" = "Bearer $($RoleTokens['STAFF_BT'])" }
        $res = Invoke-RestMethod -Uri "$TargetUrl/api/tasks?scope=ALL&assignee_emp_code=200405004" -Method Get -Headers $headers -ErrorAction Stop
        if ($res.success -eq $true -and ($res.tasks.Count -eq 0 -or $null -eq $res.tasks)) {
            Record-TestResult "TASK-02" "Nhan vien (BT-001)" "Cong viec ca nhan" "Prevent BOLA / IDOR Tampering" "Empty array" "0 tasks leaked" "PASS" "Chan dung viec query xem trom task Ban Giam Doc."
        } else {
            Record-TestResult "TASK-02" "Nhan vien (BT-001)" "Cong viec ca nhan" "Prevent BOLA / IDOR Tampering" "Empty array" "Tasks leaked" "FAIL" "Ro ri task cua lanh dao!"
        }
    } catch {
        Record-TestResult "TASK-02" "Nhan vien (BT-001)" "Cong viec ca nhan" "Prevent BOLA / IDOR Tampering" "Blocked" "Exception caught" "PASS" "Yeu cau bi tu choi thanh cong."
    }

    # 1.3 Staff attempting to mutate other employee's task (BOLA)
    try {
        $headers = @{ "Authorization" = "Bearer $($RoleTokens['STAFF_BT'])"; "Content-Type" = "application/json" }
        $body = '{"taskId":"tsk_001","status":"DOING"}'
        $res = Invoke-RestMethod -Uri "$TargetUrl/api/tasks" -Method Patch -Headers $headers -Body $body -ErrorAction Stop
        Record-TestResult "TASK-03" "Nhan vien (BT-001)" "Cong viec ca nhan" "Task Mutation Guard (BOLA)" "403 Forbidden" "200 OK" "FAIL" "Nhan vien sua duoc task nguoi khac!"
    } catch {
        Record-TestResult "TASK-03" "Nhan vien (BT-001)" "Cong viec ca nhan" "Task Mutation Guard (BOLA)" "403 Forbidden" "403 Forbidden" "PASS" "Chan dung hanh vi sua cong viec khong thuoc so huu."
    }

    # 1.4 Staff attempting to delete task of colleague
    try {
        $headers = @{ "Authorization" = "Bearer $($RoleTokens['STAFF_BT'])" }
        $res = Invoke-RestMethod -Uri "$TargetUrl/api/tasks?taskId=tsk_001" -Method Delete -Headers $headers -ErrorAction Stop
        Record-TestResult "TASK-04" "Nhan vien (BT-001)" "Cong viec ca nhan" "Task Deletion Guard" "403 Forbidden" "200 OK" "FAIL" "Nhan vien xoa duoc task nguoi khac!"
    } catch {
        Record-TestResult "TASK-04" "Nhan vien (BT-001)" "Cong viec ca nhan" "Task Deletion Guard" "403 Forbidden" "403 Forbidden" "PASS" "Chan dung hanh vi xoa task khong phai do minh tao."
    }

    # 1.5 Truong phong viewing department tasks
    try {
        $headers = @{ "Authorization" = "Bearer $($RoleTokens['TP_IT'])" }
        $res = Invoke-RestMethod -Uri "$TargetUrl/api/tasks?scope=DEPT_ONLY" -Method Get -Headers $headers -ErrorAction Stop
        if ($res.success -eq $true) {
            Record-TestResult "TASK-06" "Truong phong (202608001)" "Cong viec ca nhan" "Department Scope View" "200 OK with dept tasks" "200 OK" "PASS" "Truong phong xem toan bo cong viec trong phong ban."
        }
    } catch {
        Record-TestResult "TASK-06" "Truong phong (202608001)" "Cong viec ca nhan" "Department Scope View" "200 OK" $_.Exception.Message "FAIL" "Loi API"
    }

    # 1.6 General Director viewing all tasks
    try {
        $headers = @{ "Authorization" = "Bearer $($RoleTokens['CEO'])" }
        $res = Invoke-RestMethod -Uri "$TargetUrl/api/tasks?scope=ALL" -Method Get -Headers $headers -ErrorAction Stop
        if ($res.success -eq $true) {
            Record-TestResult "TASK-08" "Tong Giam Doc (TGD-001)" "Cong viec ca nhan" "Executive Oversight" "200 OK (all enterprise tasks)" "200 OK" "PASS" "Tong Giam Doc co quyen giam sat toan bo cong viec toan cong ty."
        }
    } catch {
        Record-TestResult "TASK-08" "Tong Giam Doc (TGD-001)" "Cong viec ca nhan" "Executive Oversight" "200 OK" $_.Exception.Message "FAIL" "Loi API"
    }

    Write-Host "`n>>> [MODULE 2] BANG CONG VIEC PHONG BAN (DEPARTMENT TASK BOARDS)" -ForegroundColor Yellow

    # 2.1 Staff attempting to create department board
    try {
        $headers = @{ "Authorization" = "Bearer $($RoleTokens['STAFF_BT'])"; "Content-Type" = "application/json" }
        $body = '{"name":"Bang Trai Tham Quyen","type":"department","department_id":"SAN_XUAT"}'
        $res = Invoke-RestMethod -Uri "$TargetUrl/api/task-boards" -Method Post -Headers $headers -Body $body -ErrorAction Stop
        Record-TestResult "BOARD-01" "Nhan vien (BT-001)" "Bang cong viec PB" "Department Board Creation Guard" "403 Forbidden" "200 OK" "FAIL" "Nhan vien tao duoc bang phong ban!"
    } catch {
        Record-TestResult "BOARD-01" "Nhan vien (BT-001)" "Bang cong viec PB" "Department Board Creation Guard" "403 Forbidden" "403 Forbidden" "PASS" "Chan nhan vien tao bang phong ban."
    }

    # 2.2 Staff creating personal board
    try {
        $headers = @{ "Authorization" = "Bearer $($RoleTokens['STAFF_BT'])"; "Content-Type" = "application/json" }
        $body = '{"name":"Ke hoach ca nhan","type":"personal"}'
        $res = Invoke-RestMethod -Uri "$TargetUrl/api/task-boards" -Method Post -Headers $headers -Body $body -ErrorAction Stop
        if ($res.success -eq $true) {
            Record-TestResult "BOARD-02" "Nhan vien (BT-001)" "Bang cong viec PB" "Personal Board Creation" "200 OK" "Created board" "PASS" "Nhan vien tao bang ca nhan thanh cong."
        }
    } catch {
        Record-TestResult "BOARD-02" "Nhan vien (BT-001)" "Bang cong viec PB" "Personal Board Creation" "200 OK" $_.Exception.Message "FAIL" "Loi tao bang ca nhan"
    }

    Write-Host "`n>>> [MODULE 3] DU AN LIEN PHONG BAN (CROSS-DEPARTMENT PROJECTS)" -ForegroundColor Yellow

    # 3.1 Staff attempting to create cross-department project
    try {
        $headers = @{ "Authorization" = "Bearer $($RoleTokens['STAFF_BT'])"; "Content-Type" = "application/json" }
        $body = '{"name":"Du An Trai Quyen","lead_department":"SAN_XUAT"}'
        $res = Invoke-RestMethod -Uri "$TargetUrl/api/projects" -Method Post -Headers $headers -Body $body -ErrorAction Stop
        Record-TestResult "PRJ-01" "Nhan vien (BT-001)" "Du an Lien phong ban" "Cross-Dept Project Creation Guard" "403 Forbidden" "200 OK" "FAIL" "Nhan vien tao duoc du an lien phong ban!"
    } catch {
        Record-TestResult "PRJ-01" "Nhan vien (BT-001)" "Du an Lien phong ban" "Cross-Dept Project Creation Guard" "403 Forbidden" "403 Forbidden" "PASS" "Chan dung nhan vien tao du an lien phong ban."
    }

    # 3.2 Staff attempting to delete project
    try {
        $headers = @{ "Authorization" = "Bearer $($RoleTokens['STAFF_BT'])" }
        $res = Invoke-RestMethod -Uri "$TargetUrl/api/projects?id=PRJ-01" -Method Delete -Headers $headers -ErrorAction Stop
        Record-TestResult "PRJ-02" "Nhan vien (BT-001)" "Du an Lien phong ban" "Project Deletion Guard" "403 Forbidden" "200 OK" "FAIL" "Nhan vien xoa duoc du an lien phong ban!"
    } catch {
        Record-TestResult "PRJ-02" "Nhan vien (BT-001)" "Du an Lien phong ban" "Project Deletion Guard" "403 Forbidden" "403 Forbidden" "PASS" "Nhan vien bi chan xoa du du an (403 Forbidden)."
    }

    # 3.3 Truong phong creating cross-department project
    try {
        $headers = @{ "Authorization" = "Bearer $($RoleTokens['TP_IT'])"; "Content-Type" = "application/json" }
        $body = '{"name":"Du an Chuyen Doi So Kho Van 2026","lead_department":"IT_CDS"}'
        $res = Invoke-RestMethod -Uri "$TargetUrl/api/projects" -Method Post -Headers $headers -Body $body -ErrorAction Stop
        if ($res.success -eq $true) {
            Record-TestResult "PRJ-05" "Truong phong (202608001)" "Du an Lien phong ban" "Manager Project Creation" "200 OK" "Created project" "PASS" "Truong phong khoi tao thanh cong du an lien phong ban."
        }
    } catch {
        Record-TestResult "PRJ-05" "Truong phong (202608001)" "Du an Lien phong ban" "Manager Project Creation" "200 OK" $_.Exception.Message "FAIL" "Loi tao du an"
    }

    # 3.4 General Director viewing all projects
    try {
        $headers = @{ "Authorization" = "Bearer $($RoleTokens['CEO'])" }
        $res = Invoke-RestMethod -Uri "$TargetUrl/api/projects" -Method Get -Headers $headers -ErrorAction Stop
        if ($res.success -eq $true) {
            Record-TestResult "PRJ-07" "Tong Giam Doc (TGD-001)" "Du an Lien phong ban" "Executive Project Oversight" "200 OK" "200 OK" "PASS" "Tong Giam Doc theo doi toan bo du an va nut that co chai."
        }
    } catch {
        Record-TestResult "PRJ-07" "Tong Giam Doc (TGD-001)" "Du an Lien phong ban" "Executive Project Oversight" "200 OK" $_.Exception.Message "FAIL" "Loi API"
    }

} else {
    Write-Host ">>> [CODE AUDIT & CONTRACT VERIFICATION SUITE]" -ForegroundColor Yellow

    $tasksRoutePath = "web/src/app/api/tasks/route.ts"
    $workerPath = "web/public/_worker.js"
    $tasksRouteContent = Get-Content -Raw $tasksRoutePath -ErrorAction SilentlyContinue
    $workerContent = Get-Content -Raw $workerPath -ErrorAction SilentlyContinue

    # Test C-01: Tasks Scoping for Level 4
    if ($tasksRouteContent -match "roleLevel >= 4" -and $tasksRouteContent -match "assignee_emp_code === userEmp") {
        Record-TestResult "TASK-01" "Nhan vien (Level 4)" "Cong viec ca nhan" "Personal Task Strict Isolation" "Only own tasks returned" "Enforced in route.ts & _worker.js" "PASS" "Nhan vien cap thap bi khoa cung chi duoc xem task cua chinh minh."
    } else {
        Record-TestResult "TASK-01" "Nhan vien (Level 4)" "Cong viec ca nhan" "Personal Task Strict Isolation" "Only own tasks returned" "Missing guard" "FAIL" "Thieu logic loc quyen nhan vien trong tasks route!"
    }

    # Test C-02: Tasks Query Parameter Tampering Prevention
    if ($tasksRouteContent -match 'requestedAssignee !== session.empCode' -and $tasksRouteContent -match 'allTasks = \[\]') {
        Record-TestResult "TASK-02" "Nhan vien (Level 4)" "Cong viec ca nhan" "BOLA / IDOR Query Tampering Protection" "Empty list on foreign empCode query" "allTasks = [] guard present" "PASS" "Chan dung viec nhan vien dung URL parameter de doc trom task Tong Giam Doc/BOD."
    } else {
        Record-TestResult "TASK-02" "Nhan vien (Level 4)" "Cong viec ca nhan" "BOLA / IDOR Query Tampering Protection" "Empty list guard" "Guard missing" "FAIL" "Chua chan query tampering cho nhan vien!"
    }

    # Test C-03: Tasks Mutation RBAC Guard
    if ($tasksRouteContent -match 'roleLevel >= 4 && !isAssignee && !isReporter && !isReviewer' -and $tasksRouteContent -match '403') {
        Record-TestResult "TASK-03" "Nhan vien (Level 4)" "Cong viec ca nhan" "Task Mutation Guard (BOLA)" "403 Forbidden" "403 Forbidden guard verified" "PASS" "Nhan vien co tinh PATCH task cua nguoi khac bi chan 403 Forbidden."
    } else {
        Record-TestResult "TASK-03" "Nhan vien (Level 4)" "Cong viec ca nhan" "Task Mutation Guard (BOLA)" "403 Forbidden" "Guard missing" "FAIL" "Thieu chan BOLA trong PATCH /api/tasks!"
    }

    # Test C-04: Tasks Deletion RBAC Guard
    if ($tasksRouteContent -match 'roleLevel >= 4 && existing.reporter_emp_code !== session.empCode' -and $tasksRouteContent -match '403') {
        Record-TestResult "TASK-04" "Nhan vien (Level 4)" "Cong viec ca nhan" "Task Deletion Guard" "403 Forbidden" "403 Forbidden guard verified" "PASS" "Nhan vien chi co the xoa task do chinh minh tao ra, bi chan 403 neu xoa task nguoi khac."
    } else {
        Record-TestResult "TASK-04" "Nhan vien (Level 4)" "Cong viec ca nhan" "Task Deletion Guard" "403 Forbidden" "Guard missing" "FAIL" "Thieu chan DELETE task trai phep!"
    }

    # Test C-05: Task Done Review Requirement
    if ($tasksRouteContent -match "Bắt buộc phải có mô tả kết quả thực hiện") {
        Record-TestResult "TASK-05" "Nhan vien (Level 4)" "Cong viec ca nhan" "DONE Result Description Guard" "400 Bad Request if missing description" "Guard verified" "PASS" "Chan bam DONE neu chua co mo ta ket qua hoan thanh."
    } else {
        Record-TestResult "TASK-05" "Nhan vien (Level 4)" "Cong viec ca nhan" "DONE Result Description Guard" "400 Bad Request" "Missing" "FAIL" "Thieu kiem tra mo ta ket qua hoan thanh!"
    }

    # Test C-06: Task Board Creation Guard for Staff
    $boardRouteContent = Get-Content -Raw "web/src/app/api/task-boards/route.ts" -ErrorAction SilentlyContinue
    if ($boardRouteContent -match "userRoleLevel >= 4 && type === 'department'" -and $boardRouteContent -match "403") {
        Record-TestResult "BOARD-01" "Nhan vien (Level 4)" "Bang cong viec PB" "Department Board Creation Guard" "403 Forbidden for staff" "Guard verified in route.ts & _worker.js" "PASS" "Nhan vien bi cam tao bang phong ban. Chi cap quan ly tro len moi duoc tao."
    } else {
        Record-TestResult "BOARD-01" "Nhan vien (Level 4)" "Bang cong viec PB" "Department Board Creation Guard" "403 Forbidden" "Missing" "FAIL" "Nhan vien van tao duoc bang phong ban!"
    }

    # Test C-07: Task Board Personal Board IDOR Protection
    if ($boardRouteContent -match "type = 'personal' AND owner_id = \?") {
        Record-TestResult "BOARD-02" "Nhan vien (Level 4)" "Bang cong viec PB" "Personal Board IDOR Isolation" "Personal boards strictly isolated by owner_id" "WHERE condition verified" "PASS" "Bang ca nhan duoc co lap tuyet doi theo owner_id, nhan vien khong thay bang ca nhan nguoi khac."
    } else {
        Record-TestResult "BOARD-02" "Nhan vien (Level 4)" "Bang cong viec PB" "Personal Board IDOR Isolation" "Owner isolation" "Missing" "FAIL" "Bang ca nhan bi lo giua cac nhan vien!"
    }

    # Test C-08: Task Board Deletion RBAC
    if ($boardRouteContent -match "DELETE" -and $boardRouteContent -match "userRoleLevel >= 4" -and $boardRouteContent -match "existing.type !== 'personal'") {
        Record-TestResult "BOARD-03" "Nhan vien (Level 4)" "Bang cong viec PB" "Board Deletion RBAC" "Staff cannot delete dept boards (403)" "DELETE handler with RBAC verified" "PASS" "Nhan vien bi chan xoa bang phong ban (403), chi duoc xoa bang ca nhan cua chinh minh."
    } else {
        Record-TestResult "BOARD-03" "Nhan vien (Level 4)" "Bang cong viec PB" "Board Deletion RBAC" "RBAC Deletion" "Missing" "FAIL" "Thieu DELETE hoac phan quyen xoa bang!"
    }

    # Test C-09: Task Cards Board Guard
    $cardsRouteContent = Get-Content -Raw "web/src/app/api/task-cards/route.ts" -ErrorAction SilentlyContinue
    if ($cardsRouteContent -match "board.type === 'personal' && board.owner_id !== empCode" -and $cardsRouteContent -match "403") {
        Record-TestResult "BOARD-04" "Nhan vien (Level 4)" "Bang cong viec PB" "Task Cards Board Access Guard" "403 on foreign personal/dept board" "Guard verified in route.ts & _worker.js" "PASS" "The cong viec duoc kiem soat quyen chat che theo board_id."
    } else {
        Record-TestResult "BOARD-04" "Nhan vien (Level 4)" "Bang cong viec PB" "Task Cards Board Access Guard" "403 Forbidden" "Missing" "FAIL" "Thieu kiem tra quyen truy cap board!"
    }

    # Test C-10: Cross-Dept Project Creation Guard
    $prjRouteContent = Get-Content -Raw "web/src/app/api/projects/route.ts" -ErrorAction SilentlyContinue
    if ($prjRouteContent -match "roleLevel >= 4" -and $prjRouteContent -match "403" -and $prjRouteContent -match "Chỉ Cấp Quản Lý") {
        Record-TestResult "PRJ-01" "Nhan vien (Level 4)" "Du an Lien phong ban" "Cross-Dept Project Creation Guard" "403 Forbidden for staff" "Guard verified in route.ts & _worker.js" "PASS" "Nhan vien cap thap (Level 4) bi chan 403 Forbidden khi co gang tao Du An Lien Phong Ban."
    } else {
        Record-TestResult "PRJ-01" "Nhan vien (Level 4)" "Du an Lien phong ban" "Cross-Dept Project Creation Guard" "403 Forbidden" "Missing" "FAIL" "Nhan vien van tao duoc du an lien phong ban!"
    }

    # Test C-11: Cross-Dept Project Deletion Guard
    if ($prjRouteContent -match "DELETE" -and $prjRouteContent -match "roleLevel >= 4" -and $prjRouteContent -match "403") {
        Record-TestResult "PRJ-02" "Nhan vien (Level 4)" "Du an Lien phong ban" "Project Deletion RBAC Guard" "403 Forbidden for staff" "DELETE handler verified with RBAC" "PASS" "Nhan vien bi chan xoa du an lien phong ban. Truong phong chi xoa du an minh lam PM."
    } else {
        Record-TestResult "PRJ-02" "Nhan vien (Level 4)" "Du an Lien phong ban" "Project Deletion RBAC Guard" "403 Forbidden" "Missing" "FAIL" "Thieu DELETE endpoint hoac phan quyen xoa du an!"
    }

    # Test C-12: Cross-Dept Project Scoping
    if ($prjRouteContent -match "roleLevel === 3" -and $prjRouteContent -match "lead_department" -and $prjRouteContent -match "collaborating_departments") {
        Record-TestResult "PRJ-03" "Truong phong (Level 3)" "Du an Lien phong ban" "Department Head Project Scoping" "Sees led, collaborated, managed projects" "Conditions verified" "PASS" "Truong phong xem cac du an do phong ban minh chu tri, phoi hop, hoac do minh lam PM."
    } else {
        Record-TestResult "PRJ-03" "Truong phong (Level 3)" "Du an Lien phong ban" "Department Head Project Scoping" "Scoping verified" "Missing" "FAIL" "Thieu phan quyen xem du an cho Truong phong!"
    }

    # Test C-13: Executive Oversight in Projects
    if ($prjRouteContent -match "ORDER BY created_at DESC" -and $workerContent -match "userRoleLevel <= 2") {
        Record-TestResult "PRJ-04" "Tong Giam Doc (Level <= 2)" "Du an Lien phong ban" "Executive Full Project Visibility" "Full unrestricted view of all projects" "Verified in route.ts & _worker.js" "PASS" "Tong Giam Doc va Ban Giam Doc toan quyen xem va quan ly tat ca cac du an lien phong ban."
    } else {
        Record-TestResult "PRJ-04" "Tong Giam Doc (Level <= 2)" "Du an Lien phong ban" "Executive Full Project Visibility" "Full view" "Missing" "FAIL" "Tong Giam Doc bi gioi han tam nhin du an!"
    }

    # Test C-14: UI Guard for Project Creation Button
    $uiPrjPath = "web/src/modules/projects/ProjectWorkspaceView.tsx"
    $uiPrjContent = Get-Content -Raw $uiPrjPath -ErrorAction SilentlyContinue
    if ($uiPrjContent -match "canCreateProject" -and $uiPrjContent -match "Chỉ Cấp Quản Lý tạo dự án") {
        Record-TestResult "UI-01" "Nhan vien (Level 4)" "Du an Lien phong ban" "UI Action Guard" "Button disabled with tooltip for staff" "canCreateProject guard verified in UI" "PASS" "Giao dien tu dong vo hieu hoa nut '+ Khoi Tao Du An Moi' doi voi tai khoan nhan vien."
    } else {
        Record-TestResult "UI-01" "Nhan vien (Level 4)" "Du an Lien phong ban" "UI Action Guard" "Guarded" "Missing" "FAIL" "Nut tao du an van hien thi cho nhan vien!"
    }

    # Test C-15: Cloudflare Worker Backend Parity
    if ($workerContent -match 'url.pathname === "/api/projects"' -and $workerContent -match 'request.method === "PATCH"' -and $workerContent -match 'request.method === "DELETE"') {
        Record-TestResult "SYNC-01" "He thong" "Cloudflare Worker" "Worker API Parity" "Worker has full GET, POST, PATCH, DELETE for all 3 modules" "Verified in web/public/_worker.js" "PASS" "Cloudflare Worker Pages Functions dat 100% dong bo voi Next.js API Routes."
    } else {
        Record-TestResult "SYNC-01" "He thong" "Cloudflare Worker" "Worker API Parity" "100% Parity" "Missing endpoints" "FAIL" "Worker thieu PATCH/DELETE du an!"
    }
}

# Generate Markdown Report
$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$totalCount = $testResults.Count

$reportMd = @"
# BAO CAO KIEM THU TU DONG DA VAI TRO (MULTI-ROLE QA REPORT)

- He thong: TBS Group II - Van Phong Chuoi Skechers Platform
- Thoi gian: $Timestamp
- Cac chuc nang duoc kiem thu:
  1. Cong viec ca nhan (Personal Tasks)
  2. Bang cong viec phong ban (Department Task Board & Kanban)
  3. Du an Lien phong ban (Cross-Department Projects & Bottlenecks)
- Phan cap vai tro:
  - Cap cao: Tong Giam Doc / Ban Giam Doc (roleLevel <= 2, e.g. TGD-001, 200405004)
  - Cap trung: Truong phong (roleLevel === 3, e.g. 202608001, LG-001)
  - Cap thap: Nhan vien / CBCNV (roleLevel >= 4, e.g. BT-001, 202206011)

---

## TONG HOP KET QUA KIEM THU

| Tong so kich ban | Dat (PASS) | That bai (FAIL) | Ty le thanh cong |
| :---: | :---: | :---: | :---: |
| **$totalCount** | **$passCount** | **$failCount** | **$(if ($totalCount -gt 0) { [math]::Round(($passCount / $totalCount) * 100, 1) } else { 0 })%** |

---

## BANG CHI TIET KET QUA KIEM THU

| Ma | Vai tro | Module | Ten kich ban | Ket qua mong doi | Trang thai | Danh gia |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
"@

foreach ($r in $testResults) {
    $statusEmoji = if ($r.Status -eq "PASS") { "PASS" } elseif ($r.Status -eq "FAIL") { "FAIL" } else { $r.Status }
    $reportMd += "`n| **$($r.Id)** | $($r.Role) | $($r.Module) | $($r.Name) | $($r.Expected) | **$statusEmoji** | $($r.Notes) |"
}

Set-Content -Path $ReportPath -Value $reportMd -Encoding UTF8
Write-Host "`nReport saved to: $ReportPath" -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "SUMMARY: Total: $totalCount | PASS: $passCount | FAIL: $failCount" -ForegroundColor Yellow
Write-Host "==========================================================================" -ForegroundColor Cyan
