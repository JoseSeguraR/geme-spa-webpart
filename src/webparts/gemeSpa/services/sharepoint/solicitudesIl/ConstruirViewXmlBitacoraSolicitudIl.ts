import {
  CampoAccionAvanceBitacoraIl,
  CampoEstadoDestinoBitacoraIl,
  CampoTareaOrigenBitacoraIl,
  TipoRegistroBitacoraSolicitudIl
} from '../../../components/vistas/cor-conecta/concentrador/administrador/constantesSolicitudesIl';
import { EscaparValorXmlCaml } from './EscaparXmlCaml';

const CamposViewBitacora = [
  'ID',
  'TAREAORIGEN_FECHAINGRESO',
  'TAREAORIGEN_ESTADO',
  'TAREAORIGEN_FECHASALIDA',
  'TAREAORIGEN',
  CampoTareaOrigenBitacoraIl,
  'ACCIONAVANCE',
  CampoAccionAvanceBitacoraIl,
  'USUARIOAVANCE',
  'TAREADESTINO',
  CampoEstadoDestinoBitacoraIl
] as const;

export function ConstruirViewXmlBitacoraSolicitudIl(idRegistroSolicitud: number, tamanoPagina: number): string {
  const viewFields = CamposViewBitacora.map((campo) => `<FieldRef Name="${campo}" />`).join('');
  const tipoRegistro = EscaparValorXmlCaml(TipoRegistroBitacoraSolicitudIl);
  const where = `<Where><And><Eq><FieldRef Name="ID_REGISTRO" /><Value Type="Number">${idRegistroSolicitud}</Value></Eq><Eq><FieldRef Name="TIPO_REGISTRO" /><Value Type="Text">${tipoRegistro}</Value></Eq></And></Where>`;
  const orderBy = '<OrderBy><FieldRef Name="ID" Ascending="FALSE" /></OrderBy>';

  return `<View Scope="RecursiveAll"><ViewFields>${viewFields}</ViewFields><Query>${where}${orderBy}</Query><RowLimit Paged="TRUE">${tamanoPagina}</RowLimit></View>`;
}
