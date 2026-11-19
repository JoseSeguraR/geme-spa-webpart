import * as React from 'react';
import type { PropsVistaSpa } from '../../../../../constants/registro-vistas/TiposRegistroVistas';
import VistaSolicitudFallaContenido from '../solicitudes-falla/VistaSolicitudFallaContenido';

export default function VistaSolicitudFallaDespachador(props: PropsVistaSpa): React.ReactElement {
  return <VistaSolicitudFallaContenido {...props} perfil="despachador" />;
}