import * as React from 'react';
import { UseMenuInicializado } from '../hooks/UseMenuInicializado';
import { UseRutaHash } from '../hooks/UseRutaHash';
import type { GemeSpaProps } from './GemeSpaProps';
import EnrutadorVistas from './navegacion/EnrutadorVistas';
import CargandoInicial from './layout/CargandoInicial';
import CarcasaSpa from './layout/CarcasaSpa';

export default function GemeSpa(props: GemeSpaProps): React.ReactElement {
  const { context, userDisplayName, signOutUrl, versionWebPart } = props;
  const { rutaActual } = UseRutaHash();
  const { estado: estadoMenu, menu, error: errorMenu } = UseMenuInicializado(context);

  if (estadoMenu === 'cargando') {
    return (
      <div className="gemeSpaBootstrap gemeSpaBootstrap--cargado">
        <CargandoInicial />
      </div>
    );
  }

  if (estadoMenu === 'error' || !menu) {
    return (
      <div className="gemeSpaBootstrap gemeSpaBootstrap--cargado">
        <div className="cowork-contenido">
          <div className="cowork-vista-prueba">
            <header className="cowork-vista-prueba__encabezado">
              <h2 className="cowork-vista-prueba__titulo">No se pudo cargar el menú</h2>
              <p className="cowork-vista-prueba__descripcion text-muted">
                {errorMenu?.message ?? 'Revise la lista SISTEMA_ACCESOS y los permisos del sitio.'}
              </p>
            </header>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CarcasaSpa
      userDisplayName={userDisplayName}
      signOutUrl={signOutUrl}
      versionWebPart={versionWebPart}
      nodosMenu={menu.arbol}
      rutaActual={rutaActual}
    >
      <EnrutadorVistas
        rutaActual={rutaActual}
        userDisplayName={userDisplayName}
        context={context}
        rutasDisponibles={menu.rutasDisponibles}
      />
    </CarcasaSpa>
  );
}
