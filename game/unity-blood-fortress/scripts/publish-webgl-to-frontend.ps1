param(
  [string]$SourceBuildPath = "d:\fookbase\game\unity-blood-fortress\Builds\WebGL",
  [string]$DestinationPath = "d:\fookbase\frontend\public\unity\hiep-si-dang-phao-dai-mau"
)

$sourceIndex = Join-Path $SourceBuildPath "index.html"

if (!(Test-Path -LiteralPath $SourceBuildPath)) {
  Write-Error "Khong tim thay thu muc build WebGL: $SourceBuildPath"
  exit 1
}

if (!(Test-Path -LiteralPath $sourceIndex)) {
  Write-Error "Khong tim thay index.html trong build WebGL: $sourceIndex"
  exit 1
}

if (!(Test-Path -LiteralPath $DestinationPath)) {
  New-Item -ItemType Directory -Path $DestinationPath -Force | Out-Null
}

Get-ChildItem -LiteralPath $DestinationPath -Force | Remove-Item -Recurse -Force
Copy-Item -Path (Join-Path $SourceBuildPath "*") -Destination $DestinationPath -Recurse -Force

Write-Host "Da copy Unity WebGL build vao:" $DestinationPath -ForegroundColor Green
Write-Host "Mo trang: http://localhost:5173/games/hiep-si-dang-phao-dai-mau" -ForegroundColor Cyan
