# Script to analyze department breakdown and counts from backup-vpchuoi-20261005.sql
$filePath = Join-Path $PSScriptRoot "..\backup-vpchuoi-20261005.sql"
if (-not (Test-Path $filePath)) {
    Write-Error "File not found: $filePath"
    exit 1
}

$userLines = Get-Content $filePath | Where-Object { $_ -like 'INSERT INTO "users"*' }
$sysUserLines = Get-Content $filePath | Where-Object { $_ -like 'INSERT INTO "sys_users"*' }
Write-Host "Total user lines found in users table: $($userLines.Count)"
Write-Host "Total user lines found in sys_users table: $($sysUserLines.Count)"

$deptCounts = @{}
$roleCounts = @{}
$deptRoleBreakdown = @{}

foreach ($line in $userLines) {
    # Extract values inside VALUES (...)
    if ($line -match 'VALUES\((.*)\);') {
        $valStr = $matches[1]
        # Split by comma considering quotes
        # Regex to split SQL values
        $vals = [regex]::Matches($valStr, "('(''|[^'])*'|[^,]+)") | ForEach-Object { 
            $v = $_.Value.Trim()
            if ($v.StartsWith("'") -and $v.EndsWith("'")) {
                $v = $v.Substring(1, $v.Length - 2).Replace("''", "'")
            }
            $v
        }
        
        # Columns in INSERT INTO "users":
        # 0: id
        # 1: emp_code
        # 2: email
        # 3: name
        # 4: phone
        # 5: password_hash
        # 6: role_id
        # 7: department_id
        # 8: title
        # 9: department
        # 10: role_code
        # 11: status
        # 12: avatar_url
        # 13: created_at
        # 14: updated_at
        # 15: version
        # 16: ngay_vao
        # 17: vtcv_hien_tai
        # 18: vtcv_sap
        # 19: vtcv_sap_xep
        # 20: bo_phan_moi
        # 21: phong_ban_hien_tai
        # 22: pb_sap_xep
        
        $dept = if ($vals.Count -gt 9) { $vals[9] } else { "Unknown" }
        $boPhanMoi = if ($vals.Count -gt 20) { $vals[20] } else { "" }
        $roleCode = if ($vals.Count -gt 10) { $vals[10] } else { "Unknown" }
        
        $key = if ($boPhanMoi -and $boPhanMoi -ne "NULL" -and $boPhanMoi -ne "") { $boPhanMoi } else { $dept }
        
        $deptCounts[$key] = ($deptCounts[$key] + 1)
        $roleCounts[$roleCode] = ($roleCounts[$roleCode] + 1)
    }
}

Write-Host "`n================ DEPARTMENTS BREAKDOWN ================"
$deptCounts.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
    Write-Host ("{0,-35} : {1,5}" -f $_.Key, $_.Value)
}

Write-Host "`n================ ROLES BREAKDOWN ================"
$roleCounts.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
    Write-Host ("{0,-25} : {1,5}" -f $_.Key, $_.Value)
}
