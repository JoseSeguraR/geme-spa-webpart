import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { NombreListaConcentrador } from '../concentradorComun/NombresListasConcentrador';
import { SharePointRestError } from '../SharePointRestError';
import type { RespuestaListaSharePoint } from '../RespuestaListaSharePoint';
import {
  CampoInstalacionGmConcentrador,
  CampoTieneSubequiposIndisponibles,
  EstadoSolicitudFallaVigente,
  NombreListaSolicitudFallaConcentrador
} from './CamposOperadorRenovable';

export type OpcionSolicitudVinculadaPgl = {
  id: number;
  etiqueta: string;
};

async function ValidarRespuesta(response: SPHttpClientResponse, operacion: string, url: string): Promise<void> {
  if (response.ok) {
    return;
  }
  throw new SharePointRestError(operacion, url, response.status, response.statusText);
}

export async function ObtenerOpcionesSolicitudFallaPgl(
  context: WebPartContext,
  instalacionId: number
): Promise<OpcionSolicitudVinculadaPgl[]> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSolicitudFallaConcentrador);
  const filtro = encodeURIComponent(
    `${CampoInstalacionGmConcentrador}Id eq ${instalacionId} and ESTADO eq '${EstadoSolicitudFallaVigente}'`
  );
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items` +
    `?$select=Id,ID_CEN&$filter=${filtro}&$orderby=ID_CEN asc&$top=200`;

  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  await ValidarRespuesta(response, 'ObtenerOpcionesSolicitudFallaPgl', url);

  const json = (await response.json()) as RespuestaListaSharePoint<{ Id?: number; ID_CEN?: string }>;
  return json.value
    .filter((item) => typeof item.Id === 'number')
    .map((item) => ({
      id: item.Id as number,
      etiqueta: (item.ID_CEN ?? '').trim() || `#${item.Id}`
    }));
}

export async function ObtenerOpcionesSolicitudConcentradorPgl(
  context: WebPartContext,
  instalacionId: number
): Promise<OpcionSolicitudVinculadaPgl[]> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaConcentrador);
  const filtro = encodeURIComponent(
    `${CampoInstalacionGmConcentrador}Id eq ${instalacionId} and ${CampoTieneSubequiposIndisponibles} eq 1`
  );
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items` +
    `?$select=Id,ID_SOLICITUD&$filter=${filtro}&$orderby=ID_SOLICITUD asc&$top=200`;

  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  await ValidarRespuesta(response, 'ObtenerOpcionesSolicitudConcentradorPgl', url);

  const json = (await response.json()) as RespuestaListaSharePoint<{ Id?: number; ID_SOLICITUD?: string }>;
  return json.value
    .filter((item) => typeof item.Id === 'number')
    .map((item) => ({
      id: item.Id as number,
      etiqueta: (item.ID_SOLICITUD ?? '').trim() || `#${item.Id}`
    }));
}
