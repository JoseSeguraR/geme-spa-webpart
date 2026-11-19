import { ConstruirRutaServidorRelativa } from '../../../../utils/EnlaceExternoMenu';
import type { PerfilVistaSolicitudFallaConcentrador } from './solicitudes-falla/PerfilVistaSolicitudFalla';
import {
  RutaHashSolicitudFallaAdministrador,
  RutaHashSolicitudFallaDespachador,
  RutaHashSolicitudFallaSolicitante
} from './solicitudes-falla/rutas';
import { RutaHashSolicitudesIl } from './administrador/rutas';
import { RutaHashSolicitudesIlDespachador } from './despachador/rutas';
import { RutaHashSolicitudesIlSolicitante } from './solicitante/rutas';

export type TabActivoConcentradorSolicitudes = 'solicitudes' | 'falla' | 'guias';

export type EnlacesTabsConcentrador = {
  urlTabSolicitudes: string;
  urlTabFalla: string;
  urlTabSolicitudesIl: string;
  urlTabGuiasManiobra: string;
};

type RutasRelativasTabs = {
  rutaTabSolicitudes: string;
  rutaTabGuias: string;
};

const RutasTabsPorPerfil: Record<PerfilVistaSolicitudFallaConcentrador, RutasRelativasTabs> = {
  administrador: {
    rutaTabSolicitudes: 'SitePages/CONC/Solicitudes/Administrador.aspx',
    rutaTabGuias: 'SitePages/CONC/Solicitudes/GuiaManiobrasAdministrador.aspx'
  },
  despachador: {
    rutaTabSolicitudes: 'SitePages/CONC/Solicitudes/Despachador.aspx',
    rutaTabGuias: 'SitePages/CONC/Solicitudes/GuiaManiobrasDespachador.aspx'
  },
  solicitante: {
    rutaTabSolicitudes: 'SitePages/CONC/Solicitudes/Solicitante.aspx',
    rutaTabGuias: 'SitePages/CONC/Solicitudes/GuiaManiobrasSolicitante.aspx'
  }
};

const RutaHashFallaPorPerfil: Record<PerfilVistaSolicitudFallaConcentrador, string> = {
  administrador: RutaHashSolicitudFallaAdministrador,
  despachador: RutaHashSolicitudFallaDespachador,
  solicitante: RutaHashSolicitudFallaSolicitante
};

const RutaHashSolicitudesIlPorPerfil: Record<PerfilVistaSolicitudFallaConcentrador, string> = {
  administrador: RutaHashSolicitudesIl,
  despachador: RutaHashSolicitudesIlDespachador,
  solicitante: RutaHashSolicitudesIlSolicitante
};

export function ObtenerEnlacesTabsConcentrador(
  perfil: PerfilVistaSolicitudFallaConcentrador,
  prefijoRutaServidorSitio: string
): EnlacesTabsConcentrador {
  const rutas = RutasTabsPorPerfil[perfil];
  return {
    urlTabSolicitudes: ConstruirRutaServidorRelativa(prefijoRutaServidorSitio, rutas.rutaTabSolicitudes),
    urlTabGuiasManiobra: ConstruirRutaServidorRelativa(prefijoRutaServidorSitio, rutas.rutaTabGuias),
    urlTabFalla: `#/${RutaHashFallaPorPerfil[perfil]}`,
    urlTabSolicitudesIl: `#/${RutaHashSolicitudesIlPorPerfil[perfil]}`
  };
}