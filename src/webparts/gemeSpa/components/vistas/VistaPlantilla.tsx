import * as React from 'react';
import { ConstruirHashDesdeRuta } from '../../utils/NavegacionHash';

export type VistaPlantillaProps = {
  titulo: string;
  rutaHash: string;
};

export default function VistaPlantilla(props: VistaPlantillaProps): React.ReactElement {
  const { titulo, rutaHash } = props;

  return (
    <div className="cowork-vista-prueba">
      <h2 className="h4 mb-2">{titulo}</h2>
      <p className="text-muted mb-0">
        Vista de prueba · hash <code>{ConstruirHashDesdeRuta(rutaHash)}</code>
      </p>
    </div>
  );
}
