import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { NodoMenu } from '../../models/NodoMenu';
import BarraLateral from './BarraLateral';
import BarraSuperior from './BarraSuperior';

export type CarcasaSpaProps = {
  userDisplayName: string;
  signOutUrl: string;
  versionWebPart: string;
  urlColeccionSitio: string;
  nodosMenu: NodoMenu[];
  rutaActual: string;
  children?: React.ReactNode;
};

/** Contenedor que hace scroll en la página de SharePoint (`undefined` si es la ventana). */
function BuscarContenedorScroll(elemento: HTMLElement): HTMLElement | undefined {
  let actual = elemento.parentElement;
  while (actual && actual !== document.body) {
    const overflowY = window.getComputedStyle(actual).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return actual;
    }
    actual = actual.parentElement;
  }
  return undefined;
}

/**
 * Publica en `--cowork-alto-visible-host` el alto visible del área con scroll de SharePoint
 * (la ventana menos la barra superior del sitio), para que la barra lateral fija (sticky) quepa entera.
 */
function UseAltoVisibleHost(raizRef: React.RefObject<HTMLDivElement>): void {
  useEffect(() => {
    const raiz = raizRef.current;
    if (!raiz) {
      return;
    }
    const contenedor = BuscarContenedorScroll(raiz);
    const Actualizar = (): void => {
      const alto = contenedor ? contenedor.clientHeight : window.innerHeight;
      raiz.style.setProperty('--cowork-alto-visible-host', `${alto}px`);
    };
    Actualizar();
    window.addEventListener('resize', Actualizar);
    return () => window.removeEventListener('resize', Actualizar);
  }, [raizRef]);
}

export default function CarcasaSpa(props: CarcasaSpaProps): React.ReactElement {
  const { userDisplayName, signOutUrl, versionWebPart, urlColeccionSitio, nodosMenu, rutaActual, children } = props;
  const [sidebarColapsada, setSidebarColapsada] = useState(false);
  const [sidebarMovilAbierta, setSidebarMovilAbierta] = useState(false);
  const raizRef = useRef<HTMLDivElement>(null);
  UseAltoVisibleHost(raizRef);

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
    <div ref={raizRef} className={clasesRaiz}>
      <div className="cowork-carcasa">
        <BarraLateral
          colapsada={sidebarColapsada}
          nodosMenu={nodosMenu}
          rutaActual={rutaActual}
          versionWebPart={versionWebPart}
          urlColeccionSitio={urlColeccionSitio}
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
