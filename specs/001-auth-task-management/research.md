# Research & Technology Decisions

**Feature**: Authentication and Task Management System  
**Branch**: 001-auth-task-management  
**Date**: 2025-11-04

## Overview

This document consolidates research findings and technology decisions for implementing a secure, resource-efficient task management system optimized for 1GB RAM VPS deployment.

---

## 1. Authentication Strategy

### Decision: JWT with HttpOnly Cookies + Refresh Token Rotation

**Rationale**:
- **JWT (JSON Web Tokens)**: Stateless authentication reduces server memory overhead (no session storage required), critical for 1GB RAM constraint
- **HttpOnly Cookies**: Prevents XSS attacks by making tokens inaccessible to JavaScript
- **Refresh Token Rotation**: Provides security against token theft while maintaining user convenience
- **Access Token**: Short-lived (15 minutes) to minimize exposure window
- **Refresh Token**: Longer-lived (7 days) but rotated on use and blacklisted on logout

**Alternatives Considered**:
- **Session-based auth**: Rejected due to memory overhead of session storage and horizontal scaling challenges
- **OAuth2**: Rejected as overkill for internal application; adds complexity without benefit
- **Basic Auth**: Rejected due to security concerns (credentials sent with every request)

**Implementation Libraries**:
- `jsonwebtoken` (npm): JWT generation and verification
- `bcrypt` (npm): Password hashing with configurable cost factor

**Security Measures**:
- Access tokens expire in 15 minutes (configurable via environment variable)
- Refresh tokens stored in database with expiration and revocation support
- Token blacklist for logout (stored in Redis or PostgreSQL for VPS constraint)
- CSRF protection via SameSite cookie attribute
- Rate limiting on login endpoint (5 attempts per 15 minutes per IP)

---

## 2. Backend Framework and Architecture

### Decision: Node.js 20 LTS + Express 4.x + TypeScript 5.x

**Rationale**:
- **Node.js 20 LTS**: Long-term support, excellent performance, mature ecosystem, low memory footprint
- **Express 4.x**: Minimal, unopinionated framework allowing fine-grained control over memory usage
- **TypeScript**: Strong typing prevents runtime errors, improves maintainability, catches bugs at compile time

**Architecture Pattern**: Layered Architecture
- **Models**: Database schema and ORM/query builder logic
- **Services**: Business logic (authentication, task assignment, alert generation)
- **Controllers**: HTTP request/response handling and validation
- **Middleware**: Cross-cutting concerns (auth, RBAC, error handling, logging)

**Alternatives Considered**:
- **NestJS**: Rejected due to higher memory overhead and abstraction layers (adds ~50-100MB RAM usage)
- **Fastify**: Considered but Express has larger ecosystem and team familiarity; performance difference negligible at our scale
- **Hapi**: Rejected due to steeper learning curve and less community support

**Key Dependencies**:
- **express**: Web framework
- **pg** (node-postgres): PostgreSQL driver (lightweight, no heavy ORM)
- **joi**: Schema validation (backend input validation)
- **winston**: Structured logging with daily rotation
- **express-rate-limit**: In-memory rate limiting (low overhead)
- **helmet**: Security headers middleware
- **cors**: Cross-origin resource sharing

**Why No ORM (e.g., TypeORM, Sequelize)**:
- ORMs add memory overhead (100-200MB) and query abstraction complexity
- Direct `pg` queries with TypeScript types provide better performance
- Full control over query optimization for 1GB RAM constraint
- Can use lightweight query builder like `slonik` if needed

---

## 3. Frontend Framework and UI Library

### Decision: React 18 + Material-UI 5 (or Tailwind CSS 3)

**Rationale**:
- **React 18**: Industry standard, excellent ecosystem, concurrent rendering for better UX
- **Material-UI 5**: Pre-built accessible components, theming system, responsive by default
- **Alternative - Tailwind CSS 3**: Utility-first CSS, smaller bundle size, full customization

**UI Library Comparison**:

