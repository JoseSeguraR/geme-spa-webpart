import * as React from 'react';
import type { PropsVistaSpa } from '../../../../../../constants/registro-vistas/TiposRegistroVistas';
import ContenidoSubestacionOperadorRenovable from './ContenidoSubestacionOperadorRenovable';

export default function VistaOperadorRenovableSubestacion(props: PropsVistaSpa): React.ReactElement {
  return <ContenidoSubestacionOperadorRenovable context={props.context} />;
}
