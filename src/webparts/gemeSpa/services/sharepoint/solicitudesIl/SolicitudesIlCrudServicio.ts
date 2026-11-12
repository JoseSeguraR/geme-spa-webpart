import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { NombreListaSolicitudesIl } from '../../../components/vistas/cor-conecta/concentrador/solicitudes-il/constantesSolicitudesIl';
import type {
  AdjuntoSolicitudIl,
  DatosActualizarSolicitudIl,
  DatosNuevaSolicitudIl,
  DetalleSolicitudIl
} from '../../../models/SolicitudIl';
import { ResolverEstadoSolicitudIl } from '../../../components/vistas/cor-conecta/concentrador/solicitudes-il/constantesSolicitudesIl';
import { ExtraerMensajeErrorSharePoint } from '../ExtraerMensajeErrorSharePoint';
import type { RespuestaListaSharePoint } from '../RespuestaListaSharePoint';
import { SharePointRestError } from '../SharePointRestError';

type ElementoCreadoSharePoint = {
  Id: number;
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

function ConstruirTituloElemento(descripcion: string, idCen: string): string {
  const base = descripcion.trim() || idCen.trim() || 'Solicitud IL';
  return base.length > 255 ? base.substring(0, 255) : base;
}

export async function CrearSolicitudIlEnSharePoint(
  context: WebPartContext,
  datos: DatosNuevaSolicitudIl
): Promise<number> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSolicitudesIl);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items`;

  const cuerpo: Record<string, string | number> = {
    Title: ConstruirTituloElemento(datos.descripcion, datos.idCen),
    ID_CEN: datos.idCen,
    INSTALACIONId: datos.centralId,
    DESCRIPCION: datos.descripcion,
    FECHA_INICIO: datos.fechaInicioIso
  };

  if (datos.fechaFinIso) {
    cuerpo.FECHA_FIN = datos.fechaFinIso;
  }

  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: {
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/json;odata=nometadata;charset=utf-8'
    },
    body: JSON.stringify(cuerpo)
  });

  await ValidarRespuesta(response, 'CrearSolicitudIlEnSharePoint', url);
  const json = (await response.json()) as ElementoCreadoSharePoint;
  if (!json.Id) {
    throw new SharePointRestError(
      'CrearSolicitudIlEnSharePoint',
      url,
      response.status,
      response.statusText,
      'SharePoint no devolvió Id del elemento creado.'
    );
  }
  return json.Id;
}

export async function ExisteSolicitudIlConIdCen(
  context: WebPartContext,
  idCen: string,
  excluirIdElemento?: number
): Promise<boolean> {
  const idNormalizado = idCen.trim();
  if (!idNormalizado) {
    return false;
  }

  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSolicitudesIl);
  const idEscapado = idNormalizado.replace(/'/g, "''");
  const filtro = `ID_CEN eq '${idEscapado}'`;
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items` +
    `?$select=Id&$filter=${encodeURIComponent(filtro)}&$top=2`;

  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  await ValidarRespuesta(response, 'ExisteSolicitudIlConIdCen', url);

  const json = (await response.json()) as RespuestaListaSharePoint<{ Id: number }>;
  if (excluirIdElemento === undefined) {
    return json.value.length > 0;
  }

  return json.value.some((item) => item.Id !== excluirIdElemento);
}

type ItemSolicitudIlRest = {
  Id: number;
  ID_CEN?: string;
  DESCRIPCION?: string;
  DESCRIPCION_LARGA?: string;
  FECHA_INICIO?: string;
  FECHA_FIN?: string;
  TAREAACTUALId?: number;
  INSTALACIONId?: number;
  INSTALACION?: { INSTALACION?: string; Title?: string };
  TAREAACTUAL?: { TAREAORIGEN_ESTADO?: string };
};

