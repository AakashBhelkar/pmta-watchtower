import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.site.basePath}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  dashboard: icon('ic-dashboard'),
  analytics: icon('ic-analytics'),
  ecommerce: icon('ic-ecommerce'),
  file: icon('ic-file'),
  folder: icon('ic-folder'),
  user: icon('ic-user'),
  order: icon('ic-order'),
  mail: icon('ic-mail'),
};

// ----------------------------------------------------------------------

export const navData = [
  /**
   * Overview
   */
  {
    subheader: 'Overview',
    items: [
      {
        title: 'Global Health',
        path: paths.dashboard.root,
        icon: ICONS.dashboard,
      },
    ],
  },
  /**
   * Analytics
   */
  {
    subheader: 'Analytics',
    items: [
      {
        title: 'Performance & Latency',
        path: paths.dashboard.performance,
        icon: ICONS.analytics,
      },
      {
        title: 'Domain Performance',
        path: paths.dashboard.domains,
        icon: ICONS.mail,
      },
      {
        title: 'Sender Risk',
        path: paths.dashboard.senders,
        icon: ICONS.user,
      },
    ],
  },
  /**
   * Data
   */
  {
    subheader: 'Data',
    items: [
      {
        title: 'Event Explorer',
        path: paths.dashboard.events,
        icon: ICONS.order,
      },
      {
        title: 'Upload Files',
        path: paths.dashboard.upload,
        icon: ICONS.folder,
      },
      {
        title: 'File Manager',
        path: paths.dashboard.files,
        icon: ICONS.file,
      },
    ],
  },
];
