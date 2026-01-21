# PMTA Analytics & Observability Platform - Unified Documentation

> **Internal PMTA observability, diagnostics, and reputation protection system**

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Vision](#3-goals--vision)
4. [Users & Personas](#4-users--personas)
5. [Scope Definition](#5-scope-definition)
6. [Supported File Types](#6-supported-file-types)
7. [Functional Requirements](#7-functional-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Technical Architecture](#9-technical-architecture)
10. [Implementation Status](#10-implementation-status)
11. [TODO Task List](#11-todo-task-list)
12. [Risk & Trade-offs](#12-risks--trade-offs)
13. [Future Roadmap](#13-future-roadmap)
14. [Getting Started](#14-getting-started)

---

## 1. Executive Summary

The PMTA Analytics & Observability Platform is an internal tool designed to ingest and analyze PowerMTA CSV log files at scale. The implementation currently covers the majority of **MVP (Phase 1)** requirements and has begun laying groundwork for **Phase 2 (Correlation & Intelligence)**.

**Current Architecture:**
- **Frontend**: React 18 + Vite + MUI v5 (Material UI)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL with Prisma ORM
- **Charts**: ApexCharts
- **CSV Parsing**: PapaParse (streaming)

---

## 2. Problem Statement

### Current State
PMTA generates multiple large CSV files (`acct`, `tran`, `bounce`, `fbl`, `rb`) daily. These files:

- Are large (50–200MB)
- Are fragmented across file types
- Require manual Excel analysis or scripts
- Provide no unified visibility across delivery, throttling, complaints, or reputation

### Impact
- Root cause analysis is slow and reactive
- Infra damage (reputation, throttling) is detected late
- Identifying responsible users/jobs is manual and error-prone
- Operational decisions lack data-backed confidence

---

## 3. Goals & Vision

### Primary Goal
Build an internal observability platform that:
- Ingests and normalizes PMTA CSV logs at scale
- Correlates delivery, performance, complaints, and reputation events
- Provides fast filtering, analytics, and visual insights
- Enables root-cause and responsibility analysis

### Long-term Vision (PMTA Watchtower 2.0)
- **Story-Led Observability**: Message Journey Distribution visualizations (Sankey Flows, Pulse Charts)
- **Intelligence-First Architecture**: Incident-Led Workflow with proactive alerting
- **The Unified Chain**: Event correlation across all log types
- Enterprise/SaaS-grade PMTA analytics product

---

## 4. Users & Personas

| Persona | Usage | Needs |
|---------|-------|-------|
| **Infra / Deliverability Team** | Daily | Deep analysis: latency, throttling, RB, bounce diagnostics |
| **Product / Ops Team** | Regular | Campaign/job performance, user-level impact analysis |
| **Support Team** | Ad-hoc | Debugging specific jobs/senders/domains, ticket-driven investigation |
| **Management** | Occasional | High-level health, risks, trends (no raw-row interaction) |

---

## 5. Scope Definition

### In Scope
- CSV ingestion (manual & bulk ZIP)
- Data normalization & deduplication
- Time-based, domain-based, sender-based analytics
- Visual dashboards
- Aggregated reports export
- Basic automated insights

### Explicitly Out of Scope
- Email sending
- Real-time SMTP interception
- Direct PMTA control (pause VMTA, block sender, etc.)
- End-customer UI

---

## 6. Supported File Types

| File Type | Purpose |
|----------|---------|
| `acct` | Final delivery outcome |
| `tran` | SMTP transaction performance |
| `bounce` | Failure classification |
| `fbl` | Complaint data |
| `rb` | Reputation / rate blocking |

---

## 7. Functional Requirements

### 7.1 Ingestion & Upload
- **FR-1**: Manual upload via UI + Bulk upload (zip / multi-file) + Accept files up to 200MB ✅
- **FR-2**: Auto-detect file type + Validate headers + Clear validation errors ✅
- **FR-3**: Chunk-based streaming parsing + Background processing with progress indicator ✅

### 7.2 Deduplication & Integrity
- **FR-4**: Detect duplicates using file hash ✅
- **FR-5**: File tracking (name, type, upload time, status, row count, error logs) ✅

### 7.3 Normalized Data Model
- **FR-6**: Canonical Event Model with core fields and derived fields ✅

### 7.4 Correlation Logic
- **FR-7**: Event correlation via messageId, jobId+recipient ✅ (API Ready)

### 7.5 Filtering & Exploration
- **FR-8**: Global Filters (date, job ID, sender, domain, VMTA, event type, etc.) ✅
- **FR-9**: Event Explorer with pagination and column controls ✅

### 7.6 Analytics & Metrics
- Layer 1: Operational Metrics (Sent, Delivered, Deferred, Bounced, Complaints, RB events) ✅
- Layer 2: Performance & Latency (Avg / P95 latency, trends by domain/VMTA/IP) ✅
- Layer 3: Domain Intelligence (bounce rate, deferral rate, RB frequency) ✅
- Layer 4: Root Cause Analysis ✅ (Backend Ready)
- Layer 5: User / Sender Impact (risk scores per sender) ✅

### 7.7 Automated Insights
- **FR-10**: Insight Cards (Throttling detection, Complaint spikes) ✅

### 7.8 Dashboards
- Dashboard 1: Global Health ✅
- Dashboard 2: Performance & Latency ✅
- Dashboard 3: Domain Performance ✅
- Dashboard 4: Sender / User Risk ✅
- Dashboard 5: Event Explorer ✅

### 7.9 Reporting & Export
- **FR-11**: Export aggregated reports as CSV ✅

---

## 8. Non-Functional Requirements

| Category | Requirement | Status |
|----------|-------------|--------|
| **Performance** | 20–25 files/day, 100s of files concurrently, Sub-second dashboards | ✅ Aggregates table |
| **Scalability** | Column-oriented storage, partitioning, async ingestion | ⏳ Partitioning needed |
| **Reliability** | Partial ingestion recovery, clear error reporting | ✅ |
| **Security** | Internal-only access, Role-based visibility (future) | ⏳ Partial |

---

## 9. Technical Architecture

### Project Structure
```
pmta-watchtower/
├── backend/                 # Node.js + Express API
│   ├── controllers/         # Request handlers
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── utils/               # CSV parsing utilities
│   └── prisma/              # Database schema
├── boilerplate/             # React Frontend
│   ├── src/
│   │   ├── pages/           # Route pages
│   │   ├── sections/        # Dashboard views
│   │   ├── services/        # API clients
│   │   ├── components/      # Reusable UI
│   │   └── layouts/         # Dashboard layout
│   └── sample-data/         # Test CSV files
└── docker-compose.yml       # PostgreSQL + pgAdmin
```

### Database Models (Prisma)
- **File**: Upload tracking with hash-based deduplication
- **Event**: Canonical event data from all PMTA files
- **AggregateMinute**: Pre-computed metrics for fast dashboard queries
- **RiskScore**: Entity-level risk scores with decay
- **Alert**: Real-time incident alerts
- **Incident**: Grouped alerts for incident management

### API Endpoints
- `POST /api/files/upload` - Upload files (supports ZIP)
- `GET /api/files` - List uploaded files
- `GET /api/events` - Query events with filters
- `GET /api/events/related/:messageId` - Correlation lookup
- `GET /api/analytics/stats` - Aggregated stats
- `GET /api/analytics/volume` - Volume trends
- `GET /api/analytics/latency` - Latency trends
- `GET /api/analytics/domains` - Domain performance
- `GET /api/analytics/senders` - Sender performance + risk
- `GET /api/analytics/insights` - Real-time alerts
- `GET /api/analytics/incidents` - Incident timeline
- `GET /api/analytics/export` - CSV export

---

## 10. Implementation Status

### What is Correctly Implemented
- ✅ Canonical Data Model (`Event`, `File` models)
- ✅ Streaming Ingestion with PapaParse + bulk inserts
- ✅ Auto-Detection of file types (acct, tran, bounce, fbl, rb)
- ✅ All Dashboard UI sections with high-fidelity aesthetics
- ✅ Analytics Aggregation with SQL (PERCENTILE_CONT, DATE_TRUNC)
- ✅ File Manager with polling for status updates
- ✅ Deduplication with unique fileHash
- ✅ AggregateMinute table for performance optimization
- ✅ Risk Score persistence in database
- ✅ Incident Detection Engine (Throttling, Complaint Spikes)
- ✅ Bulk ZIP extraction for uploads
- ✅ CSV Export functionality

### What Needs Work
- ⚠️ **Missing uploads directory** in backend
- ⚠️ **Database partitioning** not yet implemented
- ⚠️ **Environment configuration** needs cleanup
- ⚠️ **Error handling** could be more robust
- ⚠️ **Message Timeline UI** not yet built
- ⚠️ **Incident Timeline View** needs frontend component

---

## 11. TODO Task List

### 🔴 Priority 1: Critical Fixes (Immediate)
- [ ] Create `uploads/` directory in backend for file storage
- [ ] Update frontend `.env` to point to local backend correctly
- [ ] Add proper error boundaries in React components
- [ ] Fix potential BigInt serialization issues in API responses

### 🟠 Priority 2: Stability & Performance
- [ ] Implement PostgreSQL partitioning for Event table
- [ ] Add request validation middleware
- [ ] Add rate limiting for API endpoints
- [ ] Improve error messages for upload failures

### 🟡 Priority 3: Feature Completion
- [ ] Build Message Timeline UI (unified event chain view)
- [ ] Build Incident Timeline View for Dashboard 1
- [ ] Add date range filters to all dashboard sections
- [ ] Implement file deletion cascade with aggregate cleanup

### 🟢 Priority 4: Polish & UX
- [ ] Add loading skeletons for dashboard cards
- [ ] Implement toast notifications for operations
- [ ] Add data refresh buttons to dashboards
- [ ] Improve mobile responsiveness

### 🔵 Future Phases
- [ ] Sankey Flow Visualization for message journeys
- [ ] High-density VMTA Status Board
- [ ] Multi-tenancy support
- [ ] Alerting & notifications system
- [ ] API authentication & rate limiting

---

## 12. Risks & Trade-offs

| Risk | Mitigation |
|------|------------|
| Large file ingestion | Streaming + async processing |
| Correlation ambiguity | Multi-key fallback (messageId, jobId+recipient) |
| Data explosion | Short retention + aggregation tables |
| Over-complex MVP | Phase gating |

---

## 13. Future Roadmap

### Phase 2 (Planned)
- Event correlation logic ✅
- P95/P99 latency analytics ✅
- Domain intelligence scoring ✅
- User impact views ✅

### Phase 3 (Future)
- Automated insights engine ✅
- Risk scoring ✅
- Alerting system ⏳
- API access ⏳
- Multi-tenancy
- Long-term storage

### PMTA Watchtower 2.0
- "War Room" UI: Real-time health board for VMTAs and IPs
- "Message Forensic" View: Full journey per Message ID
- "Cluster" View: VMTA Pool groupings

---

## 14. Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15

### Quick Start

1. **Start the database:**
   ```bash
   docker-compose up -d
   ```

2. **Setup backend:**
   ```bash
   cd backend
   npm install
   npx prisma migrate dev
   npm run dev
   ```

3. **Setup frontend:**
   ```bash
   cd boilerplate
   npm install
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3031/dashboard
   - Backend API: http://localhost:4000
   - pgAdmin: http://localhost:5050

### Sample Data
Test CSV files are available in `boilerplate/sample-data/`:
- `sample_acct.csv` - Accounting records
- `sample_bounce.csv` - Bounce records
- `sample_fbl.csv` - Complaint records

---

*Document Version: 2.0 | Last Updated: 2026-01-21*
