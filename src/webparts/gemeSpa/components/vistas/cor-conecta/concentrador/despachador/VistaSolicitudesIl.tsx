import * as React from 'react';
import type { PropsVistaSpa } from '../../../../../constants/registro-vistas/TiposRegistroVistas';
import VistaSolicitudesIlContenido from '../VistaSolicitudesIlContenido';

export default function VistaSolicitudesIlDespachador(props: PropsVistaSpa): React.ReactElement {
  return <VistaSolicitudesIlContenido {...props} perfil="despachador" />;
}
