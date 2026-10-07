import type { NodoMenu } from './NodoMenu';

export type ResultadoInicializacionMenu = {
  arbol: NodoMenu[];
  rutasDisponibles: ReadonlySet<string>;
};
