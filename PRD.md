# 📄 Product Requirements Document (PRD)

## Product Name (Internal)
**PMTA Analytics & Observability Platform**  
*(Internal working name — can be renamed later)*

---

## 1. Problem Statement

### Current State
PMTA generates multiple large CSV files (`acct`, `tran`, `bounce`, `fbl`, `rb`) daily. These files:

- Are large (50–200MB)
- Are fragmented across file types
- Require manual Excel analysis or scripts
- Provide no unified visibility across delivery, throttling, complaints, or reputation

As a result:
- Root cause analysis is slow and reactive
- Infra damage (reputation, throttling) is detected late
- Identifying responsible users/jobs is manual and error-prone
- Operational decisions lack data-backed confidence

---

## 2. Goal & Vision

### Primary Goal
Build an internal observability platform that:
- Ingests and normalizes PMTA CSV logs at scale
- Correlates delivery, performance, complaints, and reputation events
- Provides fast filtering, analytics, and visual insights
- Enables root-cause and responsibility analysis

### Long-term Vision
Evolve this into:
- A proactive infra health system
- A reputation protection layer
- A future enterprise/SaaS-grade PMTA analytics product

---

## 3. Users & Personas

### 1️⃣ Infra / Deliverability Team (Primary)
- Daily usage
- Deep analysis
- Needs latency, throttling, RB, bounce diagnostics

### 2️⃣ Product / Ops Team
- Regular usage
- Campaign/job performance
- User-level impact analysis

### 3️⃣ Support Team
- Ad-hoc usage
- Debugging specific jobs/senders/domains
- Ticket-driven investigation

### 4️⃣ Management
- Occasional usage
- High-level health, risks, trends
- No raw-row interaction

---

## 4. Scope Definition

### In Scope
- CSV ingestion (manual & bulk)
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

## 5. Supported File Types

| File Type | Purpose |
|----------|--------|
| acct | Final delivery outcome |
| tran | SMTP transaction performance |
| bounce | Failure classification |
| fbl | Complaint data |
| rb | Reputation / rate blocking |

---

## 6. Functional Requirements

### 6.1 Ingestion & Upload

**FR-1: File Upload**
- Manual upload via UI
- Bulk upload (zip / multi-file)
- Accept files up to 200MB

**FR-2: File Detection**
- Auto-detect file type (`acct`, `tran`, `bounce`, `fbl`, `rb`)
- Validate headers
- Clear validation errors

**FR-3: Streaming Parsing**
- Chunk-based parsing
- No full-file memory load
- Background processing with progress indicator

---

### 6.2 Deduplication & Integrity

**FR-4: Deduplication**
- Detect duplicates using:
  - File hash
  - File metadata
- Configurable:
  - Auto-deduplicate **or**
  - Reject duplicates

**FR-5: File Tracking**
- File name
- File type
- Upload time
- Processing status
- Row count
- Error logs

---

### 6.3 Normalized Data Model

**FR-6: Canonical Event Model**

All rows normalized into `Event` records.

**Core Fields**
- eventType (`acct | tran | bounce | fbl | rb`)
- eventTimestamp
- jobId
- sender
- recipient
- recipientDomain
- vmta
- vmtaPool
- sourceIp
- destinationIp
- envId
- messageId
- customHeader
- fileId

**Derived Fields**
- deliveryLatency (tran only)
- recipientDomain (parsed)
- timeBucket (minute/hour/day)

---

### 6.4 Correlation Logic

**FR-7: Event Correlation**
Events correlated using:
- messageId
- jobId + recipient
- customHeader
- Time-window fallback

Supports: tran → bounce → rb → fbl


---

### 6.5 Filtering & Exploration

**FR-8: Global Filters**
- Date & time range
- Job ID
- Sender
- Recipient domain
- VMTA / pool
- Source IP
- Event type
- Bounce category
- SMTP status

