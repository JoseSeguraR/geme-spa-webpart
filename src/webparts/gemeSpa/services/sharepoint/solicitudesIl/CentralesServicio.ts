import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import {
  ModuloFiltroInstalacionConcentrador,
  NombreListaCentrales
} from '../../../components/vistas/cor-conecta/concentrador/administrador/constantesSolicitudesIl';
import type { CentralMantenedor } from '../../../models/SolicitudIl';
import type { RespuestaListaSharePoint } from '../RespuestaListaSharePoint';
import { SharePointRestError } from '../SharePointRestError';

type ElementoInstalacionSharePoint = {
  Id: number;
  INSTALACION?: string;
  MODULOS?: string | string[] | { results?: string[] };
};

async function ValidarRespuesta(response: SPHttpClientResponse, operacion: string, url: string): Promise<void> {
  if (response.ok) {
    return;
  }
  throw new SharePointRestError(operacion, url, response.status, response.statusText);
}

function ModulosIncluyenConcentrador(modulos: ElementoInstalacionSharePoint['MODULOS']): boolean {
  if (modulos === undefined || modulos === null) {
    return false;
  }
  if (typeof modulos === 'string') {
    return modulos.split(';#').some((valor) => valor.trim() === ModuloFiltroInstalacionConcentrador);
  }
  if (Array.isArray(modulos)) {
    return modulos.some((valor) => valor === ModuloFiltroInstalacionConcentrador);
  }
  const resultados = modulos.results;
  return Array.isArray(resultados) && resultados.some((valor) => valor === ModuloFiltroInstalacionConcentrador);
}

export async function ObtenerCentralesDesdeSharePoint(context: WebPartContext): Promise<CentralMantenedor[]> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaCentrales);
  const filtroModulos = `MODULOS eq '${ModuloFiltroInstalacionConcentrador.replace(/'/g, "''")}'`;
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items` +
    `?$select=Id,INSTALACION,MODULOS&$filter=${encodeURIComponent(filtroModulos)}` +
    `&$orderby=${encodeURIComponent('INSTALACION asc')}&$top=5000`;

  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  await ValidarRespuesta(response, 'ObtenerCentralesDesdeSharePoint', url);

  const json = (await response.json()) as RespuestaListaSharePoint<ElementoInstalacionSharePoint>;
  return json.value
    .filter((elemento) => typeof elemento.Id === 'number' && ModulosIncluyenConcentrador(elemento.MODULOS))
    .map((elemento) => ({
      id: elemento.Id,
      central: (elemento.INSTALACION ?? '').trim()
    }))
    .filter((central) => central.central.length > 0);
}
