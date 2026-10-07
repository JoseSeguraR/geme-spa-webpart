export type NodoMenuEnlaceInterno = {
  tipo: 'enlace';
  id: string;
  etiqueta: string;
  rutaHash: string;
  icono?: string;
};

export type NodoMenuEnlaceExterno = {
  tipo: 'enlace-externo';
  id: string;
  etiqueta: string;
  url: string;
  icono?: string;
};

export type NodoMenuGrupo = {
  tipo: 'grupo';
  id: string;
  etiqueta: string;
  hijos: NodoMenu[];
  icono?: string;
};

export type NodoMenu = NodoMenuGrupo | NodoMenuEnlaceInterno | NodoMenuEnlaceExterno;

export function EsNodoMenuGrupo(nodo: NodoMenu): nodo is NodoMenuGrupo {
  return nodo.tipo === 'grupo';
}

export function EsNodoMenuEnlaceInterno(nodo: NodoMenu): nodo is NodoMenuEnlaceInterno {
  return nodo.tipo === 'enlace';
}

export function EsNodoMenuEnlaceExterno(nodo: NodoMenu): nodo is NodoMenuEnlaceExterno {
  return nodo.tipo === 'enlace-externo';
}

export function EsNodoMenuEnlace(nodo: NodoMenu): nodo is NodoMenuEnlaceInterno | NodoMenuEnlaceExterno {
  return nodo.tipo === 'enlace' || nodo.tipo === 'enlace-externo';
}
