import type { CentralMantenedor } from './concentradorComun/CentralMantenedor';

export type MedidaPotenciaFalla = 'MW' | 'MWh';

export type EstadoFiltroSolicitudFalla = 'Vigente' | 'Finalizada' | 'Todas';

export type { CentralMantenedor };

export type SolicitudFalla = {
  id: number;
  /** Referencia en `ID_BITACORA` (formato Excel vinculado). */
  idBitacora?: string;
  idCen: string;
  centralId?: number;
  centralEtiqueta: string;
  equiposEtiqueta: string;
  fechaPerturbacion?: string;
  fechaRetorno?: string;
  descripcion: string;
  potencia?: number;
  medida?: string;
  estado: string;
  integradoSiod: boolean;
};

export type DetalleSolicitudFalla = SolicitudFalla & {
  equiposIds: number[];
  fechaCreacion?: string;
  usuarioCreador?: string;
  /** Estado SIOD derivado de `ENGINE_BITACORA` (no hay columnas SIOD en la lista). */
  fechaIntegracionSiod?: string;
  resultadoSiod?: string;
};

export type AdjuntoSolicitudFalla = {
  nombreArchivo: string;
  url: string;
  urlDescarga: string;
};

export type EquipoMantenedorFalla = {
  id: number;
  nombre: string;
};

export type DatosNuevaSolicitudFalla = {
  idCen: string;
  centralId: number;
  equiposIds: number[];
  fechaPerturbacionIso: string;
  fechaRetornoIso?: string;
  potencia: number;
  medida: MedidaPotenciaFalla;
  descripcion: string;
};

export type DatosActualizarSolicitudFalla = DatosNuevaSolicitudFalla;

export type DatosFinalizarSolicitudFalla = {
  observaciones?: string;
};

export type FiltrosAvanzadosSolicitudFalla = {
  equiposIds?: readonly number[];
  fechaPerturbacionDesde?: string;
  fechaPerturbacionHasta?: string;
  fechaRetornoDesde?: string;
  fechaRetornoHasta?: string;
};

export type EstadoFiltroGrillaSolicitudFalla = EstadoFiltroSolicitudFalla;