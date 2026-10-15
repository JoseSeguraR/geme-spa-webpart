import * as React from 'react';
import { TextoAlternativoLogo, UrlLogoMarcaWhite } from '../../constants/MarcaCliente';
import MenuUsuario from './MenuUsuario';

export type BarraSuperiorProps = {
  userDisplayName: string;
  signOutUrl: string;
  onAlternarSidebarMovil: () => void;
};

export default function BarraSuperior(props: BarraSuperiorProps): React.ReactElement {
  const { userDisplayName, signOutUrl, onAlternarSidebarMovil } = props;

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
      <div className="cowork-barra-superior__acciones">
        <MenuUsuario userDisplayName={userDisplayName} signOutUrl={signOutUrl} />
      </div>
    </header>
  );
}
