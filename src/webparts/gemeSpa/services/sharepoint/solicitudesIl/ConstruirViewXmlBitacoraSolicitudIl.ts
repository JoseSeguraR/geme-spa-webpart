import { TipoRegistroBitacoraSolicitudIl } from '../../../components/vistas/cor-conecta/concentrador/solicitudes-il/constantesSolicitudesIl';
import { ConstruirViewXmlBitacoraEngine } from '../concentradorComun/ConstruirViewXmlBitacoraEngine';

export function ConstruirViewXmlBitacoraSolicitudIl(idRegistroSolicitud: number, tamanoPagina: number): string {
  return ConstruirViewXmlBitacoraEngine(idRegistroSolicitud, TipoRegistroBitacoraSolicitudIl, tamanoPagina);
}
