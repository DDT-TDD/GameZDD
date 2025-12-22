# Clean up unnecessary files
$filesToRemove = @(
    "ALL_TASKS_COMPLETE.md",
    "FINAL_CHECKLIST.md",
    "FINAL_COMPLETION_REPORT.md",
    "GAME_AUDIT_REPORT.md",
    "GITHUB_PUBLISH_GUIDE.md",
    "GITHUB_RELEASE_README.md",
    "GITHUB_RELEASE_TEMPLATE.md",
    "GITHUB_SETUP_GUIDE.md",
    "INSTALLATION_GUIDE.md",
    "MISSION_COMPLETE.txt",
    "MIT_COMPATIBILITY_VERIFICATION.md",
    "PROJECT_COMPLETION_SUMMARY.md",
    "QUICK_SUMMARY.txt",
    "QUICK_UPLOAD.md",
    "RELEASE_CHECKLIST.md",
    "UPLOAD_READY.md",
    "USER_GUIDE.md",
    "DOCUMENTATION_INDEX_RELEASE.md",
    "00_START_HERE.md"
)

foreach ($file in $filesToRemove) {
    $path = Join-Path -Path (Get-Location) -ChildPath $file
    if (Test-Path $path) {
        Remove-Item $path -Force
        Write-Host "Deleted: $file"
    }
}

Write-Host "`nCleanup complete!"
dir | Select-Object Name
