import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { FormatearFechaHoraVisible } from '../../../utils/FechaHoraCorConecta';
import type {
  DatosFormularioLimitacionSubestacion,
  LimitacionSubestacionOperador
} from '../../../models/operadorRenovable/LimitacionSubestacionOperador';
import { NombreListaLimitacionesRed } from '../../../components/vistas/cor-conecta/concentrador/operador-renovable/constantesOperadorRenovable';
import { ExtraerMensajeErrorSharePoint } from '../ExtraerMensajeErrorSharePoint';
import type { RespuestaListaSharePoint } from '../RespuestaListaSharePoint';
import { SharePointRestError } from '../SharePointRestError';
import {
  AccionBitacoraCrearLimitacion,
  AccionBitacoraEnvioMeteologicaSimulado,
  AccionBitacoraFinalizarLimitacion,
  AccionBitacoraModificarLimitacion,
  CampoEstadoLimitacionRed,
  CampoFechaFinLimitacion,
  CampoFechaInicioLimitacion,
  CampoLookupLimitacionSolicitudConcentrador,
  CampoLookupLimitacionSolicitudFalla,
  CampoPotenciaLimitadaMw,
  EstadoLimitacionRedActiva,
  EstadoLimitacionRedFinalizada,
  MotivoIndisponibilidadFalla,
  MotivoIndisponibilidadTrabajo
} from './CamposOperadorRenovable';
import { RegistrarBitacoraLimitacionSubestacion } from './BitacoraSubestacionServicio';
import { ObtenerInstalacionesOperadorRenovable } from './InstalacionesOperadorRenovableServicio';
import { NotificarCambioDisponibilidadOperadorRenovable } from './OperadorRenovableRefrescoGlobal';

type ElementoLimitacionSharePoint = {
  Id?: number;
  INSTALACIONId?: number;
  POTENCIA_LIMITADA_MW?: number;
  FECHA_INICIO?: string;
  FECHA_FIN?: string;
  MOTIVO?: string;
  DESCRIPCION?: string;
  ESTADO?: string;
  ID_SOLICITUDId?: number;
  FALLAId?: number;
  ID_SOLICITUD?: { ID_SOLICITUD?: string };
  FALLA?: { ID_CEN?: string };
};

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

export function EsLimitacionSubestacionActiva(estado: string | undefined): boolean {
  const valor = (estado ?? '').trim();
  return valor !== EstadoLimitacionRedFinalizada && valor !== 'Finalizado';
}

function NormalizarLimitacion(
  elemento: ElementoLimitacionSharePoint,
  mapaCentrales: ReadonlyMap<number, string>
): LimitacionSubestacionOperador | undefined {
  if (typeof elemento.Id !== 'number' || typeof elemento.INSTALACIONId !== 'number') {
    return undefined;
  }
  const central = mapaCentrales.get(elemento.INSTALACIONId) ?? `#${elemento.INSTALACIONId}`;
  const inicio = FormatearFechaHoraVisible(elemento.FECHA_INICIO) || '—';
  const finRaw = elemento.FECHA_FIN?.trim();
  const fin = finRaw ? FormatearFechaHoraVisible(finRaw) || '—' : '—';

  return {
    id: elemento.Id,
    instalacionId: elemento.INSTALACIONId,
    central,
    potenciaLimitadaMw: typeof elemento.POTENCIA_LIMITADA_MW === 'number' ? elemento.POTENCIA_LIMITADA_MW : 0,
    fechaInicio: inicio,
    fechaFin: fin,
    fechaInicioIso: elemento.FECHA_INICIO,
    fechaFinIso: finRaw || undefined,
    motivo: (elemento.MOTIVO ?? '').trim(),
    descripcion: (elemento.DESCRIPCION ?? '').trim(),
    estado: (elemento.ESTADO ?? EstadoLimitacionRedActiva).trim(),
    solicitudConcentradorId: elemento.ID_SOLICITUDId,
    solicitudConcentradorEtiqueta: (elemento.ID_SOLICITUD?.ID_SOLICITUD ?? '').trim() || undefined,
    solicitudFallaId: elemento.FALLAId,
    solicitudFallaEtiqueta: (elemento.FALLA?.ID_CEN ?? '').trim() || undefined
  };
}

