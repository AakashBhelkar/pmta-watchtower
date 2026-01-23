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
15. [Platform Walkthrough & Metrics](#15-platform-walkthrough--metrics)

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
- **FR-7**: Event correlation via messageId, jobId+recipient ✅ (Partially implemented: messageId API ready)

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

## 15. Platform Walkthrough & Metrics

### 15.1 What This Application Is

PMTA Watchtower is an **internal analytics and observability platform** for PowerMTA logs.  
It ingests raw CSV log files (`acct`, `tran`, `bounce`, `fbl`, `rb`), normalizes them into a single
canonical `Event` model, aggregates metrics into `AggregateMinute`, and exposes:

- Delivery volumes and outcomes (sent, delivered, deferred, bounced, complaints, RB events)
- Latency analytics (avg / P95 over time, per domain)
- Domain-level performance and reputation indicators
- Sender/user risk scoring
- Automated alerts and incidents for throttling, high bounces, and complaint spikes

The platform is **read-only** with respect to PMTA: it does not send email or control PMTA; it only
reads exported log files and builds analytics on top.

---

### 15.2 How the System Works (End-to-End Flow)

1. **Upload**
   - User uploads one or more PMTA CSV files (or ZIP containing CSVs) from the **Upload** page.
   - Backend stores the raw file in `backend/uploads/` and computes an **MD5 hash**.
   - If a file with the same hash already exists in the `File` table, the upload is treated as a
     **duplicate** and skipped from ingestion (the frontend can surface this via the `duplicates`
     array in the upload response).
   - Each new file is created in the `File` table with `processingStatus = 'pending'`.

2. **Streaming Ingestion & Normalization**
   - The ingestion service (`backend/services/ingestionService.js`) uses **PapaParse** to stream
     CSV rows in chunks.
   - For each chunk:
     - The headers are passed to `detectFileType` (`backend/utils/csvParser.js`) to infer
       which PMTA log type it is (`acct`, `tran`, `bounce`, `fbl`, `rb`).
     - Each row is passed to `normalizeEvent`, which:
       - Normalizes timestamps (`timeLogged`, `timeQueued`) into `eventTimestamp`.
       - Extracts job ID, sender, recipient, recipient domain, VMTA, IPs, and other fields.
       - Computes **delivery latency** in seconds:  
         `deliveryLatency = (timeLogged - timeQueued) / 1000`
       - Maps raw PMTA `type` codes (for `acct` logs) into semantic `eventType`s:
         - `d` → `tran` (delivered)
         - `b` → `bounce`
         - `t` → `acct` (transient/deferred)
         - `f` → `fbl` (feedback loop / complaint)
         - `r` → `rb` (rate block / remote bounce)
   - Normalized rows are bulk-inserted into the `Event` table via `createMany`, with
     `skipDuplicates: true` to avoid exact-row duplication.

3. **Aggregation into `AggregateMinute`
   - After a file finishes ingestion, `analyticsService.aggregateFileData(fileId)` runs.
   - This executes a PostgreSQL query that groups events **per minute** by:
     - `timeBucket` = `DATE_TRUNC('minute', eventTimestamp)`
     - `eventType`, `jobId`, `sender`, `recipientDomain`, `vmta`
   - Per group it computes and upserts into `AggregateMinute`:
     - `totalCount` = number of events in that bucket
     - `delivered` = count of events with `eventType = 'tran'`
     - `bounced` = count of events with `eventType IN ('bounce', 'rb')`
     - `deferred` = count of `acct` events with `dsnAction = 'delayed'`
     - `complaints` = count of `fbl` events
     - `avgLatencyMs` = average `deliveryLatency` (seconds) * 1000
     - `p95LatencyMs` = P95 `deliveryLatency` * 1000
   - When upserting, counts are **added** to existing rows so that multiple files contribute
     cumulatively to the same minute buckets.

4. **Risk Scoring**
   - After aggregation, `updateRiskScores(fileId)` runs:
     - For each **sender** in that file, it computes:
       - `complaintRate` = `(count of fbl events) / (count of acct events) * 100`
       - `bounceRate`    = `(count of bounce events) / (count of acct events) * 100`
     - Then derives a numeric `riskScore`:
       - `riskScore = min(100, round(complaintRate * 40 + bounceRate * 10))`
       - `riskLevel` is mapped from this score:
         - `> 80` → `critical`
         - `> 60` → `high`
         - `> 30` → `medium`
         - else  → `low`
     - Risk scores are stored in `RiskScore` per `(entityType='user', entityValue=sender)`.

5. **Incident Detection**
   - `incidentDetector.detectIncidents()` periodically evaluates recent `AggregateMinute` data
     using three main rules:
     1. **Domain Throttling**  
        - Compares avg latency per domain in the last ~15 minutes vs last 24 hours.  
        - If latency is **1.5x higher than baseline** and there are deferred events or very high
          latency (> 5s), it generates a `THROTTLING` alert for that domain.
     2. **Complaint Spikes**  
        - Looks at complaints per job over the last 30 minutes vs a 7-day baseline.  
        - If complaint rate exceeds **1%**, it raises a `COMPLAINT_SPIKE` alert.
     3. **High Bounce Rate**  
        - For each job in the last ~15 minutes, computes bounce rate.  
        - If bounce rate exceeds **20%** and there are at least 10 events, it raises
          a `HIGH_BOUNCE` alert.
   - Alerts are stored in `Alert`, and correlated into open `Incident` records so the
     UI can present an incident timeline.

6. **Dashboards & APIs**
   - Dashboards consume the analytics APIs under `/api/analytics/*`:
     - `/stats`        → global counts + latency summary
     - `/volume`       → time-series volume (sent/delivered/bounced/deferred)
     - `/latency`      → time-series latency (avg / P95)
     - `/domains`      → domain-level stats
     - `/senders`      → sender-level stats + risk
     - `/insights`     → current alerts
     - `/incidents`    → incidents & their alerts
     - `/export`       → aggregated CSV exports

Additionally, the **Event Explorer** uses `/api/events` and `/api/events/related/:messageId` to
query raw `Event` rows and show per-message journeys.

---

### 15.3 Key Metrics & Calculations

Unless otherwise noted, metrics are computed from the `AggregateMinute` table for the selected
date range.

#### 15.3.1 Global Counters (`/api/analytics/stats`)

- **Sent (`sent`)**  
  Sum of `totalCount` across all `AggregateMinute` rows in the date range.  
  Represents total events (not just deliveries), so it includes delivered, bounced, deferred,
  complaints, and RB events.

- **Delivered (`delivered`)**  
  Sum of `delivered` (i.e., events mapped to `tran`) across `AggregateMinute`.

- **Bounced (`bounced`)**  
  Sum of `bounced` (bounce + RB events) across `AggregateMinute`.

- **Deferred (`deferred`)**  
  Sum of `deferred` (acct events with `dsnAction = 'delayed'`) across `AggregateMinute`.

- **Complaints (`complaints`)**  
  Sum of `complaints` (fbl events) across `AggregateMinute`.

- **RB Events (`rbEvents`)**  
  Sum of `totalCount` for rows with `eventType = 'rb'`.

- **Average Latency (`avgLatency`)**  
  Calculated as:  
  `avgLatency = (AVG(avgLatencyMs) across rows) / 1000`  
  Exposed in seconds, but the frontend **formats values ≥ 60s as minutes** (e.g., `75s` → `1.25m`).

- **P95 Latency (`p95Latency`)**  
  Calculated as:  
  `p95Latency = (MAX(p95LatencyMs) across rows) / 1000`  
  Also formatted to minutes on the frontend when ≥ 60s.

#### 15.3.2 Volume Trend (`/api/analytics/volume`)

- Groups `AggregateMinute` rows into **hourly buckets** via `DATE_TRUNC('hour', timeBucket)`.
- For each hour, returns:
  - `sent`, `delivered`, `bounced`, `deferred` (SUM of respective fields).
- Used for volume trend charts in the Overview dashboard.

#### 15.3.3 Latency Trend (`/api/analytics/latency`)

- Filters to `eventType = 'tran'` (delivered messages).
- Groups by hour and returns:
  - `avgLatency`  = `AVG(avgLatencyMs) / 1000`
  - `p95Latency`  = `MAX(p95LatencyMs) / 1000`
  - `count`       = `SUM(totalCount)`
- The latency charts show these series, formatted with auto-switch to minutes when ≥ 60s.

#### 15.3.4 Domain Stats (`/api/analytics/domains`)

- Groups by `recipientDomain` within the date range.
- For each domain returns:
  - `total`       = sum of `totalCount`
  - `delivered`   = sum of `delivered`
  - `bounced`     = sum of `bounced`
  - `complaints`  = sum of `complaints`
  - `avgLatency`  = `AVG(avgLatencyMs) / 1000` (seconds, formatted to minutes on UI when ≥ 60s)
- The frontend additionally computes:
  - **Delivery Rate** = `delivered / total * 100`
  - **Status Chips** (`Excellent`, `Good`, `Fair`, `Poor`) based on delivery rate thresholds.

#### 15.3.5 Sender Stats & Risk (`/api/analytics/senders`)

- Groups by `sender` within the date range.
- For each sender returns:
  - `total`, `delivered`, `bounced`, `complaints`, `jobCount`
  - `riskScore`, `riskLevel` if present in `RiskScore`.
- The frontend then computes:
  - **Bounce Rate**     = `bounced / total * 100`
  - **Complaint Rate**  = `complaints / total * 100`
  - If no backend `riskLevel` is present, a heuristic risk level is derived:
    - Very high bounce/complaint → `critical`
    - Moderate issues → `high` or `medium`
- Sender table colors and chips are driven by these rates and risk levels.

---

### 15.4 Frontend Pages & What They Show

#### 15.4.1 Upload Files

- **Path**: Dashboard → Upload  
- **Components**:
  - Drag-and-drop + file picker for CSV/ZIP.
  - List of selected files with detected type (based on filename hints like `acct`, `tran`, etc.).
  - Per-file status (pending / processing / completed / error) and size.
- **Backend Interactions**:
  - On upload, calls `POST /api/files/upload` with all selected files under the `files` field.
  - The backend:
    - Saves to disk.
    - Deduplicates via file hash.
    - Inserts into `File` and kicks off streaming ingestion.
- **Notes / Limitations**:
  - Duplicate content files are **not re-ingested**; they appear in the upload response under
    `duplicates`, but only one record exists in the File Manager.

#### 15.4.2 File Manager

- **Path**: Dashboard → Files  
- **Purpose**: Track all uploaded files and their ingestion state.
- **Displays** (from `GET /api/files`):
  - File name, detected type, size, upload time, row count.
  - Processing status: `pending`, `processing`, `completed`, `error`.
- **Delete Behavior**:
  - `DELETE /api/files/:id`:
    - Deletes the `File` row.
    - Cascades deletion of `Event` rows for that file.
    - Best-effort deletion of the physical CSV from disk.
    - If this was the **last file**, defensive cleanup clears:
      - `AggregateMinute`, `RiskScore`, `Alert`, `Incident` and any remaining events.
- **Current Limitation**:
  - Deleting a **single file** does *not* recompute aggregates; the contributions of that file
    remain baked into existing `AggregateMinute` rows until all files are removed.  
    Improving this would require per-file aggregation tracking or a background recompute job.

#### 15.4.3 Global Health Dashboard (Overview)

- **Path**: Dashboard → Overview  
- **Purpose**: High-level operational health for a date range.
- **Top Filters**:
  - Date range picker (default: last 7 days).
  - Refresh button.
- **Key Cards**:
  - Sent, Delivered, Deferred, Bounced, Complaints, RB Events.  
  - Cards derive their numbers directly from `/api/analytics/stats`.
  - Some cards show a “% of total” based on `stats.sent` as denominator:
    - Delivery rate  = `delivered / sent * 100`
    - Deferred rate  = `deferred / sent * 100`
    - Bounce rate    = `bounced / sent * 100`
- **Trend Chart**:
  - Uses `/api/analytics/volume` and `/api/analytics/latency`.
  - Shows sent vs delivered vs bounced vs deferred over time.
- **Insights Panel**:
  - Uses `/api/analytics/insights`.
  - Displays active alerts (throttling, complaint spikes, high bounces) summarizing current risks.

#### 15.4.4 Performance & Latency

- **Path**: Dashboard → Performance  
- **Purpose**: Deep dive into latency behavior and overall sending volume.
- **Stat Cards**:
  - **Avg Latency**: `avgLatency` from `/stats`, auto-formatted (seconds → minutes when ≥ 60s).
  - **P95 Latency**: `p95Latency` from `/stats`, same auto-format rule.
  - **Peak Latency**: max of the two above, for a quick “worst case” view.
  - **Volume (Sent)**: `sent` from `/stats` (formatted as K/M where appropriate).
- **Latency Trends Chart**:
  - Uses `/api/analytics/latency`:
    - Series: Avg Latency, P95 Latency over time.
    - Y-axis and tooltips use the latency formatter to switch to minutes when above 60s.
- **Performance by Domain Table**:
  - Uses `/api/analytics/domains`.
  - Columns: Domain, Delivered, Bounced, Avg Latency.
  - A “slow” chip is shown when the underlying latency exceeds a small threshold (currently > 5s).

#### 15.4.5 Domain Performance

- **Path**: Dashboard → Domains  
- **Purpose**: Compare ISP / domain performance side-by-side.
- **Summary Cards** (computed on the frontend from `/domains`):
  - Total Sent (sum of `total`).
  - Overall Delivery Rate (`totalDelivered / totalSent * 100`).
  - Total Bounced.
  - Complaint Rate (`totalComplaints / totalSent * 100`).
- **ISP Comparison Table**:
  - Renders domain-level stats from `/domains`.
  - Latency column uses the latency formatter (seconds → minutes when ≥ 60s).
  - Delivery rate bar and status chip (`Excellent`, `Good`, `Fair`, `Poor`) are derived on
    the frontend from `delivered`, `total`.

#### 15.4.6 Sender / User Risk

- **Path**: Dashboard → Senders  
- **Purpose**: Identify problematic senders affecting reputation.
- **Summary Cards**:
  - Critical Risk senders (riskLevel = `critical`).
  - High Risk senders (riskLevel = `high`).
  - Total senders.
  - Average complaint rate across senders.
- **Risk Table**:
  - For each sender:
    - Jobs, Total Sent, Bounce Rate, Complaint Rate, Risk Score.
  - Bounce/complaint rates here are computed on the **frontend** from totals returned by
    `/api/analytics/senders`.
  - Risk chip uses backend `riskLevel` when available; otherwise a heuristic based on rate
    thresholds.

#### 15.4.7 Event Explorer

- **Path**: Dashboard → Events  
- **Purpose**: Row-level inspection of normalized `Event` data.
- **Filters**:
  - Event type (`acct`, `tran`, `bounce`, `fbl`, `rb`).
  - Job ID (contains).
  - Sender (contains).
  - Domain (recipient domain contains).
- **Table**:
  - Shows type (with chips), timestamp, job ID, sender, recipient, VMTA, and SMTP status.
  - Data comes from `GET /api/events` with pagination.
- **Message Timeline**:
  - Clicking a row opens a timeline (via `GET /api/events/related/:messageId`) showing all
    events for that message ID in chronological order.
- **Current Gap**:
  - Correlation by `jobId + recipient` is described in requirements but not yet implemented
    in the API; currently correlation is **messageId-only**.

#### 15.4.8 Incidents

- **Path**: Dashboard → Incidents  
- **Purpose**: Visualize system anomalies detected by the incident engine.
- **Timeline View**:
  - Data from `GET /api/analytics/incidents` with included alerts.
  - Each incident shows:
    - Title, severity, status (open/resolved), summary.
    - Entity (domain/job/user) the incident is tied to.
  - Severity/color mapping:
    - `critical` → red
    - `high`     → amber
    - `medium`   → blue
    - `low`      → green

---

### 15.5 Known Limitations & Improvement Ideas

- **Aggregation vs. Deletion**  
  - Deleting an individual file does not currently subtract its contribution from aggregated
    stats. A more accurate approach would be to track per-file aggregates or trigger a
    background recomputation after deletes.

- **Risk Calculation Consistency**  
  - Backend risk uses `fbl/acct` and `bounce/acct` as denominators, while frontend tables use
    `complaints/total` and `bounced/total`. Aligning these and surfacing exact formulas in the UI
    would make risk interpretation clearer.

- **Time Window Configurability**  
  - Incident rules use hard-coded windows (15 minutes, 24 hours, 7 days) and thresholds (e.g.,
    1% complaints, 20% bounce). Making these configurable via environment or a settings UI would
    let ops tune sensitivity per environment.

- **Duplicate Handling Visibility**  
  - Hash-based deduplication is correct for data integrity but can confuse users who upload many
    files and see fewer entries in File Manager. Surfacing duplicate counts and original file
    references more prominently in the UI would improve clarity.

- **Correlation Enrichment**  
  - Implementing the planned `jobId + recipient` correlation path and exposing more message
    journey views (Sankey flows, timelines) would make investigations easier.

---

*Document Version: 2.1 | Last Updated: 2026-01-21*
