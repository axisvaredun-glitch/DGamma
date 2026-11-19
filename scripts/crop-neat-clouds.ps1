Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\mk.heru.gunawan1\Desktop\gamma\src\hero\assets\clouds\neat.jpg"
$outDir = "C:\Users\mk.heru.gunawan1\Desktop\gamma\src\hero\assets\clouds\png"
$jpg = [System.Drawing.Image]::FromFile($srcPath)
$bmp = New-Object System.Drawing.Bitmap $jpg.Width, $jpg.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($jpg, 0, 0, $jpg.Width, $jpg.Height)
$g.Dispose(); $jpg.Dispose()

function Punch-Dark([System.Drawing.Bitmap]$src) {
  $rect = New-Object System.Drawing.Rectangle 0, 0, $src.Width, $src.Height
  $data = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $n = [Math]::Abs($data.Stride) * $src.Height
  $buf = New-Object byte[] $n
  [Runtime.InteropServices.Marshal]::Copy($data.Scan0, $buf, 0, $n)
  for ($i = 0; $i -lt $buf.Length; $i += 4) {
    $b = [int]$buf[$i]; $g = [int]$buf[$i+1]; $r = [int]$buf[$i+2]
    $luma = [int](0.3*$r + 0.59*$g + 0.11*$b)
    $a = 255
    if ($luma -lt 42) { $a = 0 }
    elseif ($luma -lt 95) { $a = [int](($luma - 42) * 4.8) }
    if ($a -lt 0) { $a = 0 }
    if ($a -gt 255) { $a = 255 }
    $buf[$i+3] = [byte]$a
  }
  [Runtime.InteropServices.Marshal]::Copy($buf, 0, $data.Scan0, $n)
  $src.UnlockBits($data)
}

function Trim-Alpha([System.Drawing.Bitmap]$src) {
  $minX = $src.Width; $minY = $src.Height; $maxX = 0; $maxY = 0
  for ($y = 0; $y -lt $src.Height; $y += 1) {
    for ($x = 0; $x -lt $src.Width; $x += 1) {
      if ($src.GetPixel($x,$y).A -gt 24) {
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
  $pad = 6
  $minX = [Math]::Max(0, $minX - $pad)
  $minY = [Math]::Max(0, $minY - $pad)
  $maxX = [Math]::Min($src.Width - 1, $maxX + $pad)
  $maxY = [Math]::Min($src.Height - 1, $maxY + $pad)
  $w = $maxX - $minX + 1
  $h = $maxY - $minY + 1
  $rect = New-Object System.Drawing.Rectangle $minX, $minY, $w, $h
  return $src.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
}

# 2 cols x 3 rows on 1024x768
$boxes = @(
  @{ n='c1.png'; x=20;  y=18;  w=484; h=236 },
  @{ n='c2.png'; x=520; y=18;  w=484; h=236 },
  @{ n='c3.png'; x=20;  y=266; w=484; h=236 },
  @{ n='c4.png'; x=520; y=266; w=484; h=236 },
  @{ n='c5.png'; x=20;  y=514; w=484; h=236 },
  @{ n='c6.png'; x=520; y=514; w=484; h=236 }
)

foreach ($box in $boxes) {
  $rect = New-Object System.Drawing.Rectangle $box.x, $box.y, $box.w, $box.h
  $crop = $bmp.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  Punch-Dark $crop
  $trim = Trim-Alpha $crop
  $crop.Dispose()
  $path = Join-Path $outDir $box.n
  $trim.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output ("{0} {1}x{2}" -f $box.n, $trim.Width, $trim.Height)
  $trim.Dispose()
}
$bmp.Dispose()
Write-Output "ok"
