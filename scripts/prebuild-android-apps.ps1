# Generates two separate Android Studio projects:
#   android-client  → uz.denta.client  (Denta)
#   android-doctor  → uz.denta.doctor  (Denta Doctor)
#
# Usage (from repo root, PowerShell):
#   .\scripts\prebuild-android-apps.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Stop-GradleIfPresent {
  if (Test-Path "android\gradlew.bat") {
    & ".\android\gradlew.bat" --stop 2>$null
  }
}

function Move-AndroidOut([string]$OutDir) {
  if (Test-Path $OutDir) {
    Remove-Item -Recurse -Force $OutDir -ErrorAction SilentlyContinue
  }
  Start-Sleep -Seconds 1
  $code = (Start-Process -FilePath "robocopy" -ArgumentList @("android", $OutDir, "/E", "/MOVE", "/NFL", "/NDL", "/NJH", "/NJS", "/nc", "/ns", "/np") -Wait -PassThru).ExitCode
  # robocopy: 0–7 = success-ish
  if ($code -ge 8 -or -not (Test-Path "$OutDir\settings.gradle")) {
    Copy-Item -Recurse -Force "android" $OutDir
    Remove-Item -Recurse -Force "android" -ErrorAction SilentlyContinue
  }
  if (Test-Path "android") {
    Remove-Item -Recurse -Force "android" -ErrorAction SilentlyContinue
  }
}

function Prebuild-Variant([string]$Variant, [string]$OutDir) {
  Write-Host "`n=== Prebuild $Variant → $OutDir ===" -ForegroundColor Cyan
  Stop-GradleIfPresent
  if (Test-Path "android") {
    cmd /c "rmdir /s /q android" 2>$null
    if (Test-Path "android") {
      throw "Could not remove ./android — close Android Studio / Gradle and retry"
    }
  }

  $env:APP_VARIANT = $Variant
  npx expo prebuild --platform android --no-install
  if ($LASTEXITCODE -ne 0) {
    throw "expo prebuild failed for $Variant"
  }

  Move-AndroidOut $OutDir
  Patch-SettingsGradle $OutDir
  Patch-GradleProperties $OutDir
  Write-Host "OK: $OutDir" -ForegroundColor Green
}

function Patch-SettingsGradle([string]$OutDir) {
  $settingsPath = Join-Path $OutDir "settings.gradle"
  if (-not (Test-Path $settingsPath)) {
    throw "Missing $settingsPath"
  }
  $content = Get-Content -Raw $settingsPath
  if ($content -match "expoAutolinking\.projectRoot") {
    return
  }
  $needle = "extensions.configure(com.facebook.react.ReactSettingsExtension)"
  $insert = @"
// Folder is $OutDir (not android) — point autolinking at the Expo/JS root.
expoAutolinking.projectRoot = rootDir.parentFile

$needle
"@
  if ($content -notmatch [regex]::Escape($needle)) {
    throw "Could not patch settings.gradle in $OutDir — expected ReactSettingsExtension block"
  }
  $content = $content.Replace($needle, $insert)
  Set-Content -Path $settingsPath -Value $content -NoNewline
  Write-Host "Patched projectRoot in $settingsPath" -ForegroundColor DarkGray
}

function Patch-GradleProperties([string]$OutDir) {
  $propsPath = Join-Path $OutDir "gradle.properties"
  if (-not (Test-Path $propsPath)) {
    throw "Missing $propsPath"
  }
  $content = Get-Content -Raw $propsPath
  $content = $content -replace '(?m)^org\.gradle\.parallel=true\s*$', @"
# Parallel native builds often race on Windows (ENOENT rename / Unable to delete directory).
org.gradle.parallel=false
"@
  $content = $content -replace '(?m)^reactNativeArchitectures=.*$', @"
# Debug APK: one ABI is enough for a physical device / modern emulator and is far more reliable on Windows.
reactNativeArchitectures=arm64-v8a
"@
  Set-Content -Path $propsPath -Value $content -NoNewline
  Write-Host "Patched Windows-safe gradle.properties in $propsPath" -ForegroundColor DarkGray
}

Prebuild-Variant "client" "android-client"
Prebuild-Variant "doctor" "android-doctor"

Write-Host "`nDone. Open in Android Studio:" -ForegroundColor Yellow
Write-Host "  $root\android-client"
Write-Host "  $root\android-doctor"
