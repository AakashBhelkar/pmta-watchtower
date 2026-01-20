# PMTA Analytics & Observability Platform

An internal observability platform for PowerMTA that ingests CSV logs, normalizes data, provides analytics, and visual insights.

## Features

### MVP (Phase 1) - Implemented ✅
- **File Upload & Ingestion**: Drag-drop upload with auto file type detection
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
- Supabase account (optional, for data persistence)

### Installation

1. **Install dependencies**:
   ```bash
   cd boilerplate
   npm install
   ```

2. **Configure environment** (optional):
   Copy `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Set up database** (if using Supabase):
   - Open Supabase SQL Editor
   - Run the schema from `supabase/schema.sql`

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
│   │   ├── supabase.js        # Supabase client
│   │   ├── file-parser.js     # CSV parsing
│   │   └── index.js           # Exports
│   ├── layouts/               # Dashboard layout
│   ├── routes/                # Routing config
│   └── components/            # Reusable UI
├── supabase/
│   └── schema.sql             # Database schema
├── sample-data/               # Test CSV files
│   ├── sample_acct.csv
│   ├── sample_bounce.csv
│   └── sample_fbl.csv
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
2. Drag and drop sample files
3. Click "Process Files" to parse

## Technology Stack

- **Frontend**: React 18 + Vite
- **UI Framework**: MUI v5 (Material UI)
- **Charts**: Placeholder (add ApexCharts/Recharts)
- **Database**: Supabase (PostgreSQL)
- **CSV Parsing**: PapaParse

## Roadmap

### Phase 2 (Planned)
- [ ] Event correlation logic
- [ ] P95/P99 latency analytics
- [ ] Domain intelligence scoring
- [ ] User impact views

### Phase 3 (Future)
- [ ] Automated insights engine
- [ ] Risk scoring
- [ ] Alerting system
- [ ] API access

## License

Internal use only.
