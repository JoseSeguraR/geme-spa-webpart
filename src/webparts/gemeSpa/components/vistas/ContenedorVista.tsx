import * as React from 'react';
import LogosMarcaVista from './LogosMarcaVista';

export type ContenedorVistaProps = {
  children: React.ReactNode;
};

/** Envoltorio estándar de pantallas de negocio: `cowork-vista` + logos corporativos arriba a la derecha. */
export default function ContenedorVista(props: ContenedorVistaProps): React.ReactElement {
  const { children } = props;

  return (
    <div className="cowork-vista">
      {children}
      <LogosMarcaVista />
    </div>
  );
}
