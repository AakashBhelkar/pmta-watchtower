# Watchtower 2.0: The "Rethink" Plan
**Transitioning from a Dashboard to an Actionable Command Center**

## 1. Executive Vision
The current implementation of PMTA Watchtower provides a solid foundation for data ingestion and basic visualization. However, to meet the needs of high-volume email operations, we are pivoting toward a **Story-Led** and **Intelligence-First** architecture.

---

## 2. Core Pillars of the Rethink

### 2.1 Visual Overhaul: "Story-Led" Observability
*   **The Problem**: Currently, "Sent," "Bounced," and "Delivered" are just static numbers or basic charts. They don't explain *how* or *where* data is moving.
*   **The Solution**: Implement **Message Journey Distribution** visualizations.
    *   **Sankey Flows**: Map traffic from Senders → VMTAs → ISP Gateways (Gmail, Yahoo, Outlook).
    *   **Pulse Charts**: Use dynamic "pipe" thicknesses to visually indicate throttling (thinner pipes = higher latency/backlog).
    *   **System Pulse**: A "high-density" main page view similar to server rack monitors or stock tickers, showing every VMTA’s real-time health.

### 2.2 Structural Fix: "Intelligence First"
*   **The Problem**: The platform relies on the user to go looking for issues (e.g., browsing the "Domains" tab).
*   **The Solution**: An **Incident-Led Workflow**.
    *   The UI should actively scream when something is wrong.
    *   **Example Alert**: *"Gmail is throttling VMTA-5; 40k messages queued. Success rate dropped to 12%."*
    *   **Actionable Links**: Every alert should link directly to the affected entities (Senders, Jobs, or IPs).

### 2.3 Backend Accuracy: "The Unified Chain" (Event Correlation)
*   **The Problem**: PMTA logs (`acct`, `tran`, `bounce`) are intrinsically disconnected. Finding the delivery attempt that led to a specific bounce is currently a manual forensic task.
*   **The Solution**: A **Correlation Worker**.
    *   Link events automatically using `messageId` and `jobId+recipient` hashes.
    *   **Unified Timeline**: When viewing a bounce or FBL complaint, the system should show the entire lifecycle:
        1. `acct`: Logged/Queued time.
        2. `tran`: Delivery attempts and SMTP responses.
        3. `bounce/fbl`: Final resolution.

---

## 3. Immediate Progress (Watchtower 2.1)
To demonstrate the power of real-time data, the following has been deployed:
*   **Backend Volume API**: A new `/api/analytics/volume` endpoint providing hourly aggregated time-series data.
*   **Real-Time Trend Chart**: The "Global Health" dashboard now uses interactive **ApexCharts** to display actual volume stacks (Delivered vs. Bounced vs. Deferred) instead of mock data.

---

## 4. Proposed Observability Pillars (Next Steps)
We will now focus on building one of these three primary modules:

1.  **The "War Room" UI**: A high-density, real-time health board for VMTAs and IPs.
2.  **The "Message Forensic" View**: A deep-dive page for a single Message ID showing its full journey across all log files.
3.  **The "Cluster" View**: Grouping metrics by "VMTA Pools" to identify if specific hardware or network clusters are failing.

---

## 5. Implementation Status
| Pillar | Requirement | Status |
| :--- | :--- | :--- |
| **Visual** | Interactive Trend Charts | ✅ Deployed |
| **Visual** | Sankey/Flow Dynamics | ⏳ Researching |
| **Intelligence** | Incident Detection Engine | ✅ Backend Ready |
| **Intelligence** | High-Density Status Board | ⏳ Planned |
| **Accuracy** | Event Correlation API | ✅ Backend Ready |
| **Accuracy** | Message Timeline UI | ⏳ Planned |
