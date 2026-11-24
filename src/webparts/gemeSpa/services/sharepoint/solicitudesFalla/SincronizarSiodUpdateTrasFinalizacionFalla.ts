import { FormatearFechaHoraLocalParaSiodApi } from '../../../utils/FechaHoraCorConecta';
import { ActualizarAltaSiodSolicitudFalla, MensajeUsuarioResultadoPostSiodFalla } from './SiodSolicitudFallaApiServicio';
import type { PasoSiodSolicitudFalla, ResultadoSincronizacionSiodFalla } from './ResultadoSiodSolicitudFalla';

export type ParametrosSiodUpdateFinalizacionFalla = {
  idSolicitud: number;
  fechaRetornoLocal: string;
  urlUpdateSiod?: string;
  onProgreso?: (mensaje: string) => void;
};

/** Update SIOD cuando la solicitud pasa a Finalizada (edición o gestión). */
export async function SincronizarSiodUpdateTrasFinalizacionFalla(
  params: ParametrosSiodUpdateFinalizacionFalla
): Promise<ResultadoSincronizacionSiodFalla> {
  const { idSolicitud, fechaRetornoLocal, urlUpdateSiod, onProgreso } = params;
  const pasos: PasoSiodSolicitudFalla[] = [];

  if (!urlUpdateSiod) {
    pasos.push({
      operacion: 'update',
      intentado: false,
      exito: false,
      mensaje:
        'Integración SIOD (actualización): no configurada en el web part. La finalización quedó registrada solo en SharePoint.'
    });
    return { pasos };
  }

  const fechaefectivafin = FormatearFechaHoraLocalParaSiodApi(fechaRetornoLocal.trim());
  if (!fechaefectivafin) {
    pasos.push({
      operacion: 'update',
      intentado: false,
      exito: false,
      mensaje:
        'Integración SIOD (actualización): no se envió porque la fecha de retorno no tiene un formato válido para el API.'
    });
    return { pasos };
  }

  onProgreso?.('Conectando con SIOD para registrar la fecha efectiva de retorno…');
  const resultado = await ActualizarAltaSiodSolicitudFalla(urlUpdateSiod, {
    idreg: String(idSolicitud),
    fechaefectivafin
  });

  pasos.push({
    operacion: 'update',
    intentado: true,
    exito: resultado.exito,
    mensaje: MensajeUsuarioResultadoPostSiodFalla(resultado, 'actualización')
  });

  return { pasos };
}