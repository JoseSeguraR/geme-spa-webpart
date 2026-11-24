import type { WebPartContext } from '@microsoft/sp-webpart-base';
import {
  ResultadoIntegracionSiodExitosa,
  ResultadoIntegracionSiodFallida,
  TextoResponsableComentariosBitacoraIntegracionSiodExitosa,
  TextoResponsableComentariosBitacoraIntegracionSiodFallida
} from '../../../components/vistas/cor-conecta/concentrador/solicitudes-falla/constantesSolicitudFalla';
import {
  ConvertirIsoAFechaLocalInput,
  FormatearFechaHoraLocalParaSiodApi
} from '../../../utils/FechaHoraCorConecta';
import { ObtenerDetalleSolicitudFallaPorId } from './SolicitudFallaCrudServicio';
import { CrearEntradaBitacoraSolicitudFalla } from './BitacoraSolicitudFallaServicio';
import {
  InsertarAltaSiodSolicitudFalla,
  MensajeUsuarioResultadoPostSiodFalla
} from './SiodSolicitudFallaApiServicio';

export type ResultadoIntegracionSiodFalla = {
  exito: boolean;
  mensaje: string;
};

export async function IntegrarSolicitudFallaEnSiod(
  context: WebPartContext,
  idSolicitud: number,
  urlInsertSiod: string | undefined,
  onProgreso?: (mensaje: string) => void
): Promise<ResultadoIntegracionSiodFalla> {
  onProgreso?.('Cargando datos de la solicitud…');
  const detalle = await ObtenerDetalleSolicitudFallaPorId(context, idSolicitud);
  let exito = false;
  let mensaje = 'La integración no pudo completarse. Puede reintentar.';

  if (!urlInsertSiod) {
    mensaje = 'No hay URL de inserción SIOD configurada en el web part.';
  } else if (!detalle.centralId) {
    mensaje = 'No se encontró la central asociada a la solicitud.';
  } else if (!detalle.fechaPerturbacion) {
    mensaje = 'La solicitud no tiene fecha de perturbación para enviar a SIOD.';
  } else {
    const fechainicio = FormatearFechaHoraLocalParaSiodApi(
      ConvertirIsoAFechaLocalInput(detalle.fechaPerturbacion)
    );
    if (!fechainicio) {
      mensaje = 'La fecha de perturbación no tiene un formato válido para SIOD.';
    } else {
      onProgreso?.('Conectando con SIOD (Azure Function) para registrar la perturbación…');
      const resultado = await InsertarAltaSiodSolicitudFalla(urlInsertSiod, {
        idsolicitud: String(idSolicitud),
        instalacion: detalle.centralId,
        descripcion: detalle.descripcion.trim(),
        fechainicio
      });
      exito = resultado.exito;
      mensaje = MensajeUsuarioResultadoPostSiodFalla(resultado, 'inserción');
    }
  }

  onProgreso?.('Registrando resultado en bitácora…');

  const resultado = exito ? ResultadoIntegracionSiodExitosa : ResultadoIntegracionSiodFallida;
  const comentarioBitacora = exito
    ? TextoResponsableComentariosBitacoraIntegracionSiodExitosa
    : TextoResponsableComentariosBitacoraIntegracionSiodFallida;

  await CrearEntradaBitacoraSolicitudFalla(context, {
    idSolicitudFalla: idSolicitud,
    accion: 'Integración SIOD',
    estadoInicial: resultado,
    comentario: comentarioBitacora
  });

  return {
    exito,
    mensaje
  };
}