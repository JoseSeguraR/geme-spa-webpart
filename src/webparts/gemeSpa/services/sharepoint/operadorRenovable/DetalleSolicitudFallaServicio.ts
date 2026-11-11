import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { FormatearFechaHoraVisible } from '../../../utils/FechaHoraCorConecta';
import { SharePointRestError } from '../SharePointRestError';
import { CampoInstalacionGmConcentrador, NombreListaSolicitudFallaConcentrador } from './CamposOperadorRenovable';

export type DetalleSolicitudFallaOperador = {
  id: number;
  idCen: string;
  central: string;
  estado: string;
  descripcion: string;
  potencia: string;
  fechaPerturbacion: string;
  fechaRetorno: string;
};

type ElementoFallaSharePoint = {
  Id?: number;
  ID_CEN?: string;
  ESTADO?: string;
  DESCRIPCION?: string;
  POTENCIA?: number;
  MEDIDA?: string;
  FECHAPERTURBACION?: string;
  FECHAEFECTIVARETORNO?: string;
  INSTALACION_GM?: { INSTALACION?: string };
};

async function ValidarRespuesta(response: SPHttpClientResponse, operacion: string, url: string): Promise<void> {
  if (response.ok) {
    return;
  }
  throw new SharePointRestError(operacion, url, response.status, response.statusText);
}

export async function ObtenerDetalleSolicitudFallaOperador(
  context: WebPartContext,
  solicitudFallaId: number
): Promise<DetalleSolicitudFallaOperador | undefined> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSolicitudFallaConcentrador);
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items(${solicitudFallaId})` +
    `?$select=Id,ID_CEN,ESTADO,DESCRIPCION,POTENCIA,MEDIDA,FECHAPERTURBACION,FECHAEFECTIVARETORNO,${CampoInstalacionGmConcentrador}/INSTALACION` +
    `&$expand=${CampoInstalacionGmConcentrador}`;

  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  if (response.status === 404) {
    return undefined;
  }
  await ValidarRespuesta(response, 'ObtenerDetalleSolicitudFallaOperador', url);

  const item = (await response.json()) as ElementoFallaSharePoint;
  if (typeof item.Id !== 'number') {
    return undefined;
  }

  const potenciaNum = typeof item.POTENCIA === 'number' ? item.POTENCIA : 0;
  const medida = (item.MEDIDA ?? 'MW').trim();
  return {
    id: item.Id,
    idCen: (item.ID_CEN ?? '').trim() || `#${item.Id}`,
    central: item.INSTALACION_GM?.INSTALACION?.trim() || '—',
    estado: (item.ESTADO ?? '—').trim(),
    descripcion: (item.DESCRIPCION ?? '').trim(),
    potencia: `${potenciaNum} ${medida}`,
    fechaPerturbacion: FormatearFechaHoraVisible(item.FECHAPERTURBACION) || '—',
    fechaRetorno: FormatearFechaHoraVisible(item.FECHAEFECTIVARETORNO) || '—'
  };
}
