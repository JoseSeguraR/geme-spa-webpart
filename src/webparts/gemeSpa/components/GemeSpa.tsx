import * as React from 'react';
import { UseMenuInicializado } from '../hooks/UseMenuInicializado';
import { UseRutaHash } from '../hooks/UseRutaHash';
import type { GemeSpaProps } from './GemeSpaProps';
import EnrutadorVistas from './navegacion/EnrutadorVistas';
import CargandoInicial from './layout/CargandoInicial';
import CarcasaSpa from './layout/CarcasaSpa';
import ContenedorVista from './vistas/ContenedorVista';

export default function GemeSpa(props: GemeSpaProps): React.ReactElement {
  const { context, userDisplayName, signOutUrl, versionWebPart, propiedadesSolicitudesIl, onAbrirPropiedades } = props;
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
          <ContenedorVista>
            <header className="cowork-vista__encabezado">
              <h2 className="cowork-vista__titulo">No se pudo cargar el menú</h2>
              <p className="cowork-vista__descripcion text-muted">
                {errorMenu?.message ?? 'Revise la lista SISTEMA_ACCESOS y los permisos del sitio.'}
              </p>
            </header>
          </ContenedorVista>
        </div>
      </div>
    );
  }

  return (
    <CarcasaSpa
      userDisplayName={userDisplayName}
      signOutUrl={signOutUrl}
      versionWebPart={versionWebPart}
      urlColeccionSitio={context.pageContext.site.absoluteUrl}
      nodosMenu={menu.arbol}
      rutaActual={rutaActual}
      onAbrirPropiedades={onAbrirPropiedades}
    >
      <EnrutadorVistas
        rutaActual={rutaActual}
        userDisplayName={userDisplayName}
        context={context}
        propiedadesSolicitudesIl={propiedadesSolicitudesIl}
        rutasDisponibles={menu.rutasDisponibles}
      />
    </CarcasaSpa>
  );
}