**FR-9: Event Explorer**
- Table-based drill-down
- Pagination
- Column controls
- Chart → table click-through

---

### 6.6 Analytics & Metrics

#### Layer 1: Operational Metrics
- Sent
- Delivered
- Deferred
- Bounced (hard/soft)
- Complaints
- RB events
- Avg delivery latency

Grouped by:
- Job
- Sender
- Domain
- VMTA
- Time

#### Layer 2: Performance & Latency
Derived from `tran`: deliveryLatency = timeLogged − timeQueued

- Avg / P95 latency
- Latency trends
- Latency by domain / VMTA / IP

#### Layer 3: Domain Intelligence
- Bounce rate
- Deferral rate
- RB frequency
- Complaint rate
- Latency deviation

#### Layer 4: Root Cause Analysis
Correlates:
- Latency spikes
- RB events
- Bounce diagnostics

Outputs:
- Probable causes
- Time-windowed incidents

#### Layer 5: User / Sender Impact
Mapping:
- jobId → userId
- jobId → custom header

Metrics:
- Complaint rate per user
- Bounce severity per sender
- RB triggers per job
- Reputation risk score (future)

---

### 6.7 Automated Insights

**FR-10: Insight Cards**
Examples:
- “Gmail throttling detected”
- “Unusual complaint spike”
- “Latency anomaly vs baseline”

Rule-based (no ML initially)

---

### 6.8 Dashboards

**Dashboard 1: Global Health**
- KPI cards
- Trends
- Insight cards

**Dashboard 2: Performance & Latency**
- Latency trends
- Time × Domain heatmaps

**Dashboard 3: Domain Performance**
- ISP comparisons
- Failure & throttling

**Dashboard 4: Sender / User Risk**
- Complaint-heavy users
- Bounce-heavy senders
- RB-triggering jobs

**Dashboard 5: Event Explorer**
- Raw & filtered data
- Export support

---

### 6.9 Reporting & Export

**FR-11: Export Aggregated Reports**
- Aggregated tables
- Respects filters
- CSV format

---

## 7. Non-Functional Requirements

### Performance
- 20–25 files/day
- 100s of files concurrently
- Sub-second dashboards

### Scalability
- Column-oriented storage
- Date + eventType partitioning
- Async ingestion

### Reliability
- Partial ingestion recovery
- Clear error reporting

### Security
- Internal-only access
- Role-based visibility (future)

---

## 8. MVP vs Phases

### MVP (Phase 1)
- Upload & ingestion
- Deduplication
- Filtering & tables
- Core metrics
- Basic dashboards

### Phase 2
- Correlation logic
- Latency analytics
- Domain intelligence
- User impact views

### Phase 3
- Automated insights
- Risk scoring
- Alerting hooks
- Longer retention
- SaaS readiness

---

## 9. User Stories

**US-1 (Infra)**  
_As an infra engineer, I want to see when delivery slowed by domain._

Acceptance:
- Latency chart
- Time filter
- Tran drill-down

**US-2 (Support)**  
_As support, I want to know why a job failed._

Acceptance:
- Filter by jobId
- Correlated bounce/tran/rb
- Export summary

**US-3 (Ops)**  
_As ops, I want to know which users hurt reputation._

Acceptance:
- User-level aggregation
- Complaint & bounce metrics
- Sorted risk view

---

## 10. Risks & Trade-offs

| Risk | Mitigation |
|----|----|
| Large file ingestion | Streaming + async |
| Correlation ambiguity | Multi-key fallback |
| Data explosion | Short retention |
| Over-complex MVP | Phase gating |

---

## 11. Future SaaS-ification

- Multi-tenancy
- Long-term storage
- Alerting & notifications
- API access
- PMTA-native integrations

---

## 12. Final Assessment

You are building:

> **An internal PMTA observability, diagnostics, and reputation protection system**

Well-scoped, high-leverage, and future-proof.
