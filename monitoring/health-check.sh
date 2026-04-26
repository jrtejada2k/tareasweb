#!/bin/bash

###############################################################################
# Health Check Monitoring Script
#
# Purpose: Poll /health endpoint every 60 seconds, track uptime, alert on failures
# Usage: Run in background: ./health-check.sh &
#        Or via systemd service
# Output: monitoring/health.log with uptime tracking
# Retention: 30 days
#
# Requirements (NFR-028-029):
# - 99% uptime during business hours (8 AM - 6 PM)
# - Alert after 3 consecutive failures
# - Log all health check results with timestamp
###############################################################################

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_FILE="${SCRIPT_DIR}/health.log"
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/api/health}"
CHECK_INTERVAL=60  # seconds
ALERT_THRESHOLD=3  # consecutive failures before alert
EMAIL_ALERT="${EMAIL_ALERT:-admin@tareasweb.local}"
FAILURE_COUNT=0
TOTAL_CHECKS=0
FAILED_CHECKS=0

# Ensure log directory exists
mkdir -p "${SCRIPT_DIR}"

# Initialize log file if it doesn't exist
if [ ! -f "${LOG_FILE}" ]; then
    echo "[$(date -Iseconds)] Health check monitoring started" > "${LOG_FILE}"
fi

# Function to calculate uptime percentage
calculate_uptime() {
    if [ $TOTAL_CHECKS -eq 0 ]; then
        echo "N/A"
    else
        local SUCCESS_CHECKS=$((TOTAL_CHECKS - FAILED_CHECKS))
        local UPTIME_PCT=$(awk "BEGIN {printf \"%.2f\", ($SUCCESS_CHECKS/$TOTAL_CHECKS)*100}")
        echo "${UPTIME_PCT}%"
    fi
}

# Function to send alert
send_alert() {
    local timestamp=$1
    local reason=$2
    
    echo "[${timestamp}] ⚠️  HEALTH CHECK ALERT: ${reason}" >> "${LOG_FILE}"
    
    if [ -n "${EMAIL_ALERT}" ] && [ "${EMAIL_ALERT}" != "admin@tareasweb.local" ]; then
        local SUBJECT="[TareasWeb] Health Check Alert"
        local BODY="Health check failed at ${timestamp}\n\nReason: ${reason}\n\nConsecutive failures: ${FAILURE_COUNT}\nUptime: $(calculate_uptime)"
        echo -e "${BODY}" | mail -s "${SUBJECT}" "${EMAIL_ALERT}" 2>/dev/null || true
    fi
}

# Function to rotate logs (keep last 30 days)
rotate_logs() {
    find "${SCRIPT_DIR}" -name "health.log.*" -type f -mtime +30 -delete
    
    # Rotate if file size > 10MB
    if [ -f "${LOG_FILE}" ]; then
        FILE_SIZE=$(stat -c %s "${LOG_FILE}" 2>/dev/null || stat -f %z "${LOG_FILE}" 2>/dev/null)
        if [ $FILE_SIZE -gt 10485760 ]; then  # 10MB in bytes
            ARCHIVE_DATE=$(date +%Y%m%d-%H%M%S)
            mv "${LOG_FILE}" "${LOG_FILE}.${ARCHIVE_DATE}"
            echo "[$(date -Iseconds)] Log rotated to health.log.${ARCHIVE_DATE}" > "${LOG_FILE}"
        fi
    fi
}

# Main monitoring loop
echo "[$(date -Iseconds)] Health check monitoring started. Polling ${HEALTH_URL} every ${CHECK_INTERVAL}s" >> "${LOG_FILE}"

while true; do
    TIMESTAMP=$(date -Iseconds)
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # Perform health check with 10-second timeout
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${HEALTH_URL}" 2>/dev/null)
    CURL_EXIT=$?
    
    if [ $CURL_EXIT -eq 0 ] && [ "$HTTP_CODE" == "200" ]; then
        # Success
        if [ $FAILURE_COUNT -gt 0 ]; then
            # Recovery from failure
            echo "[${TIMESTAMP}] ✅ Health check RECOVERED after ${FAILURE_COUNT} failures. Uptime: $(calculate_uptime)" >> "${LOG_FILE}"
        fi
        FAILURE_COUNT=0
    else
        # Failure
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        FAILURE_COUNT=$((FAILURE_COUNT + 1))
        
        if [ $CURL_EXIT -ne 0 ]; then
            REASON="Connection failed (curl exit code: ${CURL_EXIT})"
        else
            REASON="HTTP ${HTTP_CODE} (expected 200)"
        fi
        
        echo "[${TIMESTAMP}] ❌ Health check FAILED: ${REASON}. Consecutive failures: ${FAILURE_COUNT}. Uptime: $(calculate_uptime)" >> "${LOG_FILE}"
        
        # Send alert after threshold
        if [ $FAILURE_COUNT -eq $ALERT_THRESHOLD ]; then
            send_alert "${TIMESTAMP}" "${REASON}"
        fi
    fi
    
    # Log uptime summary every 100 checks
    if [ $((TOTAL_CHECKS % 100)) -eq 0 ]; then
        echo "[${TIMESTAMP}] Uptime summary: $(calculate_uptime) (${TOTAL_CHECKS} checks, ${FAILED_CHECKS} failures)" >> "${LOG_FILE}"
        rotate_logs
    fi
    
    # Sleep until next check
    sleep "${CHECK_INTERVAL}"
done
