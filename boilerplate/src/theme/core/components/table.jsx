import { tableRowClasses } from '@mui/material/TableRow';
import { tableCellClasses } from '@mui/material/TableCell';

import { varAlpha } from '../../styles';

// ----------------------------------------------------------------------

const MuiTableContainer = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      position: 'relative',
      scrollbarWidth: 'thin',
      scrollbarColor: `${varAlpha(theme.vars.palette.text.disabledChannel, 0.4)} ${varAlpha(theme.vars.palette.text.disabledChannel, 0.08)}`,
    }),
  },
};

// ----------------------------------------------------------------------

const MuiTable = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({ '--palette-TableCell-border': theme.vars.palette.divider }),
  },
};

// ----------------------------------------------------------------------

const MuiTableRow = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      [`&.${tableRowClasses.selected}`]: {
        backgroundColor: varAlpha(theme.vars.palette.primary.darkChannel, 0.04),
        '&:hover': { backgroundColor: varAlpha(theme.vars.palette.primary.darkChannel, 0.08) },
      },
      '&:last-of-type': { [`& .${tableCellClasses.root}`]: { borderColor: 'transparent' } },
    }),
  },
};

// ----------------------------------------------------------------------

const MuiTableCell = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: {
      borderBottomStyle: 'solid',
      borderBottomColor: '#EBEEF2',
    },
    head: ({ theme }) => ({
      fontSize: 13,
      color: theme.vars.palette.text.secondary,
      fontWeight: theme.typography.fontWeightSemiBold,
      backgroundColor: '#FAFBFC',
      textTransform: 'none',
      letterSpacing: '0.2px',
    }),
    stickyHeader: ({ theme }) => ({
      backgroundColor: '#FAFBFC',
      backgroundImage: 'none',
    }),
    paddingCheckbox: ({ theme }) => ({ paddingLeft: theme.spacing(1) }),
  },
};

// ----------------------------------------------------------------------

const MuiTablePagination = {
  /** **************************************
   * DEFAULT PROPS
   *************************************** */
  defaultProps: {
    backIconButtonProps: { size: 'small' },
    nextIconButtonProps: { size: 'small' },
    slotProps: { select: { name: 'table-pagination-select' } },
  },

  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: { width: '100%' },
    toolbar: { height: 64 },
    actions: { marginRight: 8 },
    select: ({ theme }) => ({
      paddingLeft: 8,
      '&:focus': { borderRadius: theme.shape.borderRadius },
    }),
    selectIcon: {
      right: 4,
      width: 16,
      height: 16,
      top: 'calc(50% - 8px)',
    },
  },
};

// ----------------------------------------------------------------------

export const table = {
  MuiTable,
  MuiTableRow,
  MuiTableCell,
  MuiTableContainer,
  MuiTablePagination,
};
