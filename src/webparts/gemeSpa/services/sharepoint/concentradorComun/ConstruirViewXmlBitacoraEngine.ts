import { CamposViewBitacoraEngine } from './CamposBitacoraEngine';
import { EscaparValorXmlCaml } from './EscaparXmlCaml';

export function ConstruirViewXmlBitacoraEngine(
  idRegistro: number,
  tipoRegistro: string,
  tamanoPagina: number
): string {
  const viewFields = CamposViewBitacoraEngine.map((campo) => `<FieldRef Name="${campo}" />`).join('');
  const tipoRegistroEscapado = EscaparValorXmlCaml(tipoRegistro);
  const where = `<Where><And><Eq><FieldRef Name="ID_REGISTRO" /><Value Type="Number">${idRegistro}</Value></Eq><Eq><FieldRef Name="TIPO_REGISTRO" /><Value Type="Text">${tipoRegistroEscapado}</Value></Eq></And></Where>`;
  const orderBy = '<OrderBy><FieldRef Name="ID" Ascending="FALSE" /></OrderBy>';

  return `<View Scope="RecursiveAll"><ViewFields>${viewFields}</ViewFields><Query>${where}${orderBy}</Query><RowLimit Paged="TRUE">${tamanoPagina}</RowLimit></View>`;
}
