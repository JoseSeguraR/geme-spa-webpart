import * as React from 'react';
import ContenedorVistaCorConecta from '../ContenedorVistaCorConecta';
import LogosMarcaVista from '../LogosMarcaVista';

export type CarcasaControlSitioProps = {
  /** Ícono Bootstrap sin el prefijo `bi-`. */
  icono: string;
  titulo: string;
  descripcion: string;
  children: React.ReactNode;
};

/** Encabezado común de Permisos de usuario y de cada mantenedor (mismo formato que Solicitudes IL). */
export default function CarcasaControlSitio(props: CarcasaControlSitioProps): React.ReactElement {
  const { icono, titulo, descripcion, children } = props;

  return (
    <ContenedorVistaCorConecta layoutCabeceraSobreTabs>
      <div className="cowork-vista__fila-cabecera">
        <header className="cowork-vista__encabezado">
          <h2 className="cowork-vista__titulo-il">
            <i className={`bi bi-${icono} cowork-vista__titulo-il-icono`} aria-hidden="true" />
            <span>{titulo}</span>
          </h2>
          <p className="cowork-vista__subtitulo-il mb-0">{descripcion}</p>
        </header>
        <LogosMarcaVista />
      </div>
      <div className="cowork-control-sitio__contenido">{children}</div>
    </ContenedorVistaCorConecta>
  );
}
