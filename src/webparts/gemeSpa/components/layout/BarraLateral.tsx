import * as React from 'react';
import { TextoAlternativoLogo, UrlLogoMarcaWhite } from '../../constants/MarcaCliente';
import type { NodoMenu } from '../../models/NodoMenu';
import MenuArbol from '../navegacion/MenuArbol';

export type BarraLateralProps = {
  colapsada: boolean;
  nodosMenu: NodoMenu[];
  rutaActual: string;
  versionWebPart: string;
  urlColeccionSitio: string;
  urlCerrarSesion: string;
  onAlternarColapsada: () => void;
  onAlternarMovil: () => void;
  onEnlaceMenu?: () => void;
};

export default function BarraLateral(props: BarraLateralProps): React.ReactElement {
  const {
    colapsada,
    nodosMenu,
    rutaActual,
    versionWebPart,
    urlColeccionSitio,
    urlCerrarSesion,
    onAlternarColapsada,
    onAlternarMovil,
    onEnlaceMenu
  } = props;

  return (
    <aside className="cowork-barra-lateral" aria-label="Navegación principal">
      <div className="cowork-barra-lateral__cabecera">
        <div className="cowork-barra-lateral__logo">
          <img src={UrlLogoMarcaWhite} alt={TextoAlternativoLogo} />
        </div>
        <button
          type="button"
          className="cowork-barra-lateral__alternar cowork-barra-lateral__alternar--escritorio"
          onClick={onAlternarColapsada}
          aria-expanded={!colapsada}
          aria-label={colapsada ? 'Expandir menú lateral' : 'Contraer menú lateral'}
        >
          <i className={`bi ${colapsada ? 'bi-chevron-double-right' : 'bi-chevron-double-left'}`} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="cowork-barra-lateral__alternar cowork-barra-lateral__alternar--movil"
          onClick={onAlternarMovil}
          aria-label="Cerrar menú lateral"
        >
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      </div>
      <div className="cowork-barra-lateral__navegacion">
        <MenuArbol
          nodos={nodosMenu}
          rutaActual={rutaActual}
          colapsada={colapsada}
          urlColeccionSitio={urlColeccionSitio}
          urlCerrarSesion={urlCerrarSesion}
          onNavegar={onEnlaceMenu}
        />
      </div>
      <footer className="cowork-barra-lateral__pie">
        <span className="cowork-barra-lateral__version" title={`Versión ${versionWebPart}`}>
          {colapsada ? `v${versionWebPart}` : `Versión ${versionWebPart}`}
        </span>
      </footer>
    </aside>
  );
}
