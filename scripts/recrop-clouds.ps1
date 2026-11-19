Add-Type -AssemblyName System.Drawing

$sheetPath = "C:\Users\mk.heru.gunawan1\Desktop\gamma\src\hero\assets\clouds\png\sheet.png"
$outDir = "C:\Users\mk.heru.gunawan1\Desktop\gamma\src\hero\assets\clouds\png"
$sheet = New-Object System.Drawing.Bitmap $sheetPath
# sheet is 2300 x 1500 from 900x587 preview; scale = 2300/900
$s = 2300.0 / 900.0

function Convert-Checker([System.Drawing.Bitmap]$src) {
  $rect = New-Object System.Drawing.Rectangle 0, 0, $src.Width, $src.Height
  $data = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $n = [Math]::Abs($data.Stride) * $src.Height
  $buf = New-Object byte[] $n
  [Runtime.InteropServices.Marshal]::Copy($data.Scan0, $buf, 0, $n)
  for ($i = 0; $i -lt $buf.Length; $i += 4) {
    $b = [int]$buf[$i]; $g = [int]$buf[$i+1]; $r = [int]$buf[$i+2]
    $chroma = [Math]::Max($r,[Math]::Max($g,$b)) - [Math]::Min($r,[Math]::Min($g,$b))
    $luma = [int](0.3*$r + 0.59*$g + 0.11*$b)
    $a = 255
    if ($chroma -lt 24) {
      if ($luma -lt 108) { $a = 0 }
      elseif ($luma -lt 178) { $a = [int](($luma - 108) * 3.6) }
    }
    if ($a -lt 0) { $a = 0 }
    if ($a -gt 255) { $a = 255 }
    $buf[$i+3] = [byte]$a
  }
  [Runtime.InteropServices.Marshal]::Copy($buf, 0, $data.Scan0, $n)
  $src.UnlockBits($data)
}

function Trim-Alpha([System.Drawing.Bitmap]$src) {
  $minX = $src.Width; $minY = $src.Height; $maxX = 0; $maxY = 0
  for ($y = 0; $y -lt $src.Height; $y += 2) {
    for ($x = 0; $x -lt $src.Width; $x += 2) {
      if ($src.GetPixel($x,$y).A -gt 28) {
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
  $pad = 8
  $minX = [Math]::Max(0, $minX - $pad)
  $minY = [Math]::Max(0, $minY - $pad)
  $maxX = [Math]::Min($src.Width - 1, $maxX + $pad)
  $maxY = [Math]::Min($src.Height - 1, $maxY + $pad)
  $w = $maxX - $minX + 1
  $h = $maxY - $minY + 1
  if ($w -lt 8 -or $h -lt 8) { return $src }
  $rect = New-Object System.Drawing.Rectangle $minX, $minY, $w, $h
  return $src.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
}

function Save-Box($name, $px, $py, $pw, $ph) {
  $x = [int]($px * $s); $y = [int]($py * $s)
  $w = [int]($pw * $s); $h = [int]($ph * $s)
  if ($x + $w -gt $sheet.Width) { $w = $sheet.Width - $x }
  if ($y + $h -gt $sheet.Height) { $h = $sheet.Height - $y }
  $rect = New-Object System.Drawing.Rectangle $x, $y, $w, $h
  $crop = $sheet.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  Convert-Checker $crop
  $trim = Trim-Alpha $crop
  if ($trim -ne $crop) { $crop.Dispose() }
  $path = Join-Path $outDir $name
  $trim.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $trim.Dispose()
  Write-Output "$name $w x $h"
}

# Preview-space boxes (900x587) around complete single clouds
Save-Box "c1.png" 18 48 395 122
Save-Box "c2.png" 438 48 430 138
Save-Box "c3.png" 22 198 228 148
Save-Box "c4.png" 252 188 300 205
Save-Box "c5.png" 572 198 178 88
Save-Box "c6.png" 572 288 180 62
Save-Box "c7.png" 18 368 385 188
Save-Box "c8.png" 508 408 360 150

$sheet.Dispose()
Write-Output "recropped"
