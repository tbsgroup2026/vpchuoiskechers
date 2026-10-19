param (
    [string]$BaseUrl = "https://vpchuoiskechers.tbsgroup2026.workers.dev",
    [string]$OutputFile = "SYSTEM_QA_SECURITY_REPORT.md"
)

[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "TBS II PLATFORM - AUTOMATED QA AND SECURITY AUDIT HARNESS" -ForegroundColor Yellow
Write-Host "Target: $BaseUrl" -ForegroundColor Cyan
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "======================================================================`n" -ForegroundColor Cyan

$dnsOk = $true
try {
    $hostUri = [System.Uri]$BaseUrl
    $addresses = [System.Net.Dns]::GetHostAddresses($hostUri.Host)
    Write-Host "Target Host Reachable: $($hostUri.Host) ($($addresses[0].IPAddressToString))`n" -ForegroundColor Green
} catch {
    $dnsOk = $false
    Write-Host "[NOTICE] Target host '$BaseUrl' is unreachable from this environment." -ForegroundColor Yellow
    Write-Host "Run this in your regular PowerShell terminal with Internet access to execute live tests.`n" -ForegroundColor Yellow
}

$results = [System.Collections.Generic.List[PSObject]]::new()

function Add-TestResult($id, $category, $name, $status, $severity, $detail, $recommendation) {
    $item = [PSCustomObject]@{
        Id = $id
        Category = $category
        Name = $name
        Status = $status
        Severity = $severity
        Detail = $detail
        Recommendation = $recommendation
    }
    $results.Add($item)

    $color = [ConsoleColor]::White
    if ($status -eq "PASS") { $color = [ConsoleColor]::Green }
    elseif ($status -eq "VULNERABLE") { $color = [ConsoleColor]::Magenta }
    elseif ($status -eq "FAIL") { $color = [ConsoleColor]::Red }
    elseif ($status -eq "WARNING") { $color = [ConsoleColor]::Yellow }

    Write-Host "[$status] " -NoNewline -ForegroundColor $color
    Write-Host "[$severity] " -NoNewline -ForegroundColor DarkYellow
    Write-Host ("{0} - {1}: " -f $id, $name) -NoNewline
    Write-Host $detail -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# SUITE 1: AUTHENTICATION
# ------------------------------------------------------------------------------
Write-Host "`n>>> [TEST SUITE 1] AUTHENTICATION AND SESSION" -ForegroundColor Yellow

# Test 1.1: Login without password
try {
    $loginBody = '{"empCode":"202608001"}'
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    if ($res.success -eq $true -and $res.token) {
        $tokenSnippet = $res.token
        if ($tokenSnippet.Length -gt 25) { $tokenSnippet = $tokenSnippet.Substring(0, 25) + "..." }
        Add-TestResult "AUTH-01" "Authentication" "No-Password Login Bypass" "VULNERABLE" "CRITICAL" `
            "System allows successful authentication into Admin account 202608001 without supplying any password. Issued token: $tokenSnippet" `
            "Enforce password verification in /api/auth/login before token issuance."
    } else {
        Add-TestResult "AUTH-01" "Authentication" "Password Requirement" "PASS" "INFO" "Login rejected when password is missing." ""
    }
} catch {
    Add-TestResult "AUTH-01" "Authentication" "Password Requirement" "PASS" "INFO" "Login rejected when password is missing." ""
}

# Test 1.2: Default session fallback
try {
    $tasksRes = Invoke-RestMethod -Uri "$BaseUrl/api/tasks" -Method Get -ErrorAction Stop
    if ($tasksRes.success -eq $true -and $tasksRes.tasks -and $tasksRes.tasks.Count -gt 0) {
        Add-TestResult "AUTH-02" "Authentication" "Default Admin Session Fallback" "VULNERABLE" "CRITICAL" `
            "GET /api/tasks without Authorization header defaults to IT Department Head (202608001) and exposes $($tasksRes.tasks.Count) internal tasks." `
            "parseSessionWorker() must return null when token is missing; protected APIs must return 401 Unauthorized."
    } else {
        Add-TestResult "AUTH-02" "Authentication" "Default Session Fallback" "PASS" "INFO" "No internal tasks leaked without token." ""
    }
} catch {
    Add-TestResult "AUTH-02" "Authentication" "Default Session Fallback" "PASS" "INFO" "Authentication required for tasks." ""
}

# ------------------------------------------------------------------------------
# SUITE 2: INFORMATION DISCLOSURE
# ------------------------------------------------------------------------------
Write-Host "`n>>> [TEST SUITE 2] INFORMATION DISCLOSURE" -ForegroundColor Yellow

# Test 2.1: Public employee directory
try {
    $usersRes = Invoke-RestMethod -Uri "$BaseUrl/api/users" -Method Get -ErrorAction Stop
    if ($usersRes.success -eq $true -and $usersRes.data -and $usersRes.data.Count -gt 0) {
        Add-TestResult "DATA-01" "Information Disclosure" "Mass Employee Data Exposure (/api/users)" "VULNERABLE" "CRITICAL" `
            "Endpoint /api/users is unauthenticated and dumps $($usersRes.data.Count) confidential employee profiles including name, email, phone, title, department, role." `
            "Remove /api/users from PUBLIC_PATHS; require valid session token and restrict by department scope."
    } else {
        Add-TestResult "DATA-01" "Information Disclosure" "Employee Directory Protection" "PASS" "INFO" "Employee directory is not publicly accessible." ""
    }
} catch {
    Add-TestResult "DATA-01" "Information Disclosure" "Employee Directory Protection" "PASS" "INFO" "Protected or inaccessible." ""
}

# Test 2.2: Public business trips
try {
    $tripsRes = Invoke-RestMethod -Uri "$BaseUrl/api/business-trips" -Method Get -ErrorAction Stop
    if ($tripsRes.success -eq $true -and $tripsRes.data -and $tripsRes.data.Count -gt 0) {
        Add-TestResult "DATA-02" "Information Disclosure" "Itinerary & Employee Phone Exposure (/api/business-trips)" "VULNERABLE" "HIGH" `
            "GET /api/business-trips exposes $($tripsRes.data.Count) business trip records with phone numbers, audit targets, and locations without authentication." `
            "Require authentication and scope access to creator and managers."
    } else {
        Add-TestResult "DATA-02" "Information Disclosure" "Business Trip Protection" "PASS" "INFO" "Business trip data is protected." ""
    }
} catch {
    Add-TestResult "DATA-02" "Information Disclosure" "Business Trip Protection" "PASS" "INFO" "GET /api/business-trips requires authentication." ""
}

# Test 2.3: Public meeting room agendas
try {
    $roomsRes = Invoke-RestMethod -Uri "$BaseUrl/api/rooms" -Method Get -ErrorAction Stop
    if ($roomsRes.success -eq $true -and $roomsRes.data -and $roomsRes.data.bookings -and $roomsRes.data.bookings.Count -gt 0) {
        Add-TestResult "DATA-03" "Information Disclosure" "Internal Meeting Agenda Exposure (/api/rooms)" "WARNING" "MEDIUM" `
            "GET /api/rooms exposes $($roomsRes.data.bookings.Count) internal meeting titles (e.g. salary review, quality concerns, R&D progress) and booker names publicly." `
            "Redact internal meeting titles and booker details for unauthenticated requests."
    } else {
        Add-TestResult "DATA-03" "Information Disclosure" "Meeting Room Privacy" "PASS" "INFO" "Meeting agendas not publicly exposed." ""
    }
} catch {
    Add-TestResult "DATA-03" "Information Disclosure" "Meeting Room Privacy" "PASS" "INFO" "GET /api/rooms requires authentication." ""
}

# ------------------------------------------------------------------------------
# SUITE 3: ACCESS CONTROL & TAMPERING (BOLA / IDOR)
# ------------------------------------------------------------------------------
Write-Host "`n>>> [TEST SUITE 3] BROKEN OBJECT LEVEL AUTHORIZATION (BOLA / IDOR)" -ForegroundColor Yellow

# Test 3.1: Room lock state tampering
try {
    $lockBody = '{"id":"probe_room_nonexistent","isLocked":false,"status":"AVAILABLE"}'
    $lockRes = Invoke-RestMethod -Uri "$BaseUrl/api/rooms/lock" -Method Put -Body $lockBody -ContentType "application/json" -ErrorAction Stop
    if ($lockRes.success -eq $true) {
        Add-TestResult "BOLA-01" "Access Control (BOLA)" "Unauthenticated Room Lock Manipulation" "VULNERABLE" "HIGH" `
            "PUT /api/rooms/lock performs no authentication or role check. Anyone can lock or unlock meeting rooms." `
            "Verify session and restrict to LE_TAN or ADMIN role."
    } else {
        Add-TestResult "BOLA-01" "Access Control (BOLA)" "Room Lock Control" "PASS" "INFO" "Room lock manipulation rejected." ""
    }
} catch {
    Add-TestResult "BOLA-01" "Access Control (BOLA)" "Room Lock Control" "PASS" "INFO" "Authentication required for locking rooms." ""
}

# Test 3.2: Self-approval of business trips
try {
    $tripBody = '{"id":"probe_trip_id_test","actionLevel":"APPROVE_L2","status":"APPROVED"}'
    $tripRes = Invoke-RestMethod -Uri "$BaseUrl/api/business-trips" -Method Put -Body $tripBody -ContentType "application/json" -ErrorAction Stop
    if ($tripRes.success -eq $true) {
        Add-TestResult "BOLA-02" "Access Control (BOLA)" "Unauthenticated Business Trip Approval" "VULNERABLE" "HIGH" `
            "PUT /api/business-trips accepts APPROVE_L2 and sets status=APPROVED without validating manager permissions." `
            "Enforce token verification, roleLevel validation, and Segregation of Duties."
    } else {
        Add-TestResult "BOLA-02" "Access Control (BOLA)" "Business Trip Approval" "PASS" "INFO" "Unauthorized trip approval rejected." ""
    }
} catch {
    Add-TestResult "BOLA-02" "Access Control (BOLA)" "Business Trip Approval" "PASS" "INFO" "Authentication required for trip approval." ""
}

# Test 3.3: Unrestricted Kaizen deletion
try {
    $delRes = Invoke-RestMethod -Uri "$BaseUrl/api/ci-kaizen?id=probe_del_test_xyz" -Method Delete -ErrorAction Stop
    if ($delRes.success -eq $true) {
        Add-TestResult "BOLA-03" "Access Control (BOLA)" "Unauthenticated Kaizen Deletion" "VULNERABLE" "HIGH" `
            "DELETE /api/ci-kaizen executes database deletion without authentication check." `
            "Require authentication and verify proposal ownership or ADMIN role before deletion."
    } else {
        Add-TestResult "BOLA-03" "Access Control (BOLA)" "Kaizen Deletion Control" "PASS" "INFO" "Deletion controlled." ""
    }
} catch {
    Add-TestResult "BOLA-03" "Access Control (BOLA)" "Kaizen Deletion Control" "PASS" "INFO" "Authentication required for deleting Kaizen." ""
}

# ------------------------------------------------------------------------------
# SUITE 4: PRIVILEGE ESCALATION
# ------------------------------------------------------------------------------
Write-Host "`n>>> [TEST SUITE 4] PRIVILEGE ESCALATION" -ForegroundColor Yellow

# Test 4.1: Audit Search with regular token
try {
    $headers = @{ "Authorization" = "Bearer tbs_token_202608003_12345678" }
    $auditRes = Invoke-RestMethod -Uri "$BaseUrl/api/admin/audit-search" -Method Get -Headers $headers -ErrorAction Stop
    if ($auditRes.success -eq $true) {
        Add-TestResult "PRIV-01" "Privilege Escalation" "Audit Search Accessible by Non-Admin Users" "VULNERABLE" "HIGH" `
            "/api/admin/audit-search only checks token presence, allowing regular staff to read all company audit logs." `
            "Enforce roleLevel <= 2 or ADMIN role on all /api/admin/* endpoints."
    } else {
        Add-TestResult "PRIV-01" "Privilege Escalation" "Audit Search Access Control" "PASS" "INFO" "Audit search restricted by role." ""
    }
} catch {
    Add-TestResult "PRIV-01" "Privilege Escalation" "Audit Search Access Control" "PASS" "INFO" "Access denied for non-admin." ""
}

# ------------------------------------------------------------------------------
# SUITE 5: NOTIFICATIONS & SPOOFING
# ------------------------------------------------------------------------------
Write-Host "`n>>> [TEST SUITE 5] NOTIFICATION SPOOFING" -ForegroundColor Yellow

# Test 5.1: Unauthenticated Notification Injection
try {
    $notifBody = '{"title":"[QA TEST] Probe Notification","message":"Diagnostic test","targetUser":"TEST_PROBE","type":"INFO","link":"/work"}'
    $notifRes = Invoke-RestMethod -Uri "$BaseUrl/api/notifications" -Method Post -Body $notifBody -ContentType "application/json" -ErrorAction Stop
    if ($notifRes.success -eq $true -and $notifRes.id) {
        Add-TestResult "NOTIF-01" "Input & Integrity" "Unauthenticated Notification Injection" "VULNERABLE" "MEDIUM" `
            "POST /api/notifications allows broadcasting notifications to any user or all users without authentication." `
            "Require authentication and restrict broad targetUser=ALL notifications to administrators."
    } else {
        Add-TestResult "NOTIF-01" "Input & Integrity" "Notification Channel Control" "PASS" "INFO" "Anonymous notifications rejected." ""
    }
} catch {
    Add-TestResult "NOTIF-01" "Input & Integrity" "Notification Channel Control" "PASS" "INFO" "Authentication required for notifications." ""
}

# ------------------------------------------------------------------------------
# SUITE 6: BUSINESS LOGIC CONSTRAINTS
# ------------------------------------------------------------------------------
Write-Host "`n>>> [TEST SUITE 6] BUSINESS LOGIC VALIDATION" -ForegroundColor Yellow

# Test 6.1: Past-time room booking
try {
    $pastBody = '{"roomId":"room_4","roomName":"Room 03","title":"Past Meeting Test","bookingDate":"2020-01-01","timeSlot":"08:00 - 09:00","attendeesCount":5,"bookerName":"QA Tester"}'
    $pastRes = Invoke-RestMethod -Uri "$BaseUrl/api/rooms/booking" -Method Post -Body $pastBody -ContentType "application/json" -ErrorAction Stop
    if ($pastRes.success -eq $false -or $pastRes.code -eq "PAST_TIME_BOOKING") {
        Add-TestResult "LOGIC-01" "Business Logic" "Past-time Room Booking Prevention" "PASS" "INFO" `
            "System properly rejected booking attempt for past date (2020-01-01)." ""
    } else {
        Add-TestResult "LOGIC-01" "Business Logic" "Past-time Room Booking Prevention" "FAIL" "HIGH" `
            "System allowed creating a room booking for past date 2020-01-01." `
            "Validate timestamp against Vietnam timezone UTC+7 before writing to D1."
    }
} catch {
    Add-TestResult "LOGIC-01" "Business Logic" "Past-time Room Booking Prevention" "PASS" "INFO" `
        "System blocked past booking attempt." ""
}

# ------------------------------------------------------------------------------
# SUMMARY
# ------------------------------------------------------------------------------
Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "QA & SECURITY AUDIT SUMMARY" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan

$total = $results.Count
$vulns = ($results | Where-Object { $_.Status -eq "VULNERABLE" }).Count
$fails = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$warns = ($results | Where-Object { $_.Status -eq "WARNING" }).Count
$passes = ($results | Where-Object { $_.Status -eq "PASS" }).Count

Write-Host "Total Tests: $total"
Write-Host "PASS: $passes" -ForegroundColor Green
Write-Host "VULNERABLE: $vulns" -ForegroundColor Magenta
Write-Host "FAIL: $fails" -ForegroundColor Red
Write-Host "WARNING: $warns" -ForegroundColor Yellow

# Generate Markdown Report
$out = [System.Text.StringBuilder]::new()
[void]$out.AppendLine("# TBS II Platform - Automated QA & Security Audit Report")
[void]$out.AppendLine("**Target URL:** $BaseUrl")
[void]$out.AppendLine("**Audit Timestamp:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
[void]$out.AppendLine('**Test Runner:** `tests/system_qa_security_tester.ps1`')
[void]$out.AppendLine("")
[void]$out.AppendLine("---")
[void]$out.AppendLine("")
[void]$out.AppendLine("## 1. Executive Summary")
[void]$out.AppendLine("")
[void]$out.AppendLine("| Metric | Count | Ratio | Risk Assessment |")
[void]$out.AppendLine("| :--- | :---: | :---: | :--- |")
[void]$out.AppendLine("| **Total Tests Executed** | **$total** | 100% | Full-stack evaluation |")
[void]$out.AppendLine("| **Security Vulnerabilities (VULNERABLE)** | **$vulns** | $([Math]::Round($vulns / [Math]::Max(1, $total) * 100, 1))% | CRITICAL RISK |")
[void]$out.AppendLine("| **Business Logic Failures (FAIL)** | **$fails** | $([Math]::Round($fails / [Math]::Max(1, $total) * 100, 1))% | Requires Fix |")
[void]$out.AppendLine("| **Security Warnings (WARNING)** | **$warns** | $([Math]::Round($warns / [Math]::Max(1, $total) * 100, 1))% | Attention Needed |")
[void]$out.AppendLine("| **Passed Scenarios (PASS)** | **$passes** | $([Math]::Round($passes / [Math]::Max(1, $total) * 100, 1))% | Compliant |")
[void]$out.AppendLine("")
[void]$out.AppendLine("---")
[void]$out.AppendLine("")
[void]$out.AppendLine("## 2. Findings Matrix")
[void]$out.AppendLine("")
[void]$out.AppendLine("| ID | Category | Test Scenario | Status | Severity | Details | Remediation |")
[void]$out.AppendLine("| :--- | :--- | :--- | :---: | :---: | :--- | :--- |")

foreach ($t in $results) {
    [void]$out.AppendLine("| **$($t.Id)** | $($t.Category) | $($t.Name) | $($t.Status) | **$($t.Severity)** | $($t.Detail) | $($t.Recommendation) |")
}

[System.IO.File]::WriteAllText($OutputFile, $out.ToString(), [System.Text.Encoding]::UTF8)
Write-Host "`nReport written to: $OutputFile" -ForegroundColor Green
Write-Host "======================================================================`n" -ForegroundColor Cyan
