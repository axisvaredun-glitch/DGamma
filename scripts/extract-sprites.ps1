Add-Type -AssemblyName System.Drawing

function Convert-CheckerToAlpha([System.Drawing.Bitmap]$src) {
  $rect = New-Object System.Drawing.Rectangle 0, 0, $src.Width, $src.Height
  $data = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bytes = [Math]::Abs($data.Stride) * $src.Height
  $ptr = $data.Scan0
  $buf = New-Object byte[] $bytes
  [Runtime.InteropServices.Marshal]::Copy($ptr, $buf, 0, $bytes)
  for ($i = 0; $i -lt $buf.Length; $i += 4) {
    $b = [int]$buf[$i]; $g = [int]$buf[$i+1]; $r = [int]$buf[$i+2]
    $chroma = [Math]::Max($r, [Math]::Max($g, $b)) - [Math]::Min($r, [Math]::Min($g, $b))
    $luma = [int](0.3 * $r + 0.59 * $g + 0.11 * $b)
    if ($chroma -lt 18 -and $luma -lt 88) {
      $buf[$i+3] = 0
    } elseif ($chroma -lt 18 -and $luma -lt 150) {
      $a = [int][Math]::Min(255, ($luma - 88) * 4.2)
      $buf[$i+3] = [byte]$a
    }
  }
  [Runtime.InteropServices.Marshal]::Copy($buf, 0, $ptr, $bytes)
  $src.UnlockBits($data)
}

function Convert-BlackToAlpha([System.Drawing.Bitmap]$src, [int]$cut = 18) {
  $rect = New-Object System.Drawing.Rectangle 0, 0, $src.Width, $src.Height
  $data = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bytes = [Math]::Abs($data.Stride) * $src.Height
  $ptr = $data.Scan0
  $buf = New-Object byte[] $bytes
  [Runtime.InteropServices.Marshal]::Copy($ptr, $buf, 0, $bytes)
  for ($i = 0; $i -lt $buf.Length; $i += 4) {
    $b = [int]$buf[$i]; $g = [int]$buf[$i+1]; $r = [int]$buf[$i+2]
    $luma = [int](0.3 * $r + 0.59 * $g + 0.11 * $b)
    if ($luma -lt $cut) { $buf[$i+3] = 0 }
    elseif ($luma -lt 40) { $buf[$i+3] = [byte][int](($luma - $cut) * 10) }
  }
  [Runtime.InteropServices.Marshal]::Copy($buf, 0, $ptr, $bytes)
  $src.UnlockBits($data)
}

function Save-Crop([System.Drawing.Bitmap]$src, $x, $y, $w, $h, $path) {
  $rect = New-Object System.Drawing.Rectangle $x, $y, $w, $h
  $crop = $src.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $crop.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $crop.Dispose()
  Write-Output $path
}

$outCloud = "C:\Users\mk.heru.gunawan1\Desktop\gamma\src\hero\assets\clouds\png"
$outBolt = "C:\Users\mk.heru.gunawan1\Desktop\gamma\src\hero\assets\thunder\png"
New-Item -ItemType Directory -Force -Path $outCloud | Out-Null
New-Item -ItemType Directory -Force -Path $outBolt | Out-Null

$cloudSrc = "C:\Users\mk.heru.gunawan1\Desktop\gamma\src\hero\assets\clouds\2305.i518.024.F.m005.c9.realistic cloud sky.jpg"
$jpg = [System.Drawing.Image]::FromFile($cloudSrc)
$scaleW = 2300
$scaleH = [int](2300 * $jpg.Height / $jpg.Width)
$sheet = New-Object System.Drawing.Bitmap $scaleW, $scaleH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($sheet)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($jpg, 0, 0, $scaleW, $scaleH)
$g.Dispose(); $jpg.Dispose()
Convert-CheckerToAlpha $sheet
$sheet.Save("$outCloud\sheet.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Crop boxes in 2300x1500 space (2300 * 4500/6900 = 1500)
Save-Crop $sheet 80 90 980 380 "$outCloud\c1.png"
Save-Crop $sheet 1180 80 1020 400 "$outCloud\c2.png"
Save-Crop $sheet 40 520 620 430 "$outCloud\c3.png"
Save-Crop $sheet 640 470 820 520 "$outCloud\c4.png"
Save-Crop $sheet 1500 520 420 240 "$outCloud\c5.png"
Save-Crop $sheet 1520 760 700 280 "$outCloud\c6.png"
Save-Crop $sheet 30 980 980 500 "$outCloud\c7.png"
Save-Crop $sheet 1120 1020 1100 460 "$outCloud\c8.png"
$sheet.Dispose()

$boltSrc = "C:\Users\mk.heru.gunawan1\Desktop\gamma\src\hero\assets\thunder\4461.jpg"
$bj = [System.Drawing.Image]::FromFile($boltSrc)
$bw = 1600
$bh = [int](1600 * $bj.Height / $bj.Width)
$bs = New-Object System.Drawing.Bitmap $bw, $bh, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g2 = [System.Drawing.Graphics]::FromImage($bs)
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g2.DrawImage($bj, 0, 0, $bw, $bh)
$g2.Dispose(); $bj.Dispose()
Convert-BlackToAlpha $bs 12
$bs.Save("$outBolt\sheet.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 5250x3500 -> 1600 x 1067
Save-Crop $bs 40 80 280 380 "$outBolt\b1.png"
Save-Crop $bs 320 70 300 400 "$outBolt\b2.png"
Save-Crop $bs 620 40 320 430 "$outBolt\b3.png"
Save-Crop $bs 950 40 320 430 "$outBolt\b4.png"
Save-Crop $bs 1260 30 320 450 "$outBolt\b5.png"
Save-Crop $bs 20 520 430 520 "$outBolt\b6.png"
Save-Crop $bs 430 520 330 520 "$outBolt\b7.png"
Save-Crop $bs 760 540 250 480 "$outBolt\b8.png"
Save-Crop $bs 1010 540 220 470 "$outBolt\b9.png"
Save-Crop $bs 1230 540 180 460 "$outBolt\b10.png"
$bs.Dispose()
Write-Output "done"
