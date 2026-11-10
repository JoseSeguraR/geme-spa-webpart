import type { EquipoOperadorTarjeta, SubequipoOperador } from '../../../models/operadorRenovable/CatalogoEquiposOperador';
import { DisponibilidadSubequipoDisponible, DisponibilidadSubequipoIndisponible } from './CamposOperadorRenovable';
import {
  PeriodoCubreAhora,
  type EstadoSubequipoSharePoint,
  type PeriodoIndisponibilidad
} from './PeriodosIndisponibilidadApiServicio';
import { CalcularResumenMwEquipo } from './UtilidadesCapacidadSubequipo';

/** Períodos abiertos por subequipo, ordenados por inicio. */
export function AgruparPeriodosPorSubequipo(periodos: PeriodoIndisponibilidad[]): Map<number, PeriodoIndisponibilidad[]> {
  const mapa = new Map<number, PeriodoIndisponibilidad[]>();
  periodos
    .slice()
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
    .forEach((periodo) => {
      const lista = mapa.get(periodo.subequipoId) ?? [];
      lista.push(periodo);
      mapa.set(periodo.subequipoId, lista);
    });
  return mapa;
}

/**
 * Estado del subequipo según sus períodos (no según las columnas de SharePoint): fuera si un período lo
 * cubre ahora (con la capacidad del período); si no, disponible con su máxima. Guarda el próximo programado.
 */
export function AplicarPeriodosASubequipo(
  subequipo: SubequipoOperador,
  periodos: PeriodoIndisponibilidad[] | undefined
): SubequipoOperador {
  const lista = periodos ?? [];
  const vigente = lista.filter(PeriodoCubreAhora)[0];
  const programado = lista.filter((p) => p.estadoCalculado === 'PROGRAMADO')[0];
  if (vigente) {
    return {
      ...subequipo,
      disponibilidad: DisponibilidadSubequipoIndisponible,
      capacidadActualMw: vigente.capacidadMw,
      motivo: vigente.motivo,
      descripcion: vigente.descripcion,
      fechaIndisponibilidad: vigente.fechaInicio,
      periodoVigente: vigente,
      periodoProgramado: programado
    };
  }
  return {
    ...subequipo,
    disponibilidad: DisponibilidadSubequipoDisponible,
    capacidadActualMw: subequipo.capacidadMw,
    motivo: undefined,
    descripcion: undefined,
    periodoVigente: undefined,
    periodoProgramado: programado
  };
}

export function AplicarPeriodosATarjetas(
  tarjetas: EquipoOperadorTarjeta[],
  periodos: PeriodoIndisponibilidad[]
): EquipoOperadorTarjeta[] {
  const porSubequipo = AgruparPeriodosPorSubequipo(periodos);
  return tarjetas.map((tarjeta) => {
    const subequipos = tarjeta.subequipos.map((sub) => AplicarPeriodosASubequipo(sub, porSubequipo.get(sub.id)));
    return { ...tarjeta, subequipos, ...CalcularResumenMwEquipo(subequipos) };
  });
}

function MismaFecha(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) {
    return !a && !b;
  }
  return Date.parse(a) === Date.parse(b);
}

/**
 * Subequipos cuyo estado en SharePoint no coincide con sus períodos (p. ej. una indisponibilidad programada que
 * ya empezó o una vencida: el timer de la App Function no escribe en listas). Mismo criterio que
 * `estado_subequipo_hoy` de la Function; el web part los corrige con la API REST de SharePoint.
 */
export function EstadosDesactualizados(
  tarjetasSharePoint: EquipoOperadorTarjeta[],
  periodos: PeriodoIndisponibilidad[]
): EstadoSubequipoSharePoint[] {
  const porSubequipo = AgruparPeriodosPorSubequipo(periodos);
  const estados: EstadoSubequipoSharePoint[] = [];
  tarjetasSharePoint.forEach((tarjeta) =>
    tarjeta.subequipos.forEach((sub) => {
      if (sub.estadoRegistro !== 'Activo') {
        return;
      }
      const vigente = (porSubequipo.get(sub.id) ?? []).filter(PeriodoCubreAhora)[0];
      const campos: Record<string, string | number> = vigente
        ? {
            DISPONIBILIDAD: DisponibilidadSubequipoIndisponible,
            CAPACIDAD_ACTUAL_MW: vigente.capacidadMw,
            MOTIVO: vigente.motivo,
            DESCRIPCION: vigente.descripcion ?? '',
            FECHA_INDISPONIBILIDAD: vigente.fechaInicio
          }
        : { DISPONIBILIDAD: DisponibilidadSubequipoDisponible, CAPACIDAD_ACTUAL_MW: sub.capacidadMw, MOTIVO: '', DESCRIPCION: '' };
      const igual =
        sub.disponibilidad === campos.DISPONIBILIDAD &&
        Math.abs(sub.capacidadActualMw - Number(campos.CAPACIDAD_ACTUAL_MW)) < 1e-6 &&
        (sub.motivo ?? '') === campos.MOTIVO &&
        (sub.descripcion ?? '') === campos.DESCRIPCION &&
        (!vigente || MismaFecha(sub.fechaIndisponibilidad, vigente.fechaInicio));
      if (!igual) {
        estados.push({ subequipoId: sub.id, subequipoCodigo: sub.codigo, campos });
      }
    })
  );
  return estados;
}
