import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { SolicitudOperadorRenovableFila } from '../../../models/operadorRenovable/SolicitudOperadorRenovable';
import { NombreListaConcentrador } from '../concentradorComun/NombresListasConcentrador';
import { SharePointRestError } from '../SharePointRestError';
import {
  ConstruirViewXmlSolicitudesIndispOperador,
  type ParametrosViewXmlSolicitudesIndispOperador
} from './ConstruirViewXmlSolicitudesIndispOperador';
import { EnriquecerSolicitudesConIndisponibilidades } from './IndisponibilidadesSolicitudServicio';
import { NormalizarFilaSolicitudConcentradorOperador } from './NormalizarFilaSolicitudConcentradorOperador';
import { ObtenerInstalacionesOperadorRenovable } from './InstalacionesOperadorRenovableServicio';

type RespuestaRenderListData = {
  Row?: Record<string, unknown>[] | string;
  NextHref?: string;
};

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

function NormalizarPagingDesdeNextHref(nextHref?: string): string | undefined {
  if (!nextHref) {
    return undefined;
  }
  return nextHref.startsWith('?') ? nextHref.substring(1) : nextHref;
}

async function ValidarRespuesta(response: SPHttpClientResponse, operacion: string, url: string): Promise<void> {
  if (response.ok) {
    return;
  }
  throw new SharePointRestError(operacion, url, response.status, response.statusText);
}

export async function ObtenerSolicitudesIndispOperadorRenovable(
  context: WebPartContext,
  params: Omit<ParametrosViewXmlSolicitudesIndispOperador, 'instalacionesPermitidasIds'>,
  textoBusqueda?: string
): Promise<SolicitudOperadorRenovableFila[]> {
  const instalaciones = await ObtenerInstalacionesOperadorRenovable(context);
  const idsInstalacion = instalaciones.map((inst) => inst.id);
  if (idsInstalacion.length === 0) {
    return [];
  }

  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaConcentrador);
  let url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/RenderListDataAsStream`;

  const busqueda = textoBusqueda?.trim();
  if (busqueda) {
    url += `?InplaceSearchQuery=${encodeURIComponent(busqueda)}`;
  }

  const filasBase: Omit<
    SolicitudOperadorRenovableFila,
    'equiposResumen' | 'cantidadSubequipos' | 'subequiposIndisponibles' | 'subequiposTotal' | 'subequipos'
  >[] = [];

  let paging: string | undefined;
  do {
    const viewXml = ConstruirViewXmlSolicitudesIndispOperador({
      ...params,
      instalacionesPermitidasIds: idsInstalacion
    });
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

    await ValidarRespuesta(response, 'ObtenerSolicitudesIndispOperadorRenovable', url);
    const json = (await response.json()) as RespuestaRenderListData;
    const filasRaw = ParsearFilas(json.Row);

    for (const filaRaw of filasRaw) {
      const fila = NormalizarFilaSolicitudConcentradorOperador(filaRaw);
      if (fila) {
        filasBase.push(fila);
      }
    }

    paging = NormalizarPagingDesdeNextHref(json.NextHref);
  } while (paging);

  return EnriquecerSolicitudesConIndisponibilidades(context, filasBase);
}
