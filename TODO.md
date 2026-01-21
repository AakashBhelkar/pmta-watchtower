# PMTA Watchtower - Development TODO

Last Updated: 2026-01-21

## Status Legend
- ✅ Completed
- 🔄 In Progress
- ⏳ Planned
- ❌ Blocked

---

## 🔴 Priority 1: Critical Fixes (Completed)

- [x] ✅ Create `uploads/` directory in backend for file storage
- [x] ✅ Update frontend `.env` to point to local backend correctly
- [x] ✅ Add proper error handling in backend index.js
- [x] ✅ Fix file hash-based deduplication in file controller
- [x] ✅ Improve API response handling in frontend
- [x] ✅ Add graceful shutdown handling in backend
- [x] ✅ Merge documentation files into unified PMTA_WATCHTOWER_DOCS.md

---

## 🟠 Priority 2: Stability & Performance
            
- [ ] ⏳ Implement PostgreSQL partitioning for Event table
  - Create migration for table partitioning by date
  - Update queries to use partition pruning

- [x] ✅ Add request validation middleware
  - Use Joi or Zod for schema validation
  - Validate all API endpoints

- [x] ✅ Add rate limiting for API endpoints
  - Implement express-rate-limit
  - Configure per-endpoint limits

- [x] ✅ Improve error messages for upload failures
  - More descriptive error messages
  - Specific error codes in ingestion service

---

## 🟡 Priority 3: Feature Completion

- [x] ✅ Build Message Timeline UI (unified event chain view)
  - Create new section/view component
  - Display events in chronological order
  - Link events by messageId

- [x] ✅ Build Incident Timeline View for Dashboard 1
  - Add incident list component
  - Show timeline visualization
  - Add incident details modal

- [x] ✅ Add date range filters to all dashboard sections
  - Create shared DateRangePicker component
  - Pass filters to API calls

- [x] ✅ Implement file deletion cascade with aggregate cleanup
  - Update delete logic to delete physical files
  - Relies on Prisma Cascade Delete for events

---

## 🟢 Priority 4: Polish & UX

- [ ] ⏳ Add loading skeletons for dashboard cards
  - Replace simple loading spinners
  - Improve perceived performance

- [ ] ⏳ Implement toast notifications for operations
  - Success/error notifications for file uploads
  - Notification for background processes

- [x] ✅ Add data refresh buttons to dashboards
  - Manual refresh capability
  - Auto-refresh toggle

- [ ] ⏳ Improve mobile responsiveness
  - Test on various screen sizes
  - Adjust layouts for mobile

---

## 🔵 Future Phases (Backlog)

### Phase 2: Advanced Visualization
- [ ] Sankey Flow Visualization for message journeys
- [ ] High-density VMTA Status Board ("War Room")
- [ ] Real-time WebSocket updates

### Phase 3: Enterprise Features
- [ ] Multi-tenancy support
- [ ] User authentication & authorization
- [ ] API authentication & rate limiting
- [ ] Alerting & notifications system

### Phase 4: SaaS Readiness
- [ ] Long-term data retention policies
- [ ] Data export/import tools
- [ ] White-labeling support
- [ ] Deployment automation (CI/CD)

---

## 📝 Notes

### Development Setup
```bash
# Start database
docker-compose up -d

# Run backend
cd backend
npm install
npx prisma migrate dev
npm run dev

# Run frontend
cd boilerplate
npm install
npm run dev
```

### Access Points
- Frontend: http://localhost:3031/dashboard
- Backend API: http://localhost:4000
- pgAdmin: http://localhost:5050 (admin@pmta.com / admin123)

### Database Configuration
- PostgreSQL Port: 5433 (mapped from 5432 in Docker)
- Database: pmta_analytics
- User: pmta_user / pmta_password

### Sample Data
Upload CSV files from `boilerplate/sample-data/` for testing.

---

*For detailed architecture and requirements, see PMTA_WATCHTOWER_DOCS.md*
