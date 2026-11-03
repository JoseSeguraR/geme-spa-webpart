import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { DisponibilidadSubequipoOperador } from '../../../components/vistas/cor-conecta/concentrador/operador-renovable/constantesOperadorRenovable';
import type {
  EquipoOperadorTarjeta,
  EstadoRegistroSubequipoOperador,
  SubequipoOperador
} from '../../../models/operadorRenovable/CatalogoEquiposOperador';
import type { RespuestaListaSharePoint } from '../RespuestaListaSharePoint';
import { SharePointRestError } from '../SharePointRestError';
import {
  CampoLookupTipoEquipoSubequipo,
  CampoSharePointCapacidadActualMw,
  CampoSharePointCapacidadMaximaMw,
  DisponibilidadSubequipoDisponible,
  DisponibilidadSubequipoIndisponible
} from './CamposOperadorRenovable';
import { ObtenerInstalacionesOperadorRenovable } from './InstalacionesOperadorRenovableServicio';
import { NombreListaEquiposConcentrador, NombreListaSubequiposOperador } from './NombresListasOperadorRenovable';
import {
  CalcularResumenMwEquipo,
  NormalizarCapacidadActualAlLeer,
  ParsearCapacidadesMwTexto,
  ResolverCapacidadMaximaMwSubequipo
} from './UtilidadesCapacidadSubequipo';

/** Tras `$expand=TIPOEQUIPO`, en sitio `geme` solo es válido `$select=TIPOEQUIPO/TIPOEQUIPO`. */
type LookupTipoEquipoSharePoint = {
  TIPOEQUIPO?: string;
};

type ElementoSubequipoSharePoint = {
  Id?: number;
  Title?: string;
  CODIGO?: string;
  CAPACIDAD_MAXIMA_MW?: number;
  CAPACIDADES_MW?: string;
  CAPACIDAD_ACTUAL_MW?: number;
  ESTADO?: string;
  DISPONIBILIDAD?: string;
  MOTIVO?: string;
  DESCRIPCION?: string;
  FECHA_INDISPONIBILIDAD?: string;
  EQUIPOId?: number;
  TIPOEQUIPO?: LookupTipoEquipoSharePoint;
};

type ElementoEquipoSharePoint = {
  Id?: number;
  EQUIPO?: string;
  INSTALACIONId?: number;
  ESTADO?: string;
};

type MetaEquipo = {
  nombre: string;
  centralId: number;
  estadoEquipo: string;
};

export type ParametrosTarjetasEquiposOperador = {
  /** Si es false, solo equipos con `ESTADO = Activo` (salvo filtro catálogo «Todos»). */
  incluirEquiposInactivos: boolean;
};

async function ValidarRespuesta(response: SPHttpClientResponse, operacion: string, url: string): Promise<void> {
  if (response.ok) {
    return;
  }
  throw new SharePointRestError(operacion, url, response.status, response.statusText);
}

function ResolverDisponibilidad(valor: string | undefined): DisponibilidadSubequipoOperador {
  return valor === DisponibilidadSubequipoIndisponible ? DisponibilidadSubequipoIndisponible : DisponibilidadSubequipoDisponible;
}

function ResolverEstadoRegistro(valor: string | undefined): EstadoRegistroSubequipoOperador {
  if (valor === 'Inactivo' || valor === 'Baja') {
    return valor;
  }
  return 'Activo';
}

function EtiquetaTipoEquipo(tipo: LookupTipoEquipoSharePoint | undefined): { codigo: string; nombre: string } {
  const etiqueta = (tipo?.TIPOEQUIPO ?? '').trim();
  return { codigo: etiqueta, nombre: etiqueta };
}

