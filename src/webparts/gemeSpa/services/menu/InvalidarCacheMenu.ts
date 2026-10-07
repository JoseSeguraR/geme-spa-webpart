import type { WebPartContext } from '@microsoft/sp-webpart-base';
import {
  VERSION_CACHE_GRUPOS_USUARIO,
  VERSION_CACHE_SISTEMA_ACCESOS
} from '../../constants/ConfiguracionCacheMenu';
import { EliminarEntradaCacheLocal } from '../cache/AlmacenCacheLocal';
import { ConstruirClaveCacheGruposUsuario, ConstruirClaveCacheSistemaAccesos } from '../cache/ClavesCacheMenu';
import { LimpiarResultadoMenuMemoria } from './EstadoMenuMemoria';

export function InvalidarCacheMenu(context: WebPartContext): void {
  const siteId = context.pageContext.site.id.toString();
  const userId = context.pageContext.user.loginName;

  EliminarEntradaCacheLocal(ConstruirClaveCacheSistemaAccesos(siteId));
  EliminarEntradaCacheLocal(ConstruirClaveCacheGruposUsuario(siteId, userId));
  LimpiarResultadoMenuMemoria();
}

export function ObtenerVersionesCacheMenu(): {
  versionSistemaAccesos: string;
  versionGruposUsuario: string;
} {
  return {
    versionSistemaAccesos: VERSION_CACHE_SISTEMA_ACCESOS,
    versionGruposUsuario: VERSION_CACHE_GRUPOS_USUARIO
  };
}
