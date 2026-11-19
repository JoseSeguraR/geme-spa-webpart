import type { WebPartContext } from '@microsoft/sp-webpart-base';
import {
  ResultadoIntegracionSiodExitosa,
  ResultadoIntegracionSiodFallida
} from '../../../components/vistas/cor-conecta/concentrador/solicitudes-falla/constantesSolicitudFalla';
import { ObtenerCentralesDesdeSharePoint } from '../solicitudesIl/CentralesServicio';
import { ParsearIdCentralDesdeCodigoSiod } from '../solicitudesIl/ParsearIdCentralSiod';
import { ObtenerDetalleSolicitudFallaPorId } from './SolicitudFallaCrudServicio';
import { CrearEntradaBitacoraSolicitudFalla } from './BitacoraSolicitudFallaServicio';
import { InsertarSolicitudFallaEnSiod } from './SiodSolicitudFallaApiServicio';

export type ResultadoIntegracionSiodFalla = {
  exito: boolean;
  mensaje: string;
};

export async function IntegrarSolicitudFallaEnSiod(
  context: WebPartContext,
  idSolicitud: number,
  urlInsertSiod: string | undefined
): Promise<ResultadoIntegracionSiodFalla> {
  const detalle = await ObtenerDetalleSolicitudFallaPorId(context, idSolicitud);
  const centrales = await ObtenerCentralesDesdeSharePoint(context);
  const central = centrales.find((c) => c.id === detalle.centralId);
  let exito = false;
  if (urlInsertSiod && central && detalle.fechaPerturbacion) {
    try {
      const idCentral = ParsearIdCentralDesdeCodigoSiod(central.codigoSiod, central.central);
      const cuerpo = {
        idsolicitud: String(idSolicitud),
        idCentral,
        descripcion: detalle.descripcion,
        fechainicio: detalle.fechaPerturbacion,
        ...(detalle.fechaRetorno ? { fechaFin: detalle.fechaRetorno } : {})
      };
      exito = await InsertarSolicitudFallaEnSiod(urlInsertSiod, cuerpo);
    } catch {
      exito = false;
    }
  }

  const resultado = exito ? ResultadoIntegracionSiodExitosa : ResultadoIntegracionSiodFallida;

  await CrearEntradaBitacoraSolicitudFalla(context, {
    idSolicitudFalla: idSolicitud,
    accion: 'Integración SIOD',
    estadoInicial: resultado,
    comentario: resultado
  });

  return {
    exito,
    mensaje: exito ? 'Integración exitosa.' : 'La integración no pudo completarse. Puede reintentar.'
  };
}