import type { ModoAccionesFilaSolicitudesIl } from './DesplegableAccionesFila';

export type PerfilVistaSolicitudesIlConcentrador = 'administrador' | 'solicitante' | 'despachador';

export type EnlacesTabsSolicitudesIl = {
  urlTabSolicitudes: string;
  urlTabGuiasManiobra: string;
};

const EnlacesTabsPorPerfil: Record<PerfilVistaSolicitudesIlConcentrador, EnlacesTabsSolicitudesIl> = {
  administrador: {
    urlTabSolicitudes: '/sites/geme/SitePages/CONC/Solicitudes/Administrador.aspx',
    urlTabGuiasManiobra: '/sites/geme/SitePages/CONC/Solicitudes/GuiaManiobrasAdministrador.aspx'
  },
  solicitante: {
    urlTabSolicitudes: '/sites/geme/SitePages/CONC/Solicitudes/Solicitante.aspx',
    urlTabGuiasManiobra: '/sites/geme/SitePages/CONC/Solicitudes/GuiaManiobrasSolicitante.aspx'
  },
  despachador: {
    urlTabSolicitudes: '/sites/geme/SitePages/CONC/Solicitudes/Despachador.aspx',
    urlTabGuiasManiobra: '/sites/geme/SitePages/CONC/Solicitudes/GuiaManiobrasDespachador.aspx'
  }
};

export function ObtenerEnlacesTabsSolicitudesIl(
  perfil: PerfilVistaSolicitudesIlConcentrador
): EnlacesTabsSolicitudesIl {
  return EnlacesTabsPorPerfil[perfil];
}

export function ObtenerModoAccionesGrillaPorPerfil(
  perfil: PerfilVistaSolicitudesIlConcentrador
): ModoAccionesFilaSolicitudesIl {
  return perfil === 'solicitante' ? 'solo-ver-bitacora' : 'completo';
}

export function PermitirCreacionSolicitudesIlPorPerfil(perfil: PerfilVistaSolicitudesIlConcentrador): boolean {
  return perfil !== 'solicitante';
}
