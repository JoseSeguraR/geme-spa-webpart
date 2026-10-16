import * as React from 'react';
import type { PropsVistaSpa } from '../../../../../constants/registro-vistas/TiposRegistroVistas';
import VistaSolicitudesIlContenido from '../solicitudes-il/VistaSolicitudesIlContenido';

export default function VistaSolicitudesIlSolicitante(props: PropsVistaSpa): React.ReactElement {
  return <VistaSolicitudesIlContenido {...props} perfil="solicitante" />;
}
