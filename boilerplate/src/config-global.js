import { paths } from 'src/routes/paths';

import packageJson from '../package.json';

// ----------------------------------------------------------------------

export const CONFIG = {
  site: {
    name: 'PMTA Analytics',
    description: 'PMTA Analytics & Observability Platform',
    apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:4000',
    basePath: import.meta.env.VITE_BASE_PATH ?? '',
    version: packageJson.version,
  },
  /**
   * Auth
   * Set skip to false when authentication is needed
   */
  auth: {
    method: 'jwt',
    skip: import.meta.env.VITE_AUTH_SKIP === 'true' || true,
    redirectPath: paths.dashboard.root,
  },
  /**
   * Mapbox (for future map visualizations)
   */
  mapbox: {
    apiKey: import.meta.env.VITE_MAPBOX_API_KEY ?? '',
  },
  /**
   * Supabase (optional cloud database)
   */
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL ?? '',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  },
};

