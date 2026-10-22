import { ConstruirRutaServidorRelativa } from '../../../../../utils/EnlaceExternoMenu';
import type { ModoAccionesFilaSolicitudesIl } from './DesplegableAccionesFila';

export type PerfilVistaSolicitudesIlConcentrador = 'administrador' | 'solicitante' | 'despachador';

export type EnlacesTabsSolicitudesIl = {
  urlTabSolicitudes: string;
  urlTabGuiasManiobra: string;
};

type RutasRelativasTabsSolicitudesIl = {
  rutaTabSolicitudes: string;
  rutaTabGuiasManiobra: string;
};

/** Rutas bajo el web raíz de la colección (SitePages clásicas); el prefijo `/sites/...` viene del contexto SPFx. */
const RutasTabsPorPerfil: Record<PerfilVistaSolicitudesIlConcentrador, RutasRelativasTabsSolicitudesIl> = {
  administrador: {
    rutaTabSolicitudes: 'SitePages/CONC/Solicitudes/Administrador.aspx',
    rutaTabGuiasManiobra: 'SitePages/CONC/Solicitudes/GuiaManiobrasAdministrador.aspx'
  },
  solicitante: {
    rutaTabSolicitudes: 'SitePages/CONC/Solicitudes/Solicitante.aspx',
    rutaTabGuiasManiobra: 'SitePages/CONC/Solicitudes/GuiaManiobrasSolicitante.aspx'
  },
  despachador: {
    rutaTabSolicitudes: 'SitePages/CONC/Solicitudes/Despachador.aspx',
    rutaTabGuiasManiobra: 'SitePages/CONC/Solicitudes/GuiaManiobrasDespachador.aspx'
  }
};

export function ObtenerEnlacesTabsSolicitudesIl(
  perfil: PerfilVistaSolicitudesIlConcentrador,
  prefijoRutaServidorSitio: string
): EnlacesTabsSolicitudesIl {
  const rutas = RutasTabsPorPerfil[perfil];
  return {
    urlTabSolicitudes: ConstruirRutaServidorRelativa(prefijoRutaServidorSitio, rutas.rutaTabSolicitudes),
    urlTabGuiasManiobra: ConstruirRutaServidorRelativa(prefijoRutaServidorSitio, rutas.rutaTabGuiasManiobra)
  };
}

export function ObtenerModoAccionesGrillaPorPerfil(
  perfil: PerfilVistaSolicitudesIlConcentrador
): ModoAccionesFilaSolicitudesIl {
  return perfil === 'solicitante' ? 'solo-ver-bitacora' : 'completo';
}

export function PermitirCreacionSolicitudesIlPorPerfil(perfil: PerfilVistaSolicitudesIlConcentrador): boolean {
  return perfil !== 'solicitante';
}

const TituloVistaPorPerfil: Record<PerfilVistaSolicitudesIlConcentrador, string> = {
  administrador: 'Administrador - Solicitudes IL',
  solicitante: 'Solicitante - Solicitudes IL',
  despachador: 'Despachador - Solicitudes IL'
};

export function ObtenerTituloVistaSolicitudesIlPorPerfil(
  perfil: PerfilVistaSolicitudesIlConcentrador
): string {
  return TituloVistaPorPerfil[perfil];
}
