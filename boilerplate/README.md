# PMTA Analytics & Observability Platform - Frontend

An internal observability platform for PowerMTA that ingests CSV logs, normalizes data, provides analytics, and visual insights.

## Features

### MVP (Phase 1) - ✅ Complete
- **File Upload & Ingestion**: Drag-drop upload with auto file type detection
- **Bulk Upload**: ZIP file extraction for batch processing
- **CSV Parsing**: Streaming/chunked parsing for large files (50-200MB)
- **Data Normalization**: Canonical event model for all PMTA file types
- **Deduplication**: File hash-based duplicate detection
- **Dashboard Views**:
  - Global Health Dashboard with KPIs
  - Performance & Latency Analytics
  - Domain Performance Comparison
  - Sender/User Risk Analysis
  - Event Explorer with Filtering
  - File Manager

### Phase 2 - ✅ Implemented
- Event correlation via messageId
- P95/P99 latency analytics
- Automated incident detection (Throttling, Complaint Spikes)
- Risk score persistence

### Supported File Types
| Type | Description |
|------|-------------|
| `acct` | Final delivery outcome (accounting records) |
| `tran` | SMTP transaction performance logs |
| `bounce` | Failure classification records |
| `fbl` | Complaint/feedback loop data |
| `rb` | Reputation/rate blocking events |

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Docker (for PostgreSQL)
- Backend server running

### Installation

1. **Start the database** (from project root):
   ```bash
   docker-compose up -d
   ```

2. **Setup backend** (required first):
   ```bash
   cd backend
   npm install
   npx prisma migrate dev
   npm run dev
   ```

3. **Install frontend dependencies**:
   ```bash
   cd boilerplate
   npm install
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Open browser**:
   Navigate to http://localhost:3031/dashboard

## Project Structure

```
boilerplate/
├── src/
│   ├── pages/dashboard/       # Page components
│   ├── sections/              # View components
│   │   ├── overview/          # Global Health Dashboard
│   │   ├── performance/       # Latency Analytics
│   │   ├── domains/           # Domain Performance
│   │   ├── senders/           # Sender Risk
│   │   ├── events/            # Event Explorer
│   │   ├── upload/            # File Upload
│   │   └── files/             # File Manager
│   ├── services/              # API & utilities
│   │   ├── api.js             # Backend API client
│   │   ├── file-parser.js     # CSV parsing
│   │   └── index.js           # Exports
│   ├── layouts/               # Dashboard layout
│   ├── routes/                # Routing config
│   └── components/            # Reusable UI
├── sample-data/               # Test CSV files
└── package.json
```

## Testing

### Sample Data
Sample PMTA CSV files are provided in `sample-data/` for testing:
- `sample_acct.csv` - Accounting records
- `sample_bounce.csv` - Bounce records  
- `sample_fbl.csv` - Complaint records

### Upload Test
1. Navigate to Upload Files page
2. Drag and drop sample files (CSV or ZIP)
3. Click "Upload & Process"
4. Check File Manager for processing status

## Technology Stack

- **Frontend**: React 18 + Vite
- **UI Framework**: MUI v5 (Material UI)
- **Charts**: ApexCharts
- **State**: React Hooks
- **HTTP Client**: Axios

## Backend API

The frontend connects to a local Express.js backend via Vite proxy:
- Frontend: http://localhost:3031
- Backend: http://localhost:4000 (proxied as /api)

See `vite.config.js` for proxy configuration.

## Documentation

For complete documentation, see `../PMTA_WATCHTOWER_DOCS.md` in the project root.

## License

Internal use only.

