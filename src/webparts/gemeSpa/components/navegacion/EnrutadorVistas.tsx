import * as React from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { PropiedadesWebPartSolicitudesIl } from '../../models/ConfiguracionSolicitudesIl';
import type { PropiedadesWebPartSolicitudFalla } from '../../models/ConfiguracionSolicitudFalla';
import { ObtenerComponenteDelRegistro } from '../../constants/ComponentRegistry';
import { EsRutaDisponibleEnMenu } from '../../utils/EsRutaDisponibleEnMenu';
import { NormalizarSegmentoHash } from '../../utils/NavegacionHash';
import VistaFallbackRoute from '../vistas/VistaFallbackRoute';
import VistaRutaDesconocida from '../vistas/VistaRutaDesconocida';

export type EnrutadorVistasProps = {
  rutaActual: string;
  userDisplayName: string;
  context: WebPartContext;
  propiedadesSolicitudesIl: PropiedadesWebPartSolicitudesIl;
  propiedadesSolicitudFalla: PropiedadesWebPartSolicitudFalla;
  rutasDisponibles: ReadonlySet<string>;
};

export default function EnrutadorVistas(props: EnrutadorVistasProps): React.ReactElement {
  const { rutaActual, userDisplayName, context, propiedadesSolicitudesIl, propiedadesSolicitudFalla, rutasDisponibles } =
    props;
  const rutaNormalizada = NormalizarSegmentoHash(rutaActual);

  const Componente = ObtenerComponenteDelRegistro(rutaNormalizada);
  if (Componente) {
    return (
      <Componente
        userDisplayName={userDisplayName}
        context={context}
        propiedadesSolicitudesIl={propiedadesSolicitudesIl}
        propiedadesSolicitudFalla={propiedadesSolicitudFalla}
      />
    );
  }

  if (EsRutaDisponibleEnMenu(rutaActual, rutasDisponibles)) {
    return <VistaFallbackRoute ruta={rutaNormalizada} />;
  }

  return <VistaRutaDesconocida ruta={rutaNormalizada} />;
}
