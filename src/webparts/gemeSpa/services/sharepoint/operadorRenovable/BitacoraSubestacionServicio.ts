import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { FilaBitacoraLimitacionSubestacion } from '../../../models/operadorRenovable/LimitacionSubestacionOperador';
import { ExtraerMensajeErrorSharePoint } from '../ExtraerMensajeErrorSharePoint';
import type { RespuestaListaSharePoint } from '../RespuestaListaSharePoint';
import { SharePointRestError } from '../SharePointRestError';
import { CampoLookupBitacoraLimitacion } from './CamposOperadorRenovable';
import { NombreListaBitacoraSubestacion } from './NombresListasOperadorRenovable';

type ElementoBitacoraLimitacionSharePoint = {
  Id?: number;
  ACCION?: string;
  ESTADO_ANTERIOR?: string;
  ESTADO_NUEVO?: string;
  DESCRIPCION?: string;
  FECHA?: string;
  USUARIO?: string;
  Created?: string;
  Author?: { Title?: string };
};

const cacheListaDisponible = new Map<string, boolean>();

async function ValidarRespuesta(response: SPHttpClientResponse, operacion: string, url: string): Promise<void> {
  if (response.ok) {
    return;
  }
  const mensaje = await ExtraerMensajeErrorSharePoint(response);
  throw new SharePointRestError(operacion, url, response.status, response.statusText, mensaje);
}

async function ListaBitacoraSubestacionDisponible(context: WebPartContext): Promise<boolean> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const enCache = cacheListaDisponible.get(webUrl);
  if (enCache !== undefined) {
    return enCache;
  }
  const tituloLista = encodeURIComponent(NombreListaBitacoraSubestacion);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')`;
  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  const disponible = response.ok;
  cacheListaDisponible.set(webUrl, disponible);
  return disponible;
}

function NormalizarFilaBitacora(elemento: ElementoBitacoraLimitacionSharePoint): FilaBitacoraLimitacionSubestacion | undefined {
  if (typeof elemento.Id !== 'number') {
    return undefined;
  }
  const usuarioExplicito = elemento.USUARIO?.trim();
  const fechaExplicita = elemento.FECHA?.trim();
  return {
    id: elemento.Id,
    accion: (elemento.ACCION ?? '').trim(),
    estadoAnterior: (elemento.ESTADO_ANTERIOR ?? '').trim(),
    estadoNuevo: (elemento.ESTADO_NUEVO ?? '').trim(),
    descripcion: elemento.DESCRIPCION?.trim(),
    usuario: usuarioExplicito || (elemento.Author?.Title ?? '').trim() || '—',
    fecha: fechaExplicita || elemento.Created || ''
  };
}

export async function ObtenerBitacoraLimitacionSubestacion(
  context: WebPartContext,
  limitacionId: number
): Promise<FilaBitacoraLimitacionSubestacion[]> {
  if (!(await ListaBitacoraSubestacionDisponible(context))) {
    return [];
  }

  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaBitacoraSubestacion);
  const filtro = `${CampoLookupBitacoraLimitacion}Id eq ${limitacionId}`;
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items` +
    `?$select=Id,ACCION,ESTADO_ANTERIOR,ESTADO_NUEVO,DESCRIPCION,Created,Author/Title` +
    `&$expand=Author&$filter=${encodeURIComponent(filtro)}` +
    `&$orderby=${encodeURIComponent('Created desc')}&$top=200`;

  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  if (!response.ok) {
    return [];
  }

  const json = (await response.json()) as RespuestaListaSharePoint<ElementoBitacoraLimitacionSharePoint>;
  return json.value
    .map(NormalizarFilaBitacora)
    .filter((fila): fila is FilaBitacoraLimitacionSubestacion => fila !== undefined);
}

export type RegistrarBitacoraLimitacionSubestacionParams = {
  limitacionId: number;
  accion: string;
  estadoAnterior: string;
  estadoNuevo: string;
  descripcion?: string;
};

export async function RegistrarBitacoraLimitacionSubestacion(
  context: WebPartContext,
  params: RegistrarBitacoraLimitacionSubestacionParams
): Promise<void> {
  if (!(await ListaBitacoraSubestacionDisponible(context))) {
    return;
  }

  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaBitacoraSubestacion);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items`;

  const cuerpo: Record<string, string | number> = {
    Title: params.accion,
    [`${CampoLookupBitacoraLimitacion}Id`]: params.limitacionId,
    ACCION: params.accion,
    ESTADO_ANTERIOR: params.estadoAnterior,
    ESTADO_NUEVO: params.estadoNuevo
  };
  if (params.descripcion) {
    cuerpo.DESCRIPCION = params.descripcion;
  }

  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: {
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/json;odata=nometadata;charset=utf-8'
    },
    body: JSON.stringify(cuerpo)
  });

  await ValidarRespuesta(response, 'RegistrarBitacoraLimitacionSubestacion', url);
}
