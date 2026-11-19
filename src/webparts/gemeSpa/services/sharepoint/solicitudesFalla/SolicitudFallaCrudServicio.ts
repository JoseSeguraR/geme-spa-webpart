import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import {
  CampoDescripcionSolicitudFalla,
  CampoEstadoSolicitudFalla,
  CampoFechaPerturbacionSolicitudFalla,
  CampoFechaRetornoSolicitudFalla,
  CampoIdBitacoraSolicitudFalla,
  CampoIdCenSolicitudFalla,
  CampoLookupEquiposSolicitudFalla,
  CampoLookupEquiposTexto,
  CampoLookupInstalacionGmSolicitudFalla,
  CampoLookupInstalacionGmTexto,
  CampoMedidaSolicitudFalla,
  CampoPotenciaSolicitudFalla,
  CampoTituloSolicitudFalla,
  IdLookupEquiposSolicitudFalla,
  IdLookupInstalacionGmSolicitudFalla
} from './CamposListaSolicitudFalla';
import {
  EstadoSolicitudFallaVigente,
  NombreListaSolicitudFalla
} from '../../../components/vistas/cor-conecta/concentrador/solicitudes-falla/constantesSolicitudFalla';
import type {
  AdjuntoSolicitudFalla,
  DatosActualizarSolicitudFalla,
  DatosFinalizarSolicitudFalla,
  DatosNuevaSolicitudFalla,
  DetalleSolicitudFalla
} from '../../../models/SolicitudFalla';
import { ExtraerMensajeErrorSharePoint } from '../ExtraerMensajeErrorSharePoint';
import type { RespuestaListaSharePoint } from '../RespuestaListaSharePoint';
import { SharePointRestError } from '../SharePointRestError';
import { CompletarIntegracionSiodDesdeBitacora } from './IntegracionSiodDesdeBitacoraSolicitudFalla';

type ElementoCreadoSharePoint = {
  Id: number;
};

type AdjuntoSharePoint = {
  FileName: string;
  ServerRelativeUrl: string;
};

type ItemFallaRest = {
  Id: number;
  Created?: string;
  Author?: { Title?: string };
  ID_CEN?: string;
  DESCRIPCION?: string;
  FECHAPERTURBACION?: string;
  FECHAEFECTIVARETORNO?: string;
  POTENCIA?: number;
  MEDIDA?: string;
  ESTADO?: string;
  INSTALACION_GMId?: number;
  INSTALACION_GM?: { INSTALACION?: string };
  EQUIPOSId?: number[];
  EQUIPOS?: { EQUIPO?: string; Title?: string }[];
};

async function ValidarRespuesta(response: SPHttpClientResponse, operacion: string, url: string): Promise<void> {
  if (response.ok) {
    return;
  }
  const mensaje = await ExtraerMensajeErrorSharePoint(response);
  throw new SharePointRestError(operacion, url, response.status, response.statusText, mensaje);
}

function ConstruirTituloElemento(idCen: string, descripcion: string): string {
  const base = idCen.trim() || descripcion.trim() || 'Solicitud de falla';
  return base.length > 255 ? base.substring(0, 255) : base;
}

function ConstruirCuerpoCamposFalla(
  datos: DatosNuevaSolicitudFalla | DatosActualizarSolicitudFalla
): Record<string, string | number | number[] | null> {
  const idEquipos = IdLookupEquiposSolicitudFalla();
  const cuerpo: Record<string, string | number | number[] | null> = {
    [CampoTituloSolicitudFalla]: ConstruirTituloElemento(datos.idCen, datos.descripcion),
    [CampoIdCenSolicitudFalla]: datos.idCen.trim(),
    [IdLookupInstalacionGmSolicitudFalla()]: datos.centralId,
    [idEquipos]: datos.equiposIds,
    [`${idEquipos}@odata.type`]: 'Collection(Edm.Int32)',
    [CampoFechaPerturbacionSolicitudFalla]: datos.fechaPerturbacionIso,
    [CampoPotenciaSolicitudFalla]: datos.potencia,
    [CampoMedidaSolicitudFalla]: datos.medida,
    [CampoDescripcionSolicitudFalla]: datos.descripcion
  };

  if (datos.fechaRetornoIso) {
    cuerpo[CampoFechaRetornoSolicitudFalla] = datos.fechaRetornoIso;
  } else {
    cuerpo[CampoFechaRetornoSolicitudFalla] = null;
  }

  return cuerpo;
}

