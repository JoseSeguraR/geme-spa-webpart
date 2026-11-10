import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { GridColDef, GridRowId, GridValidRowModel } from '@mui/x-data-grid';
import GrillaServidorMui from './GrillaServidorMui';
import { TamanoPaginaTodos, type OpcionTamanoPaginaGrilla } from './TiposGrillaServidor';

export type EstadoCargaGrillaLocal = 'cargando' | 'listo' | 'error';

export type GrillaLocalMuiProps<Row extends GridValidRowModel & { id: GridRowId }> = {
  /** Todas las filas: la búsqueda, el orden y la paginación se resuelven en el navegador. */
  filas: Row[];
  columnas: GridColDef<Row>[];
  estadoCarga: EstadoCargaGrillaLocal;
  mensajeError?: string;
  onReintentar?: () => void;
  /** Etiqueta del buscador; sin ella no se muestra. */
  etiquetaBusqueda?: string;
  /** Texto en el que busca cada fila (sin distinguir mayúsculas ni tildes). */
  textoBusquedaFila?: (fila: Row) => string;
  accionesBarra?: React.ReactNode;
  campoOrdenInicial: string;
  direccionOrdenInicial?: 'asc' | 'desc';
  /** Valor con que se ordena un campo (p. ej. la fecha ISO de una columna que muestra `dd/mm/aaaa`); por defecto, `fila[campo]`. */
  valorOrden?: (fila: Row, campo: string) => unknown;
  mensajeSinRegistros?: string;
  obtenerClaseFila?: (fila: Row) => string | undefined;
};

const OpcionesTamanoPaginaLocal: readonly OpcionTamanoPaginaGrilla[] = [
  10,
  25,
  50,
  100,
  { value: TamanoPaginaTodos, label: 'Mostrar todo' }
];

function NormalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function CompararValores(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  const textoA = a === undefined || a === null ? '' : String(a);
  const textoB = b === undefined || b === null ? '' : String(b);
  return textoA.localeCompare(textoB, 'es', { numeric: true, sensitivity: 'base' });
}

/**
 * Grilla con datos ya cargados (mantenedores): envuelve `GrillaServidorMui` y pagina, ordena y busca en local.
 * Las columnas usan anchos fijos (cortas) y `flex` (texto): sin autoajuste, para que no cambien al paginar o buscar.
 */
export default function GrillaLocalMui<Row extends GridValidRowModel & { id: GridRowId }>(
  props: GrillaLocalMuiProps<Row>
): React.ReactElement {
  const {
    filas,
    columnas,
    estadoCarga,
    mensajeError,
    onReintentar,
    etiquetaBusqueda,
    textoBusquedaFila,
    accionesBarra,
    campoOrdenInicial,
    direccionOrdenInicial = 'asc',
    valorOrden,
    mensajeSinRegistros,
    obtenerClaseFila
  } = props;

  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(0);
  const [tamanoPagina, setTamanoPagina] = useState(10);
  const [campoOrden, setCampoOrden] = useState(campoOrdenInicial);
  const [direccionOrden, setDireccionOrden] = useState<'asc' | 'desc'>(direccionOrdenInicial);

  const filasFiltradas = useMemo(() => {
    const consulta = NormalizarTexto(busqueda.trim());
    const filtradas =
      consulta && textoBusquedaFila
        ? filas.filter((fila) => NormalizarTexto(textoBusquedaFila(fila)).indexOf(consulta) >= 0)
        : filas.slice();
    const signo = direccionOrden === 'asc' ? 1 : -1;
    const Valor = (fila: Row): unknown => (valorOrden ? valorOrden(fila, campoOrden) : fila[campoOrden]);
    return filtradas.sort((a, b) => signo * CompararValores(Valor(a), Valor(b)));
  }, [filas, busqueda, textoBusquedaFila, campoOrden, direccionOrden, valorOrden]);

  const total = filasFiltradas.length;
  const tamanoEfectivo = tamanoPagina === TamanoPaginaTodos ? Math.max(total, 1) : tamanoPagina;
  const ultimaPagina = Math.max(0, Math.ceil(total / tamanoEfectivo) - 1);
  const paginaActual = Math.min(pagina, ultimaPagina);

  useEffect(() => {
    setPagina(0);
  }, [busqueda]);

  const filasPagina = useMemo(
    () => filasFiltradas.slice(paginaActual * tamanoEfectivo, (paginaActual + 1) * tamanoEfectivo),
    [filasFiltradas, paginaActual, tamanoEfectivo]
  );

  const estadoGrilla = estadoCarga === 'cargando' ? 'cargando' : estadoCarga === 'error' ? 'error' : 'listo';

  return (
    <GrillaServidorMui<Row>
      filas={estadoCarga === 'error' ? [] : filasPagina}
      columnas={columnas}
      estadoCarga={estadoGrilla}
      mensajeError={mensajeError}
      onReintentar={onReintentar}
      paginaActual={paginaActual}
      tamanoPagina={tamanoPagina}
      hayPaginaSiguiente={paginaActual < ultimaPagina}
      totalFilas={total}
      onCambioPagina={setPagina}
      onCambioTamanoPagina={(tamano) => {
        setTamanoPagina(tamano);
        setPagina(0);
      }}
      campoOrden={campoOrden}
      direccionOrden={direccionOrden}
      onCambioOrdenamiento={(campo, direccion) => {
        setCampoOrden(campo === 'id' ? campoOrdenInicial : campo);
        setDireccionOrden(direccion);
      }}
      busqueda={
        etiquetaBusqueda
          ? { etiqueta: etiquetaBusqueda, valorEnConsulta: busqueda, onCambioConsulta: setBusqueda, demoraMs: 200 }
          : undefined
      }
      accionesBarra={accionesBarra}
      mensajeSinRegistros={mensajeSinRegistros}
      textoBusquedaActiva={busqueda}
      opcionesTamanoPagina={OpcionesTamanoPaginaLocal}
      alturaAutomatica
      claseContenedor="cowork-vista-tabla-mui--centrada"
      obtenerClaseFila={obtenerClaseFila}
    />
  );
}
