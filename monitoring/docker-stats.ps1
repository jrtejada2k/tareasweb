# Docker Stats Monitoring Script (PowerShell)
# Purpose: Collect Docker container metrics hourly for Windows environments
# Usage: Run via Task Scheduler hourly

param(
    [string]$LogPath = "$PSScriptRoot\stats.log",
    [int]$AlertThreshold = 80,
    [string]$EmailAlert = $env:EMAIL_ALERT
)

# Ensure monitoring directory exists
$MonitoringDir = Split-Path -Parent $LogPath
if (!(Test-Path $MonitoringDir)) {
    New-Item -ItemType Directory -Path $MonitoringDir -Force | Out-Null
}

# Function to rotate logs (keep 7 days)
function Rotate-Logs {
    # Rotate if file is older than 1 day
    if (Test-Path $LogPath) {
        $FileAge = (Get-Date) - (Get-Item $LogPath).LastWriteTime
        if ($FileAge.TotalDays -gt 1) {
            $ArchiveDate = (Get-Item $LogPath).LastWriteTime.ToString("yyyyMMdd")
            Move-Item $LogPath "$LogPath.$ArchiveDate" -Force
            "[$((Get-Date).ToString('o'))] Log rotated to stats.log.$ArchiveDate" | Out-File $LogPath
        }
    }
    
    # Delete logs older than 7 days
    Get-ChildItem "$MonitoringDir\stats.log.*" -File | 
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
        Remove-Item -Force
}

# Rotate logs
Rotate-Logs

# Collect Docker stats
$Timestamp = (Get-Date).ToString('o')
"" | Out-File $LogPath -Append
"========================================" | Out-File $LogPath -Append
"[$Timestamp] Docker Container Metrics" | Out-File $LogPath -Append
"========================================" | Out-File $LogPath -Append

try {
    # Get Docker stats (one-time snapshot)
    $Stats = docker stats --no-stream --format "table {{.Name}}`t{{.CPUPerc}}`t{{.MemUsage}}`t{{.MemPerc}}`t{{.NetIO}}`t{{.BlockIO}}" 2>&1
    $Stats | Out-File $LogPath -Append
    
    # Check for high memory usage
    $HighMemContainers = docker stats --no-stream --format "{{.Name}}`t{{.MemPerc}}" | 
        ForEach-Object {
            $parts = $_ -split "`t"
            $name = $parts[0]
            $memPerc = [float]($parts[1] -replace '%','')
            if ($memPerc -gt $AlertThreshold) {
                "$name $($parts[1])"
            }
        }
    
    if ($HighMemContainers) {
        "" | Out-File $LogPath -Append
        "[$Timestamp] ⚠️  HIGH MEMORY ALERT (>$AlertThreshold%)" | Out-File $LogPath -Append
        $HighMemContainers | Out-File $LogPath -Append
        
        # Send email alert if configured
        if ($EmailAlert -and $EmailAlert -ne "admin@tareasweb.local") {
            $Subject = "[TareasWeb] High Memory Alert"
            $Body = "High memory usage detected at $Timestamp`:`n`n$($HighMemContainers -join "`n")`n`nThreshold: $AlertThreshold%"
            Send-MailMessage -To $EmailAlert -Subject $Subject -Body $Body -SmtpServer "localhost" -From "monitoring@tareasweb.local" -ErrorAction SilentlyContinue
        }
    }
    
    "[$Timestamp] Stats collection completed" | Out-File $LogPath -Append
} catch {
    "[$Timestamp] Error collecting stats: $_" | Out-File $LogPath -Append
}

exit 0
