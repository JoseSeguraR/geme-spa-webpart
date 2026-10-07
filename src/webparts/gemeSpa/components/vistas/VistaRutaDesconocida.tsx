import * as React from 'react';
import { ConstruirHashDesdeRuta, EstablecerRutaHash } from '../../utils/NavegacionHash';
import { RutaInicio } from '../../models/RutaAplicacion';

export type VistaRutaDesconocidaProps = {
  ruta: string;
};

export default function VistaRutaDesconocida(props: VistaRutaDesconocidaProps): React.ReactElement {
  const { ruta } = props;

  const IrAlInicio = (): void => {
    EstablecerRutaHash(RutaInicio);
  };

  return (
    <div className="cowork-vista-prueba">
      <header className="cowork-vista-prueba__encabezado">
        <h2 className="cowork-vista-prueba__titulo">Ruta no disponible</h2>
        <p className="cowork-vista-prueba__descripcion text-muted">
          La ruta <code>{ConstruirHashDesdeRuta(ruta)}</code> no está configurada en su menú o no tiene acceso.
        </p>
      </header>
      <button type="button" className="btn cowork-btn-primary btn-sm" onClick={IrAlInicio}>
        Ir al inicio
      </button>
    </div>
  );
}
