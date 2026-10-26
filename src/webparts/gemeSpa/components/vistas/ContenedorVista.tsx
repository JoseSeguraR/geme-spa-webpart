import * as React from 'react';

export type ContenedorVistaProps = {
  children: React.ReactNode;
  /** Cabecera propia (p. ej. título + logos en fila) encima de tabs. */
  layoutCabeceraSobreTabs?: boolean;
};

/** Envoltorio estándar de pantallas de negocio: bloque `cowork-vista` (sin logos; ver COR Conecta). */
export default function ContenedorVista(props: ContenedorVistaProps): React.ReactElement {
  const { children, layoutCabeceraSobreTabs = false } = props;

  const clasesVista = ['cowork-vista', layoutCabeceraSobreTabs ? 'cowork-vista--cabecera-sobre-tabs' : '']
    .filter(Boolean)
    .join(' ');

  return <div className={clasesVista}>{children}</div>;
}
