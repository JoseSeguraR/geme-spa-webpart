import * as React from 'react';
import type { PropsVistaSpa } from '../../../../../constants/registro-vistas/TiposRegistroVistas';
import VistaSolicitudFallaContenido from '../solicitudes-falla/VistaSolicitudFallaContenido';

export default function VistaSolicitudFallaSolicitante(props: PropsVistaSpa): React.ReactElement {
  return <VistaSolicitudFallaContenido {...props} perfil="solicitante" />;
}