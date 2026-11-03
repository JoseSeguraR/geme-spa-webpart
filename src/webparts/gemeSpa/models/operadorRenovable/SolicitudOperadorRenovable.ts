import type { DisponibilidadSubequipoOperador } from '../../components/vistas/cor-conecta/concentrador/operador-renovable/constantesOperadorRenovable';
import type { SubequipoOperador } from './CatalogoEquiposOperador';

export type SolicitudOperadorRenovableFila = {
  id: number;
  idSolicitud: string;
  idCenSodi: string;
  relacionSodiCen: string;
  solicitante: string;
  empresaSolicitante?: string;
  central: string;
  centralId?: number;
  equiposResumen: string;
  cantidadSubequipos: number;
  descripcion: string;
  subequiposIndisponibles: number;
  subequiposTotal: number;
  /** Subequipos vinculados en `CONC_LISTA_INDISPONIBILIDADES` (estado desde maestro). */
  subequipos: IndisponibilidadSubequipoSolicitud[];
  fechaProgramadaInicio: string;
  fechaEfectivaInicio: string;
  estado: string;
};

export type DetalleSolicitudConcentradorOperador = {
  id: number;
  idSolicitud: string;
  relacionSodiCen: string;
  central: string;
  solicitante: string;
  descripcion: string;
  estado: string;
  inicioProgramado?: string;
  inicioEfectivo?: string;
  finProgramado?: string;
};

export type IndisponibilidadSubequipoSolicitud = {
  id: number;
  idSolicitudConcentrador: number;
  subequipoId: number;
  codigo: string;
  tipoEtiqueta: string;
  capacidadMw: number;
  capacidadesMwOpciones: number[];
  capacidadActualMw: number;
  mwFueraServicio: number;
  disponibilidad: DisponibilidadSubequipoOperador;
  motivo?: string;
};

export function IndisponibilidadASubequipoOperador(fila: IndisponibilidadSubequipoSolicitud): SubequipoOperador {
  return {
    id: fila.subequipoId,
    codigo: fila.codigo,
    nombre: fila.codigo,
    tipoCodigo: '',
    tipoNombre: fila.tipoEtiqueta,
    capacidadMw: fila.capacidadMw,
    capacidadesMwOpciones: fila.capacidadesMwOpciones,
    capacidadActualMw: fila.capacidadActualMw,
    estadoRegistro: 'Activo',
    disponibilidad: fila.disponibilidad,
    motivo: fila.motivo,
    equipoId: 0
  };
}

export type ResumenIndisponibilidadesSolicitud = {
  total: number;
  indisponibles: number;
  primerCodigo: string;
  filas: IndisponibilidadSubequipoSolicitud[];
};
