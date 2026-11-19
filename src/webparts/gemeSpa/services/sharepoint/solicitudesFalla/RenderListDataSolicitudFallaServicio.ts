import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { NombreListaSolicitudFalla } from '../../../components/vistas/cor-conecta/concentrador/solicitudes-falla/constantesSolicitudFalla';
import type { SolicitudFallaNormalizada } from './NormalizarFilaSolicitudFallaDesdeRender';
import { NormalizarFilaSolicitudFallaDesdeRender } from './NormalizarFilaSolicitudFallaDesdeRender';
import { SharePointRestError } from '../SharePointRestError';
import { ConstruirViewXmlSolicitudFalla, type ParametrosViewXmlSolicitudFalla } from './ConstruirViewXmlSolicitudFalla';

export type ResultadoPaginaSolicitudFalla = {
  filas: SolicitudFallaNormalizada[];
  pagingSiguiente?: string;
};

type RespuestaRenderListData = {
  Row?: Record<string, unknown>[] | string;
  NextHref?: string;
};

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
  throw new SharePointRestError(operacion, url, response.status, response.statusText);
}

export async function ObtenerPaginaSolicitudFallaRenderListData(
  context: WebPartContext,
  params: ParametrosViewXmlSolicitudFalla,
  paging?: string,
  textoBusqueda?: string
): Promise<ResultadoPaginaSolicitudFalla> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSolicitudFalla);
  let url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/RenderListDataAsStream`;

  const busqueda = textoBusqueda?.trim();
  if (busqueda) {
    url += `?InplaceSearchQuery=${encodeURIComponent(busqueda)}`;
  }

  const viewXml = ConstruirViewXmlSolicitudFalla(params);
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

  await ValidarRespuesta(response, 'ObtenerPaginaSolicitudFallaRenderListData', url);
  const json = (await response.json()) as RespuestaRenderListData;
  const filasRaw = ParsearFilas(json.Row);
  const filas = filasRaw
    .map((fila) => NormalizarFilaSolicitudFallaDesdeRender(fila))
    .filter((fila): fila is SolicitudFallaNormalizada => fila !== undefined);

  return {
    filas,
    pagingSiguiente: NormalizarPagingDesdeNextHref(json.NextHref)
  };
}