import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { FormatearFechaHoraVisible } from '../../../utils/FechaHoraCorConecta';
import { ObtenerDetalleSolicitudFallaPorId } from './SolicitudFallaCrudServicio';

/** Resumen de solo lectura (operador renovable y modal Ver). */
export type DetalleSolicitudFallaOperador = {
  id: number;
  idCen: string;
  central: string;
  estado: string;
  descripcion: string;
  potencia: string;
  fechaPerturbacion: string;
  fechaRetorno: string;
  integradoSiod: boolean;
  fechaIntegracionSiod: string;
  resultadoSiod: string;
  equiposEtiqueta: string;
};

export async function ObtenerDetalleSolicitudFallaOperador(
  context: WebPartContext,
  solicitudFallaId: number
): Promise<DetalleSolicitudFallaOperador | undefined> {
  try {
    const item = await ObtenerDetalleSolicitudFallaPorId(context, solicitudFallaId);
    const potenciaNum = typeof item.potencia === 'number' ? item.potencia : 0;
    const medida = (item.medida ?? 'MW').trim();
    return {
      id: item.id,
      idCen: item.idCen || `#${item.id}`,
      central: item.centralEtiqueta || '—',
      estado: item.estado || '—',
      descripcion: item.descripcion,
      potencia: `${potenciaNum} ${medida}`,
      fechaPerturbacion: FormatearFechaHoraVisible(item.fechaPerturbacion) || '—',
      fechaRetorno: FormatearFechaHoraVisible(item.fechaRetorno) || '—',
      integradoSiod: item.integradoSiod,
      fechaIntegracionSiod: FormatearFechaHoraVisible(item.fechaIntegracionSiod) || '—',
      resultadoSiod: (item.resultadoSiod ?? '').trim() || '—',
      equiposEtiqueta: item.equiposEtiqueta || '—'
    };
  } catch {
    return undefined;
  }
}