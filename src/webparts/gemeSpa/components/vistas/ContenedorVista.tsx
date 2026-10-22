import * as React from 'react';
import LogosMarcaVista from './LogosMarcaVista';

export type ContenedorVistaProps = {
  children: React.ReactNode;
  /** Cabecera propia (p. ej. título + logos en fila) encima de tabs; no duplica logos flotantes. */
  layoutCabeceraSobreTabs?: boolean;
};

/** Envoltorio estándar de pantallas de negocio: `cowork-vista` + logos corporativos arriba a la derecha. */
export default function ContenedorVista(props: ContenedorVistaProps): React.ReactElement {
  const { children, layoutCabeceraSobreTabs = false } = props;

  const clasesVista = ['cowork-vista', layoutCabeceraSobreTabs ? 'cowork-vista--cabecera-sobre-tabs' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={clasesVista}>
      {children}
      {layoutCabeceraSobreTabs ? null : <LogosMarcaVista />}
    </div>
  );
}
