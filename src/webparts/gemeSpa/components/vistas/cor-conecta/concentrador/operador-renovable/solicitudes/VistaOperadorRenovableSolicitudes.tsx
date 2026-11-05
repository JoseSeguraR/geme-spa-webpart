import * as React from 'react';
import type { PropsVistaSpa } from '../../../../../../constants/registro-vistas/TiposRegistroVistas';
import ContenidoSolicitudesOperadorRenovable from './ContenidoSolicitudesOperadorRenovable';

export default function VistaOperadorRenovableSolicitudes(props: PropsVistaSpa): React.ReactElement {
  return <ContenidoSolicitudesOperadorRenovable context={props.context} />;
}
