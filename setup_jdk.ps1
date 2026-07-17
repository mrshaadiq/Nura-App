# setup_jdk.ps1
# Script to install local JDK 17 for Expo/React Native Android builds

$ErrorActionPreference = "Stop"

$jdkDir = Join-Path $PSScriptRoot ".jdk"
if (-not (Test-Path $jdkDir)) {
    New-Item -ItemType Directory -Path $jdkDir | Out-Null
}

$zipPath = Join-Path $jdkDir "openjdk17.zip"
$downloadUrl = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.12%2B7/OpenJDK17U-jdk_x64_windows_hotspot_17.0.12_7.zip"

Write-Host "Mengunduh JDK 17 (sekitar 150MB)..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath

Write-Host "Mengekstrak JDK 17..." -ForegroundColor Cyan
# Expand to $jdkDir
Expand-Archive -Path $zipPath -DestinationPath $jdkDir -Force
Remove-Item $zipPath -Force

# Find the extracted folder (should be jdk-17.0.12+7)
$extractedFolders = Get-ChildItem -Path $jdkDir -Directory
if ($extractedFolders.Count -eq 0) {
    Write-Error "Tidak dapat menemukan folder JDK hasil ekstrak."
}
$jdkHome = $extractedFolders[0].FullName
$jdkHomeGradleFormat = $jdkHome.Replace("\", "/")

Write-Host "JDK 17 terpasang di: $jdkHome" -ForegroundColor Green

# Update android/gradle.properties
$gradlePropertiesPath = Join-Path $PSScriptRoot "android\gradle.properties"
if (Test-Path $gradlePropertiesPath) {
    $content = Get-Content $gradlePropertiesPath -Raw
    $line = "org.gradle.java.home=$jdkHomeGradleFormat"
    
    if ($content -match "org.gradle.java.home=") {
        # Replace existing
        $content = $content -replace "org.gradle.java.home=.*", $line
    } else {
        # Append to the end
        $content = $content + "`r`n" + $line
    }
    
    Set-Content -Path $gradlePropertiesPath -Value $content -Force
    Write-Host "Berhasil menambahkan org.gradle.java.home ke android/gradle.properties" -ForegroundColor Green
} else {
    Write-Warning "File android/gradle.properties tidak ditemukan. Pastikan Anda berada di folder root proyek."
}

Write-Host "Selesai! Sekarang silakan jalankan 'npm run android' kembali." -ForegroundColor Green
