# PMTA Analytics & Observability Platform - Project Audit & Progress Report

## 1. Executive Summary
The implementation currently covers the majority of **MVP (Phase 1)** requirements and has begun laying the groundwork for **Phase 2 (Correlation & Intelligence)**. The application architecture is sound, utilizing a modern stack (React/Vite, Node/Express, PostgreSQL/Prisma). Core ingestion pipelines and analytics dashboards are functional.

---

## 2. Audit Findings

### 2.1 What is Correct (Implemented & Standardized)
*   **Canonical Data Model**: The `Event` and `File` models in Prisma closely align with the PRD requirements.
*   **Streaming Ingestion**: The `ingestionService.js` correctly implements chunked parsing using `PapaParse` and `createMany` for bulk inserts, preventing memory bottlenecks.
*   **Auto-Detection**: The system detects PMTA file types (`acct`, `tran`, `bounce`, etc.) based on header signatures both on the frontend (for UI feedback) and backend (for processing).
*   **Core UI Sections**: All requested dashboards (`Global Health`, `Performance`, `Domain Performance`, `Sender Risk`, `Event Explorer`) are implemented with high-fidelity aesthetics.
*   **Analytics Aggregation**: Backend routes for stats and latency trends use advanced SQL (e.g., `PERCENTILE_CONT`, `DATE_TRUNC`) to provide professional-grade metrics like P95 latency.
*   **Polling Mechanism**: The File Manager correctly polls for the status of "pending" and "processing" files.

### 2.2 What is Incorrect / Deviating from PRD
*   **Database Scalability**: 
    *   **Missing Aggregates**: The `aggregates_minute` table is missing. Currently, dashboards query the raw `Event` table directly, which will degrade performance as data grows.
    *   **Partitioning**: Daily/Type partitioning for the `Event` table (requested in PRD 1.2) is not implemented.
*   **Deduplication**: The `fileHash` field in the `File` model is not marked `unique` in the Prisma schema, which could lead to duplicate file ingestion.
*   **Risk Scoring Persistence**: Risk levels are calculated on-the-fly in the frontend for Senders, but the PRD requires a backend `risk_scores` table with decay logic.
*   **File Upload Limits**: Bulk ZIP upload support (FR-1) is not yet implemented.

### 2.3 Gaps & Unfinished Features
*   **Event Correlation (FR-7)**: Logic to link `tran` -> `bounce` -> `fbl` via `messageId` or `jobId+recipient` is currently absent.
*   **Automated Insights (FR-10)**: The `InsightsPanel` remains populated with mock data. The rule-based detection (Throttling, Complaint Spikes) is not implemented in the backend.
*   **Reporting (FR-11)**: The "Export CSV" buttons in the UI are placeholders and do not trigger a backend export service.
*   **Incident Timeline**: The powerful "cluster-based" incident view (Section 2 of the second PRD part) is not yet built.

---

## 3. Recommended TODO Task List

### Phase 1: Stability & Scaling (Immediate Priority)
- [x] **DB Hardening**: Mark `fileHash` as `UNIQUE` in `schema.prisma`. (Completed)
- [x] **Performance Layer**: Create the `aggregates_minute` table and implement the trigger in `ingestionService.js`. (Completed)
- [x] **Aggregation Optimization**: Update `analyticsRoutes.js` to query from `aggregates_minute`. (Completed)
- [ ] **Partitioning**: Implement manual PostgreSQL partitioning for the `Event` table via a migration.

### Phase 2: Intelligence & Correlation
- [x] **Correlation Engine**: Added /related/:messageId API to link multi-file events. (Completed)
- [x] **Rule-Based Detection**: Implemented `IncidentDetector` with Throttling and Complaint Spike rules. (Completed)
- [x] **Insights API**: Connected `InsightsPanel` to real-time alerts. (Completed)
- [x] **Risk Score Persistence**: Integrated user-level risk scores into Senders view. (Completed)

### Phase 3: Features & Polishing
### Phase 3: Features & Polishing
- [x] **Bulk Upload**: Added recursive ZIP extraction to the ingestion pipeline. (Completed)
- [x] **Export Service**: Implemented CSV export functionality for all major reports. (Completed)
- [ ] **Infrastructure Health**: Evolve Dashboard 1 to include the "Incident Timeline View". (API Ready)

---

## 4. Final Assessment
The application is **correctly built** from an architectural standpoint. It handles large-scale data ingestion and provides the precise metrics required for PMTA observability. To transition from an MVP to a "Production-Grade Platform," the focus must now shift from UI/Dashboard creation to **Data Persistence Strategy** (Aggregations/Risk Scores) and **Intelligence Rules**.
