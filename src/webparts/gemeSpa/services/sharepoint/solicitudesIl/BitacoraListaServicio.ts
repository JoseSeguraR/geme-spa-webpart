import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { TipoRegistroBitacoraSolicitudIl } from '../../../components/vistas/cor-conecta/concentrador/solicitudes-il/constantesSolicitudesIl';
import type { FilaBitacoraSolicitudIl } from '../../../models/BitacoraSolicitudIl';
import { ObtenerFilasBitacoraEngine } from '../concentradorComun/BitacoraEngineListaServicio';

export async function ObtenerFilasBitacoraSolicitudIl(
  context: WebPartContext,
  idSolicitudIl: number
): Promise<FilaBitacoraSolicitudIl[]> {
  return ObtenerFilasBitacoraEngine(context, idSolicitudIl, TipoRegistroBitacoraSolicitudIl);
}
