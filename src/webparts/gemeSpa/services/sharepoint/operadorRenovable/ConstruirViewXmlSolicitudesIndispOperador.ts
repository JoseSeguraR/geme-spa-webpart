import {
  CampoEmpresaSolicitanteConcentrador,
  CampoEstadoTareaActualConcentrador,
  CampoInstalacionGmConcentrador,
  CampoLookupTareaActualConcentrador,
  CampoTieneSubequiposIndisponibles,
  EstadosEnCursoOperadorRenovable
} from './CamposOperadorRenovable';
import { EscaparValorXmlCaml } from '../concentradorComun/EscaparXmlCaml';

export type FiltroEstadoSolicitudesIndispOperador = 'enCurso' | 'todosEstados';

export type ParametrosViewXmlSolicitudesIndispOperador = {
  instalacionesPermitidasIds: readonly number[];
  tamanoPagina: number;
  campoOrden: string;
  direccionOrden: 'asc' | 'desc';
  filtroEstado: FiltroEstadoSolicitudesIndispOperador;
};

const CamposView = [
  'ID',
  'ID_SOLICITUD',
  'RELACION_SODI_CEN',
  CampoInstalacionGmConcentrador,
  'SOLICITANTE',
  CampoEmpresaSolicitanteConcentrador,
  'DESCRIPCION',
  'INICIO_PROGRAMADO',
  'INICIO_EFECTIVO',
  CampoLookupTareaActualConcentrador,
  CampoEstadoTareaActualConcentrador
] as const;

function CombinarFiltrosAnd(filtros: readonly string[]): string {
  const validos = filtros.filter((f) => f.length > 0);
  if (validos.length === 0) {
    return '';
  }
  if (validos.length === 1) {
    return validos[0];
  }
  return validos.reduce((acumulado, filtro) => `<And>${acumulado}${filtro}</And>`);
}

function ConstruirFiltroEstadosEnCurso(): string {
  const valores = EstadosEnCursoOperadorRenovable.map(
    (estado) => `<Value Type="Text">${EscaparValorXmlCaml(estado)}</Value>`
  ).join('');
  return `<In><FieldRef Name="${CampoEstadoTareaActualConcentrador}" /><Values>${valores}</Values></In>`;
}

function ConstruirFiltroTieneSubequiposIndisponibles(): string {
  return `<Eq><FieldRef Name="${CampoTieneSubequiposIndisponibles}" /><Value Type="Boolean">1</Value></Eq>`;
}

function ConstruirFiltroInstalaciones(ids: readonly number[]): string {
  if (ids.length === 0) {
    return '';
  }
  if (ids.length === 1) {
    return `<Eq><FieldRef Name="${CampoInstalacionGmConcentrador}" LookupId="TRUE" /><Value Type="Lookup">${ids[0]}</Value></Eq>`;
  }
  const valores = ids.map((id) => `<Value Type="Lookup">${id}</Value>`).join('');
  return `<In><FieldRef Name="${CampoInstalacionGmConcentrador}" LookupId="TRUE" /><Values>${valores}</Values></In>`;
}

export function ConstruirViewXmlSolicitudesIndispOperador(params: ParametrosViewXmlSolicitudesIndispOperador): string {
  const filtroTieneIndisp = ConstruirFiltroTieneSubequiposIndisponibles();
  const filtroInstalacion = ConstruirFiltroInstalaciones(params.instalacionesPermitidasIds);
  const filtroEnCurso = params.filtroEstado === 'enCurso' ? ConstruirFiltroEstadosEnCurso() : '';

  const whereInner = CombinarFiltrosAnd([filtroTieneIndisp, filtroInstalacion, filtroEnCurso]);

  const viewFields = CamposView.map((campo) => `<FieldRef Name="${campo}" />`).join('');
  const campoOrden = EscaparValorXmlCaml(params.campoOrden);
  const ascendente = params.direccionOrden === 'asc' ? 'TRUE' : 'FALSE';
  const orderBy = `<OrderBy><FieldRef Name="${campoOrden}" Ascending="${ascendente}" /><FieldRef Name="ID" Ascending="TRUE" /></OrderBy>`;

  return `<View Scope="RecursiveAll"><ViewFields>${viewFields}</ViewFields><Query><Where>${whereInner}</Where>${orderBy}</Query><RowLimit Paged="TRUE">${params.tamanoPagina}</RowLimit></View>`;
}
