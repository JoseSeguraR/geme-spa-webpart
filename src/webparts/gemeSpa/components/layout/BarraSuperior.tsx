import * as React from 'react';
import { TextoAlternativoLogo, UrlLogoMarcaWhite } from '../../constants/MarcaCliente';
import MenuUsuario from './MenuUsuario';

export type BarraSuperiorProps = {
  userDisplayName: string;
  signOutUrl: string;
  onAlternarSidebarMovil: () => void;
  onAbrirPropiedades?: () => void;
};

export default function BarraSuperior(props: BarraSuperiorProps): React.ReactElement {
  const { userDisplayName, signOutUrl, onAlternarSidebarMovil, onAbrirPropiedades } = props;

  return (
    <header className="cowork-barra-superior">
      <div className="cowork-barra-superior__inicio d-flex align-items-center gap-2">
        <button
          type="button"
          className="cowork-barra-superior__alternar-movil"
          onClick={onAlternarSidebarMovil}
          aria-label="Abrir menú lateral"
        >
          <i className="bi bi-list" aria-hidden="true" />
        </button>
        <div className="cowork-barra-superior__logo">
          <img src={UrlLogoMarcaWhite} alt={TextoAlternativoLogo} />
        </div>
      </div>
      <div className="cowork-barra-superior__acciones d-flex align-items-center gap-2">
        {onAbrirPropiedades ? (
          <button
            type="button"
            className="cowork-barra-superior__icono"
            onClick={onAbrirPropiedades}
            title="Configurar web part"
            aria-label="Configurar web part"
          >
            <i className="bi bi-gear" aria-hidden="true" />
          </button>
        ) : null}
        <MenuUsuario userDisplayName={userDisplayName} signOutUrl={signOutUrl} />
      </div>
    </header>
  );
}
