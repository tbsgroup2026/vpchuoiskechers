$patterns = @("Kho & Logistics", "Kho &amp; Logistics", "Kho và Logistics", "kho-logistics")
$results = @()

foreach ($p in $patterns) {
    $matches = Get-ChildItem -Path "d:\Work\TBS II\web\src" -Recurse -File | Select-String -Pattern $p -SimpleMatch
    foreach ($m in $matches) {
        $results += [PSCustomObject]@{
            Pattern = $p
            File = $m.Path.Replace("d:\Work\TBS II\", "")
            Line = $m.LineNumber
            Content = $m.Line.Trim()
        }
    }
}

if ($results.Count -eq 0) {
    Write-Output "SUCCESS: Zero matches found for old patterns in web/src!"
} else {
    $results | Format-Table -AutoSize | Out-String | Write-Output
}