export async function ObtenerLimitacionesRedOperadorRenovable(
  context: WebPartContext
): Promise<LimitacionSubestacionOperador[]> {
  const instalaciones = await ObtenerInstalacionesOperadorRenovable(context);
  const idsPermitidos = new Set(instalaciones.map((c) => c.id));
  const mapaCentrales = new Map(instalaciones.map((c) => [c.id, c.central] as const));
  if (idsPermitidos.size === 0) {
    return [];
  }

  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaLimitacionesRed);
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items` +
    `?$select=Id,INSTALACIONId,${CampoPotenciaLimitadaMw},${CampoFechaInicioLimitacion},${CampoFechaFinLimitacion},MOTIVO,DESCRIPCION,${CampoEstadoLimitacionRed},` +
    `${CampoLookupLimitacionSolicitudConcentrador}Id,${CampoLookupLimitacionSolicitudFalla}Id,` +
    `${CampoLookupLimitacionSolicitudConcentrador}/ID_SOLICITUD,${CampoLookupLimitacionSolicitudFalla}/ID_CEN` +
    `&$expand=${CampoLookupLimitacionSolicitudConcentrador},${CampoLookupLimitacionSolicitudFalla}` +
    `&$orderby=${encodeURIComponent(`${CampoFechaInicioLimitacion} desc`)}&$top=5000`;

  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  await ValidarRespuesta(response, 'ObtenerLimitacionesRedOperadorRenovable', url);

  const json = (await response.json()) as RespuestaListaSharePoint<ElementoLimitacionSharePoint>;
  return json.value
    .filter((item) => typeof item.INSTALACIONId === 'number' && idsPermitidos.has(item.INSTALACIONId))
    .map((item) => NormalizarLimitacion(item, mapaCentrales))
    .filter((fila): fila is LimitacionSubestacionOperador => fila !== undefined);
}

function ConstruirTituloLimitacion(central: string, potenciaMw: number): string {
  return `PGL ${central} ${potenciaMw} MW`.slice(0, 255);
}

function DescribirCambiosLimitacion(
  anterior: LimitacionSubestacionOperador,
  datos: DatosFormularioLimitacionSubestacion,
  centralNueva: string
): string {
  const campos: [string, string, string][] = [
    ['Central', anterior.central, centralNueva],
    [
      'Potencia',
      `${anterior.potenciaLimitadaMw} MW`,
      `${datos.potenciaLimitadaMw} MW`
    ],
    ['Motivo', anterior.motivo, datos.motivo],
    ['Descripción', anterior.descripcion, datos.descripcion ?? '']
  ];
  return campos
    .filter(([, antes, despues]) => antes !== despues)
    .map(([etiqueta, antes, despues]) => `${etiqueta}: ${antes || '—'} → ${despues || '—'}`)
    .join(' · ');
}

async function CrearItemLimitacion(
  context: WebPartContext,
  titulo: string,
  cuerpo: Record<string, string | number | null>
): Promise<number> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaLimitacionesRed);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items`;

  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: {
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/json;odata=nometadata;charset=utf-8'
    },
    body: JSON.stringify({ Title: titulo, ...cuerpo })
  });

  await ValidarRespuesta(response, 'CrearItemLimitacion', url);
  const json = (await response.json()) as ElementoCreadoSharePoint;
  if (!json.Id) {
    throw new SharePointRestError(
      'CrearItemLimitacion',
      url,
      response.status,
      response.statusText,
      'SharePoint no devolvió Id de la limitación.'
    );
  }
  return json.Id;
}

