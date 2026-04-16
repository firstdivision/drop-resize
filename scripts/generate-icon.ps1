$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$repoRoot = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $repoRoot 'assets\icons'
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

$png = Join-Path $outDir 'drop-resize.png'
$ico = Join-Path $outDir 'drop-resize.ico'

$bmp = New-Object System.Drawing.Bitmap 256, 256
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::FromArgb(207, 95, 47))

$font = New-Object System.Drawing.Font('Segoe UI', 96, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$stringFormat = New-Object System.Drawing.StringFormat
$stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
$stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

$graphics.DrawString('DR', $font, [System.Drawing.Brushes]::White, (New-Object System.Drawing.RectangleF(0, 0, 256, 256)), $stringFormat)
$bmp.Save($png, [System.Drawing.Imaging.ImageFormat]::Png)

$icon = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
$fileStream = [System.IO.File]::Open($ico, [System.IO.FileMode]::Create)
$icon.Save($fileStream)
$fileStream.Close()

$font.Dispose()
$graphics.Dispose()
$bmp.Dispose()
