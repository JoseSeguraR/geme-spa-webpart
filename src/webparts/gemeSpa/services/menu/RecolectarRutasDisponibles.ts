import type { NodoMenu } from '../../models/NodoMenu';
import { EsNodoMenuEnlaceInterno, EsNodoMenuGrupo } from '../../models/NodoMenu';

export function RecolectarRutasDisponiblesDesdeArbol(nodos: NodoMenu[]): Set<string> {
  const rutas = new Set<string>();

  const Recorrer = (items: NodoMenu[]): void => {
    for (const nodo of items) {
      if (EsNodoMenuGrupo(nodo)) {
        Recorrer(nodo.hijos);
      } else if (EsNodoMenuEnlaceInterno(nodo) && nodo.rutaHash) {
        rutas.add(nodo.rutaHash);
      }
    }
  };

  Recorrer(nodos);
  return rutas;
}
