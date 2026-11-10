import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { EnvioMeteologicaBitacora } from '../../../models/operadorRenovable/CatalogoEquiposOperador';
import type { FilaBitacoraLimitacionSubestacion } from '../../../models/operadorRenovable/LimitacionSubestacionOperador';
import { NormalizarEnvioBitacora } from './BitacoraOperadorServicio';
import {
  DescribirEnvioCapacidad,
  ResultadoSinEnvio,
  type RespuestaCapacidadCentralApi,
  type ResultadoEnvioMeteologica
} from './CapacidadCentralApiServicio';
import { PedirApiOperador, UrlApiOperador, UsuarioOperador } from './PeriodosIndisponibilidadApiServicio';

/**
 * Bitácora de limitaciones por subestación: `app.concentrador_bitacora_limitacion` en la BD de la App Function
 * (reemplaza a la lista CONC_LISTA_BITACORA_SUBESTACION, 10-11-2026). Cada evento se registra con
 * `POST /api/concentrador-limitaciones/eventos`, que además recalcula la central y envía el tope (GRID).
 */

/** Los campos vacíos llegan como null en el JSON; se tratan igual que ausentes. */
type FilaBitacoraLimitacionApi = {
  id: number;
  accion?: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  potenciaLimitadaMw?: number;
  fechaInicio?: string;
  fechaFin?: string;
  motivo?: string;
  descripcion?: string;
  usuario?: string;
  fechaEvento?: string;
  creadoEn?: string;
  meteologica?: EnvioMeteologicaBitacora;
};

export type DatosEventoLimitacion = {
  limitacionId: number;
  accion: string;
  estadoAnterior: string;
  estadoNuevo: string;
  descripcion?: string;
};

/** Últimos 200 eventos de la limitación, del más reciente al más antiguo. */
export async function ObtenerBitacoraLimitacionSubestacion(limitacionId: number): Promise<FilaBitacoraLimitacionSubestacion[]> {
  const respuesta = await PedirApiOperador<{ success?: boolean; error?: string; bitacora?: FilaBitacoraLimitacionApi[] }>(
    UrlApiOperador('concentrador-bitacora', { limitacion: String(limitacionId) })
  );
  return (respuesta.bitacora ?? []).map((fila) => ({
    id: fila.id,
    accion: fila.accion ?? '',
    estadoAnterior: fila.estadoAnterior ?? '',
    estadoNuevo: fila.estadoNuevo ?? '',
    potenciaLimitadaMw: typeof fila.potenciaLimitadaMw === 'number' ? fila.potenciaLimitadaMw : undefined,
    fechaInicio: fila.fechaInicio || undefined,
    fechaFin: fila.fechaFin || undefined,
    motivo: fila.motivo || undefined,
    descripcion: fila.descripcion || undefined,
    usuario: fila.usuario || '—',
    fecha: fila.fechaEvento ?? fila.creadoEn ?? '',
    meteologica: NormalizarEnvioBitacora(fila.meteologica)
  }));
}

async function PedirEnvio(ruta: string, cuerpo: object): Promise<ResultadoEnvioMeteologica> {
  try {
    const respuesta = await PedirApiOperador<RespuestaCapacidadCentralApi>(UrlApiOperador(ruta), cuerpo);
    return DescribirEnvioCapacidad(respuesta);
  } catch (err) {
    const detalle = err instanceof Error ? err.message : 'sin detalle';
    return ResultadoSinEnvio('ERROR_APP_FUNCTION', `No se pudo registrar el evento ni enviar a Meteológica: ${detalle}`);
  }
}

/**
 * Registra el evento (bitácora en la BD) y envía el tope de la central a Meteológica. No lanza: la
 * limitación ya quedó guardada en SharePoint y el resultado se muestra al operador.
 */
export function RegistrarEventoLimitacionSubestacion(
  context: WebPartContext,
  datos: DatosEventoLimitacion
): Promise<ResultadoEnvioMeteologica> {
  return PedirEnvio('concentrador-limitaciones/eventos', { ...datos, usuario: UsuarioOperador(context) });
}

/** Reenvía el último cálculo de la limitación si no quedó enviado. No lanza. */
export function ReintentarEnvioLimitacionSubestacion(limitacionId: number): Promise<ResultadoEnvioMeteologica> {
  return PedirEnvio('concentrador-limitaciones/reintentar', { limitacionId });
}