| Feature | Material-UI 5 | Tailwind CSS 3 | Chakra UI 2 |
|---------|---------------|----------------|-------------|
| Bundle Size | ~300-400KB (tree-shaken) | ~10-50KB (purged) | ~250-350KB |
| Accessibility | Excellent (WCAG 2.1 AA) | Manual implementation | Excellent |
| Learning Curve | Medium (component API) | Low (CSS classes) | Low-Medium |
| Customization | Good (theme system) | Excellent (full control) | Good |
| Development Speed | Fast (pre-built components) | Medium (build from scratch) | Fast |

**Recommendation**: **Material-UI 5** for faster development with accessible components, OR **Tailwind CSS 3** if bundle size is priority.

**Alternatives Considered**:
- **Chakra UI**: Good alternative to MUI, slightly smaller bundle
- **Ant Design**: Rejected due to larger bundle size and opinionated design
- **Bootstrap React**: Rejected as outdated design patterns

**Key Dependencies**:
- **react**: UI library
- **react-router-dom**: Client-side routing
- **axios**: HTTP client with interceptors for JWT handling
- **formik + yup**: Form management and validation
- **react-calendar** OR **fullcalendar/react**: Calendar view
- **react-toastify**: Toast notifications
- **date-fns**: Date manipulation (lighter than Moment.js)

---

## 4. Database Design and Optimization

### Decision: PostgreSQL 16 (Alpine) with Optimized Configuration

**Rationale**:
- **PostgreSQL**: Best relational database for complex queries, ACID compliance, excellent performance
- **Alpine Image**: Reduces image size by ~50% compared to Debian-based images
- **Version 16**: Latest stable with performance improvements and better JSON support

**Memory Optimization for 1GB RAM VPS**:
```ini
shared_buffers = 128MB          # 25% of 512MB allocated to PostgreSQL
effective_cache_size = 256MB    # Estimate of OS cache
work_mem = 4MB                  # Per-query memory
maintenance_work_mem = 32MB     # For VACUUM, CREATE INDEX
max_connections = 20            # Limit concurrent connections
random_page_cost = 1.1          # SSD optimization
```

**Connection Pooling**:
- Backend uses `pg.Pool` with max 20 connections
- Idle timeout: 10 seconds
- Connection timeout: 5 seconds

**Indexing Strategy**:
- Primary keys: All UUIDs (better for distributed systems)
- Foreign keys: Indexed for JOIN optimization
- Query-specific indexes: `user_id`, `project_id`, `status`, `start_date`, `end_date`
- Composite indexes for common query patterns (e.g., `user_id + status`)

**Alternatives Considered**:
- **MySQL**: Rejected due to less robust ACID compliance and JSON support
- **SQLite**: Rejected due to lack of concurrent write support
- **MongoDB**: Rejected as relational data model is better fit for task management

---

## 5. Calendar and Date Handling

### Decision: react-calendar + date-fns

**Rationale**:
- **react-calendar**: Lightweight (30KB), highly customizable, no external dependencies
- **date-fns**: Modular date library (tree-shakeable), smaller than Moment.js
- Combined size: ~50KB vs. ~200KB+ for FullCalendar with dependencies

**Alternatives Considered**:
- **FullCalendar**: Feature-rich but heavy (200KB+), overkill for our use case
- **react-big-calendar**: Good alternative, slightly larger than react-calendar
- **Moment.js**: Rejected due to large size (288KB) and deprecated status

**Implementation Approach**:
- Use `react-calendar` for month/week/day views
- Custom event rendering for tasks (color-coded by status)
- Click handlers for task navigation
- Lazy load calendar data (load only visible month)

---

## 6. Real-Time Notifications

### Decision: Server-Sent Events (SSE) or Polling (not WebSockets)

**Rationale**:
- **Server-Sent Events**: One-way server-to-client push, lower overhead than WebSockets
- **HTTP Long Polling**: Fallback for browsers not supporting SSE
- **Why Not WebSockets**: Adds complexity, requires persistent connections (memory overhead), overkill for notification frequency

**Implementation**:
- SSE endpoint: `/api/v1/notifications/stream` (authenticated)
- Client polls every 30 seconds for fallback
- Toast notifications using `react-toastify`

**Alternatives Considered**:
- **WebSockets (Socket.io)**: Rejected due to memory overhead of persistent connections
- **Push Notifications (Web Push API)**: Future enhancement, not MVP

