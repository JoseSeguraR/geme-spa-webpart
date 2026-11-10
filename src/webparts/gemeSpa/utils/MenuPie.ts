import type { NodoMenu } from '../models/NodoMenu';
import { EsNodoMenuGrupo } from '../models/NodoMenu';

/**
 * HASH_TITLE (sin mayúsculas ni tildes) del Header de SISTEMA_ACCESOS cuyos hijos van al pie del sidebar.
 * El Header no se muestra: sus hijos (Permisos de usuario, Mantenedores) quedan como opciones de primer nivel del pie.
 */
const EtiquetasGrupoPieMenu: readonly string[] = ['control sitio', 'control del sitio', 'control de sitio'];

export type NodosMenuSeparados = {
  principales: NodoMenu[];
  pie: NodoMenu[];
};

function NormalizarEtiqueta(etiqueta: string): string {
  return etiqueta
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function EsGrupoPieMenu(nodo: NodoMenu): boolean {
  return EsNodoMenuGrupo(nodo) && EtiquetasGrupoPieMenu.indexOf(NormalizarEtiqueta(nodo.etiqueta)) >= 0;
}

/**
 * Quita el grupo «Control Sitio» del árbol, esté en el nivel que esté (en SISTEMA_ACCESOS puede colgar de un módulo,
 * p. ej. COR Conecta), y devuelve sus hijos para el pie. Los grupos que quedan vacíos tras quitarlo también se omiten.
 */
export function SepararNodosPieMenu(nodos: NodoMenu[]): NodosMenuSeparados {
  const pie: NodoMenu[] = [];

  const Filtrar = (items: NodoMenu[]): NodoMenu[] => {
    const resultado: NodoMenu[] = [];

    for (const nodo of items) {
      if (!EsNodoMenuGrupo(nodo)) {
        resultado.push(nodo);
        continue;
      }

      if (EsGrupoPieMenu(nodo)) {
        pie.push(...nodo.hijos);
        continue;
      }

      const hijos = Filtrar(nodo.hijos);
      const sinCambios = hijos.length === nodo.hijos.length && hijos.every((hijo, i) => hijo === nodo.hijos[i]);
      if (sinCambios) {
        resultado.push(nodo);
      } else if (hijos.length > 0) {
        resultado.push({ ...nodo, hijos });
      }
    }

    return resultado;
  };

  return { principales: Filtrar(nodos), pie };
}
