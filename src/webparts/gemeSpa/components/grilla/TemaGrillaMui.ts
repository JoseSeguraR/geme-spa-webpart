import { createTheme } from '@mui/material/styles';
import { esES as localeMaterialEs } from '@mui/material/locale';
import { esES as localeDataGridEs } from '@mui/x-data-grid/locales';
import type {} from '@mui/x-data-grid/themeAugmentation';
import { AlturaEncabezadoGrillaPx, AlturaFilaGrillaPx } from '../../models/GrillaServidor';

/**
 * Valores alineados con `styles/_tokens.scss` y `docs/arquitectura-spa.md` (tipografía en vistas).
 * Celdas, encabezados de columna, paginación e inputs: `--cowork-font-size-sm`.
 * La palette de MUI no admite `var(--cowork-*)` en todos los campos: el tema parsea colores en runtime.
 * La grilla usa fondo claro de contenido (no el azul del sidebar).
 */
const ColorTextoPrincipal = '#0f172b';
const ColorSuperficieGrilla = '#ffffff';
const ColorContenidoBg = '#f8f9fb';
const ColorBordeGrilla = '#dee2e6';
const ColorPrimarioGeme = '#003773';

/** Tema MUI + textos en español para Data Grid (menú de columnas, paginación, etc.). */
export const TemaGrillaGeme = createTheme(
  {
    typography: {
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      fontSize: 14,
      body1: {
        fontSize: 'var(--cowork-font-size-sm)',
        lineHeight: 'var(--cowork-line-height)'
      }
    },
    palette: {
      primary: {
        main: ColorPrimarioGeme
      },
      background: {
        paper: ColorSuperficieGrilla,
        default: ColorContenidoBg
      },
      divider: ColorBordeGrilla,
      text: {
        primary: ColorTextoPrincipal
      }
    },
    components: {
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: '1px solid var(--cowork-color-grilla-borde)',
            backgroundColor: 'var(--cowork-color-grilla-superficie-bg)',
            fontSize: 'var(--cowork-font-size-sm)',
            lineHeight: 'var(--cowork-line-height)',
            '--DataGrid-rowHeight': `${AlturaFilaGrillaPx}px`,
            '--DataGrid-headerHeight': `${AlturaEncabezadoGrillaPx}px`
          },
          columnHeader: {
            fontSize: 'var(--cowork-font-size-sm)',
            fontWeight: 600
          },
          columnHeaderTitle: {
            fontWeight: 600
          },
          cell: {
            alignItems: 'center',
            display: 'flex',
            paddingTop: 'var(--cowork-space-2)',
            paddingBottom: 'var(--cowork-space-2)',
            paddingLeft: 'var(--cowork-space-3)',
            paddingRight: 'var(--cowork-space-3)'
          },
          footerContainer: {
            minHeight: AlturaEncabezadoGrillaPx,
            maxHeight: AlturaEncabezadoGrillaPx,
            overflow: 'hidden',
            boxSizing: 'border-box',
            '& .MuiTablePagination-root': {
              overflow: 'hidden'
            },
            '& .MuiTablePagination-toolbar': {
              minHeight: AlturaEncabezadoGrillaPx,
              maxHeight: AlturaEncabezadoGrillaPx,
              alignItems: 'center',
              overflow: 'hidden',
              boxSizing: 'border-box'
            },
            '& .MuiInputBase-root': {
              minHeight: 'unset'
            },
            '& .MuiOutlinedInput-root': {
              minHeight: 'unset'
            },
            '& .MuiTablePagination-selectLabel': {
              margin: 0,
              display: 'flex',
              alignItems: 'center'
            },
            '& .MuiTablePagination-displayedRows': {
              margin: 0,
              display: 'flex',
              alignItems: 'center'
            },
            '& .MuiTablePagination-select': {
              display: 'flex',
              alignItems: 'center'
            },
            '& .MuiTablePagination-actions': {
              display: 'flex',
              alignItems: 'center'
            }
          },
          toolbarContainer: {
            minHeight: AlturaEncabezadoGrillaPx
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontSize: 'var(--cowork-font-size-sm)',
            lineHeight: 'var(--cowork-line-height)'
          },
          sizeSmall: {
            minHeight: 'var(--cowork-control-altura)',
            paddingTop: 'var(--cowork-space-1)',
            paddingBottom: 'var(--cowork-space-1)'
          }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: 'var(--cowork-color-grilla-superficie-bg)',
            fontSize: 'var(--cowork-font-size-sm)',
            lineHeight: 'var(--cowork-line-height)'
          },
          sizeSmall: {
            minHeight: 'var(--cowork-control-altura)'
          }
        }
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: 'var(--cowork-font-size-sm)',
            lineHeight: 'var(--cowork-line-height)'
          },
          sizeSmall: {
            lineHeight: 'var(--cowork-line-height)'
          }
        }
      },
      MuiFormControl: {
        styleOverrides: {
          root: {
            '& .MuiInputLabel-root': {
              backgroundColor: 'var(--cowork-color-grilla-superficie-bg)',
              paddingLeft: 'var(--cowork-space-1)',
              paddingRight: 'var(--cowork-space-1)'
            }
          }
        }
      },
      MuiTablePagination: {
        styleOverrides: {
          root: {
            fontSize: 'var(--cowork-font-size-sm)',
            lineHeight: 'var(--cowork-line-height)',
            overflow: 'hidden'
          },
          toolbar: {
            alignItems: 'center'
          },
          selectLabel: {
            margin: 0,
            alignSelf: 'center'
          },
          displayedRows: {
            margin: 0,
            alignSelf: 'center'
          },
          select: {
            alignSelf: 'center',
            paddingTop: 'var(--cowork-space-1)',
            paddingBottom: 'var(--cowork-space-1)'
          },
          actions: {
            alignSelf: 'center'
          }
        }
      }
    }
  },
  localeMaterialEs,
  localeDataGridEs
);
