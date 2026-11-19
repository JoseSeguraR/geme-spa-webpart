export type PropiedadesWebPartSolicitudFalla = {
  concSolicitudFallaUrlExcelVinculado?: string;
  concSolicitudFallaUrlInsertSIOD?: string;
  concSolicitudFallaUrlDeleteSIOD?: string;
  concSolicitudFallaUrlUpdateSIOD?: string;
};

export function ObtenerUrlExcelVinculadoSolicitudFallaDesdeProps(
  props: PropiedadesWebPartSolicitudFalla
): string | undefined {
  const url = props.concSolicitudFallaUrlExcelVinculado?.trim() ?? '';
  return url.length > 0 ? url : undefined;
}

export function ObtenerUrlInsertSiodSolicitudFallaDesdeProps(
  props: PropiedadesWebPartSolicitudFalla
): string | undefined {
  const url = props.concSolicitudFallaUrlInsertSIOD?.trim() ?? '';
  return url.length > 0 ? url : undefined;
}

export function ObtenerUrlUpdateSiodSolicitudFallaDesdeProps(
  props: PropiedadesWebPartSolicitudFalla
): string | undefined {
  const url = props.concSolicitudFallaUrlUpdateSIOD?.trim() ?? '';
  return url.length > 0 ? url : undefined;
}