import type { DisponibilidadSubequipoOperador } from '../../components/vistas/cor-conecta/concentrador/operador-renovable/constantesOperadorRenovable';
import type { PeriodoIndisponibilidad } from '../../services/sharepoint/operadorRenovable/PeriodosIndisponibilidadApiServicio';

export type EstadoRegistroSubequipoOperador = 'Activo' | 'Inactivo' | 'Baja';

export type SubequipoOperador = {
  id: number;
  codigo: string;
  nombre: string;
  tipoCodigo: string;
  tipoNombre: string;
  /** Capacidad nominal (`CAPACIDAD_MAXIMA_MW` en subequipos; fallback desde `CAPACIDADES_MW`). */
  capacidadMw: number;
  capacidadesMwOpciones: number[];
  /** MW con los que queda operando; si Disponible = `capacidadMw` (SharePoint `CAPACIDAD_ACTUAL_MW`). */
  capacidadActualMw: number;
  estadoRegistro: EstadoRegistroSubequipoOperador;
  disponibilidad: DisponibilidadSubequipoOperador;
  motivo?: string;
  descripcion?: string;
  fechaIndisponibilidad?: string;
  equipoId: number;
  /** Con la App Function de períodos: el que lo deja fuera ahora (vigente o vencido). */
  periodoVigente?: PeriodoIndisponibilidad;
  /** El próximo que todavía no empieza. */
  periodoProgramado?: PeriodoIndisponibilidad;
};

export type EquipoOperadorTarjeta = {
  id: number;
  nombreEquipo: string;
  centralId: number;
  central: string;
  subequipos: SubequipoOperador[];
  totalMw: number;
  indisponibleMw: number;
};

/** Resultado de Meteológica que acompañó a un evento de bitácora (envío del perfil o del tope). */
export type EnvioMeteologicaBitacora = {
  estado?: string;
  error?: string;
  verificado?: boolean;
  /** ISO UTC. */
  desde?: string;
  hasta?: string;
  tramos?: { desde: string; hasta: string; mw: number }[];
  /** Solo limitaciones: tipo y valor del tramo GRID. */
  tipo?: string;
  valorMw?: number;
  enviadoEn?: string;
};

/** Fila de `app.concentrador_bitacora_subequipo` (BD de la App Function). Fechas ISO UTC. */
export type FilaBitacoraOperadorSubequipo = {
  id: number;
  accion: string;
  estadoAnterior: string;
  estadoNuevo: string;
  capacidadMw?: number;
  motivo?: string;
  descripcion?: string;
  usuario: string;
  /** Cuándo ocurrió (inicio, retorno, cambio). */
  fecha: string;
  fechaInicio?: string;
  fechaFinEstimada?: string;
  fechaFin?: string;
  fechaFinEstimadaAnterior?: string;
  meteologica?: EnvioMeteologicaBitacora;
};
