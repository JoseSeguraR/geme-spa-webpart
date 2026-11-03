import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { CentralMantenedor } from '../../../models/concentradorComun/CentralMantenedor';
import { ObtenerCentralesRenovablesDesdeSharePoint } from '../concentradorComun/CentralesInstalacionesServicio';
import { ObtenerIdsInstalacionesUsuarioActual } from '../concentradorComun/UsuarioInstalacionesServicio';

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
