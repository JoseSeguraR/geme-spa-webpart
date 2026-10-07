import type { WebPartContext } from '@microsoft/sp-webpart-base';
import {
  TTL_SISTEMA_ACCESOS_MS,
  VERSION_CACHE_SISTEMA_ACCESOS
} from '../../constants/ConfiguracionCacheMenu';
import type { RegistroSistemaAccesoNormalizado } from '../../models/SistemaAcceso';
import { GuardarEntradaCacheLocal, LeerEntradaCacheLocal } from '../cache/AlmacenCacheLocal';
import { ConstruirClaveCacheSistemaAccesos } from '../cache/ClavesCacheMenu';
import { ObtenerRegistrosSistemaAccesosDesdeSharePoint } from '../sharepoint/SistemaAccesosServicio';

export async function ObtenerRegistrosSistemaAccesosConCache(
  context: WebPartContext,
  forzarRecarga: boolean
): Promise<RegistroSistemaAccesoNormalizado[]> {
  const siteId = context.pageContext.site.id.toString();
  const clave = ConstruirClaveCacheSistemaAccesos(siteId);

  if (!forzarRecarga) {
    const enCache = LeerEntradaCacheLocal<RegistroSistemaAccesoNormalizado[]>(
      clave,
      VERSION_CACHE_SISTEMA_ACCESOS,
      TTL_SISTEMA_ACCESOS_MS
    );
    if (enCache) {
      return enCache;
    }
  }

  const registros = await ObtenerRegistrosSistemaAccesosDesdeSharePoint(context);
  GuardarEntradaCacheLocal(clave, VERSION_CACHE_SISTEMA_ACCESOS, registros);
  return registros;
}
