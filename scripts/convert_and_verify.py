# -*- coding: utf-8 -*-
"""
Update Word Fields and Export to PDF via Word COM Automation.
"""

import os
import subprocess

DOCX_PATH = r"D:\Work\TBS II\Bao_cao_thuc_tap_tot_nghiep.docx"
PDF_PATH = r"D:\Work\TBS II\Bao_cao_thuc_tap_tot_nghiep.pdf"

PS_SCRIPT = f'''
$docxPath = "{DOCX_PATH}"
$pdfPath = "{PDF_PATH}"

Write-Host "Starting Word Application..."
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

try {{
    Write-Host "Opening Document: " $docxPath
    $doc = $word.Documents.Open($docxPath)
    
    Write-Host "Updating all Fields (TOC, Figures, Tables, Page Numbers)..."
    foreach ($field in $doc.Fields) {{
        $field.Update() | Out-Null
    }}
    
    foreach ($toc in $doc.TablesOfContents) {{
        $toc.Update()
    }}
    
    foreach ($tof in $doc.TablesOfFigures) {{
        $tof.Update()
    }}
    
    $pageCount = $doc.ComputeStatistics(2) # 2 = wdStatisticPages
    Write-Host "Total Page Count: " $pageCount
    
    Write-Host "Saving updated docx..."
    $doc.Save()
    
    Write-Host "Exporting to PDF: " $pdfPath
    # 17 = wdFormatPDF
    $doc.SaveAs([ref]$pdfPath, [ref]17)
    
    $doc.Close()
    Write-Host "SUCCESS: PDF generated with $pageCount pages."
}} catch {{
    Write-Host "ERROR: " $_.Exception.Message
}} finally {{
    $word.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}}
'''

def run_conversion():
    ps_file = "scripts/update_and_export.ps1"
    with open(ps_file, "w", encoding="utf-8") as f:
        f.write(PS_SCRIPT)
        
    cmd = ["powershell", "-ExecutionPolicy", "Bypass", "-File", ps_file]
    print("Running PowerShell Word COM automation...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    print("STDOUT:\n", res.stdout)
    print("STDERR:\n", res.stderr)
    
    if os.path.exists(PDF_PATH):
        size_mb = os.path.getsize(PDF_PATH) / (1024 * 1024)
        print(f"PDF file generated successfully! Size: {size_mb:.2f} MB")
    else:
        print("PDF file was not generated.")

if __name__ == "__main__":
    run_conversion()
