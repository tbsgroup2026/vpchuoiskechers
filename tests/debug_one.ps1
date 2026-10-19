[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
try {
    $res = Invoke-RestMethod -Uri "https://vpchuoiskechers.tbsgroup2026.workers.dev/api/users" -Method Get
    Write-Host "SUCCESS: $($res.data.Count) records returned"
} catch {
    Write-Host "CATCH EXCEPTION: $($_.Exception.Message)"
    if ($_.Exception.InnerException) {
        Write-Host "INNER: $($_.Exception.InnerException.Message)"
    }
}
