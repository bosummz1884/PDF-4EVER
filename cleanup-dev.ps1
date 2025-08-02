# PowerShell Cleanup Script for Node, VS Code, Vite, and Visual Studio Projects

Write-Host "Starting cleanup... Please ensure Visual Studio and VS Code are CLOSED." -ForegroundColor Yellow

# 1. Clean project folders
$foldersToDelete = @("node_modules", "dist", "build", ".next", ".turbo", ".cache", ".vs", "out")
foreach ($folder in $foldersToDelete) {
    if (Test-Path $folder) {
        Write-Host "Deleting $folder ..." -ForegroundColor Cyan
        Remove-Item -Recurse -Force $folder
    }
}

# 2. Clean Vite cache (inside node_modules)
$viteCache = "node_modules\.vite"
if (Test-Path $viteCache) {
    Write-Host "Deleting Vite cache ..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force $viteCache
}

# 3. Clean TypeScript build info files
$tsbuildInfoFiles = Get-ChildItem -Recurse -Filter "*.tsbuildinfo"
foreach ($file in $tsbuildInfoFiles) {
    Write-Host "Deleting $($file.FullName) ..." -ForegroundColor Cyan
    Remove-Item -Force $file.FullName
}

# 4. Clean npm cache
Write-Host "Cleaning npm cache ..." -ForegroundColor Cyan
npm cache clean --force

# 5. Clean VS Code cache (user-level)
$vsCodeCacheDirs = @(
    "$env:APPDATA\Code\Cache",
    "$env:APPDATA\Code\CachedData",
    "$env:APPDATA\Code\CachedExtensions"
)
foreach ($dir in $vsCodeCacheDirs) {
    if (Test-Path $dir) {
        Write-Host "Cleaning VS Code cache at $dir ..." -ForegroundColor Cyan
        Remove-Item -Recurse -Force $dir
    }
}

# 6. Clean Windows TEMP files
Write-Host "Cleaning Windows TEMP files ..." -ForegroundColor Cyan
$tempFiles = Get-ChildItem -Path $env:TEMP\* -Recurse -ErrorAction SilentlyContinue
foreach ($tempFile in $tempFiles) {
    try {
        Remove-Item -Recurse -Force $tempFile.FullName -ErrorAction SilentlyContinue
    } catch {
        # Skip files that are in use
    }
}

Write-Host "Cleanup complete! You can now reopen Visual Studio/VS Code and reinstall dependencies." -ForegroundColor Green
