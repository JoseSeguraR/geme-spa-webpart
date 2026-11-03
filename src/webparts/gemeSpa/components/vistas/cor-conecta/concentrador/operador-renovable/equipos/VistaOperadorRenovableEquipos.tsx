import * as React from 'react';
import type { PropsVistaSpa } from '../../../../../../constants/registro-vistas/TiposRegistroVistas';
import ContenidoEquiposOperadorRenovable from './ContenidoEquiposOperadorRenovable';

export default function VistaOperadorRenovableEquipos(props: PropsVistaSpa): React.ReactElement {
  return <ContenidoEquiposOperadorRenovable context={props.context} />;
}
