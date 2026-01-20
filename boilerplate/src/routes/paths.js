// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  faqs: '/faqs',
  // AUTH
  auth: {
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
    },
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    // Analytics pages
    performance: `${ROOTS.DASHBOARD}/performance`,
    domains: `${ROOTS.DASHBOARD}/domains`,
    senders: `${ROOTS.DASHBOARD}/senders`,
    // Data pages
    events: `${ROOTS.DASHBOARD}/events`,
    upload: `${ROOTS.DASHBOARD}/upload`,
    files: `${ROOTS.DASHBOARD}/files`,
  },
};
