import type { DisponibilidadSubequipoOperador } from '../../components/vistas/cor-conecta/concentrador/operador-renovable/constantesOperadorRenovable';

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

export type DatosMarcarIndisponibilidadSubequipo = {
  subequipoId: number;
  motivo: string;
  descripcion?: string;
  fechaIndisponibilidadIso: string;
  capacidadActualMw: number;
  capacidadMaximaMw: number;
  disponibilidadAnterior: string;
};

export type DatosMarcarDisponibilidadSubequipo = {
  subequipoId: number;
  fechaDisponibilidadIso: string;
  capacidadMaximaMw: number;
  disponibilidadAnterior: string;
  capacidadActualAnteriorMw: number;
};

export type FilaBitacoraOperadorSubequipo = {
  id: number;
  accion: string;
  estadoAnterior: string;
  estadoNuevo: string;
  capacidadMw?: number;
  motivo?: string;
  descripcion?: string;
  usuario: string;
  fecha: string;
};
