import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { GridColDef } from '@mui/x-data-grid';
import type {
  ConsultaItemsLista,
  CuerpoItemLista
} from '../../../../../services/sharepoint/listaGenerica/ListaSharePointServicio';

/** Valores de un registro tal como los edita el formulario (texto, o lista de textos en casillas). */
export type ValoresRegistroCatalogo = Record<string, string | string[]>;

/** Fila de la grilla: `id` del ítem de SharePoint más los valores normalizados (y etiquetas para mostrar). */
export type FilaCatalogo = { id: number; [clave: string]: number | string | string[] };

export type OpcionCampoCatalogo = {
  valor: string;
  etiqueta: string;
};

/** Opciones que se cargan de otras listas (p. ej. tecnologías activas), por nombre. */
export type OpcionesDinamicasCatalogo = Record<string, OpcionCampoCatalogo[]>;

export type TipoCampoCatalogo = 'texto' | 'numero' | 'seleccion' | 'casillas';

export type CampoCatalogo = {
  clave: string;
  etiqueta: string;
  tipo: TipoCampoCatalogo;
  obligatorio?: boolean;
  maxLength?: number;
  /** Convierte a mayúsculas mientras se escribe. */
  mayusculas?: boolean;
  patron?: { expresion: RegExp; mensaje: string };
  /** No puede repetirse en otro registro (sin distinguir mayúsculas). */
  unico?: boolean;
  /** Número entero mayor o igual a este mínimo. */
  enteroMinimo?: number;
  ayuda?: string;
  placeholder?: string;
  /** Opciones fijas (selección o casillas). */
  opciones?: readonly OpcionCampoCatalogo[];
  /** Nombre de las opciones dinámicas (`DefinicionCatalogo.cargarOpciones`). */
  origenOpciones?: string;
  /** Texto de la opción vacía de una selección; sin él la selección no ofrece vacío. */
  textoOpcionVacia?: string;
  /**
   * Clave de la fila con la etiqueta del valor actual: si el valor ya no está entre las opciones
   * (p. ej. una tecnología inactiva), se agrega para no perderlo.
   */
  claveEtiquetaActual?: string;
  /** Texto entre paréntesis del valor actual que ya no está entre las opciones (por defecto «inactivo»). */
  etiquetaValorAusente?: string;
  /** Cada opción se asocia a un solo registro: no se ofrecen las que ya usa otro (validar además con `unico`). */
  opcionesUnicas?: boolean;
  /**
   * Aviso bajo una selección sin opciones de origen (p. ej. por qué no se pudieron cargar).
   * Si hay opciones pero todas las usa otro registro (`opcionesUnicas`), el modal muestra su propio aviso.
   */
  ayudaSinOpciones?: string | (() => string);
  /** Valor al agregar un registro nuevo. */
  valorInicial?: string | string[];
  anchoCompleto?: boolean;
};

export type DefinicionCatalogo = {
  /** Lista de SharePoint. */
  lista: string;
  /** Texto de los botones y títulos: «Agregar empresa», «Editar empresa». */
  nombreRegistro: string;
  consulta: ConsultaItemsLista;
  /** Normaliza un ítem de SharePoint a una fila. */
  leer: (item: Record<string, unknown>) => FilaCatalogo;
  /** Cuerpo del POST/MERGE a partir de los valores del formulario. */
  construirCuerpo: (valores: ValoresRegistroCatalogo) => CuerpoItemLista;
  campos: readonly CampoCatalogo[];
  /** Columnas de la grilla (sin la de acciones). */
  columnas: GridColDef<FilaCatalogo>[];
  campoOrden: string;
  textoBusqueda: (fila: FilaCatalogo) => string;
  cargarOpciones?: (context: WebPartContext) => Promise<OpcionesDinamicasCatalogo>;
  /** Validación adicional; devuelve el mensaje de error o `undefined`. */
  validar?: (valores: ValoresRegistroCatalogo) => string | undefined;
};
