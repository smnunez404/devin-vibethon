$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskBin = Join-Path $taskRoot '.tools/media/bin'
New-Item -ItemType Directory -Force $taskBin | Out-Null
$taskFfmpeg = & python -c 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'
Copy-Item -LiteralPath $taskFfmpeg -Destination (Join-Path $taskBin 'ffmpeg.exe') -Force
Copy-Item -LiteralPath (Join-Path $taskRoot '.tools/media/node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe') -Destination (Join-Path $taskBin 'ffprobe.exe') -Force
$env:PATH = $taskBin + [IO.Path]::PathSeparator + $env:PATH
foreach ($taskTheme in @('fairground','diamonds','gears')) {
    $taskProject = if ($taskTheme -eq 'fairground') { Join-Path $taskRoot 'videos/neon-tunnel' } else { Join-Path $taskRoot ('videos/neon-' + $taskTheme) }
    $taskOutput = Join-Path $taskRoot ('assets/v001/backgrounds/loop-' + $taskTheme + '.mp4')
    if (Test-Path -LiteralPath $taskOutput) { Write-Output "Existing output: $taskOutput"; continue }
    & npx hyperframes check $taskProject
    if ($LASTEXITCODE -ne 0) { throw "Check failed: $taskTheme" }
    & npx hyperframes render $taskProject --output $taskOutput --fps 30 --quality looks --workers 1
    if ($LASTEXITCODE -ne 0) { throw "Render failed: $taskTheme" }
    & (Join-Path $taskBin 'ffprobe.exe') -v error -show_entries 'stream=width,height,r_frame_rate,nb_frames:format=duration,size' -of json $taskOutput
}
