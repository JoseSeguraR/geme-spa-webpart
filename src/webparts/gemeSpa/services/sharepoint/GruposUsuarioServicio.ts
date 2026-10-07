import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { SharePointRestError } from './SharePointRestError';
import type { RespuestaListaSharePoint } from './RespuestaListaSharePoint';

type GrupoSharePointBasico = {
  Id: number;
};

async function ValidarRespuesta(
  response: SPHttpClientResponse,
  operacion: string,
  recurso: string
): Promise<void> {
  if (response.ok) {
    return;
  }
  throw new SharePointRestError(operacion, recurso, response.status, response.statusText);
}

export async function ObtenerIdsGruposUsuarioDesdeSharePoint(context: WebPartContext): Promise<number[]> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const url = `${webUrl}/_api/web/currentuser/groups?$select=Id`;

  const response: SPHttpClientResponse = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  await ValidarRespuesta(response, 'ObtenerIdsGruposUsuarioDesdeSharePoint', url);

  const json = (await response.json()) as RespuestaListaSharePoint<GrupoSharePointBasico>;
  return json.value.map((grupo) => grupo.Id);
}
