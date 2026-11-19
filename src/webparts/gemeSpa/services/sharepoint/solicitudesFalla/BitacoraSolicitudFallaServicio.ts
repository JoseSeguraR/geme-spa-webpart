import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import {
  ActorTareaOrigenBitacoraSolicitudFalla,
  CampoBitacoraResponsableMultipleId,
  ClasificacionTareaBitacoraCierre,
  ClasificacionTareaBitacoraFlujo,
  ConstruirTareaIdentificadorSolicitudFalla,
  EsTareaPendienteBitacoraNo,
  EstadoSolicitudFallaFinalizada,
  EstadoSolicitudFallaVigente,
  NombreListaBitacoraEngine,
  TextoResponsableComentariosBitacoraEdicionSolicitudFalla,
  TipoRegistroBitacoraSolicitudFalla
} from '../../../components/vistas/cor-conecta/concentrador/solicitudes-falla/constantesSolicitudFalla';
import type { FilaBitacoraEngine } from '../../../models/concentradorComun/FilaBitacoraEngine';
import { ExtraerMensajeErrorSharePoint } from '../ExtraerMensajeErrorSharePoint';
import { ObtenerFilasBitacoraEngine } from '../concentradorComun/BitacoraEngineListaServicio';
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

export type ParametrosEntradaBitacoraFalla = {
  idSolicitudFalla: number;
  accion: string;
  comentario?: string;
  estadoInicial?: string;
  estadoFinal?: string;
};

function ObtenerIdUsuarioActual(context: WebPartContext): number | undefined {
  const id = context.pageContext.legacyPageContext.userId;
  if (typeof id === 'number' && id > 0) {
    return id;
  }
  return undefined;
}

function ParsearIdBitacoraDesdeTexto(valor: string | undefined): number | undefined {
  if (!valor?.trim()) {
    return undefined;
  }
  const id = Number(valor.trim());
  if (!Number.isFinite(id) || id <= 0) {
    return undefined;
  }
  return id;
}

async function ResolverIdBitacoraAbierta(context: WebPartContext, idSolicitudFalla: number): Promise<number> {
  const filas = await ObtenerFilasBitacoraEngine(context, idSolicitudFalla, TipoRegistroBitacoraSolicitudFalla);
  if (filas.length === 0) {
    throw new Error('No hay registro de bitácora abierto para cerrar.');
  }
  const sinCierre = filas.filter((fila) => !fila.fechaCierre.trim());
  const candidatas = (sinCierre.length > 0 ? sinCierre : filas).sort((a, b) => b.id - a.id);
  const id = candidatas[0]?.id;
  if (!id) {
    throw new Error('No se pudo determinar el registro de bitácora a cerrar.');
  }
  return id;
}

export async function CerrarBitacoraActualSolicitudFalla(
  context: WebPartContext,
  idRegistroBitacora: number,
  responsableComentarios: string
): Promise<void> {
  const idUsuario = ObtenerIdUsuarioActual(context);
  if (idUsuario === undefined) {
    throw new Error('No se pudo determinar el usuario actual para cerrar la bitácora.');
  }

  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaBitacoraEngine);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items(${idRegistroBitacora})`;
  const ahoraIso = new Date().toISOString();

  const cuerpo: Record<string, string | number> = {
    TAREAORIGEN_FECHASALIDA: ahoraIso,
    USUARIOAVANCEId: idUsuario,
    RESPONSABLE_COMENTARIOS: responsableComentarios
  };

  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: {
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/json;odata=nometadata;charset=utf-8',
      'IF-MATCH': '*',
      'X-HTTP-Method': 'MERGE'
    },
    body: JSON.stringify(cuerpo)
  });

  await ValidarRespuesta(response, 'CerrarBitacoraActualSolicitudFalla', url);
}

/** Registro de cierre al finalizar la solicitud (gestión). */
export async function CrearEntradaBitacoraCierreSolicitudFalla(
  context: WebPartContext,
  idSolicitudFalla: number
): Promise<number> {
  const idUsuario = ObtenerIdUsuarioActual(context);
  if (idUsuario === undefined) {
    throw new Error('No se pudo determinar el usuario actual para la bitácora.');
  }

  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaBitacoraEngine);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items`;
  const ahoraIso = new Date().toISOString();

  const cuerpo: Record<string, string | number | number[]> = {
    Title: `${TipoRegistroBitacoraSolicitudFalla} ${idSolicitudFalla}`,
    ID_REGISTRO: idSolicitudFalla,
    TIPO_REGISTRO: TipoRegistroBitacoraSolicitudFalla,
    TAREAORIGEN_ESTADO: EstadoSolicitudFallaFinalizada,
    TAREAORIGEN_ACTOR: ActorTareaOrigenBitacoraSolicitudFalla,
    TAREAORIGEN_FECHAINGRESO: ahoraIso,
    CLASIFICACION_TAREA: ClasificacionTareaBitacoraCierre,
    ES_TAREA_PENDIENTE: EsTareaPendienteBitacoraNo,
    TAREA_IDENTIFICADOR: ConstruirTareaIdentificadorSolicitudFalla(idSolicitudFalla),
    [CampoBitacoraResponsableMultipleId]: [idUsuario],
    [`${CampoBitacoraResponsableMultipleId}@odata.type`]: 'Collection(Edm.Int32)'
  };

  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: {
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/json;odata=nometadata;charset=utf-8'
    },
    body: JSON.stringify(cuerpo)
  });

  await ValidarRespuesta(response, 'CrearEntradaBitacoraCierreSolicitudFalla', url);
  const json = (await response.json()) as ElementoCreadoSharePoint;
  if (!json.Id) {
    throw new SharePointRestError(
      'CrearEntradaBitacoraCierreSolicitudFalla',
      url,
      response.status,
      response.statusText,
      'SharePoint no devolvió Id del registro de bitácora.'
    );
  }
  return json.Id;
}

