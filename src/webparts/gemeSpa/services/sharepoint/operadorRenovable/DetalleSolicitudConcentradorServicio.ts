import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { DetalleSolicitudConcentradorOperador } from '../../../models/operadorRenovable/SolicitudOperadorRenovable';
import type { AdjuntoSolicitudIl } from '../../../models/SolicitudIl';
import { NombreListaConcentrador } from '../concentradorComun/NombresListasConcentrador';
import { ExtraerMensajeErrorSharePoint } from '../ExtraerMensajeErrorSharePoint';
import { SharePointRestError } from '../SharePointRestError';
import {
  CampoEstadoTareaActualConcentrador,
  CampoLookupTareaActualConcentrador
} from './CamposOperadorRenovable';

type ItemConcentradorRest = {
  Id: number;
  ID_SOLICITUD?: string;
  RELACION_SODI_CEN?: string;
  DESCRIPCION?: string;
  INICIO_PROGRAMADO?: string;
  INICIO_EFECTIVO?: string;
  FIN_PROGRAMADO?: string;
  INSTALACION_GM?: { INSTALACION?: string; Title?: string };
  SOLICITANTE?: { Title?: string };
  TAREAACTUAL?: { TAREAORIGEN_ESTADO?: string };
};

type AdjuntoSharePoint = {
  FileName: string;
  ServerRelativeUrl: string;
};

async function ValidarRespuesta(response: SPHttpClientResponse, operacion: string, url: string): Promise<void> {
  if (response.ok) {
    return;
  }
  const mensaje = await ExtraerMensajeErrorSharePoint(response);
  throw new SharePointRestError(operacion, url, response.status, response.statusText, mensaje);
}

export async function ObtenerDetalleSolicitudConcentrador(
  context: WebPartContext,
  idElemento: number
): Promise<DetalleSolicitudConcentradorOperador> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaConcentrador);
  const select = [
    'Id',
    'ID_SOLICITUD',
    'RELACION_SODI_CEN',
    'DESCRIPCION',
    'INICIO_PROGRAMADO',
    'INICIO_EFECTIVO',
    'FIN_PROGRAMADO',
    'INSTALACION_GM/INSTALACION',
    'SOLICITANTE/Title',
    'TAREAACTUAL/TAREAORIGEN_ESTADO'
  ].join(',');
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items(${idElemento})` +
    `?$select=${select}&$expand=INSTALACION_GM,SOLICITANTE,TAREAACTUAL`;

  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  await ValidarRespuesta(response, 'ObtenerDetalleSolicitudConcentrador', url);

  const item = (await response.json()) as ItemConcentradorRest;
  const central = (item.INSTALACION_GM?.INSTALACION ?? item.INSTALACION_GM?.Title ?? '').trim();
  const estado = item.TAREAACTUAL?.TAREAORIGEN_ESTADO?.trim() || '—';

  return {
    id: item.Id,
    idSolicitud: item.ID_SOLICITUD?.trim() || `#${item.Id}`,
    relacionSodiCen: item.RELACION_SODI_CEN?.trim() || '',
    central: central || '—',
    solicitante: item.SOLICITANTE?.Title?.trim() || '—',
    descripcion: item.DESCRIPCION?.trim() || '',
    estado,
    inicioProgramado: item.INICIO_PROGRAMADO,
    inicioEfectivo: item.INICIO_EFECTIVO,
    finProgramado: item.FIN_PROGRAMADO
  };
}

export async function ObtenerAdjuntosSolicitudConcentrador(
  context: WebPartContext,
  idElemento: number
): Promise<AdjuntoSolicitudIl[]> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaConcentrador);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items(${idElemento})/AttachmentFiles`;

  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  await ValidarRespuesta(response, 'ObtenerAdjuntosSolicitudConcentrador', url);

  const json = (await response.json()) as { value?: AdjuntoSharePoint[] };
  const adjuntos = json.value ?? [];
  const origenTenant = new URL(context.pageContext.web.absoluteUrl).origin;

  return adjuntos.map((adjunto) => {
    const relativa = adjunto.ServerRelativeUrl ?? '';
    const urlAbsoluta = relativa.startsWith('http')
      ? relativa
      : `${origenTenant}${relativa.startsWith('/') ? relativa : `/${relativa}`}`;
    const urlDescarga = urlAbsoluta.includes('?') ? `${urlAbsoluta}&download=1` : `${urlAbsoluta}?download=1`;
    return {
      nombreArchivo: adjunto.FileName,
      url: urlAbsoluta,
      urlDescarga
    };
  });
}

/** Referencia de campos de estado motor (RenderListData). */
export const CamposEstadoMotorConcentradorReferencia = {
  lookup: CampoLookupTareaActualConcentrador,
  estado: CampoEstadoTareaActualConcentrador
};
