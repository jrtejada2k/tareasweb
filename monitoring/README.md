# Monitoring & Observability

This directory contains monitoring scripts and tools for tracking system health, performance metrics, and alerting.

## Requirements

Based on Phase 15 requirements (T090-T093) and NFR-028-037:
- Docker container metrics (CPU, memory, network I/O)
- PostgreSQL slow query logging (>100ms)
- Health endpoint polling (99% uptime tracking)
- Automated alerts for critical conditions

---

## Scripts

### 1. docker-stats.sh (Bash) / docker-stats.ps1 (PowerShell)

**Purpose**: Collect Docker container metrics hourly

**Usage**:
```bash
# Linux/Mac (via cron)
0 * * * * /path/to/monitoring/docker-stats.sh

# Windows (Task Scheduler)
# Run: powershell.exe -ExecutionPolicy Bypass -File docker-stats.ps1
```

**Output**: `monitoring/stats.log` with:
- Container name
- CPU percentage
- Memory usage and percentage
- Network I/O
- Block I/O
- Timestamp (ISO 8601)

**Alerts**: Email notification when memory usage >80%

**Log Retention**: 7 days (automatic rotation)

---

### 2. health-check.sh

**Purpose**: Poll /health endpoint every 60 seconds, track uptime

**Usage**:
```bash
# Run as background service
./monitoring/health-check.sh &

# Or via systemd
sudo systemctl start tareasweb-health-check

# Or via screen/tmux
screen -dmS health-check ./monitoring/health-check.sh
```

**Output**: `monitoring/health.log` with:
- Timestamp of each check
- Success/failure status
- HTTP status codes
- Uptime percentage calculation
- Alert notifications after 3 consecutive failures

**Requirements**: curl, mail (for email alerts)

**Log Retention**: 30 days or 10MB (whichever comes first)

---

### 3. alert.sh

**Purpose**: Check system metrics and send alerts every 5 minutes

**Usage**:
```bash
# Via cron
*/5 * * * * /path/to/monitoring/alert.sh
```

**Alert Conditions**:
1. **High Memory Usage**: Container using >80% memory
2. **Database Connection Failure**: Health endpoint reports database down
3. **Container Restarts**: More than 3 restarts in 5 minutes
4. **Low Disk Space**: Less than 10% disk space free
5. **Health Endpoint Unavailable**: HTTP status != 200
6. **Slow Queries**: More than 10 slow queries (>100ms) in recent logs

**Output**: `monitoring/alerts.log` with alert details

**Notifications**:
- Email via SMTP (configure EMAIL_ALERT environment variable)
- Backend API POST to `/api/v1/monitoring/alerts` (if available)

**Log Retention**: 30 days or 5MB (whichever comes first)

---

## Environment Variables

Set these environment variables to configure monitoring:

```bash
# Email alerts
export EMAIL_ALERT="admin@yourdomain.com"

# Backend URL for API integration
export BACKEND_URL="http://localhost:3000"

# Health check URL
export HEALTH_URL="http://localhost:3000/api/health"

# Alert thresholds
export MEMORY_THRESHOLD=80  # Percentage
export DISK_THRESHOLD=10    # Percentage free
```

---

## PostgreSQL Slow Query Logging

Slow query logging is enabled in `database/postgresql.conf`:

```ini
log_min_duration_statement = 100  # Log queries >100ms
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d.log'
```

**View Slow Queries**:
```bash
# Inside Docker container
docker exec -it tareasweb-database cat /var/log/postgresql/postgresql-$(date +%Y-%m-%d).log | grep "duration:"

# From host (if volume mounted)
grep "duration:" monitoring/postgresql-logs/postgresql-*.log
```

**Analyze Slow Queries**:
```sql
-- Install pg_stat_statements extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View top 10 slowest queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## Setup Instructions

### Linux/Mac

1. Make scripts executable:
```bash
chmod +x monitoring/*.sh
```

2. Set up cron jobs:
```bash
crontab -e

# Add these lines:
0 * * * * /path/to/TareasWeb/monitoring/docker-stats.sh
*/5 * * * * /path/to/TareasWeb/monitoring/alert.sh
```

3. Start health check service:
```bash
# Option 1: Screen session
screen -dmS health-check ./monitoring/health-check.sh

