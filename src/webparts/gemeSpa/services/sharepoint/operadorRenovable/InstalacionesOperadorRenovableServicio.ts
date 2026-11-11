import { SPHttpClient } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { CentralMantenedor } from '../../../models/concentradorComun/CentralMantenedor';
import { ObtenerCentralesRenovablesDesdeSharePoint } from '../concentradorComun/CentralesInstalacionesServicio';
import { ObtenerIdsInstalacionesUsuarioActual } from '../concentradorComun/UsuarioInstalacionesServicio';
import { NombreListaCentrales } from '../concentradorComun/NombresListasConcentrador';
import { CampoFacilityIdMeteologica } from './CamposOperadorRenovable';

/**
 * Centrales del operador: instalaciones **activas** (`ESTADO = Activo`) con módulo Concentrador,
 * intersectadas con USUARIOSINSTALACIONES cuando el usuario tiene instalaciones asignadas
 * (maqueta 03-nov-2026: todas las activas; tipo en subequipo, no en Instalaciones).
 */
export async function ObtenerInstalacionesOperadorRenovable(
  context: WebPartContext
): Promise<CentralMantenedor[]> {
  const [renovables, idsUsuario] = await Promise.all([
    ObtenerCentralesRenovablesDesdeSharePoint(context),
    ObtenerIdsInstalacionesUsuarioActual(context)
  ]);

  if (idsUsuario.length === 0) {
    return renovables;
  }

  const permitidas = new Set(idsUsuario);
  return renovables.filter((central) => permitidas.has(central.id));
}

/**
 * ID de la central en Meteológica (`FACILITY_ID_METEOLOGICA` de `CONC_MANTENEDOR_INSTALACIONES`).
 * undefined si está vacío o la columna aún no existe en el sitio.
 */
export async function ObtenerFacilityIdMeteologicaCentral(
  context: WebPartContext,
  centralId: number
): Promise<string | undefined> {
  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaCentrales);
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items(${centralId})` +
    `?$select=${CampoFacilityIdMeteologica}`;
  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  if (!response.ok) {
    return undefined;
  }
  const json = (await response.json()) as Record<string, string | null | undefined>;
  const facilityId = (json[CampoFacilityIdMeteologica] ?? '').trim();
  return facilityId || undefined;
}
