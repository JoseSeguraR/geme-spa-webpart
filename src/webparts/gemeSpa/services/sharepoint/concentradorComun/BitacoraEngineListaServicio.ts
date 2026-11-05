import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { FilaBitacoraEngine } from '../../../models/concentradorComun/FilaBitacoraEngine';
import { ExtraerMensajeErrorSharePoint } from '../ExtraerMensajeErrorSharePoint';
import { SharePointRestError } from '../SharePointRestError';
import { ConstruirViewXmlBitacoraEngine } from './ConstruirViewXmlBitacoraEngine';
import { NombreListaBitacoraEngine } from './NombresListasConcentrador';
import { NormalizarFilaBitacoraEngine } from './NormalizarFilaBitacoraEngine';

type RespuestaRenderListData = {
  Row?: Record<string, unknown>[] | string;
  NextHref?: string;
};

const TamanoPaginaBitacoraPorRegistro = 100;

function NormalizarPagingDesdeNextHref(nextHref?: string): string | undefined {
  if (!nextHref) {
    return undefined;
  }
  return nextHref.startsWith('?') ? nextHref.substring(1) : nextHref;
}

function ParsearFilas(row: RespuestaRenderListData['Row']): Record<string, unknown>[] {
  if (!row) {
    return [];
  }
  if (typeof row === 'string') {
    try {
      const parseado = JSON.parse(row) as unknown;
      return Array.isArray(parseado) ? (parseado as Record<string, unknown>[]) : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(row) ? row : [];
}

async function ValidarRespuesta(response: SPHttpClientResponse, operacion: string, url: string): Promise<void> {
  if (response.ok) {
    return;
  }
  const mensaje = await ExtraerMensajeErrorSharePoint(response);
  throw new SharePointRestError(operacion, url, response.status, response.statusText, mensaje);
}

export async function ObtenerFilasBitacoraEngine(
  context: WebPartContext,
  idRegistro: number,
  tipoRegistro: string
): Promise<FilaBitacoraEngine[]> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaBitacoraEngine);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/RenderListDataAsStream`;

  const filas: FilaBitacoraEngine[] = [];
  let paging: string | undefined;

  do {
    const viewXml = ConstruirViewXmlBitacoraEngine(idRegistro, tipoRegistro, TamanoPaginaBitacoraPorRegistro);
    const cuerpo = {
      parameters: {
        RenderOptions: 2,
        ViewXml: viewXml,
        DatesInUtc: true,
        ...(paging ? { Paging: paging } : {})
      }
    };

    const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
      headers: {
        Accept: 'application/json;odata=nometadata',
        'Content-Type': 'application/json;odata=nometadata;charset=utf-8'
      },
      body: JSON.stringify(cuerpo)
    });

    await ValidarRespuesta(response, 'ObtenerFilasBitacoraEngine', url);
    const json = (await response.json()) as RespuestaRenderListData;
    const filasRaw = ParsearFilas(json.Row);

    for (const filaRaw of filasRaw) {
      const fila = NormalizarFilaBitacoraEngine(filaRaw);
      if (fila) {
        filas.push(fila);
      }
    }

    paging = NormalizarPagingDesdeNextHref(json.NextHref);
  } while (paging);

  return filas;
}
