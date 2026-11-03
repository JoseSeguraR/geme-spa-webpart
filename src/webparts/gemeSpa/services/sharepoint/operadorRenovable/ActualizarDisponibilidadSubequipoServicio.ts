import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type {
  DatosMarcarDisponibilidadSubequipo,
  DatosMarcarIndisponibilidadSubequipo
} from '../../../models/operadorRenovable/CatalogoEquiposOperador';
import { ExtraerMensajeErrorSharePoint } from '../ExtraerMensajeErrorSharePoint';
import { SharePointRestError } from '../SharePointRestError';
import { RegistrarBitacoraSubequipoOperador } from './BitacoraOperadorServicio';
import {
  AccionBitacoraEnvioMeteologicaSimulado,
  AccionBitacoraMarcarDisponibilidad,
  AccionBitacoraMarcarIndisponibilidad,
  CampoSharePointCapacidadActualMw,
  DisponibilidadSubequipoDisponible,
  DisponibilidadSubequipoIndisponible
} from './CamposOperadorRenovable';
import { NotificarCambioDisponibilidadOperadorRenovable } from './OperadorRenovableRefrescoGlobal';
import { NombreListaSubequiposOperador } from './NombresListasOperadorRenovable';
import { CalcularMwFueraServicio } from './UtilidadesCapacidadSubequipo';

async function ValidarRespuesta(response: SPHttpClientResponse, operacion: string, url: string): Promise<void> {
  if (response.ok) {
    return;
  }
  const mensaje = await ExtraerMensajeErrorSharePoint(response);
  throw new SharePointRestError(operacion, url, response.status, response.statusText, mensaje);
}

async function ActualizarItemSubequipo(
  context: WebPartContext,
  subequipoId: number,
  cuerpo: Record<string, string | number>
): Promise<void> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSubequiposOperador);
  const url = `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items(${subequipoId})`;

  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: {
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/json;odata=nometadata;charset=utf-8',
      'IF-MATCH': '*',
      'X-HTTP-Method': 'MERGE'
    },
    body: JSON.stringify(cuerpo)
  });

  await ValidarRespuesta(response, 'ActualizarItemSubequipo', url);
}

async function RegistrarEnvioMeteologicaSubequipoSimulado(
  context: WebPartContext,
  subequipoId: number,
  detalle: string
): Promise<void> {
  await RegistrarBitacoraSubequipoOperador(context, {
    subequipoId,
    accion: AccionBitacoraEnvioMeteologicaSimulado,
    estadoAnterior: '—',
    estadoNuevo: '—',
    descripcion: detalle
  });
}

export async function MarcarSubequipoIndisponibleEnSharePoint(
  context: WebPartContext,
  datos: DatosMarcarIndisponibilidadSubequipo
): Promise<void> {
  await ActualizarItemSubequipo(context, datos.subequipoId, {
    DISPONIBILIDAD: DisponibilidadSubequipoIndisponible,
    [CampoSharePointCapacidadActualMw]: datos.capacidadActualMw,
    MOTIVO: datos.motivo,
    DESCRIPCION: datos.descripcion ?? '',
    FECHA_INDISPONIBILIDAD: datos.fechaIndisponibilidadIso
  });

  await RegistrarBitacoraSubequipoOperador(context, {
    subequipoId: datos.subequipoId,
    accion: AccionBitacoraMarcarIndisponibilidad,
    estadoAnterior: datos.disponibilidadAnterior,
    estadoNuevo: DisponibilidadSubequipoIndisponible,
    capacidadMw: datos.capacidadActualMw,
    motivo: datos.motivo,
    descripcion: datos.descripcion
  });

  await RegistrarEnvioMeteologicaSubequipoSimulado(
    context,
    datos.subequipoId,
    `Disponibilidad indisponible (${datos.capacidadActualMw} MW operativos; simulado Meteológica).`
  );
  NotificarCambioDisponibilidadOperadorRenovable();
}

export async function MarcarSubequipoDisponibleEnSharePoint(
  context: WebPartContext,
  datos: DatosMarcarDisponibilidadSubequipo
): Promise<void> {
  await ActualizarItemSubequipo(context, datos.subequipoId, {
    DISPONIBILIDAD: DisponibilidadSubequipoDisponible,
    [CampoSharePointCapacidadActualMw]: datos.capacidadMaximaMw,
    MOTIVO: '',
    DESCRIPCION: ''
  });

  const mwFueraAnterior = CalcularMwFueraServicio(datos.capacidadMaximaMw, datos.capacidadActualAnteriorMw);

  await RegistrarBitacoraSubequipoOperador(context, {
    subequipoId: datos.subequipoId,
    accion: AccionBitacoraMarcarDisponibilidad,
    estadoAnterior: datos.disponibilidadAnterior,
    estadoNuevo: DisponibilidadSubequipoDisponible,
    capacidadMw: datos.capacidadMaximaMw,
    descripcion:
      mwFueraAnterior > 0
        ? `Retorno a servicio (${datos.fechaDisponibilidadIso}). MW fuera previos: ${mwFueraAnterior}.`
        : `Retorno a servicio (${datos.fechaDisponibilidadIso}).`
  });

  await RegistrarEnvioMeteologicaSubequipoSimulado(
    context,
    datos.subequipoId,
    `Disponibilidad restaurada (${datos.capacidadMaximaMw} MW; simulado Meteológica).`
  );
  NotificarCambioDisponibilidadOperadorRenovable();
}
