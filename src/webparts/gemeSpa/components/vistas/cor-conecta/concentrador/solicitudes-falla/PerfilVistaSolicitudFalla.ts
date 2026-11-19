export type PerfilVistaSolicitudFallaConcentrador = 'administrador' | 'solicitante' | 'despachador';

export type ModoAccionesFilaSolicitudFalla = 'completo' | 'solo-ver';

export function ObtenerModoAccionesGrillaFallaPorPerfil(
  perfil: PerfilVistaSolicitudFallaConcentrador
): ModoAccionesFilaSolicitudFalla {
  return perfil === 'solicitante' ? 'solo-ver' : 'completo';
}

export function PermitirCreacionSolicitudFallaPorPerfil(
  perfil: PerfilVistaSolicitudFallaConcentrador
): boolean {
  return perfil !== 'solicitante';
}

const TituloVistaPorPerfil: Record<PerfilVistaSolicitudFallaConcentrador, string> = {
  administrador: 'Administrador - Solicitud de Falla',
  solicitante: 'Solicitante - Solicitud de Falla',
  despachador: 'Despachador - Solicitud de Falla'
};

export function ObtenerTituloVistaSolicitudFallaPorPerfil(
  perfil: PerfilVistaSolicitudFallaConcentrador
): string {
  return TituloVistaPorPerfil[perfil];
}