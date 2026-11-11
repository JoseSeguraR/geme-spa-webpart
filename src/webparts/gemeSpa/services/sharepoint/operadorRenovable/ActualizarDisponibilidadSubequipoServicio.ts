import { SPHttpClient } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { SubequipoOperador } from '../../../models/operadorRenovable/CatalogoEquiposOperador';
import { ExtraerMensajeErrorSharePoint } from '../ExtraerMensajeErrorSharePoint';
import { NombreListaSubequiposOperador } from './NombresListasOperadorRenovable';
import { NotificarCambioDisponibilidadOperadorRenovable } from './OperadorRenovableRefrescoGlobal';
import {
  AnularPeriodo,
  CambiarFechaEstimadaPeriodo,
  CrearPeriodos,
  FinalizarPeriodos,
  MigrarPeriodos,
  ReenviarPerfilCentral,
  type DatosCrearPeriodos,
  type EstadoSubequipoSharePoint,
  type PeriodoIndisponibilidad,
  type ResultadoAccionPeriodos,
  type ResultadoMigracion
} from './PeriodosIndisponibilidadApiServicio';

/**
 * Acciones del operador sobre la disponibilidad de los subequipos. La App Function guarda el período, escribe
 * la bitácora y envía el perfil a Meteológica, pero **no escribe en listas de SharePoint** (el cliente no le da
 * ese permiso): devuelve el estado de hoy de los subequipos afectados y el web part lo escribe en
 * `CONC_MANTENEDOR_SUBEQUIPOS` con la API REST de SharePoint, como el usuario conectado.
 */

/**
 * Escribe en SharePoint el estado de los subequipos (MERGE por ítem). No lanza: el período ya quedó guardado;
 * devuelve un aviso por cada subequipo que no se pudo actualizar.
 */
export async function AplicarEstadoSubequiposSharePoint(
  context: WebPartContext,
  estados: EstadoSubequipoSharePoint[]
): Promise<string[]> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const lista = encodeURIComponent(NombreListaSubequiposOperador);
  const avisos: string[] = [];
  for (const estado of estados) {
    const url = `${webUrl}/_api/web/lists/getbytitle('${lista}')/items(${estado.subequipoId})`;
    try {
      const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/json;odata=nometadata;charset=utf-8',
          'IF-MATCH': '*',
          'X-HTTP-Method': 'MERGE'
        },
        body: JSON.stringify(estado.campos)
      });
      if (!response.ok) {
        const mensaje = await ExtraerMensajeErrorSharePoint(response);
        avisos.push(`No se pudo actualizar el estado de ${estado.subequipoCodigo} en SharePoint: ${mensaje ?? `HTTP ${response.status}`}.`);
      }
    } catch {
      avisos.push(`No se pudo actualizar el estado de ${estado.subequipoCodigo} en SharePoint.`);
    }
  }
  return avisos;
}

/** Aplica en SharePoint el estado que devolvió la App Function y suma los avisos al resultado. */
async function ConEstadoEnSharePoint(
  context: WebPartContext,
  resultado: ResultadoAccionPeriodos
): Promise<ResultadoAccionPeriodos> {
  const avisos = await AplicarEstadoSubequiposSharePoint(context, resultado.subequipos);
  NotificarCambioDisponibilidadOperadorRenovable();
  return { ...resultado, avisos: resultado.avisos.concat(avisos) };
}

/** Crea las indisponibilidades (un período por subequipo, mismas fechas). */
export async function MarcarIndisponibilidadConPeriodos(
  context: WebPartContext,
  datos: DatosCrearPeriodos
): Promise<ResultadoAccionPeriodos> {
  return ConEstadoEnSharePoint(context, await CrearPeriodos(context, datos));
}

/**
 * Marca disponibles: guarda el fin real de sus períodos. Un subequipo Indisponible sin período (dato
 * anterior a los períodos) solo se pone Disponible en SharePoint, sin envío (no contaba en el perfil).
 */
export async function MarcarDisponibilidadConPeriodos(
  context: WebPartContext,
  subequipos: SubequipoOperador[],
  fechaFinIso: string
): Promise<ResultadoAccionPeriodos> {
  const periodos = subequipos
    .map((sub) => sub.periodoVigente)
    .filter((periodo): periodo is PeriodoIndisponibilidad => periodo !== undefined);
  const sinPeriodo = subequipos.filter((sub) => !sub.periodoVigente).map((sub) => sub.id);
  return ConEstadoEnSharePoint(
    context,
    await FinalizarPeriodos(context, periodos.map((p) => p.id), fechaFinIso, sinPeriodo)
  );
}

/** Cambia la fecha estimada de fin; la App Function reenvía el perfil. */
export async function ModificarFechaEstimadaPeriodo(
  context: WebPartContext,
  periodo: PeriodoIndisponibilidad,
  fechaFinEstimadaIso: string
): Promise<ResultadoAccionPeriodos> {
  return ConEstadoEnSharePoint(context, await CambiarFechaEstimadaPeriodo(context, periodo.id, fechaFinEstimadaIso));
}

/** Anula una indisponibilidad cargada por error (deja de contar en el perfil). */
export async function AnularIndisponibilidadPeriodo(
  context: WebPartContext,
  periodo: PeriodoIndisponibilidad
): Promise<ResultadoAccionPeriodos> {
  return ConEstadoEnSharePoint(context, await AnularPeriodo(context, periodo.id));
}

/** Recalcula y reenvía el perfil de la central (y pone al día su estado en SharePoint). */
export async function ReenviarPerfilYEstado(context: WebPartContext, instalacionId: number): Promise<ResultadoAccionPeriodos> {
  return ConEstadoEnSharePoint(context, await ReenviarPerfilCentral(context, instalacionId));
}

/** Migra las indisponibilidades sin período y escribe en SharePoint el estado que corresponda. */
export async function MigrarIndisponibilidadesExistentes(context: WebPartContext): Promise<ResultadoMigracion> {
  const resultado = await MigrarPeriodos(context, false);
  const avisos = await AplicarEstadoSubequiposSharePoint(context, resultado.subequipos);
  NotificarCambioDisponibilidadOperadorRenovable();
  return { ...resultado, omitidos: resultado.omitidos.concat(avisos) };
}
