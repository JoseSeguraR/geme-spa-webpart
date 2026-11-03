import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { FilaBitacoraOperadorSubequipo } from '../../../models/operadorRenovable/CatalogoEquiposOperador';
import { ExtraerMensajeErrorSharePoint } from '../ExtraerMensajeErrorSharePoint';
import type { RespuestaListaSharePoint } from '../RespuestaListaSharePoint';
import { SharePointRestError } from '../SharePointRestError';
import {
  AccionBitacoraEnvioMeteologicaSimulado,
  AccionBitacoraMarcarDisponibilidad,
  AccionBitacoraMarcarIndisponibilidad,
  CampoSharePointCapacidadBitacoraSubequipo
} from './CamposOperadorRenovable';
import {
  NombreListaBitacoraOperador,
  NombreListaBitacoraSubequipo
} from './NombresListasOperadorRenovable';

type ElementoBitacoraSubequipoSharePoint = {
  Id?: number;
  ACCION?: string;
  ESTADO_ANTERIOR?: string;
  ESTADO_NUEVO?: string;
  CAPACIDAD_MW?: number;
  MOTIVO?: string;
  DESCRIPCION?: string;
  FECHA?: string;
  USUARIO?: string;
  Created?: string;
  Author?: { Title?: string };
};

type ElementoCreadoSharePoint = {
  Id: number;
};

type ModoBitacoraSubequipo = 'nueva' | 'legacy';

const TipoObjetoBitacoraLegacySubequipo = 'Subequipo';

async function ValidarRespuesta(response: SPHttpClientResponse, operacion: string, url: string): Promise<void> {
  if (response.ok) {
    return;
  }
  const mensaje = await ExtraerMensajeErrorSharePoint(response);
  throw new SharePointRestError(operacion, url, response.status, response.statusText, mensaje);
}

function NormalizarFilaBitacora(elemento: ElementoBitacoraSubequipoSharePoint): FilaBitacoraOperadorSubequipo | undefined {
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
    capacidadMw: typeof elemento.CAPACIDAD_MW === 'number' ? elemento.CAPACIDAD_MW : undefined,
    motivo: elemento.MOTIVO?.trim(),
    descripcion: elemento.DESCRIPCION?.trim(),
    usuario: usuarioExplicito || (elemento.Author?.Title ?? '').trim() || '—',
    fecha: fechaExplicita || elemento.Created || ''
  };
}

async function ObtenerModoBitacora(context: WebPartContext): Promise<ModoBitacoraSubequipo> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaBitacoraSubequipo);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')`;
  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  if (response.ok) {
    return 'nueva';
  }
  if (response.status === 404 || response.status === 400) {
    return 'legacy';
  }
  await ValidarRespuesta(response, 'ObtenerModoBitacora', url);
  return 'legacy';
}

export async function ObtenerBitacoraSubequipoOperador(
  context: WebPartContext,
  subequipoId: number
): Promise<FilaBitacoraOperadorSubequipo[]> {
  const modo = await ObtenerModoBitacora(context);
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(
    modo === 'nueva' ? NombreListaBitacoraSubequipo : NombreListaBitacoraOperador
  );
  const filtro =
    modo === 'nueva'
      ? `SUBEQUIPOId eq ${subequipoId}`
      : `TIPO_OBJETO eq '${TipoObjetoBitacoraLegacySubequipo}' and SUBEQUIPOId eq ${subequipoId}`;
  const selectCampos =
    modo === 'nueva'
      ? `Id,ACCION,ESTADO_ANTERIOR,ESTADO_NUEVO,${CampoSharePointCapacidadBitacoraSubequipo},MOTIVO,DESCRIPCION,FECHA,USUARIO,Created,Author/Title`
      : `Id,ACCION,ESTADO_ANTERIOR,ESTADO_NUEVO,${CampoSharePointCapacidadBitacoraSubequipo},MOTIVO,DESCRIPCION,Created,Author/Title`;
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items` +
    `?$select=${selectCampos}` +
    `&$expand=Author&$filter=${encodeURIComponent(filtro)}` +
    `&$orderby=${encodeURIComponent('Created desc')}&$top=200`;

  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  await ValidarRespuesta(response, 'ObtenerBitacoraSubequipoOperador', url);

  const json = (await response.json()) as RespuestaListaSharePoint<ElementoBitacoraSubequipoSharePoint>;
  return json.value
    .map(NormalizarFilaBitacora)
    .filter((fila): fila is FilaBitacoraOperadorSubequipo => fila !== undefined);
}

export type RegistrarBitacoraSubequipoOperadorParams = {
  subequipoId: number;
  accion:
    | typeof AccionBitacoraMarcarIndisponibilidad
    | typeof AccionBitacoraMarcarDisponibilidad
    | typeof AccionBitacoraEnvioMeteologicaSimulado;
  estadoAnterior: string;
  estadoNuevo: string;
  capacidadMw?: number;
  motivo?: string;
  descripcion?: string;
};

export async function RegistrarBitacoraSubequipoOperador(
  context: WebPartContext,
  params: RegistrarBitacoraSubequipoOperadorParams
): Promise<void> {
  const modo = await ObtenerModoBitacora(context);
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(
    modo === 'nueva' ? NombreListaBitacoraSubequipo : NombreListaBitacoraOperador
  );
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items`;

  const cuerpo: Record<string, string | number> = {
    Title: params.accion,
    SUBEQUIPOId: params.subequipoId,
    ACCION: params.accion,
    ESTADO_ANTERIOR: params.estadoAnterior,
    ESTADO_NUEVO: params.estadoNuevo
  };

  if (modo === 'legacy') {
    cuerpo.TIPO_OBJETO = TipoObjetoBitacoraLegacySubequipo;
  }

  if (params.capacidadMw !== undefined) {
    cuerpo[CampoSharePointCapacidadBitacoraSubequipo] = params.capacidadMw;
  }
  if (params.motivo) {
    cuerpo.MOTIVO = params.motivo;
  }
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

  if (!response.ok) {
    if (modo === 'nueva' && (response.status === 404 || response.status === 400)) {
      await RegistrarBitacoraLegacy(context, params);
      return;
    }
    await ValidarRespuesta(response, 'RegistrarBitacoraSubequipoOperador', url);
  }
  const json = (await response.json()) as ElementoCreadoSharePoint;
  if (!json.Id) {
    throw new SharePointRestError(
      'RegistrarBitacoraSubequipoOperador',
      url,
      response.status,
      response.statusText,
      'SharePoint no devolvió Id del evento de bitácora.'
    );
  }
}

async function RegistrarBitacoraLegacy(
  context: WebPartContext,
  params: RegistrarBitacoraSubequipoOperadorParams
): Promise<void> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaBitacoraOperador);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items`;

  const cuerpo: Record<string, string | number> = {
    Title: params.accion,
    TIPO_OBJETO: TipoObjetoBitacoraLegacySubequipo,
    SUBEQUIPOId: params.subequipoId,
    ACCION: params.accion,
    ESTADO_ANTERIOR: params.estadoAnterior,
    ESTADO_NUEVO: params.estadoNuevo
  };

  if (params.capacidadMw !== undefined) {
    cuerpo[CampoSharePointCapacidadBitacoraSubequipo] = params.capacidadMw;
  }
  if (params.motivo) {
    cuerpo.MOTIVO = params.motivo;
  }
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

  await ValidarRespuesta(response, 'RegistrarBitacoraLegacy', url);
}
