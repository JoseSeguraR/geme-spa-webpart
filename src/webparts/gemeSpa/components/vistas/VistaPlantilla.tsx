import * as React from 'react';
import { ConstruirHashDesdeRuta } from '../../utils/NavegacionHash';
import ContenedorVista from './ContenedorVista';

export type VistaPlantillaProps = {
  titulo: string;
  rutaHash: string;
};

export default function VistaPlantilla(props: VistaPlantillaProps): React.ReactElement {
  const { titulo, rutaHash } = props;

  return (
    <ContenedorVista>
      <header className="cowork-vista__encabezado">
        <h2 className="cowork-vista__titulo">{titulo}</h2>
        <p className="cowork-vista__descripcion text-muted">
          Vista de prueba · hash <code>{ConstruirHashDesdeRuta(rutaHash)}</code>
        </p>
      </header>
    </ContenedorVista>
  );
}
