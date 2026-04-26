#!/bin/bash

###############################################################################
# Monitoring Alert Script
#
# Purpose: Check system metrics and send alerts for critical conditions
# Usage: Run via cron: */5 * * * * /path/to/alert.sh
# Output: monitoring/alerts.log
# Retention: 30 days
#
# Alert Conditions (NFR-008-013, NFR-030):
# - Docker container memory usage >80%
# - Database connection failures
# - Repeated container restarts (>3 in 5 minutes)
# - Health endpoint unavailable
# - Disk space <10% free
###############################################################################

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_FILE="${SCRIPT_DIR}/alerts.log"
MEMORY_THRESHOLD=80  # Percentage
DISK_THRESHOLD=10    # Percentage free
EMAIL_ALERT="${EMAIL_ALERT:-admin@tareasweb.local}"
BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"

# Ensure log directory exists
mkdir -p "${SCRIPT_DIR}"

# Initialize log file if it doesn't exist
if [ ! -f "${LOG_FILE}" ]; then
    echo "[$(date -Iseconds)] Alert monitoring started" > "${LOG_FILE}"
fi

# Function to send email alert
send_email_alert() {
    local subject=$1
    local body=$2
    local timestamp=$(date -Iseconds)
    
    echo "[${timestamp}] ALERT: ${subject}" >> "${LOG_FILE}"
    echo "${body}" >> "${LOG_FILE}"
    echo "---" >> "${LOG_FILE}"
    
    if [ -n "${EMAIL_ALERT}" ] && [ "${EMAIL_ALERT}" != "admin@tareasweb.local" ]; then
        echo -e "${body}" | mail -s "[TareasWeb Alert] ${subject}" "${EMAIL_ALERT}" 2>/dev/null || true
    fi
}

# Function to send alert via backend API
send_backend_alert() {
    local alert_type=$1
    local message=$2
    
    curl -X POST "${BACKEND_URL}/api/v1/monitoring/alerts" \
        -H "Content-Type: application/json" \
        -d "{\"type\":\"${alert_type}\",\"message\":\"${message}\",\"timestamp\":\"$(date -Iseconds)\"}" \
        2>/dev/null || true
}

# Rotate logs (keep last 30 days)
find "${SCRIPT_DIR}" -name "alerts.log.*" -type f -mtime +30 -delete

# Rotate if file size > 5MB
if [ -f "${LOG_FILE}" ]; then
    FILE_SIZE=$(stat -c %s "${LOG_FILE}" 2>/dev/null || stat -f %z "${LOG_FILE}" 2>/dev/null)
    if [ $FILE_SIZE -gt 5242880 ]; then  # 5MB in bytes
        ARCHIVE_DATE=$(date +%Y%m%d-%H%M%S)
        mv "${LOG_FILE}" "${LOG_FILE}.${ARCHIVE_DATE}"
        echo "[$(date -Iseconds)] Log rotated to alerts.log.${ARCHIVE_DATE}" > "${LOG_FILE}"
    fi
fi

###############################################################################
# Check 1: Docker Container Memory Usage
###############################################################################

TIMESTAMP=$(date -Iseconds)
HIGH_MEM_CONTAINERS=$(docker stats --no-stream --format "{{.Name}}\t{{.MemPerc}}" 2>/dev/null | \
    awk -v threshold="${MEMORY_THRESHOLD}" '{gsub(/%/, "", $2); if ($2 > threshold) print $1, $2"%"}')

if [ -n "${HIGH_MEM_CONTAINERS}" ]; then
    SUBJECT="High Memory Usage (>${MEMORY_THRESHOLD}%)"
    BODY="High memory usage detected at ${TIMESTAMP}:\n\n${HIGH_MEM_CONTAINERS}\n\nAction: Consider increasing container memory limits or investigating memory leaks."
    send_email_alert "${SUBJECT}" "${BODY}"
    send_backend_alert "high_memory" "${HIGH_MEM_CONTAINERS}"
