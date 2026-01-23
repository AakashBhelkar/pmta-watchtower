// ----------------------------------------------------------------------

const MuiCard = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      position: 'relative',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      borderRadius: 12,
      border: '1px solid #EBEEF2',
      zIndex: 0, // Fix Safari overflow: hidden with border radius
    }),
  },
};

// ----------------------------------------------------------------------

const MuiCardHeader = {
  /** **************************************
   * DEFAULT PROPS
   *************************************** */
  defaultProps: {
    titleTypographyProps: { variant: 'h6' },
    subheaderTypographyProps: { variant: 'body2', marginTop: '4px' },
  },

  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(3, 3, 0),
    }),
  },
};

// ----------------------------------------------------------------------

const MuiCardContent = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: { root: ({ theme }) => ({ padding: theme.spacing(3) }) },
};

// ----------------------------------------------------------------------

export const card = { MuiCard, MuiCardHeader, MuiCardContent };
