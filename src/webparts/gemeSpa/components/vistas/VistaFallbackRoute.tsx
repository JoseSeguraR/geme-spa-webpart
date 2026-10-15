import * as React from 'react';
import { ConstruirHashDesdeRuta } from '../../utils/NavegacionHash';
import ContenedorVista from './ContenedorVista';

export type VistaFallbackRouteProps = {
  ruta: string;
};

export default function VistaFallbackRoute(props: VistaFallbackRouteProps): React.ReactElement {
  const { ruta } = props;

  return (
    <ContenedorVista>
      <header className="cowork-vista__encabezado">
        <h2 className="cowork-vista__titulo">Funcionalidad en preparación</h2>
        <p className="cowork-vista__descripcion text-muted">
          Esta funcionalidad aún no se encuentra disponible.
        </p>
      </header>
      <p className="small text-muted mb-0">
        Ruta configurada: <code>{ConstruirHashDesdeRuta(ruta)}</code>
      </p>
    </ContenedorVista>
  );
}
