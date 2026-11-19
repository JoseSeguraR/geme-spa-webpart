import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { EquipoMantenedorFalla } from '../../../models/SolicitudFalla';
import { NombreListaEquiposConcentrador } from '../operadorRenovable/NombresListasOperadorRenovable';
import type { RespuestaListaSharePoint } from '../RespuestaListaSharePoint';
import { SharePointRestError } from '../SharePointRestError';

async function ValidarRespuesta(response: SPHttpClientResponse, operacion: string, url: string): Promise<void> {
  if (response.ok) {
    return;
  }
  throw new SharePointRestError(operacion, url, response.status, response.statusText);
}

export async function ObtenerEquiposPorCentralFalla(
  context: WebPartContext,
  centralId: number
): Promise<EquipoMantenedorFalla[]> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaEquiposConcentrador);
  const filtro = `INSTALACIONId eq ${centralId}`;
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items` +
    `?$select=Id,EQUIPO&$filter=${encodeURIComponent(filtro)}` +
    `&$orderby=${encodeURIComponent('EQUIPO asc')}&$top=500`;

  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  await ValidarRespuesta(response, 'ObtenerEquiposPorCentralFalla', url);

  const json = (await response.json()) as RespuestaListaSharePoint<{ Id: number; EQUIPO?: string }>;
  return (json.value ?? []).map((item) => ({
    id: item.Id,
    nombre: (item.EQUIPO ?? '').trim() || `Equipo #${item.Id}`
  }));
}