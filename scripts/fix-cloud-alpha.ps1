Add-Type -AssemblyName System.Drawing

function Convert-CheckerToAlpha([System.Drawing.Bitmap]$src) {
  $rect = New-Object System.Drawing.Rectangle 0, 0, $src.Width, $src.Height
  $data = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bytes = [Math]::Abs($data.Stride) * $src.Height
  $buf = New-Object byte[] $bytes
  [Runtime.InteropServices.Marshal]::Copy($data.Scan0, $buf, 0, $bytes)
  for ($i = 0; $i -lt $buf.Length; $i += 4) {
    $b = [int]$buf[$i]; $g = [int]$buf[$i+1]; $r = [int]$buf[$i+2]
    $chroma = [Math]::Max($r, [Math]::Max($g, $b)) - [Math]::Min($r, [Math]::Min($g, $b))
    $luma = [int](0.3 * $r + 0.59 * $g + 0.11 * $b)
    $a = 255
    if ($chroma -lt 22) {
      if ($luma -lt 105) { $a = 0 }
      elseif ($luma -lt 175) { $a = [int][Math]::Min(255, ($luma - 105) * 3.6) }
    }
    if ($a -lt 0) { $a = 0 }
    if ($a -gt 255) { $a = 255 }
    $buf[$i+3] = [byte]$a
  }
  [Runtime.InteropServices.Marshal]::Copy($buf, 0, $data.Scan0, $bytes)
  $src.UnlockBits($data)
}

$files = Get-ChildItem "C:\Users\mk.heru.gunawan1\Desktop\gamma\src\hero\assets\clouds\png\c*.png"
foreach ($f in $files) {
  $bmp = New-Object System.Drawing.Bitmap $f.FullName
  Convert-CheckerToAlpha $bmp
  $tmp = $f.FullName + ".tmp.png"
  $bmp.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Move-Item -Force $tmp $f.FullName
  Write-Output $f.Name
}
Write-Output "fixed"
