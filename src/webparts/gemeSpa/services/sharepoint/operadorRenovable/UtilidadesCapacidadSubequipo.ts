import type { SubequipoOperador } from '../../../models/operadorRenovable/CatalogoEquiposOperador';
import {
  DisponibilidadSubequipoDisponible,
  DisponibilidadSubequipoIndisponible,
  EstadoSubequipoActivo
} from './CamposOperadorRenovable';

export function ObtenerMaximoDesdeCapacidadesMwTexto(valor: string | undefined): number {
  if (!valor?.trim()) {
    return 0;
  }
  const partes = valor
    .split(',')
    .map((p) => Number.parseFloat(p.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (partes.length === 0) {
    return 0;
  }
  return Math.max(...partes);
}

/** Resuelve la capacidad nominal cuando la columna máxima no viene en REST (transición de esquema). */
export function ResolverCapacidadMaximaMwSubequipo(params: {
  capacidadMaximaLista?: number;
  capacidadesMwTexto?: string;
  disponibilidad?: string;
  capacidadActualLista?: number;
}): number {
  if (typeof params.capacidadMaximaLista === 'number' && params.capacidadMaximaLista > 0) {
    return params.capacidadMaximaLista;
  }
  const desdeTexto = ObtenerMaximoDesdeCapacidadesMwTexto(params.capacidadesMwTexto);
  if (desdeTexto > 0) {
    return desdeTexto;
  }
  if (
    params.disponibilidad === DisponibilidadSubequipoDisponible &&
    typeof params.capacidadActualLista === 'number' &&
    params.capacidadActualLista > 0
  ) {
    return params.capacidadActualLista;
  }
  return 0;
}

export function ParsearCapacidadesMwTexto(valor: string | undefined, capacidadNominalMw: number): number[] {
  if (!valor?.trim()) {
    if (capacidadNominalMw > 0) {
      return [capacidadNominalMw];
    }
    return [];
  }
  const partes = valor
    .split(',')
    .map((p) => Number.parseFloat(p.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  const unicos = Array.from(new Set(partes)).sort((a, b) => a - b);
  return unicos.filter((mw) => mw <= capacidadNominalMw || capacidadNominalMw <= 0);
}

/** MW con los que puede quedar operando (0 + opciones parciales menores que la máxima), alineado con maqueta oct-2026. */
export function ObtenerCapacidadesActualesPermitidas(subequipo: SubequipoOperador): number[] {
  const opcionesParciales = subequipo.capacidadesMwOpciones.length
    ? subequipo.capacidadesMwOpciones.filter((mw) => mw > 0 && mw < subequipo.capacidadMw)
    : [];
  const valores = new Set<number>([0, ...opcionesParciales]);
  if (subequipo.capacidadMw > 0) {
    valores.add(subequipo.capacidadMw);
  }
  return Array.from(valores).sort((a, b) => a - b);
}

/** @deprecated Usar {@link ObtenerCapacidadesActualesPermitidas}. */
export function ObtenerCapacidadesIndisponiblesPermitidas(subequipo: SubequipoOperador): number[] {
  return ObtenerCapacidadesActualesPermitidas(subequipo);
}

export function NormalizarCapacidadActualAlLeer(
  disponibilidad: string | undefined,
  capacidadMaximaMw: number,
  valorLista?: number
): number {
  if (disponibilidad === DisponibilidadSubequipoDisponible) {
    return capacidadMaximaMw;
  }
  if (typeof valorLista === 'number' && Number.isFinite(valorLista)) {
    return Math.max(0, Math.min(valorLista, capacidadMaximaMw));
  }
  return 0;
}

export function CalcularMwFueraServicio(capacidadMaximaMw: number, capacidadActualMw: number): number {
  if (capacidadMaximaMw <= 0) {
    return 0;
  }
  return Math.max(0, capacidadMaximaMw - Math.max(0, Math.min(capacidadActualMw, capacidadMaximaMw)));
}

export function CalcularMwIndisponiblesSubequipoActivo(subequipo: SubequipoOperador): number {
  if (subequipo.estadoRegistro !== EstadoSubequipoActivo) {
    return 0;
  }
  if (subequipo.disponibilidad !== DisponibilidadSubequipoIndisponible) {
    return 0;
  }
  return CalcularMwFueraServicio(subequipo.capacidadMw, subequipo.capacidadActualMw);
}

export function CalcularResumenMwEquipo(subequipos: SubequipoOperador[]): { totalMw: number; indisponibleMw: number } {
  let totalMw = 0;
  let indisponibleMw = 0;
  for (const sub of subequipos) {
    if (sub.estadoRegistro !== EstadoSubequipoActivo) {
      continue;
    }
    totalMw += sub.capacidadMw;
    indisponibleMw += CalcularMwIndisponiblesSubequipoActivo(sub);
  }
  return { totalMw, indisponibleMw };
}
