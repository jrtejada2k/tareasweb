#!/bin/bash

###############################################################################
# Docker Stats Monitoring Script
#
# Purpose: Collect Docker container metrics (CPU, memory, network) hourly
# Usage: Run via cron: 0 * * * * /path/to/docker-stats.sh
# Output: monitoring/stats.log with timestamp
# Retention: 7 days (automatic rotation)
#
# Requirements (FR-149-153, NFR-033-037):
# - Collect CPU, memory, network I/O metrics
# - Log with ISO 8601 timestamp
# - Rotate logs daily (7-day retention)
# - Alert if any container uses >80% memory
###############################################################################

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_FILE="${SCRIPT_DIR}/stats.log"
ALERT_THRESHOLD=80  # Memory usage percentage threshold for alerts
EMAIL_ALERT="${EMAIL_ALERT:-admin@tareasweb.local}"

# Ensure log directory exists
mkdir -p "${SCRIPT_DIR}"

# Rotate logs if file is older than 1 day
if [ -f "${LOG_FILE}" ]; then
    # Get file modification time
    FILE_TIME=$(stat -c %Y "${LOG_FILE}" 2>/dev/null || stat -f %m "${LOG_FILE}" 2>/dev/null)
    CURRENT_TIME=$(date +%s)
    AGE=$((CURRENT_TIME - FILE_TIME))
    
    # If file is older than 24 hours (86400 seconds), rotate it
    if [ $AGE -gt 86400 ]; then
        ARCHIVE_DATE=$(date -r "${LOG_FILE}" +%Y%m%d 2>/dev/null || date -j -f %s "${FILE_TIME}" +%Y%m%d 2>/dev/null)
        mv "${LOG_FILE}" "${LOG_FILE}.${ARCHIVE_DATE}"
        echo "[$(date -Iseconds)] Log rotated to stats.log.${ARCHIVE_DATE}" > "${LOG_FILE}"
    fi
fi

# Delete logs older than 7 days
find "${SCRIPT_DIR}" -name "stats.log.*" -type f -mtime +7 -delete

# Collect Docker stats
TIMESTAMP=$(date -Iseconds)
echo "" >> "${LOG_FILE}"
echo "========================================" >> "${LOG_FILE}"
echo "[${TIMESTAMP}] Docker Container Metrics" >> "${LOG_FILE}"
echo "========================================" >> "${LOG_FILE}"

# Get container stats (one-time snapshot, no streaming)
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}" >> "${LOG_FILE}" 2>&1

# Check for high memory usage and alert
HIGH_MEM_CONTAINERS=$(docker stats --no-stream --format "{{.Name}}\t{{.MemPerc}}" | awk -v threshold="${ALERT_THRESHOLD}" '$2 > threshold {print $1, $2}')

if [ -n "${HIGH_MEM_CONTAINERS}" ]; then
    echo "" >> "${LOG_FILE}"
    echo "[${TIMESTAMP}] ⚠️  HIGH MEMORY ALERT (>${ALERT_THRESHOLD}%)" >> "${LOG_FILE}"
    echo "${HIGH_MEM_CONTAINERS}" >> "${LOG_FILE}"
    
    # Send email alert if EMAIL_ALERT is configured
    if [ -n "${EMAIL_ALERT}" ] && [ "${EMAIL_ALERT}" != "admin@tareasweb.local" ]; then
        SUBJECT="[TareasWeb] High Memory Alert"
        BODY="High memory usage detected at ${TIMESTAMP}:\n\n${HIGH_MEM_CONTAINERS}\n\nThreshold: ${ALERT_THRESHOLD}%"
        echo -e "${BODY}" | mail -s "${SUBJECT}" "${EMAIL_ALERT}" 2>/dev/null || true
    fi
fi

# Log success
echo "[${TIMESTAMP}] Stats collection completed" >> "${LOG_FILE}"

# Optional: Send stats to backend monitoring endpoint
# curl -X POST http://localhost:3000/api/v1/metrics \
#   -H "Content-Type: application/json" \
#   -d "{\"timestamp\":\"${TIMESTAMP}\",\"source\":\"docker-stats\"}" \
#   2>/dev/null || true

exit 0
