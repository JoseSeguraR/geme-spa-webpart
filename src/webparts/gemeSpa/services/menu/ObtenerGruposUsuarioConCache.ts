import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { TTL_GRUPOS_USUARIO_MS, VERSION_CACHE_GRUPOS_USUARIO } from '../../constants/ConfiguracionCacheMenu';
import { GuardarEntradaCacheLocal, LeerEntradaCacheLocal } from '../cache/AlmacenCacheLocal';
import { ConstruirClaveCacheGruposUsuario } from '../cache/ClavesCacheMenu';
import { ObtenerIdsGruposUsuarioDesdeSharePoint } from '../sharepoint/GruposUsuarioServicio';

export async function ObtenerGruposUsuarioConCache(
  context: WebPartContext,
  forzarRecarga: boolean
): Promise<number[]> {
  const siteId = context.pageContext.site.id.toString();
  const userId = context.pageContext.user.loginName;
  const clave = ConstruirClaveCacheGruposUsuario(siteId, userId);

  if (!forzarRecarga) {
    const enCache = LeerEntradaCacheLocal<number[]>(clave, VERSION_CACHE_GRUPOS_USUARIO, TTL_GRUPOS_USUARIO_MS);
    if (enCache) {
      return enCache;
    }
  }

  const idsGrupos = await ObtenerIdsGruposUsuarioDesdeSharePoint(context);
  GuardarEntradaCacheLocal(clave, VERSION_CACHE_GRUPOS_USUARIO, idsGrupos);
  return idsGrupos;
}
