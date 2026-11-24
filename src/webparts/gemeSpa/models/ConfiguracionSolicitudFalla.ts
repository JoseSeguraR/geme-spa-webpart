export type PropiedadesWebPartSolicitudFalla = {
  concSolicitudFallaUrlExcelVinculado?: string;
  concSolicitudFallaUrlInsertSIOD?: string;
  concSolicitudFallaUrlUpdateSIOD?: string;
};

/** El panel usa campo multilínea; se quitan espacios/saltos y entidades HTML en URLs de Function. */
export function NormalizarUrlAzureFunctionSolicitudFalla(url: string): string {
  return url
    .trim()
    .replace(/\s+/g, '')
    .replace(/&amp;/gi, '&');
}

export function UrlAzureFunctionIncluyeCodigoAutorizacion(url: string): boolean {
  return /[?&]code=/i.test(url);
}

export function ObtenerUrlExcelVinculadoSolicitudFallaDesdeProps(
  props: PropiedadesWebPartSolicitudFalla
): string | undefined {
  const url = props.concSolicitudFallaUrlExcelVinculado?.trim() ?? '';
  return url.length > 0 ? url : undefined;
}

export function ObtenerUrlInsertSiodSolicitudFallaDesdeProps(
  props: PropiedadesWebPartSolicitudFalla
): string | undefined {
  const crudo = props.concSolicitudFallaUrlInsertSIOD?.trim() ?? '';
  if (crudo.length === 0) {
    return undefined;
  }
  return NormalizarUrlAzureFunctionSolicitudFalla(crudo);
}

export function ObtenerUrlUpdateSiodSolicitudFallaDesdeProps(
  props: PropiedadesWebPartSolicitudFalla
): string | undefined {
  const crudo = props.concSolicitudFallaUrlUpdateSIOD?.trim() ?? '';
  if (crudo.length === 0) {
    return undefined;
  }
  return NormalizarUrlAzureFunctionSolicitudFalla(crudo);
}