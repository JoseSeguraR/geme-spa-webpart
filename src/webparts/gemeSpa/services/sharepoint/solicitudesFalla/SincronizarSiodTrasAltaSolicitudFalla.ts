import type { DatosNuevaSolicitudFalla } from '../../../models/SolicitudFalla';
import { FormatearFechaHoraLocalParaSiodApi } from '../../../utils/FechaHoraCorConecta';
import {
  EstadoSolicitudFallaFinalizada,
  ResolverEstadoSolicitudFallaDesdeFechaRetorno
} from '../../../components/vistas/cor-conecta/concentrador/solicitudes-falla/constantesSolicitudFalla';
import {
  ActualizarAltaSiodSolicitudFalla,
  InsertarAltaSiodSolicitudFalla,
  MensajeUsuarioResultadoPostSiodFalla
} from './SiodSolicitudFallaApiServicio';
import type { PasoSiodSolicitudFalla, ResultadoSincronizacionSiodFalla } from './ResultadoSiodSolicitudFalla';

export type ParametrosSincronizarSiodTrasAltaSolicitudFalla = {
  idSolicitud: number;
  datos: DatosNuevaSolicitudFalla;
  fechaPerturbacionLocal: string;
  fechaRetornoLocal?: string;
  urlInsertSiod?: string;
  urlUpdateSiod?: string;
  onProgreso?: (mensaje: string) => void;
};

function PasoInsert(exito: boolean, mensajeBase: string): PasoSiodSolicitudFalla {
  return {
    operacion: 'insert',
    intentado: true,
    exito,
    mensaje: exito
      ? mensajeBase
      : `${mensajeBase} La solicitud quedó guardada en SharePoint.`
  };
}

function PasoUpdate(exito: boolean, mensajeBase: string): PasoSiodSolicitudFalla {
  return {
    operacion: 'update',
    intentado: true,
    exito,
    mensaje: mensajeBase
  };
}

/**
 * Insert SIOD tras alta en SharePoint; si queda Finalizada, update en el mismo flujo (orden fijo).
 */
export async function SincronizarSiodTrasAltaSolicitudFalla(
  params: ParametrosSincronizarSiodTrasAltaSolicitudFalla
): Promise<ResultadoSincronizacionSiodFalla> {
  const {
    idSolicitud,
    datos,
    fechaPerturbacionLocal,
    fechaRetornoLocal,
    urlInsertSiod,
    urlUpdateSiod,
    onProgreso
  } = params;

  const pasos: PasoSiodSolicitudFalla[] = [];

  if (!urlInsertSiod) {
    return { pasos };
  }

  const fechainicio = FormatearFechaHoraLocalParaSiodApi(fechaPerturbacionLocal);
  if (!fechainicio) {
    pasos.push({
      operacion: 'insert',
      intentado: false,
      exito: false,
      mensaje:
        'Integración SIOD (inserción): no se envió porque la fecha de perturbación no tiene un formato válido para el API.'
    });
    return { pasos };
  }

  onProgreso?.('Conectando con SIOD para registrar la perturbación…');
  const resultadoInsert = await InsertarAltaSiodSolicitudFalla(urlInsertSiod, {
    idsolicitud: String(idSolicitud),
    instalacion: datos.centralId,
    descripcion: datos.descripcion.trim(),
    fechainicio
  });
  pasos.push(PasoInsert(resultadoInsert.exito, MensajeUsuarioResultadoPostSiodFalla(resultadoInsert, 'inserción')));

  const estado = ResolverEstadoSolicitudFallaDesdeFechaRetorno(datos.fechaRetornoIso);
  if (estado !== EstadoSolicitudFallaFinalizada) {
    return { pasos };
  }

  if (!urlUpdateSiod) {
    pasos.push({
      operacion: 'update',
      intentado: false,
      exito: false,
      mensaje:
        'Integración SIOD (actualización): no configurada en el web part. La solicitud quedó Finalizada solo en SharePoint.'
    });
    return { pasos };
  }

  const retornoLocal = fechaRetornoLocal?.trim() ?? '';
  const fechaefectivafin = FormatearFechaHoraLocalParaSiodApi(retornoLocal);
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

  if (!resultadoInsert.exito) {
    pasos.push({
      operacion: 'update',
      intentado: false,
      exito: false,
      mensaje: 'Integración SIOD (actualización): omitida porque la inserción no fue exitosa.'
    });
    return { pasos };
  }

  onProgreso?.('Conectando con SIOD para registrar la fecha efectiva de retorno…');
  const resultadoUpdate = await ActualizarAltaSiodSolicitudFalla(urlUpdateSiod, {
    idreg: String(idSolicitud),
    fechaefectivafin
  });
  pasos.push(PasoUpdate(resultadoUpdate.exito, MensajeUsuarioResultadoPostSiodFalla(resultadoUpdate, 'actualización')));

  return { pasos };
}