function NormalizarSubequipo(elemento: ElementoSubequipoSharePoint): SubequipoOperador | undefined {
  if (typeof elemento.Id !== 'number' || typeof elemento.EQUIPOId !== 'number') {
    return undefined;
  }
  const disponibilidad = ResolverDisponibilidad(elemento.DISPONIBILIDAD);
  const valorActualLista = elemento.CAPACIDAD_ACTUAL_MW;
  const capacidadMw = ResolverCapacidadMaximaMwSubequipo({
    capacidadMaximaLista: elemento.CAPACIDAD_MAXIMA_MW,
    capacidadesMwTexto: elemento.CAPACIDADES_MW,
    disponibilidad,
    capacidadActualLista: valorActualLista
  });
  const capacidadActualMw = NormalizarCapacidadActualAlLeer(disponibilidad, capacidadMw, valorActualLista);

  const codigo = (elemento.CODIGO ?? '').trim();
  const nombre = (elemento.Title ?? codigo).trim();
  const tipo = EtiquetaTipoEquipo(elemento.TIPOEQUIPO);

  return {
    id: elemento.Id,
    codigo: codigo || `#${elemento.Id}`,
    nombre,
    tipoCodigo: tipo.codigo,
    tipoNombre: tipo.nombre,
    capacidadMw,
    capacidadesMwOpciones: ParsearCapacidadesMwTexto(elemento.CAPACIDADES_MW, capacidadMw),
    capacidadActualMw,
    estadoRegistro: ResolverEstadoRegistro(elemento.ESTADO),
    disponibilidad,
    motivo: elemento.MOTIVO?.trim(),
    descripcion: elemento.DESCRIPCION?.trim(),
    fechaIndisponibilidad: elemento.FECHA_INDISPONIBILIDAD,
    equipoId: elemento.EQUIPOId
  };
}

function EquipoPadreActivo(meta: MetaEquipo | undefined): boolean {
  if (!meta) {
    return false;
  }
  const estado = (meta.estadoEquipo ?? 'Activo').trim();
  return estado === '' || estado === 'Activo';
}

function AgruparEnTarjetas(
  subequipos: SubequipoOperador[],
  metaPorEquipo: ReadonlyMap<number, MetaEquipo>,
  mapaCentralPorId: ReadonlyMap<number, { id: number; nombre: string }>,
  incluirEquiposInactivos: boolean
): EquipoOperadorTarjeta[] {
  const porEquipo = new Map<number, SubequipoOperador[]>();
  for (const sub of subequipos) {
    const lista = porEquipo.get(sub.equipoId) ?? [];
    lista.push(sub);
    porEquipo.set(sub.equipoId, lista);
  }

  const tarjetas: EquipoOperadorTarjeta[] = [];
  for (const [equipoId, subs] of Array.from(porEquipo.entries())) {
    const meta = metaPorEquipo.get(equipoId);
    if (!meta) {
      continue;
    }
    if (!incluirEquiposInactivos && !EquipoPadreActivo(meta)) {
      continue;
    }
    const subsVisibles = incluirEquiposInactivos
      ? subs
      : subs.filter((sub) => sub.estadoRegistro === 'Activo');
    if (subsVisibles.length === 0) {
      continue;
    }
    const central = mapaCentralPorId.get(meta.centralId);
    if (!central) {
      continue;
    }
    subsVisibles.sort((a, b) => a.codigo.localeCompare(b.codigo, 'es'));
    const resumen = CalcularResumenMwEquipo(subsVisibles);
    tarjetas.push({
      id: equipoId,
      nombreEquipo: meta.nombre,
      centralId: central.id,
      central: central.nombre,
      subequipos: subsVisibles,
      totalMw: resumen.totalMw,
      indisponibleMw: resumen.indisponibleMw
    });
  }

  tarjetas.sort((a, b) => {
    const cmpCentral = a.central.localeCompare(b.central, 'es');
    if (cmpCentral !== 0) {
      return cmpCentral;
    }
    return a.nombreEquipo.localeCompare(b.nombreEquipo, 'es');
  });

  return tarjetas;
}

