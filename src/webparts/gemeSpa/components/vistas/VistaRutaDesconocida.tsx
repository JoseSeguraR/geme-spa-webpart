import * as React from 'react';
import { ConstruirHashDesdeRuta, EstablecerRutaHash } from '../../utils/NavegacionHash';
import { RutaInicio } from '../../models/RutaAplicacion';
import ContenedorVista from './ContenedorVista';

export type VistaRutaDesconocidaProps = {
  ruta: string;
};

export default function VistaRutaDesconocida(props: VistaRutaDesconocidaProps): React.ReactElement {
  const { ruta } = props;

  const IrAlInicio = (): void => {
    EstablecerRutaHash(RutaInicio);
  };

  return (
    <ContenedorVista>
      <header className="cowork-vista__encabezado">
        <h2 className="cowork-vista__titulo">Ruta no disponible</h2>
        <p className="cowork-vista__descripcion text-muted">
          La ruta <code>{ConstruirHashDesdeRuta(ruta)}</code> no está registrada en la aplicación o no tiene acceso desde el menú.
        </p>
      </header>
      <button type="button" className="btn cowork-btn-primary btn-sm" onClick={IrAlInicio}>
        Ir al inicio
      </button>
    </ContenedorVista>
  );
}