export async function ResolverIdBitacoraActualSolicitudFalla(
  context: WebPartContext,
  idSolicitudFalla: number,
  idBitacoraReferencia?: string
): Promise<number> {
  const idReferencia = ParsearIdBitacoraDesdeTexto(idBitacoraReferencia);
  if (idReferencia !== undefined) {
    return idReferencia;
  }
  return ResolverIdBitacoraAbierta(context, idSolicitudFalla);
}

/** Primer registro de bitácora al crear una solicitud de falla (formulario Nueva). */
export async function CrearEntradaBitacoraAltaSolicitudFalla(
  context: WebPartContext,
  idSolicitudFalla: number
): Promise<number> {
  const idUsuario = ObtenerIdUsuarioActual(context);
  if (idUsuario === undefined) {
    throw new Error('No se pudo determinar el usuario actual para la bitácora.');
  }

  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaBitacoraEngine);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items`;
  const ahoraIso = new Date().toISOString();

  const cuerpo: Record<string, string | number | number[]> = {
    Title: `${TipoRegistroBitacoraSolicitudFalla} ${idSolicitudFalla}`,
    ID_REGISTRO: idSolicitudFalla,
    TIPO_REGISTRO: TipoRegistroBitacoraSolicitudFalla,
    TAREAORIGEN_ESTADO: EstadoSolicitudFallaVigente,
    TAREAORIGEN_ACTOR: ActorTareaOrigenBitacoraSolicitudFalla,
    TAREAORIGEN_FECHAINGRESO: ahoraIso,
    CLASIFICACION_TAREA: ClasificacionTareaBitacoraFlujo,
    ES_TAREA_PENDIENTE: EsTareaPendienteBitacoraNo,
    TAREA_IDENTIFICADOR: ConstruirTareaIdentificadorSolicitudFalla(idSolicitudFalla),
    [CampoBitacoraResponsableMultipleId]: [idUsuario],
    [`${CampoBitacoraResponsableMultipleId}@odata.type`]: 'Collection(Edm.Int32)'
  };

  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: {
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/json;odata=nometadata;charset=utf-8'
    },
    body: JSON.stringify(cuerpo)
  });

  await ValidarRespuesta(response, 'CrearEntradaBitacoraAltaSolicitudFalla', url);
  const json = (await response.json()) as ElementoCreadoSharePoint;
  if (!json.Id) {
    throw new SharePointRestError(
      'CrearEntradaBitacoraAltaSolicitudFalla',
      url,
      response.status,
      response.statusText,
      'SharePoint no devolvió Id del registro de bitácora.'
    );
  }
  return json.Id;
}

/** Registro de auditoría al guardar el formulario Editar (estado de la solicitud sin cambio). */
export async function CrearEntradaBitacoraEdicionSolicitudFalla(
  context: WebPartContext,
  idSolicitudFalla: number,
  estadoSolicitud: string
): Promise<number> {
  const idUsuario = ObtenerIdUsuarioActual(context);
  if (idUsuario === undefined) {
    throw new Error('No se pudo determinar el usuario actual para la bitácora.');
  }

  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaBitacoraEngine);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items`;
  const ahoraIso = new Date().toISOString();
  const estadoBitacora = estadoSolicitud.trim() || EstadoSolicitudFallaVigente;

  const cuerpo: Record<string, string | number | number[]> = {
    Title: `${TipoRegistroBitacoraSolicitudFalla} ${idSolicitudFalla}`,
    ID_REGISTRO: idSolicitudFalla,
    TIPO_REGISTRO: TipoRegistroBitacoraSolicitudFalla,
    TAREAORIGEN_ESTADO: estadoBitacora,
    TAREAORIGEN_ACTOR: ActorTareaOrigenBitacoraSolicitudFalla,
    TAREAORIGEN_FECHAINGRESO: ahoraIso,
    CLASIFICACION_TAREA: ClasificacionTareaBitacoraFlujo,
    ES_TAREA_PENDIENTE: EsTareaPendienteBitacoraNo,
    TAREA_IDENTIFICADOR: ConstruirTareaIdentificadorSolicitudFalla(idSolicitudFalla),
    RESPONSABLE_COMENTARIOS: TextoResponsableComentariosBitacoraEdicionSolicitudFalla,
    [CampoBitacoraResponsableMultipleId]: [idUsuario],
    [`${CampoBitacoraResponsableMultipleId}@odata.type`]: 'Collection(Edm.Int32)'
  };

  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: {
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/json;odata=nometadata;charset=utf-8'
    },
    body: JSON.stringify(cuerpo)
  });

  await ValidarRespuesta(response, 'CrearEntradaBitacoraEdicionSolicitudFalla', url);
  const json = (await response.json()) as ElementoCreadoSharePoint;
  if (!json.Id) {
    throw new SharePointRestError(
      'CrearEntradaBitacoraEdicionSolicitudFalla',
      url,
      response.status,
      response.statusText,
      'SharePoint no devolvió Id del registro de bitácora.'
    );
  }
  return json.Id;
}

