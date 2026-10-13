
$docxPath = "D:\Work\TBS II\Bao_cao_thuc_tap_tot_nghiep.docx"
$pdfPath = "D:\Work\TBS II\Bao_cao_thuc_tap_tot_nghiep.pdf"

Write-Host "Starting Word Application..."
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

try {
    Write-Host "Opening Document: " $docxPath
    $doc = $word.Documents.Open($docxPath)
    
    Write-Host "Updating all Fields (TOC, Figures, Tables, Page Numbers)..."
    foreach ($field in $doc.Fields) {
        $field.Update() | Out-Null
    }
    
    foreach ($toc in $doc.TablesOfContents) {
        $toc.Update()
    }
    
    foreach ($tof in $doc.TablesOfFigures) {
        $tof.Update()
    }
    
    $pageCount = $doc.ComputeStatistics(2) # 2 = wdStatisticPages
    Write-Host "Total Page Count: " $pageCount
    
    Write-Host "Saving updated docx..."
    $doc.Save()
    
    Write-Host "Exporting to PDF: " $pdfPath
    # 17 = wdFormatPDF
    $doc.SaveAs([ref]$pdfPath, [ref]17)
    
    $doc.Close()
    Write-Host "SUCCESS: PDF generated with $pageCount pages."
} catch {
    Write-Host "ERROR: " $_.Exception.Message
} finally {
    $word.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
