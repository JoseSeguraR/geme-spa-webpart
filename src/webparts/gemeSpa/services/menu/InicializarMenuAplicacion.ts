import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { ResultadoInicializacionMenu } from '../../models/ResultadoInicializacionMenu';
import {
  EstablecerResultadoMenuMemoria,
  LimpiarResultadoMenuMemoria,
  ObtenerResultadoMenuMemoria
} from './EstadoMenuMemoria';
import { ObtenerGruposUsuarioConCache } from './ObtenerGruposUsuarioConCache';
import { ObtenerRegistrosSistemaAccesosConCache } from './ObtenerRegistrosSistemaAccesosConCache';
import { ProcesarMenuDesdeRegistros } from './ProcesarMenuDesdeRegistros';

export type OpcionesInicializarMenuAplicacion = {
  context: WebPartContext;
  forzarRecarga?: boolean;
};

/**
 * Obtiene SISTEMA_ACCESOS y grupos del usuario (memoria → localStorage → SharePoint),
 * procesa audiencias, árbol, rutas hash y deja el resultado en memoria para la sesión SPA.
 */
export async function InicializarMenuAplicacion(
  opciones: OpcionesInicializarMenuAplicacion
): Promise<ResultadoInicializacionMenu> {
  const { context, forzarRecarga = false } = opciones;

  if (forzarRecarga) {
    LimpiarResultadoMenuMemoria();
  }

  if (!forzarRecarga) {
    const memoria = ObtenerResultadoMenuMemoria();
    if (memoria) {
      return memoria;
    }
  }

  const [registros, idsGruposUsuario] = await Promise.all([
    ObtenerRegistrosSistemaAccesosConCache(context, forzarRecarga),
    ObtenerGruposUsuarioConCache(context, forzarRecarga)
  ]);

  const resultado = ProcesarMenuDesdeRegistros(registros, idsGruposUsuario);
  EstablecerResultadoMenuMemoria(resultado);
  return resultado;
}
