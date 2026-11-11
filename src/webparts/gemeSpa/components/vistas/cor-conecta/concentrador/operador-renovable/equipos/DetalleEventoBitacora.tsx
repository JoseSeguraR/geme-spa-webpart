import * as React from 'react';
import type { EnvioMeteologicaBitacora } from '../../../../../../models/operadorRenovable/CatalogoEquiposOperador';
import { FormatearFechaHoraVisible } from '../../../../../../utils/FechaHoraCorConecta';

/** Fechas de la indisponibilidad o de la limitación en un evento de bitácora (ISO UTC). */
export function FechasEventoBitacora(props: {
  fechaInicio?: string;
  fechaFinEstimada?: string;
  fechaFin?: string;
  fechaFinEstimadaAnterior?: string;
}): React.ReactElement {
  const { fechaInicio, fechaFinEstimada, fechaFin, fechaFinEstimadaAnterior } = props;
  const partes = [
    fechaInicio ? `Inicio ${FormatearFechaHoraVisible(fechaInicio)}` : '',
    fechaFinEstimada
      ? `Fin estimado ${fechaFinEstimadaAnterior ? `${FormatearFechaHoraVisible(fechaFinEstimadaAnterior)} → ` : ''}${FormatearFechaHoraVisible(fechaFinEstimada)}`
      : '',
    fechaFin ? `Fin real ${FormatearFechaHoraVisible(fechaFin)}` : ''
  ].filter((parte) => parte);
  if (partes.length === 0) {
    return <></>;
  }
  return <div className="small">{partes.join(' · ')}</div>;
}

const ClasesEstado: Record<string, string> = {
  ENVIADO: 'text-bg-success',
  DESHABILITADO: 'text-bg-secondary',
  SIN_FACILITY_ID: 'text-bg-warning',
  ERROR: 'text-bg-danger',
  PENDIENTE: 'text-bg-warning'
};

/** Resultado del envío a Meteológica que acompañó al evento (perfil de la central o tope GRID). */
export function EnvioEventoBitacora(props: { envio?: EnvioMeteologicaBitacora }): React.ReactElement {
  const { envio } = props;
  if (!envio || !envio.estado) {
    return <></>;
  }
  const rango =
    envio.desde && envio.hasta
      ? `${FormatearFechaHoraVisible(envio.desde)} – ${FormatearFechaHoraVisible(envio.hasta)}`
      : '';
  const detalle = [
    envio.tramos && envio.tramos.length > 0 ? `${envio.tramos.length} tramo${envio.tramos.length === 1 ? '' : 's'}` : '',
    envio.tipo && envio.valorMw !== undefined ? `${envio.tipo} ${envio.valorMw.toLocaleString('es-CL')} MW` : '',
    rango
  ].filter((parte) => parte);
  return (
    <div className="small mt-1">
      <span className={`badge ${ClasesEstado[envio.estado] ?? 'text-bg-secondary'} me-1`}>Meteológica: {envio.estado}</span>
      <span className="text-muted">{detalle.join(' · ')}</span>
      {envio.error ? <div className="text-danger">{envio.error}</div> : null}
    </div>
  );
}