async function ActualizarItemLimitacion(
  context: WebPartContext,
  limitacionId: number,
  cuerpo: Record<string, string | number | null>
): Promise<void> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaLimitacionesRed);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items(${limitacionId})`;

  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: {
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/json;odata=nometadata;charset=utf-8',
      'IF-MATCH': '*',
      'X-HTTP-Method': 'MERGE'
    },
    body: JSON.stringify(cuerpo)
  });

  await ValidarRespuesta(response, 'ActualizarItemLimitacion', url);
}

function CuerpoLimitacionDesdeFormulario(datos: DatosFormularioLimitacionSubestacion): Record<string, string | number | null> {
  const cuerpo: Record<string, string | number | null> = {
    INSTALACIONId: datos.instalacionId,
    [CampoPotenciaLimitadaMw]: datos.potenciaLimitadaMw,
    [CampoFechaInicioLimitacion]: datos.fechaInicioIso,
    MOTIVO: datos.motivo,
    DESCRIPCION: datos.descripcion?.trim() ?? '',
    [`${CampoLookupLimitacionSolicitudConcentrador}Id`]: null,
    [`${CampoLookupLimitacionSolicitudFalla}Id`]: null
  };
  if (datos.fechaFinIso) {
    cuerpo[CampoFechaFinLimitacion] = datos.fechaFinIso;
  }
  if (datos.motivo === MotivoIndisponibilidadFalla && typeof datos.solicitudFallaId === 'number') {
    cuerpo[`${CampoLookupLimitacionSolicitudFalla}Id`] = datos.solicitudFallaId;
  }
  if (datos.motivo === MotivoIndisponibilidadTrabajo && typeof datos.solicitudConcentradorId === 'number') {
    cuerpo[`${CampoLookupLimitacionSolicitudConcentrador}Id`] = datos.solicitudConcentradorId;
  }
  return cuerpo;
}

export async function RegistrarEnvioMeteologicaLimitacionSimulado(
  context: WebPartContext,
  limitacion: LimitacionSubestacionOperador
): Promise<void> {
  const detalle = `Tope de ${limitacion.potenciaLimitadaMw} MW en ${limitacion.central} (simulado; sin App Function).`;
  await RegistrarBitacoraLimitacionSubestacion(context, {
    limitacionId: limitacion.id,
    accion: AccionBitacoraEnvioMeteologicaSimulado,
    estadoAnterior: limitacion.estado,
    estadoNuevo: limitacion.estado,
    descripcion: detalle
  });
}

export async function CrearLimitacionRedConBitacora(
  context: WebPartContext,
  datos: DatosFormularioLimitacionSubestacion,
  nombreCentral: string,
  enviarMeteologica: boolean
): Promise<number> {
  const titulo = ConstruirTituloLimitacion(nombreCentral, datos.potenciaLimitadaMw);
  const id = await CrearItemLimitacion(context, titulo, {
    ...CuerpoLimitacionDesdeFormulario(datos),
    [CampoEstadoLimitacionRed]: EstadoLimitacionRedActiva
  });

  await RegistrarBitacoraLimitacionSubestacion(context, {
    limitacionId: id,
    accion: AccionBitacoraCrearLimitacion,
    estadoAnterior: '—',
    estadoNuevo: EstadoLimitacionRedActiva,
    descripcion: 'Limitación registrada en SharePoint.'
  });

  NotificarCambioDisponibilidadOperadorRenovable();

  if (enviarMeteologica) {
    await RegistrarEnvioMeteologicaLimitacionSimulado(context, {
      id,
      instalacionId: datos.instalacionId,
      central: nombreCentral,
      potenciaLimitadaMw: datos.potenciaLimitadaMw,
      fechaInicio: FormatearFechaHoraVisible(datos.fechaInicioIso),
      fechaFin: datos.fechaFinIso ? FormatearFechaHoraVisible(datos.fechaFinIso) : '—',
      motivo: datos.motivo,
      descripcion: datos.descripcion ?? '',
      estado: EstadoLimitacionRedActiva
    });
  }

  return id;
}

export async function ActualizarLimitacionRedConBitacora(
  context: WebPartContext,
  limitacion: LimitacionSubestacionOperador,
  datos: DatosFormularioLimitacionSubestacion,
  nombreCentral: string,
  enviarMeteologica: boolean
): Promise<void> {
  const cambios = DescribirCambiosLimitacion(limitacion, datos, nombreCentral);
  const titulo = ConstruirTituloLimitacion(nombreCentral, datos.potenciaLimitadaMw);
  await ActualizarItemLimitacion(context, limitacion.id, {
    Title: titulo,
    ...CuerpoLimitacionDesdeFormulario(datos)
  });

  NotificarCambioDisponibilidadOperadorRenovable();

  await RegistrarBitacoraLimitacionSubestacion(context, {
    limitacionId: limitacion.id,
    accion: AccionBitacoraModificarLimitacion,
    estadoAnterior: limitacion.estado,
    estadoNuevo: limitacion.estado,
    descripcion: cambios || 'Se guardó sin cambios en campos visibles.'
  });

  if (enviarMeteologica) {
    await RegistrarEnvioMeteologicaLimitacionSimulado(context, {
      ...limitacion,
      instalacionId: datos.instalacionId,
      central: nombreCentral,
      potenciaLimitadaMw: datos.potenciaLimitadaMw,
      motivo: datos.motivo,
      descripcion: datos.descripcion ?? ''
    });
  }
}

export async function FinalizarLimitacionRed(
  context: WebPartContext,
  limitacion: LimitacionSubestacionOperador
): Promise<void> {
  const ahoraIso = new Date().toISOString();
  const estadoAnterior = limitacion.estado;
  await ActualizarItemLimitacion(context, limitacion.id, {
    [CampoEstadoLimitacionRed]: EstadoLimitacionRedFinalizada,
    [CampoFechaFinLimitacion]: ahoraIso
  });

  await RegistrarBitacoraLimitacionSubestacion(context, {
    limitacionId: limitacion.id,
    accion: AccionBitacoraFinalizarLimitacion,
    estadoAnterior,
    estadoNuevo: EstadoLimitacionRedFinalizada,
    descripcion: `Finalizada con fecha ${FormatearFechaHoraVisible(ahoraIso)}.`
  });
}