fi

###############################################################################
# Check 2: Database Connection Status
###############################################################################

DB_HEALTH=$(curl -s --max-time 5 "${BACKEND_URL}/api/health" 2>/dev/null | grep -o '"database":\s*"[^"]*"' | cut -d'"' -f4)

if [ "${DB_HEALTH}" != "connected" ] && [ -n "${DB_HEALTH}" ]; then
    SUBJECT="Database Connection Failed"
    BODY="Database health check failed at ${TIMESTAMP}.\n\nStatus: ${DB_HEALTH}\n\nAction: Check PostgreSQL container status and logs."
    send_email_alert "${SUBJECT}" "${BODY}"
    send_backend_alert "database_down" "Database status: ${DB_HEALTH}"
fi

###############################################################################
# Check 3: Container Restart Count
###############################################################################

# Get containers with restart count >3
RESTARTED_CONTAINERS=$(docker ps --format "{{.Names}}\t{{.Status}}" 2>/dev/null | \
    awk '/Restarting|Up.*\(.*[4-9]|[1-9][0-9]/ {print}')

if [ -n "${RESTARTED_CONTAINERS}" ]; then
    SUBJECT="Frequent Container Restarts"
    BODY="Containers with multiple restarts detected at ${TIMESTAMP}:\n\n${RESTARTED_CONTAINERS}\n\nAction: Check container logs for crash causes."
    send_email_alert "${SUBJECT}" "${BODY}"
    send_backend_alert "container_restarts" "${RESTARTED_CONTAINERS}"
fi

###############################################################################
# Check 4: Disk Space
###############################################################################

DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | tr -d '%')

if [ "${DISK_USAGE}" -gt $((100 - DISK_THRESHOLD)) ]; then
    SUBJECT="Low Disk Space (<${DISK_THRESHOLD}% free)"
    BODY="Disk space is running low at ${TIMESTAMP}.\n\nUsage: ${DISK_USAGE}%\n\nAction: Clean up logs, old Docker images, or increase disk capacity."
    send_email_alert "${SUBJECT}" "${BODY}"
    send_backend_alert "low_disk_space" "Disk usage: ${DISK_USAGE}%"
fi

###############################################################################
# Check 5: Health Endpoint Availability
###############################################################################

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${BACKEND_URL}/api/health" 2>/dev/null)

if [ "${HTTP_CODE}" != "200" ]; then
    SUBJECT="Health Endpoint Unavailable (HTTP ${HTTP_CODE})"
    BODY="Backend health endpoint failed at ${TIMESTAMP}.\n\nHTTP Code: ${HTTP_CODE}\nURL: ${BACKEND_URL}/api/health\n\nAction: Check backend container status and logs."
    send_email_alert "${SUBJECT}" "${BODY}"
    send_backend_alert "health_check_failed" "HTTP ${HTTP_CODE}"
fi

###############################################################################
# Check 6: PostgreSQL Slow Queries (if slow query log is enabled)
###############################################################################

if [ -f "/var/log/postgresql/postgresql-slow.log" ]; then
    SLOW_QUERIES=$(tail -100 /var/log/postgresql/postgresql-slow.log 2>/dev/null | grep -c "duration:")
    
    if [ "${SLOW_QUERIES}" -gt 10 ]; then
        SUBJECT="High Number of Slow Queries (${SLOW_QUERIES})"
        BODY="Multiple slow queries detected at ${TIMESTAMP}.\n\nCount: ${SLOW_QUERIES} queries >100ms in last 100 log entries\n\nAction: Review slow query log and optimize queries."
        send_email_alert "${SUBJECT}" "${BODY}"
        send_backend_alert "slow_queries" "Count: ${SLOW_QUERIES}"
    fi
fi

###############################################################################
# Success Log
###############################################################################

echo "[${TIMESTAMP}] Alert check completed - no critical alerts" >> "${LOG_FILE}"

exit 0