export async function CrearSolicitudFallaEnSharePoint(
  context: WebPartContext,
  datos: DatosNuevaSolicitudFalla
): Promise<number> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSolicitudFalla);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items`;
  const cuerpo = {
    ...ConstruirCuerpoCamposFalla(datos),
    [CampoEstadoSolicitudFalla]: EstadoSolicitudFallaVigente
  };

  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: {
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/json;odata=nometadata;charset=utf-8'
    },
    body: JSON.stringify(cuerpo)
  });

  await ValidarRespuesta(response, 'CrearSolicitudFallaEnSharePoint', url);
  const json = (await response.json()) as ElementoCreadoSharePoint;
  if (!json.Id) {
    throw new SharePointRestError(
      'CrearSolicitudFallaEnSharePoint',
      url,
      response.status,
      response.statusText,
      'SharePoint no devolvió Id del elemento creado.'
    );
  }
  return json.Id;
}

export async function ExisteSolicitudFallaConIdCen(
  context: WebPartContext,
  idCen: string,
  excluirIdElemento?: number
): Promise<boolean> {
  const idNormalizado = idCen.trim();
  if (!idNormalizado) {
    return false;
  }

  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSolicitudFalla);
  const idEscapado = idNormalizado.replace(/'/g, "''");
  const filtro = `${CampoIdCenSolicitudFalla} eq '${idEscapado}'`;
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items` +
    `?$select=Id&$filter=${encodeURIComponent(filtro)}&$top=2`;

  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  await ValidarRespuesta(response, 'ExisteSolicitudFallaConIdCen', url);

  const json = (await response.json()) as RespuestaListaSharePoint<{ Id: number }>;
  if (excluirIdElemento === undefined) {
    return json.value.length > 0;
  }
  return json.value.some((item) => item.Id !== excluirIdElemento);
}

export async function ObtenerDetalleSolicitudFallaPorId(
  context: WebPartContext,
  idElemento: number
): Promise<DetalleSolicitudFalla> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSolicitudFalla);
  const select = [
    'Id',
    'Created',
    'Author/Title',
    CampoIdCenSolicitudFalla,
    CampoDescripcionSolicitudFalla,
    CampoFechaPerturbacionSolicitudFalla,
    CampoFechaRetornoSolicitudFalla,
    CampoPotenciaSolicitudFalla,
    CampoMedidaSolicitudFalla,
    CampoEstadoSolicitudFalla,
    IdLookupInstalacionGmSolicitudFalla(),
    IdLookupEquiposSolicitudFalla(),
    `${CampoLookupInstalacionGmSolicitudFalla}/${CampoLookupInstalacionGmTexto}`,
    `${CampoLookupEquiposSolicitudFalla}/${CampoLookupEquiposTexto}`
  ].join(',');
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items(${idElemento})` +
    `?$select=${select}&$expand=Author,${CampoLookupInstalacionGmSolicitudFalla},${CampoLookupEquiposSolicitudFalla}`;

  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  if (response.status === 404) {
    throw new SharePointRestError('ObtenerDetalleSolicitudFallaPorId', url, 404, 'Not Found');
  }
  await ValidarRespuesta(response, 'ObtenerDetalleSolicitudFallaPorId', url);

  const item = (await response.json()) as ItemFallaRest;
  const equiposIds = item.EQUIPOSId ?? [];
  const equiposEtiqueta = (item.EQUIPOS ?? [])
    .map((eq) => (eq.EQUIPO ?? eq.Title ?? '').trim())
    .filter(Boolean)
    .join(', ');
  const centralEtiqueta = (item.INSTALACION_GM?.INSTALACION ?? '').trim();

  const detalleBase: DetalleSolicitudFalla = {
    id: item.Id,
    idCen: (item.ID_CEN ?? '').trim(),
    centralId: item.INSTALACION_GMId,
    centralEtiqueta,
    equiposEtiqueta,
    equiposIds,
    fechaPerturbacion: item.FECHAPERTURBACION,
    fechaRetorno: item.FECHAEFECTIVARETORNO,
    descripcion: item.DESCRIPCION ?? '',
    potencia: item.POTENCIA,
    medida: item.MEDIDA,
    estado: item.ESTADO ?? EstadoSolicitudFallaVigente,
    integradoSiod: false,
    fechaCreacion: item.Created,
    usuarioCreador: item.Author?.Title?.trim() || undefined
  };

  const integracion = await CompletarIntegracionSiodDesdeBitacora(context, idElemento);
  return {
    ...detalleBase,
    integradoSiod: integracion.integradoSiod,
    fechaIntegracionSiod: integracion.fechaIntegracionSiod,
    resultadoSiod: integracion.resultadoSiod
  };
}

export async function ActualizarSolicitudFallaEnSharePoint(
  context: WebPartContext,
  idElemento: number,
  datos: DatosActualizarSolicitudFalla
): Promise<void> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSolicitudFalla);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items(${idElemento})`;
  const cuerpo = ConstruirCuerpoCamposFalla(datos);

  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: {
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/json;odata=nometadata;charset=utf-8',
      'IF-MATCH': '*',
      'X-HTTP-Method': 'MERGE'
    },
    body: JSON.stringify(cuerpo)
  });

  await ValidarRespuesta(response, 'ActualizarSolicitudFallaEnSharePoint', url);
}