export async function CrearEntradaBitacoraSolicitudFalla(
  context: WebPartContext,
  params: ParametrosEntradaBitacoraFalla
): Promise<number> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaBitacoraEngine);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items`;
  const ahoraIso = new Date().toISOString();
  const idUsuario = ObtenerIdUsuarioActual(context);

  const cuerpo: Record<string, string | number> = {
    Title: params.comentario ? `${params.accion}: ${params.comentario}` : params.accion,
    ID_REGISTRO: params.idSolicitudFalla,
    TIPO_REGISTRO: TipoRegistroBitacoraSolicitudFalla,
    TAREAORIGEN_ESTADO: params.estadoInicial ?? params.accion,
    TAREAORIGEN_FECHAINGRESO: ahoraIso,
    CLASIFICACION_TAREA: ClasificacionTareaBitacoraFlujo,
    ES_TAREA_PENDIENTE: EsTareaPendienteBitacoraNo
  };

  if (params.estadoFinal) {
    cuerpo.TAREAORIGEN_FECHASALIDA = ahoraIso;
  }

  if (idUsuario !== undefined) {
    cuerpo.USUARIOAVANCEId = idUsuario;
  }

  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: {
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/json;odata=nometadata;charset=utf-8'
    },
    body: JSON.stringify(cuerpo)
  });

  await ValidarRespuesta(response, 'CrearEntradaBitacoraSolicitudFalla', url);
  const json = (await response.json()) as ElementoCreadoSharePoint;
  if (!json.Id) {
    throw new SharePointRestError(
      'CrearEntradaBitacoraSolicitudFalla',
      url,
      response.status,
      response.statusText,
      'SharePoint no devolvió Id del registro de bitácora.'
    );
  }
  return json.Id;
}

export async function ObtenerFilasBitacoraSolicitudFalla(
  context: WebPartContext,
  idSolicitudFalla: number
): Promise<FilaBitacoraEngine[]> {
  return ObtenerFilasBitacoraEngine(context, idSolicitudFalla, TipoRegistroBitacoraSolicitudFalla);
}