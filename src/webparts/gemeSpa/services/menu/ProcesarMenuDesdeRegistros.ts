import type { ResultadoInicializacionMenu } from '../../models/ResultadoInicializacionMenu';
import type { RegistroSistemaAccesoNormalizado } from '../../models/SistemaAcceso';
import { ConstruirArbolMenu } from './ConstruirArbolMenu';
import { FiltrarRegistrosPorAudienciaEnlace } from './FiltrarPorAudiencia';
import { FiltrarRegistrosVisibles, ObtenerIdsRegistrosVisibles } from './PropagarVisibilidadHeaders';
import { RecolectarRutasDisponiblesDesdeArbol } from './RecolectarRutasDisponibles';
import { ReemplazarEnlacesLegadoControlSitio } from './ReemplazarEnlacesLegadoControlSitio';

export function ProcesarMenuDesdeRegistros(
  registros: RegistroSistemaAccesoNormalizado[],
  idsGruposUsuario: number[]
): ResultadoInicializacionMenu {
  const conjuntoGruposUsuario = new Set(idsGruposUsuario);
  const trasAudiencia = FiltrarRegistrosPorAudienciaEnlace(registros, conjuntoGruposUsuario);
  const idsVisibles = ObtenerIdsRegistrosVisibles(trasAudiencia);
  const registrosVisibles = FiltrarRegistrosVisibles(trasAudiencia, idsVisibles);
  const arbol = ReemplazarEnlacesLegadoControlSitio(ConstruirArbolMenu(registrosVisibles));
  const rutasDisponibles = RecolectarRutasDisponiblesDesdeArbol(arbol);

  return {
    arbol,
    rutasDisponibles
  };
}
