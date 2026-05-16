Add-Type -AssemblyName System.Drawing

$root = Join-Path (Get-Location) "public/assets/workspace-covers"
New-Item -ItemType Directory -Force -Path $root | Out-Null

$covers = @(
  @{ Name = "study-desk"; Sky = "#2e3b4e"; Ground = "#3b2519"; Accent = "#ffd860"; Detail = "#7fb7ff"; Mode = "desk" },
  @{ Name = "tower-room"; Sky = "#283247"; Ground = "#49505d"; Accent = "#f6da7b"; Detail = "#1d2739"; Mode = "tower" },
  @{ Name = "forest-camp"; Sky = "#426f48"; Ground = "#244f2b"; Accent = "#ffd352"; Detail = "#153819"; Mode = "forest" },
  @{ Name = "guild-hall"; Sky = "#6d4024"; Ground = "#2f1d15"; Accent = "#f0bd4f"; Detail = "#c4362c"; Mode = "hall" },
  @{ Name = "war-table"; Sky = "#3a2b24"; Ground = "#251812"; Accent = "#d0b06d"; Detail = "#3f8a5f"; Mode = "map" },
  @{ Name = "castle-room"; Sky = "#575e6d"; Ground = "#343a45"; Accent = "#8fc9f4"; Detail = "#70401f"; Mode = "castle" }
)

function New-Brush($hex) {
  return New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($hex))
}

foreach ($cover in $covers) {
  $w = 480
  $h = 270
  $bitmap = New-Object System.Drawing.Bitmap($w, $h)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor

  $sky = New-Brush $cover.Sky
  $ground = New-Brush $cover.Ground
  $accent = New-Brush $cover.Accent
  $detail = New-Brush $cover.Detail
  $dark = New-Brush "#17100b"
  $wood = New-Brush "#8a542d"

  $graphics.FillRectangle($sky, 0, 0, $w, $h)
  $graphics.FillRectangle($ground, 0, 160, $w, 110)
  $graphics.FillRectangle($dark, 0, 0, $w, 18)
  $graphics.FillRectangle($dark, 0, $h - 18, $w, 18)
  $graphics.FillRectangle($dark, 0, 0, 18, $h)
  $graphics.FillRectangle($dark, $w - 18, 0, 18, $h)
  $graphics.FillRectangle($accent, 36, 28, 408, 18)
  $graphics.FillRectangle($accent, 36, 224, 408, 18)

  switch ($cover.Mode) {
    "forest" {
      for ($x = 44; $x -lt 430; $x += 68) {
        $graphics.FillRectangle($detail, $x, 54, 42, 104)
        $graphics.FillRectangle($wood, $x + 16, 126, 12, 58)
      }
      $graphics.FillRectangle($accent, 222, 146, 36, 62)
      $graphics.FillRectangle((New-Brush "#ff6a2a"), 234, 164, 18, 42)
    }
    "map" {
      $graphics.FillRectangle($wood, 78, 74, 324, 130)
      $graphics.FillRectangle($accent, 112, 94, 256, 84)
      $graphics.FillRectangle($detail, 142, 118, 54, 28)
      $graphics.FillRectangle((New-Brush "#557cc1"), 252, 110, 42, 36)
      $graphics.FillRectangle((New-Brush "#7d3d24"), 200, 156, 106, 12)
    }
    "tower" {
      $graphics.FillRectangle($accent, 344, 44, 58, 58)
      $graphics.FillRectangle($detail, 204, 66, 72, 128)
      $graphics.FillRectangle((New-Brush "#5fa9df"), 222, 88, 36, 58)
      $graphics.FillRectangle($wood, 166, 188, 146, 30)
    }
    "castle" {
      for ($y = 58; $y -lt 156; $y += 38) {
        for ($x = 36; $x -lt 430; $x += 82) {
          $graphics.FillRectangle((New-Brush "#6c7484"), $x, $y, 52, 14)
        }
      }
      $graphics.FillRectangle($accent, 210, 52, 64, 92)
      $graphics.FillRectangle($wood, 120, 178, 240, 46)
    }
    default {
      for ($x = 58; $x -lt 430; $x += 72) {
        $graphics.FillRectangle($detail, $x, 74, 42, 72)
      }
      $graphics.FillRectangle($wood, 96, 170, 288, 54)
      if ($cover.Mode -eq "hall") {
        $graphics.FillRectangle($detail, 208, 48, 64, 100)
      } else {
        $graphics.FillRectangle($accent, 304, 92, 34, 70)
      }
    }
  }

  $path = Join-Path $root "$($cover.Name).png"
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

  $sky.Dispose()
  $ground.Dispose()
  $accent.Dispose()
  $detail.Dispose()
  $dark.Dispose()
  $wood.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}
