import { useCallback, useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { ObtenerTodosLosItemsLista } from '../../../../../services/sharepoint/listaGenerica/ListaSharePointServicio';
import { SharePointRestError } from '../../../../../services/sharepoint/SharePointRestError';
import type { EstadoCargaGrillaLocal } from '../../../../grilla/GrillaLocalMui';
import type { DefinicionCatalogo, FilaCatalogo, OpcionesDinamicasCatalogo } from './TiposCatalogo';

export type UseCatalogoResultado = {
  filas: FilaCatalogo[];
  opciones: OpcionesDinamicasCatalogo;
  estado: EstadoCargaGrillaLocal;
  error: string | undefined;
  recargar: () => void;
};

/** Carga los registros de un catálogo (y sus opciones dinámicas) y permite recargarlos tras guardar. */
export function UseCatalogo(
  context: WebPartContext,
  definicion: DefinicionCatalogo | undefined
): UseCatalogoResultado {
  const [filas, setFilas] = useState<FilaCatalogo[]>([]);
  const [opciones, setOpciones] = useState<OpcionesDinamicasCatalogo>({});
  const [estado, setEstado] = useState<EstadoCargaGrillaLocal>('cargando');
  const [error, setError] = useState<string | undefined>();
  const [version, setVersion] = useState(0);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!definicion) {
      setFilas([]);
      setEstado('listo');
      return undefined;
    }
    let cancelado = false;
    setEstado('cargando');
    setError(undefined);

    Promise.all([
      ObtenerTodosLosItemsLista<Record<string, unknown>>(context, definicion.lista, definicion.consulta),
      definicion.cargarOpciones ? definicion.cargarOpciones(context) : Promise.resolve({})
    ])
      .then(([items, opcionesCargadas]) => {
        if (cancelado) {
          return;
        }
        setFilas(items.map(definicion.leer));
        setOpciones(opcionesCargadas);
        setEstado('listo');
      })
      .catch((err: unknown) => {
        if (cancelado) {
          return;
        }
        console.error(err);
        setError(
          err instanceof SharePointRestError
            ? `No se pudo cargar ${definicion.lista}: ${err.message}`
            : `No se pudo cargar ${definicion.lista}.`
        );
        setEstado('error');
      });

    return () => {
      cancelado = true;
    };
  }, [context, definicion, version]);

  return { filas, opciones, estado, error, recargar };
}
