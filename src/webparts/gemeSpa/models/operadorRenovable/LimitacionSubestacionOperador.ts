import type { EnvioMeteologicaBitacora } from './CatalogoEquiposOperador';
import type { EstadoLimitacionSubestacion } from '../../components/vistas/cor-conecta/concentrador/operador-renovable/constantesOperadorRenovable';

export type LimitacionSubestacionOperador = {
  id: number;
  instalacionId: number;
  central: string;
  potenciaLimitadaMw: number;
  fechaInicio: string;
  fechaFin: string;
  fechaInicioIso?: string;
  fechaFinIso?: string;
  motivo: string;
  descripcion: string;
  estado: EstadoLimitacionSubestacion | string;
  /** Lookup → `CONC_LISTA_CONCENTRADOR` (motivo Trabajo). */
  solicitudConcentradorId?: number;
  solicitudConcentradorEtiqueta?: string;
  /** Lookup → `CONC_LISTA_SOLICITUDFALLA` (motivo Falla). */
  solicitudFallaId?: number;
  solicitudFallaEtiqueta?: string;
};

export type DatosFormularioLimitacionSubestacion = {
  instalacionId: number;
  potenciaLimitadaMw: number;
  fechaInicioIso: string;
  fechaFinIso?: string;
  motivo: string;
  descripcion?: string;
  solicitudConcentradorId?: number;
  solicitudFallaId?: number;
};

/** Fila de `app.concentrador_bitacora_limitacion` (BD de la App Function). Fechas ISO UTC. */
export type FilaBitacoraLimitacionSubestacion = {
  id: number;
  accion: string;
  estadoAnterior: string;
  estadoNuevo: string;
  potenciaLimitadaMw?: number;
  fechaInicio?: string;
  fechaFin?: string;
  motivo?: string;
  descripcion?: string;
  usuario: string;
  fecha: string;
  meteologica?: EnvioMeteologicaBitacora;
};
