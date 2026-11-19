import {
  CampoEstadoSolicitudFalla,
  CampoFechaPerturbacionSolicitudFalla,
  CampoFechaRetornoSolicitudFalla,
  CampoLookupEquiposSolicitudFalla,
  CampoLookupInstalacionGmSolicitudFalla,
  CamposConsultaGrillaSolicitudFalla
} from './CamposListaSolicitudFalla';
import {
  EstadoSolicitudFallaFinalizada,
  EstadoSolicitudFallaVigente
} from '../../../components/vistas/cor-conecta/concentrador/solicitudes-falla/constantesSolicitudFalla';
import type { EstadoFiltroSolicitudFalla } from '../../../models/SolicitudFalla';
import { EscaparValorXmlCaml } from '../solicitudesIl/EscaparXmlCaml';

export type ParametrosViewXmlSolicitudFalla = {
  estadoFiltro: EstadoFiltroSolicitudFalla;
  centralId?: number;
  equiposIdsFiltro?: readonly number[];
  instalacionesPermitidasIds?: readonly number[];
  fechaPerturbacionDesdeIso?: string;
  fechaPerturbacionHastaIso?: string;
  fechaRetornoDesdeIso?: string;
  fechaRetornoHastaIso?: string;
  tamanoPagina: number;
  campoOrden: string;
  direccionOrden: 'asc' | 'desc';
};

function ConstruirFiltroEstado(estadoFiltro: EstadoFiltroSolicitudFalla): string {
  if (estadoFiltro === 'Todas') {
    return '';
  }
  const valor = estadoFiltro === 'Vigente' ? EstadoSolicitudFallaVigente : EstadoSolicitudFallaFinalizada;
  return `<Eq><FieldRef Name="${CampoEstadoSolicitudFalla}" /><Value Type="Text">${EscaparValorXmlCaml(valor)}</Value></Eq>`;
}

function ConstruirFiltroInstalacion(centralId?: number, instalacionesPermitidasIds?: readonly number[]): string {
  if (centralId !== undefined && centralId !== null) {
    return `<Eq><FieldRef Name="${CampoLookupInstalacionGmSolicitudFalla}" LookupId="TRUE" /><Value Type="Lookup">${centralId}</Value></Eq>`;
  }
  if (instalacionesPermitidasIds && instalacionesPermitidasIds.length > 0) {
    const valores = instalacionesPermitidasIds.map((id) => `<Value Type="Lookup">${id}</Value>`).join('');
    return `<In><FieldRef Name="${CampoLookupInstalacionGmSolicitudFalla}" LookupId="TRUE" /><Values>${valores}</Values></In>`;
  }
  return '';
}

function ConstruirFiltroFecha(
  nombreCampo: string,
  desdeIso?: string,
  hastaIso?: string
): string {
  const partes: string[] = [];
  if (desdeIso) {
    partes.push(
      `<Geq><FieldRef Name="${nombreCampo}" /><Value Type="DateTime" IncludeTimeValue="TRUE">${EscaparValorXmlCaml(desdeIso)}</Value></Geq>`
    );
  }
  if (hastaIso) {
    partes.push(
      `<Leq><FieldRef Name="${nombreCampo}" /><Value Type="DateTime" IncludeTimeValue="TRUE">${EscaparValorXmlCaml(hastaIso)}</Value></Leq>`
    );
  }
  if (partes.length === 0) {
    return '';
  }
  if (partes.length === 1) {
    return partes[0];
  }
  return `<And>${partes[0]}${partes[1]}</And>`;
}

function AnidarComparadores(elemento: 'And' | 'Or', condiciones: string[]): string {
  const activas = condiciones.filter(Boolean);
  if (activas.length === 0) {
    return '';
  }
  if (activas.length === 1) {
    return activas[0];
  }
  let combinado = activas[activas.length - 1];
  for (let indice = activas.length - 2; indice >= 0; indice -= 1) {
    combinado = `<${elemento}>${activas[indice]}${combinado}</${elemento}>`;
  }
  return combinado;
}

function AnidarFiltros(filtros: string[]): string {
  const combinado = AnidarComparadores('And', filtros);
  if (!combinado) {
    return '';
  }
  return `<Where>${combinado}</Where>`;
}

function ConstruirFiltroEquipos(equiposIds?: readonly number[]): string {
  if (!equiposIds || equiposIds.length === 0) {
    return '';
  }
  const condiciones = equiposIds.map(
    (id) =>
      `<Eq><FieldRef Name="${CampoLookupEquiposSolicitudFalla}" LookupId="TRUE" /><Value Type="Lookup">${id}</Value></Eq>`
  );
  return AnidarComparadores('Or', condiciones);
}

function ConstruirOrderBy(campoOrden: string, direccionOrden: 'asc' | 'desc'): string {
  const ascendente = direccionOrden === 'asc' ? 'TRUE' : 'FALSE';
  const campo = EscaparValorXmlCaml(campoOrden);
  return `<OrderBy><FieldRef Name="${campo}" Ascending="${ascendente}" /><FieldRef Name="ID" Ascending="TRUE" /></OrderBy>`;
}

export function ConstruirViewXmlSolicitudFalla(params: ParametrosViewXmlSolicitudFalla): string {
  const viewFields = CamposConsultaGrillaSolicitudFalla.map((campo) => `<FieldRef Name="${campo}" />`).join('');
  const filtros = [
    ConstruirFiltroEstado(params.estadoFiltro),
    ConstruirFiltroInstalacion(params.centralId, params.instalacionesPermitidasIds),
    ConstruirFiltroEquipos(params.equiposIdsFiltro),
    ConstruirFiltroFecha(
      CampoFechaPerturbacionSolicitudFalla,
      params.fechaPerturbacionDesdeIso,
      params.fechaPerturbacionHastaIso
    ),
    ConstruirFiltroFecha(
      CampoFechaRetornoSolicitudFalla,
      params.fechaRetornoDesdeIso,
      params.fechaRetornoHastaIso
    )
  ];
  const where = AnidarFiltros(filtros);
  const orderBy = ConstruirOrderBy(params.campoOrden, params.direccionOrden);

  return `<View Scope="RecursiveAll"><ViewFields>${viewFields}</ViewFields><Query>${where}${orderBy}</Query><RowLimit Paged="TRUE">${params.tamanoPagina}</RowLimit></View>`;
}