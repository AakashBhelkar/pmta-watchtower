import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { CONFIG } from 'src/config-global';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

// Overview
const OverviewPage = lazy(() => import('src/pages/dashboard/overview'));

// Analytics
const PerformancePage = lazy(() => import('src/pages/dashboard/performance'));
const DomainsPage = lazy(() => import('src/pages/dashboard/domains'));
const SendersPage = lazy(() => import('src/pages/dashboard/senders'));
const IncidentsPage = lazy(() => import('src/pages/dashboard/incidents'));

// Data
const EventsPage = lazy(() => import('src/pages/dashboard/events'));
const UploadPage = lazy(() => import('src/pages/dashboard/upload'));
const FilesPage = lazy(() => import('src/pages/dashboard/files'));

// ----------------------------------------------------------------------

const layoutContent = (
  <DashboardLayout>
    <Suspense fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  </DashboardLayout>
);

export const dashboardRoutes = [
  {
    path: 'dashboard',
    element: CONFIG.auth.skip ? <>{layoutContent}</> : <AuthGuard>{layoutContent}</AuthGuard>,
    children: [
      // Overview
      { element: <OverviewPage />, index: true },
      // Analytics
      { path: 'performance', element: <PerformancePage /> },
      { path: 'domains', element: <DomainsPage /> },
      { path: 'senders', element: <SendersPage /> },
      { path: 'incidents', element: <IncidentsPage /> },
      // Data
      { path: 'events', element: <EventsPage /> },
      { path: 'upload', element: <UploadPage /> },
      { path: 'files', element: <FilesPage /> },
    ],
  },
];
