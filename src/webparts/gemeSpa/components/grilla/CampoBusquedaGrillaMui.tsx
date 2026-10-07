import * as React from 'react';
import { TextField } from '@mui/material';

export type CampoBusquedaGrillaMuiProps = {
  etiqueta: string;
  valor: string;
  onCambio: (valor: string) => void;
};

export default function CampoBusquedaGrillaMui(props: CampoBusquedaGrillaMuiProps): React.ReactElement {
  const { etiqueta, valor, onCambio } = props;

  return (
    <TextField
      size="small"
      variant="outlined"
      label={etiqueta}
      value={valor}
      onChange={(event) => onCambio(event.target.value)}
      sx={{
        minWidth: 240,
        flex: '1 1 240px',
        maxWidth: '100%'
      }}
    />
  );
}
