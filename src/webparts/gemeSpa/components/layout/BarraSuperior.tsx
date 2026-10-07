import * as React from 'react';
import { TextoAlternativoLogo, UrlLogoMarca } from '../../constants/MarcaCliente';
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
          <img src={UrlLogoMarca} alt={TextoAlternativoLogo} />
        </div>
      </div>
      <div className="cowork-barra-superior__acciones">
        <button type="button" className="cowork-barra-superior__icono" aria-label="Notificaciones">
          <i className="bi bi-bell" aria-hidden="true" />
        </button>
        <button type="button" className="cowork-barra-superior__icono" aria-label="Ayuda">
          <i className="bi bi-question-circle" aria-hidden="true" />
        </button>
        <MenuUsuario userDisplayName={userDisplayName} signOutUrl={signOutUrl} />
      </div>
    </header>
  );
}
