import {
  CampoEstadoTareaActualIl,
  CampoLookupTareaActualIl,
  type EstadoSolicitudIl
} from '../../../components/vistas/cor-conecta/concentrador/administrador/constantesSolicitudesIl';
import { EscaparValorXmlCaml } from './EscaparXmlCaml';

export type ParametrosViewXmlSolicitudesIl = {
  estado: EstadoSolicitudIl;
  centralId?: number;
  tamanoPagina: number;
  campoOrden: string;
  direccionOrden: 'asc' | 'desc';
};

const CamposView = [
  'ID',
  'ID_CEN',
  'INSTALACION',
  'DESCRIPCION',
  'FECHA_INICIO',
  'FECHA_FIN',
  CampoLookupTareaActualIl,
  CampoEstadoTareaActualIl
] as const;

function ConstruirWhere(estado: EstadoSolicitudIl, centralId?: number): string {
  const filtroEstado = `<Eq><FieldRef Name="${CampoEstadoTareaActualIl}" /><Value Type="Text">${EscaparValorXmlCaml(estado)}</Value></Eq>`;

  if (centralId === undefined || centralId === null) {
    return `<Where>${filtroEstado}</Where>`;
  }

  return `<Where><And>${filtroEstado}<Eq><FieldRef Name="INSTALACION" LookupId="TRUE" /><Value Type="Lookup">${centralId}</Value></Eq></And></Where>`;
}

function ConstruirOrderBy(campoOrden: string, direccionOrden: 'asc' | 'desc'): string {
  const ascendente = direccionOrden === 'asc' ? 'TRUE' : 'FALSE';
  const campo = EscaparValorXmlCaml(campoOrden);
  return `<OrderBy><FieldRef Name="${campo}" Ascending="${ascendente}" /><FieldRef Name="ID" Ascending="TRUE" /></OrderBy>`;
}

export function ConstruirViewXmlSolicitudesIl(params: ParametrosViewXmlSolicitudesIl): string {
  const viewFields = CamposView.map((campo) => `<FieldRef Name="${campo}" />`).join('');
  const where = ConstruirWhere(params.estado, params.centralId);
  const orderBy = ConstruirOrderBy(params.campoOrden, params.direccionOrden);

  return `<View Scope="RecursiveAll"><ViewFields>${viewFields}</ViewFields><Query>${where}${orderBy}</Query><RowLimit Paged="TRUE">${params.tamanoPagina}</RowLimit></View>`;
}
