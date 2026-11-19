import type { WebPartContext } from '@microsoft/sp-webpart-base';
import {
  CerrarBitacoraActualSolicitudFalla,
  CrearEntradaBitacoraCierreSolicitudFalla,
  ResolverIdBitacoraActualSolicitudFalla
} from './BitacoraSolicitudFallaServicio';
import { ActualizarIdBitacoraFalla, FinalizarSolicitudFallaEnSharePoint } from './SolicitudFallaCrudServicio';

export type ParametrosFinalizarGestionSolicitudFalla = {
  idSolicitudFalla: number;
  idBitacoraReferencia?: string;
  observaciones: string;
};

export async function FinalizarGestionSolicitudFallaConBitacora(
  context: WebPartContext,
  params: ParametrosFinalizarGestionSolicitudFalla
): Promise<void> {
  const idBitacoraActual = await ResolverIdBitacoraActualSolicitudFalla(
    context,
    params.idSolicitudFalla,
    params.idBitacoraReferencia
  );

  await CerrarBitacoraActualSolicitudFalla(context, idBitacoraActual, params.observaciones);

  const idBitacoraCierre = await CrearEntradaBitacoraCierreSolicitudFalla(context, params.idSolicitudFalla);

  await FinalizarSolicitudFallaEnSharePoint(context, params.idSolicitudFalla, {
    observaciones: params.observaciones
  });
  await ActualizarIdBitacoraFalla(context, params.idSolicitudFalla, idBitacoraCierre);
}