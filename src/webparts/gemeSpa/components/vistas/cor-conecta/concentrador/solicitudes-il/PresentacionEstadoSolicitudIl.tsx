import * as React from 'react';
import { ResolverEstadoSolicitudIl, type EstadoSolicitudIl } from './constantesSolicitudesIl';

export { ResolverEstadoSolicitudIl };

function ClaseModificadorEstado(estado: EstadoSolicitudIl): string {
  switch (estado) {
    case 'Finalizada':
      return 'cowork-estado-solicitud-il--finalizada';
    case 'Anulada':
      return 'cowork-estado-solicitud-il--anulada';
    default:
      return 'cowork-estado-solicitud-il--vigente';
  }
}

export function ClaseInsigniaEstadoSolicitudIl(estado: EstadoSolicitudIl): string {
  return `cowork-badge-estado ${ClaseModificadorEstado(estado)}`;
}

export type BloqueEstadoFormularioSolicitudIlProps = {
  estado: EstadoSolicitudIl;
  ayuda?: React.ReactNode;
};

export function BloqueEstadoFormularioSolicitudIl(
  props: BloqueEstadoFormularioSolicitudIlProps
): React.ReactElement {
  const { estado, ayuda } = props;
  const modificador = ClaseModificadorEstado(estado);

  return (
    <div className={`cowork-formulario-estado ${modificador}`} aria-live="polite">
      <div className="cowork-formulario-estado__principal">
        <span className="cowork-formulario-estado__etiqueta">Estado</span>
        <span className={ClaseInsigniaEstadoSolicitudIl(estado)}>{estado}</span>
      </div>
      {ayuda ? <p className="cowork-formulario-estado__ayuda mb-0">{ayuda}</p> : null}
    </div>
  );
}
