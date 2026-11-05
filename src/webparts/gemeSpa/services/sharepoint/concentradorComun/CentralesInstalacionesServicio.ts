import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { CentralMantenedor } from '../../../models/concentradorComun/CentralMantenedor';
import type { RespuestaListaSharePoint } from '../RespuestaListaSharePoint';
import { SharePointRestError } from '../SharePointRestError';
import { ModuloFiltroInstalacionConcentrador, NombreListaCentrales } from './NombresListasConcentrador';
import { SelectCamposInstalacionesConcentrador } from './ResolverSelectInstalacionesConcentrador';

const EstadoInstalacionActiva = 'Activo';

type ElementoInstalacionSharePoint = {
  Id: number;
  INSTALACION?: string;
  CODIGO_SIOD?: string;
  MODULOS?: string | string[] | { results?: string[] };
  ESTADO?: string;
};

export type OpcionesCentralesInstalaciones = {
  /** Filtra instalaciones cuyo MODULOS incluye Concentrador (predeterminado true). */
  soloModuloConcentrador?: boolean;
  /**
   * Operador renovable (maqueta 03-nov-2026): solo instalaciones con `ESTADO = Activo`.
   * Equivalente a `obtenerCentralesRenovables()` sobre centrales activas.
   */
  soloRenovables?: boolean;
};

async function ValidarRespuesta(response: SPHttpClientResponse, operacion: string, url: string): Promise<void> {
  if (response.ok) {
    return;
  }
  throw new SharePointRestError(operacion, url, response.status, response.statusText);
}

function ModulosIncluyenConcentrador(modulos: ElementoInstalacionSharePoint['MODULOS']): boolean {
  if (modulos === undefined || modulos === null) {
    return false;
  }
  if (typeof modulos === 'string') {
    return modulos.split(';#').some((valor) => valor.trim() === ModuloFiltroInstalacionConcentrador);
  }
  if (Array.isArray(modulos)) {
    return modulos.some((valor) => valor === ModuloFiltroInstalacionConcentrador);
  }
  const resultados = modulos.results;
  return Array.isArray(resultados) && resultados.some((valor) => valor === ModuloFiltroInstalacionConcentrador);
}

/** Mismo criterio que maqueta: `instalacion.activo` ↔ columna `ESTADO` = Activo. */
export function InstalacionEsActivaEnMantenedor(elemento: Pick<ElementoInstalacionSharePoint, 'ESTADO'>): boolean {
  return (elemento.ESTADO ?? '').trim() === EstadoInstalacionActiva;
}

/**
 * @deprecated Usar `InstalacionEsActivaEnMantenedor`. Antes filtraba por `TIPO_SUBEQUIPO` / `ES_RENOVABLE` (revocado 03-nov-2026).
 */
export function InstalacionEsCentralOperadorRenovable(elemento: ElementoInstalacionSharePoint): boolean {
  return InstalacionEsActivaEnMantenedor(elemento);
}

export async function ObtenerCentralesInstalaciones(
  context: WebPartContext,
  opciones: OpcionesCentralesInstalaciones = {}
): Promise<CentralMantenedor[]> {
  const { soloModuloConcentrador = true, soloRenovables = false } = opciones;
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaCentrales);

  const filtros: string[] = [];
  if (soloModuloConcentrador) {
    filtros.push(`MODULOS eq '${ModuloFiltroInstalacionConcentrador.replace(/'/g, "''")}'`);
  }
  if (soloRenovables) {
    filtros.push(`ESTADO eq '${EstadoInstalacionActiva.replace(/'/g, "''")}'`);
  }

  const filtroQuery = filtros.length ? `&$filter=${encodeURIComponent(filtros.join(' and '))}` : '';
  const selectCampos = SelectCamposInstalacionesConcentrador();
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items` +
    `?$select=${selectCampos}` +
    `${filtroQuery}&$orderby=${encodeURIComponent('INSTALACION asc')}&$top=5000`;

  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  await ValidarRespuesta(response, 'ObtenerCentralesInstalaciones', url);

  const json = (await response.json()) as RespuestaListaSharePoint<ElementoInstalacionSharePoint>;
  return json.value
    .filter((elemento) => typeof elemento.Id === 'number')
    .filter((elemento) => !soloModuloConcentrador || ModulosIncluyenConcentrador(elemento.MODULOS))
    .filter((elemento) => !soloRenovables || InstalacionEsActivaEnMantenedor(elemento))
    .map((elemento) => ({
      id: elemento.Id,
      central: (elemento.INSTALACION ?? '').trim(),
      codigoSiod: (elemento.CODIGO_SIOD ?? '').trim(),
      esRenovable: InstalacionEsActivaEnMantenedor(elemento)
    }))
    .filter((central) => central.central.length > 0);
}

/** Alias histórico usado por Solicitudes IL. */
export async function ObtenerCentralesDesdeSharePoint(context: WebPartContext): Promise<CentralMantenedor[]> {
  return ObtenerCentralesInstalaciones(context, { soloModuloConcentrador: true, soloRenovables: false });
}

/** Ámbito de centrales del operador renovable: activas + módulo Concentrador. */
export async function ObtenerCentralesRenovablesDesdeSharePoint(context: WebPartContext): Promise<CentralMantenedor[]> {
  return ObtenerCentralesInstalaciones(context, { soloModuloConcentrador: true, soloRenovables: true });
}
