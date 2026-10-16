import {
  CampoEstadoTareaActualIl,
  CampoLookupTareaActualIl,
  type EstadoSolicitudIl
} from '../../../components/vistas/cor-conecta/concentrador/solicitudes-il/constantesSolicitudesIl';
import { EscaparValorXmlCaml } from './EscaparXmlCaml';

export type ParametrosViewXmlSolicitudesIl = {
  estado: EstadoSolicitudIl;
  centralId?: number;
  /** Restringe INSTALACION (lookup) a estos IDs; p. ej. instalaciones del solicitante. */
  instalacionesPermitidasIds?: readonly number[];
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

function ConstruirFiltroInstalacion(centralId?: number, instalacionesPermitidasIds?: readonly number[]): string {
  if (centralId !== undefined && centralId !== null) {
    return `<Eq><FieldRef Name="INSTALACION" LookupId="TRUE" /><Value Type="Lookup">${centralId}</Value></Eq>`;
  }
  if (instalacionesPermitidasIds && instalacionesPermitidasIds.length > 0) {
    const valores = instalacionesPermitidasIds.map((id) => `<Value Type="Lookup">${id}</Value>`).join('');
    return `<In><FieldRef Name="INSTALACION" LookupId="TRUE" /><Values>${valores}</Values></In>`;
  }
  return '';
}

function ConstruirWhere(
  estado: EstadoSolicitudIl,
  centralId?: number,
  instalacionesPermitidasIds?: readonly number[]
): string {
  const filtroEstado = `<Eq><FieldRef Name="${CampoEstadoTareaActualIl}" /><Value Type="Text">${EscaparValorXmlCaml(estado)}</Value></Eq>`;
  const filtroInstalacion = ConstruirFiltroInstalacion(centralId, instalacionesPermitidasIds);

  if (!filtroInstalacion) {
    return `<Where>${filtroEstado}</Where>`;
  }

  return `<Where><And>${filtroEstado}${filtroInstalacion}</And></Where>`;
}

function ConstruirOrderBy(campoOrden: string, direccionOrden: 'asc' | 'desc'): string {
  const ascendente = direccionOrden === 'asc' ? 'TRUE' : 'FALSE';
  const campo = EscaparValorXmlCaml(campoOrden);
  return `<OrderBy><FieldRef Name="${campo}" Ascending="${ascendente}" /><FieldRef Name="ID" Ascending="TRUE" /></OrderBy>`;
}

export function ConstruirViewXmlSolicitudesIl(params: ParametrosViewXmlSolicitudesIl): string {
  const viewFields = CamposView.map((campo) => `<FieldRef Name="${campo}" />`).join('');
  const where = ConstruirWhere(params.estado, params.centralId, params.instalacionesPermitidasIds);
  const orderBy = ConstruirOrderBy(params.campoOrden, params.direccionOrden);

  return `<View Scope="RecursiveAll"><ViewFields>${viewFields}</ViewFields><Query>${where}${orderBy}</Query><RowLimit Paged="TRUE">${params.tamanoPagina}</RowLimit></View>`;
}
