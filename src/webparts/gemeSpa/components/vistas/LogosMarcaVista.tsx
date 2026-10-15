import * as React from 'react';
import {
  TextoAlternativoLogoCentroOperaciones,
  TextoAlternativoLogoGmServices,
  UrlLogoCentroOperacionesVista,
  UrlLogoGmServicesVista
} from '../../constants/MarcaCliente';

export default function LogosMarcaVista(): React.ReactElement {
  return (
    <div className="cowork-vista__logos-marca">
      <img
        className="cowork-vista__logo-marca"
        src={UrlLogoGmServicesVista}
        alt={TextoAlternativoLogoGmServices}
      />
      <img
        className="cowork-vista__logo-marca"
        src={UrlLogoCentroOperacionesVista}
        alt={TextoAlternativoLogoCentroOperaciones}
      />
    </div>
  );
}
