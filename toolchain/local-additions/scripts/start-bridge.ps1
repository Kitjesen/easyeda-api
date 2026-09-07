$ErrorActionPreference = 'Stop'
$skillPath = Split-Path -Parent $PSScriptRoot
$runtimeConfig = Get-Content -LiteralPath (Join-Path $skillPath 'local-runtime.json') -Raw | ConvertFrom-Json
$connectionPath = [System.IO.Path]::GetFullPath($runtimeConfig.connectionRoot)
if (-not (Test-Path -LiteralPath (Join-Path $connectionPath 'AGENTS.md'))) { throw 'Configured connection workspace is missing.' }
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$serverPath = Join-Path $PSScriptRoot 'bridge-server.mjs'
$pidPath = Join-Path $connectionPath 'bridge.pid'
$stdoutPath = Join-Path $connectionPath 'bridge.stdout.log'
$stderrPath = Join-Path $connectionPath 'bridge.stderr.log'

for ($bridgePort = 49620; $bridgePort -le 49629; $bridgePort++) {
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:$bridgePort/health" -TimeoutSec 1
        if ($health.service -eq 'easyeda-bridge') {
            Write-Output "Bridge already running on http://127.0.0.1:$bridgePort"
            $health | ConvertTo-Json -Depth 5
            exit 0
        }
    } catch { }
}

& $nodePath --check $serverPath
if ($LASTEXITCODE -ne 0) { throw 'Bridge syntax check failed.' }
$process = Start-Process -FilePath $nodePath -ArgumentList @(('"{0}"' -f $serverPath)) -WorkingDirectory $skillPath -WindowStyle Hidden -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath -PassThru
Set-Content -LiteralPath $pidPath -Value $process.Id -Encoding ascii

for ($attempt = 0; $attempt -lt 12; $attempt++) {
    Start-Sleep -Milliseconds 250
    $process.Refresh()
    if ($process.HasExited) { throw "Bridge exited early. Inspect $stderrPath" }
    for ($bridgePort = 49620; $bridgePort -le 49629; $bridgePort++) {
        try {
            $health = Invoke-RestMethod -Uri "http://127.0.0.1:$bridgePort/health" -TimeoutSec 1
            if ($health.service -eq 'easyeda-bridge') {
                Write-Output "Started PID $($process.Id) on http://127.0.0.1:$bridgePort"
                $health | ConvertTo-Json -Depth 5
                exit 0
            }
        } catch { }
    }
}
throw "Bridge health endpoint was not ready. Inspect $stdoutPath and $stderrPath"
