import * as React from 'react';
import { useMemo, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { GridColDef } from '@mui/x-data-grid';
import {
  CeldaAccionesCentrada,
  GrillaLocalMui,
  ObtenerOpcionesBaseColumnaAccionesGrilla
} from '../../../../grilla';
import CarcasaControlSitio from '../CarcasaControlSitio';
import { ObtenerPantallaMantenedor, type ClaveMantenedor } from '../rutas';
import ModalRegistroCatalogo from './ModalRegistroCatalogo';
import type { DefinicionCatalogo, FilaCatalogo } from './TiposCatalogo';
import { UseCatalogo } from './UseCatalogo';

export type MantenedorCatalogoProps = {
  context: WebPartContext;
  clave: ClaveMantenedor;
  definicion: DefinicionCatalogo;
};

type EstadoModal = { visible: false } | { visible: true; fila?: FilaCatalogo };

/** Mantenedor de un catálogo simple: grilla con búsqueda, «Agregar …» y «Editar» por fila (sin eliminar, como el legado). */
export default function MantenedorCatalogo(props: MantenedorCatalogoProps): React.ReactElement {
  const { context, clave, definicion } = props;
  const pantalla = ObtenerPantallaMantenedor(clave);
  const { filas, opciones, estado, error, recargar } = UseCatalogo(context, definicion);
  const [modal, setModal] = useState<EstadoModal>({ visible: false });

  const columnas = useMemo((): GridColDef<FilaCatalogo>[] => {
    const acciones: GridColDef<FilaCatalogo> = {
      ...ObtenerOpcionesBaseColumnaAccionesGrilla(),
      renderCell: (params) => (
        <CeldaAccionesCentrada>
          <button
            type="button"
            className="btn btn-sm btn-link p-0 text-primary"
            title={`Editar ${definicion.nombreRegistro}`}
            aria-label={`Editar ${definicion.nombreRegistro}`}
            onClick={() => setModal({ visible: true, fila: params.row })}
          >
            <i className="bi bi-pencil-square" aria-hidden="true" />
          </button>
        </CeldaAccionesCentrada>
      )
    };
    return [acciones, ...definicion.columnas];
  }, [definicion]);

  return (
    <CarcasaControlSitio icono={pantalla.icono} titulo={pantalla.etiqueta} descripcion={pantalla.descripcion}>
      <GrillaLocalMui<FilaCatalogo>
        filas={filas}
        columnas={columnas}
        estadoCarga={estado}
        mensajeError={error}
        onReintentar={recargar}
        etiquetaBusqueda="Buscar"
        textoBusquedaFila={definicion.textoBusqueda}
        campoOrdenInicial={definicion.campoOrden}
        mensajeSinRegistros="No hay registros."
        accionesBarra={
          <button
            type="button"
            className="btn btn-sm cowork-btn-primary"
            onClick={() => setModal({ visible: true })}
            disabled={estado === 'cargando'}
          >
            <i className="bi bi-plus-lg me-1" aria-hidden="true" />
            Agregar {definicion.nombreRegistro}
          </button>
        }
      />
      <ModalRegistroCatalogo
        context={context}
        definicion={definicion}
        fila={modal.visible ? modal.fila : undefined}
        filas={filas}
        opciones={opciones}
        visible={modal.visible}
        icono={`bi-${pantalla.icono}`}
        onCerrar={() => setModal({ visible: false })}
        onGuardado={recargar}
      />
    </CarcasaControlSitio>
  );
}
