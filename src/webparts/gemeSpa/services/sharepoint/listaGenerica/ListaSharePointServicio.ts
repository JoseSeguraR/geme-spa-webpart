import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { ExtraerMensajeErrorSharePoint } from '../ExtraerMensajeErrorSharePoint';
import type { RespuestaListaSharePoint } from '../RespuestaListaSharePoint';
import { SharePointRestError } from '../SharePointRestError';

/** Consulta OData sobre los ítems de una lista (sin codificar: el servicio codifica cada parte). */
export type ConsultaItemsLista = {
  select: string;
  expand?: string;
  filter?: string;
  orderby?: string;
};

export type CuerpoItemLista = Record<string, unknown>;

const EncabezadosJson = {
  Accept: 'application/json;odata=nometadata',
  'Content-Type': 'application/json;odata=nometadata;charset=utf-8'
};

async function ValidarRespuesta(response: SPHttpClientResponse, operacion: string, url: string): Promise<void> {
  if (response.ok) {
    return;
  }
  const mensaje = await ExtraerMensajeErrorSharePoint(response);
  throw new SharePointRestError(operacion, url, response.status, response.statusText, mensaje);
}

function UrlItemsLista(context: WebPartContext, lista: string): string {
  const webUrl = context.pageContext.web.absoluteUrl;
  return `${webUrl}/_api/web/lists/getbytitle('${encodeURIComponent(lista)}')/items`;
}

/** Todos los ítems de la lista que cumplen la consulta; sigue `@odata.nextLink` (listas de más de 5000 ítems). */
export async function ObtenerTodosLosItemsLista<T>(
  context: WebPartContext,
  lista: string,
  consulta: ConsultaItemsLista
): Promise<T[]> {
  const partes = [`$select=${encodeURIComponent(consulta.select)}`, '$top=5000'];
  if (consulta.expand) {
    partes.push(`$expand=${encodeURIComponent(consulta.expand)}`);
  }
  if (consulta.filter) {
    partes.push(`$filter=${encodeURIComponent(consulta.filter)}`);
  }
  if (consulta.orderby) {
    partes.push(`$orderby=${encodeURIComponent(consulta.orderby)}`);
  }

  const elementos: T[] = [];
  let urlSiguiente: string | undefined = `${UrlItemsLista(context, lista)}?${partes.join('&')}`;

  while (urlSiguiente) {
    const response: SPHttpClientResponse = await context.spHttpClient.get(
      urlSiguiente,
      SPHttpClient.configurations.v1
    );
    await ValidarRespuesta(response, `ObtenerTodosLosItemsLista(${lista})`, urlSiguiente);
    const json = (await response.json()) as RespuestaListaSharePoint<T>;
    elementos.push(...json.value);
    urlSiguiente = json['@odata.nextLink'];
  }

  return elementos;
}

/** Crea un ítem y devuelve su Id. */
export async function CrearItemLista(context: WebPartContext, lista: string, cuerpo: CuerpoItemLista): Promise<number> {
  const url = UrlItemsLista(context, lista);
  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: EncabezadosJson,
    body: JSON.stringify(cuerpo)
  });
  await ValidarRespuesta(response, `CrearItemLista(${lista})`, url);
  const json = (await response.json()) as { Id?: number; ID?: number };
  return json.Id ?? json.ID ?? 0;
}

/** Actualiza solo las columnas indicadas (MERGE). */
export async function ActualizarItemLista(
  context: WebPartContext,
  lista: string,
  id: number,
  cuerpo: CuerpoItemLista
): Promise<void> {
  const url = `${UrlItemsLista(context, lista)}(${id})`;
  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: { ...EncabezadosJson, 'IF-MATCH': '*', 'X-HTTP-Method': 'MERGE' },
    body: JSON.stringify(cuerpo)
  });
  await ValidarRespuesta(response, `ActualizarItemLista(${lista})`, url);
}

export async function EliminarItemLista(context: WebPartContext, lista: string, id: number): Promise<void> {
  const url = `${UrlItemsLista(context, lista)}(${id})`;
  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: { ...EncabezadosJson, 'IF-MATCH': '*', 'X-HTTP-Method': 'DELETE' }
  });
  await ValidarRespuesta(response, `EliminarItemLista(${lista})`, url);
}
