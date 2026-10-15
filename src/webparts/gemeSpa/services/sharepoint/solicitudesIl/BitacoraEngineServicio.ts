import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import {
  ClasificacionTareaBitacoraFlujo,
  EsTareaPendienteBitacoraNo,
  NombreListaBitacoraEngine,
  TipoRegistroBitacoraSolicitudIl
} from '../../../components/vistas/cor-conecta/concentrador/administrador/constantesSolicitudesIl';
import { ExtraerMensajeErrorSharePoint } from '../ExtraerMensajeErrorSharePoint';
import { SharePointRestError } from '../SharePointRestError';

type ElementoCreadoSharePoint = {
  Id: number;
};

async function ValidarRespuesta(response: SPHttpClientResponse, operacion: string, url: string): Promise<void> {
  if (response.ok) {
    return;
  }
  const mensaje = await ExtraerMensajeErrorSharePoint(response);
  throw new SharePointRestError(operacion, url, response.status, response.statusText, mensaje);
}

export type ParametrosRegistroBitacoraEngine = {
  idRegistroSolicitud: number;
  tareaOrigenId: number;
  tareaOrigenEstado: string;
  fechaIngresoIso: string;
  fechaSalidaIso?: string;
  accionAvanceId?: number;
  usuarioAvanceId?: number;
  tareaDestinoId?: number;
};

function ConstruirCuerpoBitacora(params: ParametrosRegistroBitacoraEngine): Record<string, string | number> {
  const cuerpo: Record<string, string | number> = {
    Title: `${TipoRegistroBitacoraSolicitudIl} ${params.idRegistroSolicitud}`,
    ID_REGISTRO: params.idRegistroSolicitud,
    TIPO_REGISTRO: TipoRegistroBitacoraSolicitudIl,
    TAREAORIGENId: params.tareaOrigenId,
    TAREAORIGEN_ESTADO: params.tareaOrigenEstado,
    TAREAORIGEN_FECHAINGRESO: params.fechaIngresoIso,
    CLASIFICACION_TAREA: ClasificacionTareaBitacoraFlujo,
    ES_TAREA_PENDIENTE: EsTareaPendienteBitacoraNo
  };

  if (params.fechaSalidaIso) {
    cuerpo.TAREAORIGEN_FECHASALIDA = params.fechaSalidaIso;
  }
  if (params.accionAvanceId !== undefined) {
    cuerpo.ACCIONAVANCEId = params.accionAvanceId;
  }
  if (params.usuarioAvanceId !== undefined) {
    cuerpo.USUARIOAVANCEId = params.usuarioAvanceId;
  }
  if (params.tareaDestinoId !== undefined) {
    cuerpo.TAREADESTINOId = params.tareaDestinoId;
  }

  return cuerpo;
}

export async function CrearRegistroBitacoraEngine(
  context: WebPartContext,
  params: ParametrosRegistroBitacoraEngine
): Promise<number> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaBitacoraEngine);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items`;
  const cuerpo = ConstruirCuerpoBitacora(params);

  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: {
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/json;odata=nometadata;charset=utf-8'
    },
    body: JSON.stringify(cuerpo)
  });

  await ValidarRespuesta(response, 'CrearRegistroBitacoraEngine', url);
  const json = (await response.json()) as ElementoCreadoSharePoint;
  if (!json.Id) {
    throw new SharePointRestError(
      'CrearRegistroBitacoraEngine',
      url,
      response.status,
      response.statusText,
      'SharePoint no devolvió Id del registro de bitácora.'
    );
  }
  return json.Id;
}

export type ParametrosCierreRegistroBitacoraEngine = {
  idRegistroBitacora: number;
  fechaSalidaIso: string;
  accionAvanceId: number;
  usuarioAvanceId: number;
  tareaDestinoId: number;
};

export async function CerrarRegistroBitacoraEngine(
  context: WebPartContext,
  params: ParametrosCierreRegistroBitacoraEngine
): Promise<void> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaBitacoraEngine);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items(${params.idRegistroBitacora})`;

  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: {
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/json;odata=nometadata;charset=utf-8',
      'IF-MATCH': '*',
      'X-HTTP-Method': 'MERGE'
    },
    body: JSON.stringify({
      TAREAORIGEN_FECHASALIDA: params.fechaSalidaIso,
      ACCIONAVANCEId: params.accionAvanceId,
      USUARIOAVANCEId: params.usuarioAvanceId,
      TAREADESTINOId: params.tareaDestinoId
    })
  });

  await ValidarRespuesta(response, 'CerrarRegistroBitacoraEngine', url);
}