export async function FinalizarSolicitudFallaEnSharePoint(
  context: WebPartContext,
  idElemento: number,
  _datos: DatosFinalizarSolicitudFalla
): Promise<void> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSolicitudFalla);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items(${idElemento})`;

  const cuerpo: Record<string, string> = {
    [CampoEstadoSolicitudFalla]: 'Finalizada'
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

  await ValidarRespuesta(response, 'FinalizarSolicitudFallaEnSharePoint', url);
}

export async function ActualizarIdBitacoraFalla(
  context: WebPartContext,
  idElemento: number,
  idBitacora: number | string
): Promise<void> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSolicitudFalla);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items(${idElemento})`;

  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: {
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/json;odata=nometadata;charset=utf-8',
      'IF-MATCH': '*',
      'X-HTTP-Method': 'MERGE'
    },
    body: JSON.stringify({
      [CampoIdBitacoraSolicitudFalla]: String(idBitacora)
    })
  });

  await ValidarRespuesta(response, 'ActualizarIdBitacoraFalla', url);
}

export async function AgregarAdjuntoSolicitudFalla(
  context: WebPartContext,
  idElemento: number,
  archivo: File
): Promise<void> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSolicitudFalla);
  const nombreArchivo = encodeURIComponent(archivo.name.replace(/'/g, "''"));
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items(${idElemento})` +
    `/AttachmentFiles/add(FileName='${nombreArchivo}')`;

  const buffer = await archivo.arrayBuffer();
  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: {
      Accept: 'application/json;odata=nometadata'
    },
    body: buffer
  });

  await ValidarRespuesta(response, 'AgregarAdjuntoSolicitudFalla', url);
}

export async function EliminarAdjuntoSolicitudFalla(
  context: WebPartContext,
  idElemento: number,
  nombreArchivo: string
): Promise<void> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSolicitudFalla);
  const nombreEscapado = nombreArchivo.replace(/'/g, "''");
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items(${idElemento})` +
    `/AttachmentFiles('${nombreEscapado}')`;

  const response = await context.spHttpClient.fetch(url, SPHttpClient.configurations.v1, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json;odata=nometadata',
      'IF-MATCH': '*'
    }
  });

  await ValidarRespuesta(response, 'EliminarAdjuntoSolicitudFalla', url);
}

export async function ObtenerAdjuntosSolicitudFalla(
  context: WebPartContext,
  idElemento: number
): Promise<AdjuntoSolicitudFalla[]> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSolicitudFalla);
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items(${idElemento})/AttachmentFiles`;

  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  await ValidarRespuesta(response, 'ObtenerAdjuntosSolicitudFalla', url);

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