async function ObtenerElementosSubequiposMantenedor(
  context: WebPartContext,
  operacion: string
): Promise<ElementoSubequipoSharePoint[]> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaSubequiposOperador);
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items` +
    `?$select=Id,Title,CODIGO,${CampoSharePointCapacidadMaximaMw},CAPACIDADES_MW,${CampoSharePointCapacidadActualMw},ESTADO,DISPONIBILIDAD,MOTIVO,DESCRIPCION,` +
    `FECHA_INDISPONIBILIDAD,EQUIPOId,${CampoLookupTipoEquipoSubequipo}/TIPOEQUIPO` +
    `&$expand=${CampoLookupTipoEquipoSubequipo}&$top=5000`;
  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  await ValidarRespuesta(response, operacion, url);
  const json = (await response.json()) as RespuestaListaSharePoint<ElementoSubequipoSharePoint>;
  return json.value;
}

/**
 * Equipos padre con su central. SharePoint REST no admite `$expand` anidado
 * (SUBEQUIPO → EQUIPO → INSTALACION), por eso la central se lee aquí y se une en cliente.
 */
async function ObtenerMetaEquiposPorId(
  context: WebPartContext,
  operacion: string
): Promise<Map<number, MetaEquipo>> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaEquiposConcentrador);
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items` +
    `?$select=Id,EQUIPO,INSTALACIONId,ESTADO&$top=5000`;
  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  await ValidarRespuesta(response, operacion, url);
  const json = (await response.json()) as RespuestaListaSharePoint<ElementoEquipoSharePoint>;

  const mapa = new Map<number, MetaEquipo>();
  for (const elemento of json.value) {
    if (typeof elemento.Id !== 'number' || typeof elemento.INSTALACIONId !== 'number') {
      continue;
    }
    mapa.set(elemento.Id, {
      nombre: (elemento.EQUIPO ?? `Equipo ${elemento.Id}`).trim(),
      centralId: elemento.INSTALACIONId,
      estadoEquipo: (elemento.ESTADO ?? 'Activo').trim()
    });
  }
  return mapa;
}

/** Todos los subequipos de CONC_MANTENEDOR_SUBEQUIPOS indexados por Id (join en cliente). */
export async function ObtenerMapaSubequiposPorId(
  context: WebPartContext
): Promise<Map<number, SubequipoOperador>> {
  const elementos = await ObtenerElementosSubequiposMantenedor(context, 'ObtenerMapaSubequiposPorId');
  const mapa = new Map<number, SubequipoOperador>();
  for (const elemento of elementos) {
    const sub = NormalizarSubequipo(elemento);
    if (sub) {
      mapa.set(sub.id, sub);
    }
  }
  return mapa;
}

export async function ObtenerTarjetasEquiposOperadorRenovable(
  context: WebPartContext,
  parametros: ParametrosTarjetasEquiposOperador = { incluirEquiposInactivos: false }
): Promise<EquipoOperadorTarjeta[]> {
  const operacion = 'ObtenerTarjetasEquiposOperadorRenovable';
  const instalaciones = await ObtenerInstalacionesOperadorRenovable(context);
  if (instalaciones.length === 0) {
    return [];
  }

  const [elementos, metaPorEquipo] = await Promise.all([
    ObtenerElementosSubequiposMantenedor(context, operacion),
    ObtenerMetaEquiposPorId(context, operacion)
  ]);

  const mapaCentralPorId = new Map(
    instalaciones.map((inst) => [inst.id, { id: inst.id, nombre: inst.central }])
  );

  const subequipos = elementos
    .map(NormalizarSubequipo)
    .filter((sub): sub is SubequipoOperador => {
      if (!sub) {
        return false;
      }
      const meta = metaPorEquipo.get(sub.equipoId);
      return meta !== undefined && mapaCentralPorId.has(meta.centralId);
    });

  return AgruparEnTarjetas(
    subequipos,
    metaPorEquipo,
    mapaCentralPorId,
    parametros.incluirEquiposInactivos
  );
}
