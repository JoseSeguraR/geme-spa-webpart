import * as React from 'react';
import VistaPlantilla from './VistaPlantilla';

export default function VistaAdqProveedoresAprobadores(): React.ReactElement {
  return (
    <VistaPlantilla
      titulo="Proveedores · Aprobadores"
      rutaHash="adquisiciones/proveedores/aprobadores"
    />
  );
}
