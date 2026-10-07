import { VERSION_CACHE_GRUPOS_USUARIO, VERSION_CACHE_SISTEMA_ACCESOS } from '../../constants/ConfiguracionCacheMenu';

export function ConstruirClaveCacheSistemaAccesos(siteId: string): string {
  return `sistema_accesos_${siteId}_${VERSION_CACHE_SISTEMA_ACCESOS}`;
}

export function ConstruirClaveCacheGruposUsuario(siteId: string, userId: string): string {
  const userIdSeguro = userId.replace(/[^\w.-@]/g, '_');
  return `sistema_grupos_${siteId}_${userIdSeguro}_${VERSION_CACHE_GRUPOS_USUARIO}`;
}
