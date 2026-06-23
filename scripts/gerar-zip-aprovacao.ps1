$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$projectName = Split-Path -Leaf $projectRoot
$timestamp = Get-Date -Format 'yyyyMMdd-HHmm'
$zipName = "$projectName-aprovacao-$timestamp.zip"
$outputZip = Join-Path (Split-Path -Parent $projectRoot) $zipName
$stagingRoot = Join-Path ([System.IO.Path]::GetTempPath()) "$projectName-aprovacao-$timestamp"

$includePaths = @(
  'backend',
  'docs',
  'frontend',
  'public',
  'tests',
  '.env.example',
  '.gitignore',
  'eslint.config.js',
  'package-lock.json',
  'package.json'
)

$excludePatterns = @(
  '\.env$',
  '\\backend\\\.env$',
  '\\node_modules(\\|$)',
  '\\frontend\\dist(\\|$)'
)

if (Test-Path $stagingRoot) {
  Remove-Item -LiteralPath $stagingRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $stagingRoot | Out-Null

foreach ($relativePath in $includePaths) {
  $sourcePath = Join-Path $projectRoot $relativePath
  if (-not (Test-Path $sourcePath)) {
    continue
  }

  $destinationPath = Join-Path $stagingRoot $relativePath

  if (Test-Path $sourcePath -PathType Container) {
    New-Item -ItemType Directory -Path $destinationPath -Force | Out-Null

    Get-ChildItem -LiteralPath $sourcePath -Recurse -Force | ForEach-Object {
      $fullPath = $_.FullName
      $normalizedPath = $fullPath.Replace('/', '\')

      if ($excludePatterns | Where-Object { $normalizedPath -match $_ }) {
        return
      }

      $relativeItemPath = $fullPath.Substring($projectRoot.Length).TrimStart('\')
      $targetItemPath = Join-Path $stagingRoot $relativeItemPath

      if ($_.PSIsContainer) {
        New-Item -ItemType Directory -Path $targetItemPath -Force | Out-Null
      } else {
        $targetDir = Split-Path -Parent $targetItemPath
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        Copy-Item -LiteralPath $fullPath -Destination $targetItemPath -Force
      }
    }
  } else {
    $targetDir = Split-Path -Parent $destinationPath
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Copy-Item -LiteralPath $sourcePath -Destination $destinationPath -Force
  }
}

if (Test-Path $outputZip) {
  Remove-Item -LiteralPath $outputZip -Force
}

Compress-Archive -Path (Join-Path $stagingRoot '*') -DestinationPath $outputZip -CompressionLevel Optimal
Remove-Item -LiteralPath $stagingRoot -Recurse -Force

Write-Host "Pacote gerado com sucesso:"
Write-Host $outputZip
