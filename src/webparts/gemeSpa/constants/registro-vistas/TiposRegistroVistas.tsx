import * as React from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { PropiedadesWebPartSolicitudesIl } from '../../models/ConfiguracionSolicitudesIl';
import type { PropiedadesWebPartSolicitudFalla } from '../../models/ConfiguracionSolicitudFalla';

/** Props comunes que el enrutador puede pasar a cualquier vista registrada. */
export type PropsVistaSpa = {
  userDisplayName: string;
  context: WebPartContext;
  propiedadesSolicitudesIl: PropiedadesWebPartSolicitudesIl;
  propiedadesSolicitudFalla: PropiedadesWebPartSolicitudFalla;
};

export type ComponenteVistaSpa = React.ComponentType<PropsVistaSpa>;

export type RegistroVistasMap = Record<string, ComponenteVistaSpa>;

export function RegistrarVistaSinProps(Vista: React.ComponentType): ComponenteVistaSpa {
  const VistaRegistrada = (_props: PropsVistaSpa): React.ReactElement => {
    return <Vista />;
  };
  return VistaRegistrada;
}
