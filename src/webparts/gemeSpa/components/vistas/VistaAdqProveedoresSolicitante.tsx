import * as React from 'react';
import VistaPlantilla from './VistaPlantilla';

export default function VistaAdqProveedoresSolicitante(): React.ReactElement {
  return (
    <VistaPlantilla
      titulo="Proveedores · Solicitante"
      rutaHash="adquisiciones/proveedores/solicitante"
    />
  );
}
