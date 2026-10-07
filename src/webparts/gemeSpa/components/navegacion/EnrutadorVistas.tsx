import * as React from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { ObtenerComponenteDelRegistro } from '../../constants/ComponentRegistry';
import { EsRutaDisponibleEnMenu } from '../../utils/EsRutaDisponibleEnMenu';
import VistaFallbackRoute from '../vistas/VistaFallbackRoute';
import VistaRutaDesconocida from '../vistas/VistaRutaDesconocida';

export type EnrutadorVistasProps = {
  rutaActual: string;
  userDisplayName: string;
  context: WebPartContext;
  rutasDisponibles: ReadonlySet<string>;
};

export default function EnrutadorVistas(props: EnrutadorVistasProps): React.ReactElement {
  const { rutaActual, userDisplayName, context, rutasDisponibles } = props;

  if (!EsRutaDisponibleEnMenu(rutaActual, rutasDisponibles)) {
    return <VistaRutaDesconocida ruta={rutaActual} />;
  }

  const Componente = ObtenerComponenteDelRegistro(rutaActual);
  if (Componente) {
    return <Componente userDisplayName={userDisplayName} context={context} />;
  }

  return <VistaFallbackRoute ruta={rutaActual} />;
}
