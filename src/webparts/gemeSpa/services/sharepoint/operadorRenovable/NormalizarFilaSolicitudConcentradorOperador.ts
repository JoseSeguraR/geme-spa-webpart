import type { SolicitudOperadorRenovableFila } from '../../../models/operadorRenovable/SolicitudOperadorRenovable';
import { FormatearFechaHoraVisible } from '../../../utils/FechaHoraCorConecta';
import {
  CampoEmpresaSolicitanteConcentrador,
  CampoEstadoTareaActualConcentrador,
  CampoInstalacionGmConcentrador,
  CampoLookupTareaActualConcentrador
} from './CamposOperadorRenovable';
import { ObtenerLookupId, ObtenerNumero, ObtenerTexto, type FilaRenderListData } from './UtilidadesFilaRenderListData';

function ConstruirEtiquetaIdCenSodi(idSolicitud: string, relacion: string): string {
  if (!relacion || relacion === idSolicitud) {
    return idSolicitud || '—';
  }
  if (!idSolicitud) {
    return relacion;
  }
  return `${idSolicitud} / ${relacion}`;
}

export function NormalizarFilaSolicitudConcentradorOperador(
  fila: FilaRenderListData
): Omit<
  SolicitudOperadorRenovableFila,
  'equiposResumen' | 'cantidadSubequipos' | 'subequiposIndisponibles' | 'subequiposTotal' | 'subequipos'
> | undefined {
  const id = ObtenerNumero(fila.ID ?? fila.Id);
  if (!id) {
    return undefined;
  }

  const idSolicitud = ObtenerTexto(fila.ID_SOLICITUD);
  const relacionSodi = ObtenerTexto(fila.RELACION_SODI_CEN);
  const centralRaw = fila[CampoInstalacionGmConcentrador];
  const estadoProyectado = ObtenerTexto(fila[CampoEstadoTareaActualConcentrador]);
  const estadoLookup = ObtenerTexto(fila[CampoLookupTareaActualConcentrador]);
  const estado = estadoProyectado || estadoLookup || '—';

  const inicioProg = ObtenerTexto(fila.INICIO_PROGRAMADO);
  const inicioEfec = ObtenerTexto(fila.INICIO_EFECTIVO);

  const empresa = ObtenerTexto(fila[CampoEmpresaSolicitanteConcentrador]);

  return {
    id,
    idSolicitud: idSolicitud || `#${id}`,
    idCenSodi: ConstruirEtiquetaIdCenSodi(idSolicitud, relacionSodi),
    relacionSodiCen: relacionSodi,
    solicitante: ObtenerTexto(fila.SOLICITANTE) || '—',
    empresaSolicitante: empresa || undefined,
    central: ObtenerTexto(centralRaw) || '—',
    centralId: ObtenerLookupId(centralRaw),
    descripcion: ObtenerTexto(fila.DESCRIPCION),
    fechaProgramadaInicio: FormatearFechaHoraVisible(inicioProg) || '—',
    fechaEfectivaInicio: FormatearFechaHoraVisible(inicioEfec) || '—',
    estado
  };
}
