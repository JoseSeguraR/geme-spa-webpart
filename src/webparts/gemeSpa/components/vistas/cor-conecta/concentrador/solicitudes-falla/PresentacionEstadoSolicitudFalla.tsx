import * as React from 'react';
import {
  EstadoSolicitudFallaFinalizada,
  EstadoSolicitudFallaVigente
} from './constantesSolicitudFalla';

export function ClaseInsigniaEstadoSolicitudFalla(estado: string): string {
  if (estado === EstadoSolicitudFallaFinalizada) {
    return 'badge bg-success';
  }
  if (estado === EstadoSolicitudFallaVigente) {
    return 'badge bg-warning text-dark';
  }
  return 'badge bg-secondary';
}

export function BloqueEstadoSolicitudFalla(props: { estado: string }): React.ReactElement {
  return <span className={ClaseInsigniaEstadoSolicitudFalla(props.estado)}>{props.estado}</span>;
}