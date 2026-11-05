import * as React from 'react';
import ContenedorVistaCorConecta from '../../ContenedorVistaCorConecta';
import LogosMarcaVista from '../../LogosMarcaVista';
import { ConstruirHashDesdeRuta } from '../../../../../utils/NavegacionHash';
import {
  TabsOperadorRenovableDefinicion,
  type TabOperadorRenovable
} from './rutas';

export type CarcasaOperadorRenovableProps = {
  tabActiva: TabOperadorRenovable;
  children: React.ReactNode;
};

export default function CarcasaOperadorRenovable(props: CarcasaOperadorRenovableProps): React.ReactElement {
  const { tabActiva, children } = props;

  return (
    <ContenedorVistaCorConecta layoutCabeceraSobreTabs>
      <div className="cowork-vista__fila-cabecera">
        <header className="cowork-vista__encabezado cowork-vista__encabezado--operador-renovable">
          <h2 className="cowork-vista__titulo-il">
            <i className="bi bi-solar-panel cowork-vista__titulo-il-icono" aria-hidden="true" />
            <span>Operador renovable</span>
          </h2>
          <p className="cowork-vista__subtitulo-il mb-0">
            Disponibilidad de subequipos en centrales renovables, solicitudes con indisponibilidad y limitaciones
            por subestación.
          </p>
        </header>
        <LogosMarcaVista />
      </div>

      <ul className="nav nav-tabs cowork-vista__tabs cowork-vista__tabs--operador-renovable" role="tablist">
        {TabsOperadorRenovableDefinicion.map((tab) => {
          const activa = tab.id === tabActiva;
          return (
            <li key={tab.id} className="nav-item" role="presentation">
              {activa ? (
                <span className="nav-link active" aria-current="page">
                  <i className={`bi ${tab.iconoBootstrap} me-1`} aria-hidden="true" />
                  {tab.etiqueta}
                </span>
              ) : (
                <a className="nav-link" href={ConstruirHashDesdeRuta(tab.rutaHash)}>
                  <i className={`bi ${tab.iconoBootstrap} me-1`} aria-hidden="true" />
                  {tab.etiqueta}
                </a>
              )}
            </li>
          );
        })}
      </ul>

      <div className="cowork-vista-operador-renovable__contenido">{children}</div>
    </ContenedorVistaCorConecta>
  );
}