# Option 2: Systemd service (create /etc/systemd/system/tareasweb-health-check.service)
# See systemd-example.service file
```

### Windows

1. Set up Task Scheduler for docker-stats.ps1:
   - Open Task Scheduler
   - Create Basic Task: "TareasWeb Docker Stats"
   - Trigger: Daily at 00:00, repeat every 1 hour
   - Action: Start a program
   - Program: `powershell.exe`
   - Arguments: `-ExecutionPolicy Bypass -File C:\path\to\monitoring\docker-stats.ps1`

2. For health checks, consider using:
   - Windows Service (NSSM - Non-Sucking Service Manager)
   - Scheduled Task running continuously
   - Docker container with health check script

---

## Monitoring Dashboard (Future Enhancement)

Consider integrating with monitoring platforms:

- **Prometheus + Grafana**: Metrics collection and visualization
- **ELK Stack**: Log aggregation and analysis
- **Datadog / New Relic**: Commercial APM solutions
- **Netdata**: Real-time performance monitoring

### Quick Prometheus Setup

```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
  
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus

volumes:
  prometheus_data:
  grafana_data:
```

---

## Success Criteria (Phase 15)

- [X] T090: Docker stats logged hourly
- [X] T091: PostgreSQL slow query log enabled (>100ms threshold)
- [X] T092: Health check polling every 60 seconds
- [X] T093: Monitoring alerts configured (memory, database, restarts, disk, health)

**Verification**:
```bash
# Check stats logging
ls -lh monitoring/stats.log*

# Check health logging
ls -lh monitoring/health.log

# Check alerts
ls -lh monitoring/alerts.log

# Verify PostgreSQL slow query log
docker exec tareasweb-database ls -lh /var/log/postgresql/

# Test alert script manually
./monitoring/alert.sh
```

---

## Troubleshooting

### Issue: Scripts not executable
```bash
chmod +x monitoring/*.sh
```

### Issue: Email alerts not sending
- Check SMTP configuration: `echo "Test" | mail -s "Test" admin@example.com`
- Verify EMAIL_ALERT environment variable is set
- Check mail logs: `tail -f /var/log/mail.log`

### Issue: Health check not starting
- Check script output: `./monitoring/health-check.sh` (run in foreground first)
- Verify backend is running: `curl http://localhost:3000/api/health`
- Check permissions: `ls -la monitoring/health.log`

### Issue: PostgreSQL slow queries not logged
- Verify config loaded: `docker exec tareasweb-database psql -U tareasweb_user -d tareasweb -c "SHOW log_min_duration_statement;"`
- Check log directory exists: `docker exec tareasweb-database ls -la /var/log/postgresql/`
- Restart database: `docker-compose restart database`

---

## Performance Impact

All monitoring scripts are designed to minimize performance overhead:

- **docker-stats.sh**: Runs once per hour, <1 second execution time
- **health-check.sh**: 60-second polling interval, minimal CPU usage
- **alert.sh**: Runs every 5 minutes, checks complete in <5 seconds
- **PostgreSQL logging**: Only logs queries >100ms, negligible impact

**Estimated Resource Usage**:
- CPU: <1% average
- Memory: <10MB for all monitoring processes
- Disk: ~100MB/month for logs (with rotation)
- Network: <1KB/minute for health checks

---

## Related Documentation

- [spec.md](../specs/001-auth-task-management/spec.md) - Requirements (NFR-028-037)
- [plan.md](../specs/001-auth-task-management/plan.md) - Technical architecture
- [tasks.md](../specs/001-auth-task-management/tasks.md) - Phase 15 tasks
- [quickstart.md](../specs/001-auth-task-management/quickstart.md) - Deployment guide

---

**Last Updated**: 2025-11-05  
**Phase**: 15 - Monitoring & Observability  
**Status**: Complete
