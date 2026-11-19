import * as React from 'react';
import { Box } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';

export const CampoColumnaAccionesGrilla = 'acciones';

export const TituloColumnaAccionesGrilla = 'Acciones';

export const AnchoPredeterminadoColumnaAccionesGrilla = 72;

export type OpcionesBaseColumnaAccionesGrilla = Pick<
  GridColDef,
  'field' | 'headerName' | 'width' | 'sortable' | 'filterable' | 'disableColumnMenu' | 'align' | 'headerAlign'
>;

export function ObtenerOpcionesBaseColumnaAccionesGrilla(ancho?: number): OpcionesBaseColumnaAccionesGrilla {
  return {
    field: CampoColumnaAccionesGrilla,
    headerName: TituloColumnaAccionesGrilla,
    width: ancho ?? AnchoPredeterminadoColumnaAccionesGrilla,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    align: 'center',
    headerAlign: 'center'
  };
}

export type CeldaAccionesCentradaProps = {
  children: React.ReactNode;
  alinearVerticalInicio?: boolean;
};

export function CeldaAccionesCentrada(props: CeldaAccionesCentradaProps): React.ReactElement {
  const { children, alinearVerticalInicio = false } = props;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: alinearVerticalInicio ? 'flex-start' : 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%'
      }}
    >
      {children}
    </Box>
  );
}