export async function ObtenerDetalleSolicitudIlPorId(
  context: WebPartContext,
  idElemento: number
): Promise<DetalleSolicitudIl> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSolicitudesIl);
  const select = [
    'Id',
    'ID_CEN',
    'DESCRIPCION',
    'DESCRIPCION_LARGA',
    'FECHA_INICIO',
    'FECHA_FIN',
    'TAREAACTUALId',
    'INSTALACIONId',
    'INSTALACION/INSTALACION',
    'TAREAACTUAL/TAREAORIGEN_ESTADO'
  ].join(',');
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items(${idElemento})` +
    `?$select=${select}&$expand=INSTALACION,TAREAACTUAL`;

  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  await ValidarRespuesta(response, 'ObtenerDetalleSolicitudIlPorId', url);

  const item = (await response.json()) as ItemSolicitudIlRest;
  const estadoTexto = item.TAREAACTUAL?.TAREAORIGEN_ESTADO ?? '';
  const centralEtiqueta =
    (item.INSTALACION?.INSTALACION ?? item.INSTALACION?.Title ?? '').trim();

  return {
    id: item.Id,
    idCen: item.ID_CEN ?? '',
    centralId: item.INSTALACIONId ?? undefined,
    centralEtiqueta,
    descripcion: item.DESCRIPCION ?? '',
    descripcionLarga: item.DESCRIPCION_LARGA ?? '',
    fechaInicio: item.FECHA_INICIO ?? undefined,
    fechaFin: item.FECHA_FIN ?? undefined,
    estado: ResolverEstadoSolicitudIl(estadoTexto),
    idBitacoraActual:
      item.TAREAACTUALId && item.TAREAACTUALId > 0 ? item.TAREAACTUALId : undefined
  };
}

export async function ActualizarSolicitudIlEnSharePoint(
  context: WebPartContext,
  idElemento: number,
  datos: DatosActualizarSolicitudIl
): Promise<void> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSolicitudesIl);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items(${idElemento})`;

  const cuerpo: Record<string, string | number | null> = {
    Title: ConstruirTituloElemento(datos.descripcion, datos.idCen),
    ID_CEN: datos.idCen,
    INSTALACIONId: datos.centralId,
    DESCRIPCION: datos.descripcion,
    FECHA_INICIO: datos.fechaInicioIso
  };

  if (datos.descripcionLarga !== undefined) {
    cuerpo.DESCRIPCION_LARGA = datos.descripcionLarga;
  }

  if (datos.limpiarFechaFin) {
    cuerpo.FECHA_FIN = null;
  } else if (datos.fechaFinIso) {
    cuerpo.FECHA_FIN = datos.fechaFinIso;
  }

  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: {
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/json;odata=nometadata;charset=utf-8',
      'IF-MATCH': '*',
      'X-HTTP-Method': 'MERGE'
    },
    body: JSON.stringify(cuerpo)
  });

  await ValidarRespuesta(response, 'ActualizarSolicitudIlEnSharePoint', url);
}

export async function ActualizarTareaActualSolicitudIl(
  context: WebPartContext,
  idElemento: number,
  idBitacora: number
): Promise<void> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSolicitudesIl);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items(${idElemento})`;

  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: {
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/json;odata=nometadata;charset=utf-8',
      'IF-MATCH': '*',
      'X-HTTP-Method': 'MERGE'
    },
    body: JSON.stringify({
      TAREAACTUALId: idBitacora
    })
  });

  await ValidarRespuesta(response, 'ActualizarTareaActualSolicitudIl', url);
}

export async function AgregarAdjuntoSolicitudIl(
  context: WebPartContext,
  idElemento: number,
  archivo: File
): Promise<void> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSolicitudesIl);
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

  await ValidarRespuesta(response, 'AgregarAdjuntoSolicitudIl', url);
}

export async function EliminarAdjuntoSolicitudIl(
  context: WebPartContext,
  idElemento: number,
  nombreArchivo: string
): Promise<void> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSolicitudesIl);
  const nombreEscapado = nombreArchivo.replace(/'/g, "''");
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items(${idElemento})` +
    `/AttachmentFiles('${nombreEscapado}')`;

  const response = await context.spHttpClient.fetch(
    url,
    SPHttpClient.configurations.v1,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json;odata=nometadata',
        'IF-MATCH': '*'
      }
    }
  );

  await ValidarRespuesta(response, 'EliminarAdjuntoSolicitudIl', url);
}

export async function ObtenerAdjuntosSolicitudIl(
  context: WebPartContext,
  idElemento: number
): Promise<AdjuntoSolicitudIl[]> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSolicitudesIl);
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items(${idElemento})/AttachmentFiles`;

  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  await ValidarRespuesta(response, 'ObtenerAdjuntosSolicitudIl', url);

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
