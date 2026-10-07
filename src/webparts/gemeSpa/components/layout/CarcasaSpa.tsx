import * as React from 'react';
import { useCallback, useState } from 'react';
import type { NodoMenu } from '../../models/NodoMenu';
import BarraLateral from './BarraLateral';
import BarraSuperior from './BarraSuperior';

export type CarcasaSpaProps = {
  userDisplayName: string;
  signOutUrl: string;
  versionWebPart: string;
  nodosMenu: NodoMenu[];
  rutaActual: string;
  children?: React.ReactNode;
};

export default function CarcasaSpa(props: CarcasaSpaProps): React.ReactElement {
  const { userDisplayName, signOutUrl, versionWebPart, nodosMenu, rutaActual, children } = props;
  const [sidebarColapsada, setSidebarColapsada] = useState(false);
  const [sidebarMovilAbierta, setSidebarMovilAbierta] = useState(false);

  const AlternarSidebarColapsada = useCallback((): void => {
    setSidebarColapsada((valor) => !valor);
  }, []);

  const AlternarSidebarMovil = useCallback((): void => {
    setSidebarMovilAbierta((valor) => !valor);
  }, []);

  const CerrarSidebarMovil = useCallback((): void => {
    setSidebarMovilAbierta(false);
  }, []);

  const clasesRaiz = [
    'gemeSpaBootstrap',
    'gemeSpaBootstrap--cargado',
    sidebarColapsada ? 'gemeSpaBootstrap--sidebar-colapsada' : '',
    sidebarMovilAbierta ? 'gemeSpaBootstrap--sidebar-movil-abierta' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={clasesRaiz}>
      <div className="cowork-carcasa">
        <BarraLateral
          colapsada={sidebarColapsada}
          nodosMenu={nodosMenu}
          rutaActual={rutaActual}
          versionWebPart={versionWebPart}
          onAlternarColapsada={AlternarSidebarColapsada}
          onAlternarMovil={AlternarSidebarMovil}
          onEnlaceMenu={CerrarSidebarMovil}
        />
        <div className="coworkprincipal">
          <BarraSuperior
            userDisplayName={userDisplayName}
            signOutUrl={signOutUrl}
            onAlternarSidebarMovil={AlternarSidebarMovil}
          />
          <main className="cowork-contenido">{children}</main>
        </div>
      </div>
    </div>
  );
}
