import type { EstadoSolicitudIl } from '../components/vistas/cor-conecta/concentrador/administrador/constantesSolicitudesIl';

export type SolicitudIl = {
  id: number;
  idCen: string;
  centralId: number | null;
  centralEtiqueta: string;
  descripcion: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  estado: EstadoSolicitudIl | string;
};

export type CentralMantenedor = {
  id: number;
  central: string;
};

export type DatosNuevaSolicitudIl = {
  idCen: string;
  centralId: number;
  descripcion: string;
  fechaInicioIso: string;
  fechaFinIso?: string;
  /** Estado de flujo calculado en UI (Vigente / Finalizada); no se persiste como columna ESTADO. */
  estadoFlujo: EstadoSolicitudIl;
};

export type AdjuntoSolicitudIl = {
  nombreArchivo: string;
  url: string;
  urlDescarga: string;
};

/** Detalle para gestión: incluye lookup TAREAACTUAL (bitácora vigente). */
export type DetalleSolicitudIl = SolicitudIl & {
  idBitacoraActual: number | null;
};

export type DatosActualizarSolicitudIl = {
  idCen: string;
  centralId: number;
  descripcion: string;
  fechaInicioIso: string;
  fechaFinIso?: string;
  /** MERGE con FECHA_FIN en null (reactivar o anular). */
  limpiarFechaFin?: boolean;
};
