import * as React from 'react';
import type { CapacidadMeteologicaCentral } from './UseCapacidadMeteologicaCentral';

/** Meteológica rechaza disponibilidades sobre el 105 % de su capacidad instalada. */
export const ToleranciaCapacidadMeteologica = 1.05;

function FormatearMw(valor: number): string {
  return `${valor.toLocaleString('es-CL', { maximumFractionDigits: 2 })} MW`;
}

export const EtiquetaCapacidadMeteologica = 'Capacidad instalada Meteológica';

/** Valor del indicador «Capacidad instalada Meteológica» según el estado de la consulta. */
export function TextoCapacidadMeteologica(capacidad: CapacidadMeteologicaCentral): string {
  switch (capacidad.estado) {
    case 'listo':
      return FormatearMw(capacidad.capacidadMw);
    case 'cargando':
      return '…';
    case 'sinFacilityId':
      return 'Sin FACILITY_ID';
    default:
      return 'No disponible';
  }
}

export type AvisoCapacidadMeteologicaProps = {
  capacidad: CapacidadMeteologicaCentral;
  /** Capacidad de la central según GEME (suma de sus subequipos activos). */
  capacidadGemeMw: number;
};

/** Aviso cuando la capacidad de GEME supera el 105 % de la instalada en Meteológica. */
export function AvisoCapacidadMeteologica(props: AvisoCapacidadMeteologicaProps): React.ReactElement {
  const { capacidad, capacidadGemeMw } = props;
  if (capacidad.estado !== 'listo' || capacidadGemeMw <= capacidad.capacidadMw * ToleranciaCapacidadMeteologica) {
    return <></>;
  }
  return (
    <div className="alert alert-warning py-2">
      La capacidad de la central en GEME ({capacidadGemeMw.toFixed(1)} MW) supera el 105 % de la capacidad instalada
      en Meteológica ({capacidad.capacidadMw.toFixed(1)} MW): Meteológica rechazará los envíos. Revise los subequipos
      o la capacidad registrada en Meteológica.
    </div>
  );
}
