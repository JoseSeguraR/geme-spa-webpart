import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { NOMBRE_LISTA_SISTEMA_ACCESOS } from '../../constants/ConfiguracionCacheMenu';
import type { RegistroSistemaAccesoNormalizado } from '../../models/SistemaAcceso';
import { NormalizarRegistrosSistemaAccesos } from '../menu/NormalizarRegistrosSistemaAccesos';
import type { ElementoSistemaAccesoSharePoint } from './ElementoSistemaAccesoSharePoint';
import { SharePointRestError } from './SharePointRestError';
import type { RespuestaListaSharePoint } from './RespuestaListaSharePoint';

const CamposSelect = [
  'Id',
  'TIPOACCESO',
  'PADREId',
  'ORDEN',
  'HASH_TITLE',
  'HASH_KEY',
  'GRUPOACCESOId',
  'ACTIVO',
  'ICONO',
  'PADRE/Id'
].join(',');

const ExpandLookup = 'PADRE';

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

export async function ObtenerRegistrosSistemaAccesosDesdeSharePoint(
  context: WebPartContext
): Promise<RegistroSistemaAccesoNormalizado[]> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NOMBRE_LISTA_SISTEMA_ACCESOS);
  const urlInicial =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items` +
    `?$select=${CamposSelect}&$expand=${ExpandLookup}&$filter=ACTIVO eq 1&$orderby=ORDEN asc`;

  const elementos: ElementoSistemaAccesoSharePoint[] = [];
  let urlSiguiente: string | undefined = urlInicial;

  while (urlSiguiente) {
    const response: SPHttpClientResponse = await context.spHttpClient.get(
      urlSiguiente,
      SPHttpClient.configurations.v1
    );
    await ValidarRespuesta(response, 'ObtenerRegistrosSistemaAccesosDesdeSharePoint', urlSiguiente);

    const json = (await response.json()) as RespuestaListaSharePoint<ElementoSistemaAccesoSharePoint>;
    elementos.push(...json.value);
    urlSiguiente = json['@odata.nextLink'];
  }

  return NormalizarRegistrosSistemaAccesos(elementos);
}