---

## 7. Docker Optimization

### Decision: Alpine-Based Multi-Stage Builds

**Backend Dockerfile Strategy**:
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node
CMD ["node", "dist/server.js"]
```

**Memory Limits** (docker-compose.yml):
```yaml
services:
  backend:
    mem_limit: 300m
    mem_reservation: 200m
  database:
    mem_limit: 300m
    mem_reservation: 200m
  nginx:
    mem_limit: 100m
```

**Image Size Targets**:
- Backend: ~150-200MB (Alpine + Node.js + dependencies)
- Frontend: ~50-100MB (Alpine Nginx + static files)
- Database: ~200-250MB (PostgreSQL Alpine)

---

## 8. Alert System Implementation

### Decision: Background Job with Cron-like Scheduler

**Rationale**:
- **node-cron**: Lightweight scheduler (40KB), runs in-process
- Runs every 15 minutes to check at-risk tasks
- Generates notifications stored in database
- Email sending via nodemailer (optional, configurable)

**Alert Logic**:
```typescript
// Check every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  const atRiskTasks = await checkDeadlineRisks();
  for (const task of atRiskTasks) {
    await createNotification(task.masterId, task);
    if (emailEnabled) {
      await sendAlertEmail(task.masterEmail, task);
    }
  }
});
```

**Deadline Risk Criteria**:
- Not Started: 50% of time elapsed between start_date and end_date
- In Progress: <20% time remaining until end_date

**Alternatives Considered**:
- **External scheduler (cron)**: Rejected to keep everything in Docker
- **Redis + Bull Queue**: Rejected due to additional service overhead
- **Database triggers**: Rejected as less flexible for business logic

---

## 9. Security Best Practices

### XSS Prevention
- React auto-escapes JSX by default
- Validate and sanitize all user inputs on backend (Joi schemas)
- CSP headers via Helmet middleware
- No `dangerouslySetInnerHTML` usage

### SQL Injection Prevention
- Parameterized queries only (`pg` placeholder syntax)
- No string concatenation for SQL queries
- Input validation with Joi before database queries

### CSRF Protection
- SameSite cookie attribute: `Strict` or `Lax`
- CSRF tokens for state-changing operations (optional with SameSite)

### Rate Limiting
- `express-rate-limit` middleware
- Login: 5 attempts per 15 minutes per IP
- API: 100 requests per 15 minutes per user
- Configurable via environment variables

### HTTPS/TLS
- Nginx reverse proxy handles SSL termination
- Let's Encrypt certificates (free, auto-renew)
- HTTP → HTTPS redirect
- HSTS header with 1-year max-age

---

## 10. Logging and Monitoring

### Decision: Winston + Daily File Rotation

**Rationale**:
- **Winston**: Flexible, structured logging (JSON format)
- **Daily rotation**: Prevents log files from growing unbounded
- **7-day retention**: Balance between debugging needs and disk space

**Log Levels**:
- **error**: Exceptions, failures
- **warn**: Deprecated usage, recoverable issues
- **info**: Application events (user login, task created)
- **debug**: Development-only verbose output

**Log Format**:
```json
{
  "timestamp": "2025-11-04T10:30:00.000Z",
  "level": "info",
  "message": "User logged in",
  "userId": "uuid",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**Monitoring**:
- Docker health checks for all containers
- `/health` endpoint returns service status
- Manual log review (grep, tail) on VPS
- Future: Lightweight monitoring (Prometheus + Grafana if resources allow)

---

## 11. Testing Strategy

### Backend Testing
- **Unit Tests**: Jest for services and utilities
- **Integration Tests**: Supertest for API endpoints
- **Coverage Target**: 70%+ for critical paths (auth, RBAC, task assignment)

### Frontend Testing
- **Component Tests**: React Testing Library
- **E2E Tests**: Optional - Playwright (not in MVP due to resource constraints)

### Database Testing
- Use separate test database (`tareasweb_test`)
- Seed data before each test suite
- Rollback transactions after tests

---

## 12. Deployment and CI/CD

### Deployment Process
1. **Build**: `docker-compose build`
2. **Push**: Tag images and push to registry (optional)
3. **Deploy**: `docker-compose up -d` on VPS
4. **Health Check**: Verify all containers healthy
5. **Backup**: Take database snapshot before major updates

### Backup Strategy
- **Frequency**: Daily at 2 AM (cron job)
- **Method**: `pg_dump` to compressed SQL file
- **Retention**: 7 daily, 4 weekly, 3 monthly
- **Storage**: Encrypted backup on separate volume or remote storage (S3/SFTP)

### CI/CD (Optional)
- GitHub Actions or GitLab CI for automated testing
- Run tests on pull requests
- Deploy to staging environment for validation
- Manual promotion to production (within 1GB RAM constraint, CI may run on separate machine)

---

## Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Backend Runtime | Node.js | 20.x LTS | Server-side JavaScript execution |
| Backend Framework | Express | 4.x | REST API framework |
| Language | TypeScript | 5.x | Type safety and developer experience |
| Database | PostgreSQL | 16.x Alpine | Relational data storage |
| Frontend Library | React | 18.x | UI rendering |
| UI Components | Material-UI | 5.x | Pre-built accessible components |
| Authentication | JWT + bcrypt | Latest | Token-based auth + password hashing |
| Validation | Joi (backend) | Latest | Server-side input validation |
| Validation | Yup (frontend) | Latest | Client-side form validation |
| HTTP Client | Axios | Latest | API communication |
| Calendar | react-calendar | Latest | Task calendar view |
| Notifications | react-toastify | Latest | Toast notifications |
| Logging | Winston | Latest | Structured logging |
| Rate Limiting | express-rate-limit | Latest | API rate limiting |
| Containerization | Docker + Compose | 24.x+ / 2.x+ | Container orchestration |
| Reverse Proxy | Nginx | Alpine | SSL termination, static files |
| Testing (Backend) | Jest + Supertest | Latest | Unit and integration tests |
| Testing (Frontend) | Jest + RTL | Latest | Component tests |

---

## Open Questions and Future Enhancements

### Deferred to Post-MVP
1. **Email Service**: Which SMTP provider? (Recommendation: SendGrid free tier or Gmail SMTP)
2. **File Uploads**: Task attachments (not in current spec, may add later)
3. **Advanced Reporting**: Analytics dashboard for project metrics
4. **Mobile App**: Native mobile apps (React Native potential)
5. **Integrations**: Slack notifications, Calendar sync (Google Calendar, Outlook)
6. **Multi-language Support**: i18n (currently Spanish status terms + English UI)

### Configuration Decisions Needed Before Deployment
1. **Domain Name**: For Let's Encrypt SSL certificate
2. **SMTP Credentials**: For email alerts (if enabled)
3. **Backup Storage**: Local volume vs. remote storage (S3, SFTP)
4. **Admin User**: Initial master user credentials

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Memory limit exceeded | App crashes, OOM kills | Strict memory limits per container, monitoring, optimization |
| Database connection exhaustion | API errors, slow responses | Connection pooling (max 20), query optimization, pagination |
| Large bundle size | Slow frontend loading | Code splitting, tree shaking, lazy loading, bundle analyzer |
| Security vulnerability | Data breach, unauthorized access | Regular dependency updates, security audits, penetration testing |
| Data loss | Business disruption | Daily automated backups, tested restore procedures |
| SSL certificate expiration | HTTPS unavailable | Let's Encrypt auto-renewal, monitoring expiration dates |

---

## Conclusion

All technology choices align with the TasksWeb Constitution principles:
- ✅ Security-First: JWT + bcrypt + HTTPS + rate limiting + input validation
- ✅ Resource-Constrained: Alpine images, optimized PostgreSQL, <750MB total memory
- ✅ RBAC: Server-side role enforcement in middleware
- ✅ API-First: REST endpoints with OpenAPI documentation
- ✅ Docker-Native: Multi-stage builds, health checks, Compose orchestration
- ✅ Input Validation: Joi (backend) + Yup (frontend) dual validation
- ✅ Observability: Winston logging, health endpoints, audit logs

**No NEEDS CLARIFICATION items remaining.** Ready to proceed to Phase 1 (Design & Contracts).
