import * as React from 'react';
import ContenedorVista, { type ContenedorVistaProps } from '../ContenedorVista';
import LogosMarcaVista from './LogosMarcaVista';

export type ContenedorVistaCorConectaProps = ContenedorVistaProps;

/** Envoltorio COR Conecta: `cowork-vista` + logos GM Services / Centro de Operaciones. */
export default function ContenedorVistaCorConecta(props: ContenedorVistaCorConectaProps): React.ReactElement {
  const { children, layoutCabeceraSobreTabs = false } = props;

  return (
    <ContenedorVista layoutCabeceraSobreTabs={layoutCabeceraSobreTabs}>
      {children}
      {layoutCabeceraSobreTabs ? null : <LogosMarcaVista />}
    </ContenedorVista>
  );
}
