import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { GridColDef } from '@mui/x-data-grid';
import {
  NombreListaCentrales,
  NombreListaTiposEquipos
} from '../../../../../services/sharepoint/concentradorComun/NombresListasConcentrador';
import {
  EliminarItemLista,
  ObtenerTodosLosItemsLista
} from '../../../../../services/sharepoint/listaGenerica/ListaSharePointServicio';
import { ObtenerConteoSubequiposPorEquipo } from '../../../../../services/sharepoint/mantenedores/SubequiposMantenedorServicio';
import { NombreListaEquiposConcentrador } from '../../../../../services/sharepoint/operadorRenovable/NombresListasOperadorRenovable';
import { SharePointRestError } from '../../../../../services/sharepoint/SharePointRestError';
import {
  CeldaAccionesCentrada,
  GrillaLocalMui,
  ObtenerOpcionesBaseColumnaAccionesGrilla
} from '../../../../grilla';
import CarcasaControlSitio from '../CarcasaControlSitio';
import { ObtenerPantallaMantenedor } from '../rutas';
import ModalRegistroCatalogo from './ModalRegistroCatalogo';
import ModalSubequipos from './ModalSubequipos';
import type { DefinicionCatalogo, FilaCatalogo, OpcionCampoCatalogo, OpcionesDinamicasCatalogo } from './TiposCatalogo';
import { UseCatalogo } from './UseCatalogo';
import {
  CampoEstadoCatalogo,
  CampoLookup,
  ColumnaEstadoCatalogo,
  EnteroONulo,
  EstadoRegistroActivo,
  TextoColumna,
  ValorTexto
} from './UtilidadesCatalogo';

export type MantenedorEquiposCentralProps = {
  context: WebPartContext;
};

type EstadoModal = { visible: false } | { visible: true; fila?: FilaCatalogo };

async function CargarTiposEquipoActivos(context: WebPartContext): Promise<OpcionesDinamicasCatalogo> {
  const items = await ObtenerTodosLosItemsLista<Record<string, unknown>>(context, NombreListaTiposEquipos, {
    select: 'Id,TIPOEQUIPO',
    filter: `ESTADO eq '${EstadoRegistroActivo}'`,
    orderby: 'TIPOEQUIPO asc'
  });
  return { tiposEquipo: items.map((item) => ({ valor: String(item.Id), etiqueta: TextoColumna(item.TIPOEQUIPO) })) };
}

/** Equipos de una central — CONC_MANTENEDOR_EQUIPOS (INSTALACION, EQUIPO, TIPO_EQUIPO, ESTADO). */
function DefinicionEquipos(instalacionId: number): DefinicionCatalogo {
  return {
    lista: NombreListaEquiposConcentrador,
    nombreRegistro: 'equipo',
    consulta: {
      select: 'Id,EQUIPO,TIPO_EQUIPOId,TIPO_EQUIPO/TIPOEQUIPO,ESTADO',
      expand: 'TIPO_EQUIPO',
      filter: `INSTALACIONId eq ${instalacionId}`,
      orderby: 'EQUIPO asc'
    },
    leer: (item) => ({
      id: Number(item.Id),
      nombre: TextoColumna(item.EQUIPO),
      tipoId: TextoColumna(item.TIPO_EQUIPOId),
      tipo: CampoLookup(item.TIPO_EQUIPO, 'TIPOEQUIPO'),
      estado: TextoColumna(item.ESTADO)
    }),
    construirCuerpo: (v) => ({ EQUIPO: v.nombre, TIPO_EQUIPOId: EnteroONulo(v.tipoId), ESTADO: v.estado }),
    campos: [
      { clave: 'nombre', etiqueta: 'Nombre del equipo', tipo: 'texto', obligatorio: true, maxLength: 255, unico: true },
      {
        clave: 'tipoId',
        etiqueta: 'Tipo de equipo',
        tipo: 'seleccion',
        origenOpciones: 'tiposEquipo',
        textoOpcionVacia: '-- Sin tipo --',
        claveEtiquetaActual: 'tipo'
      },
      CampoEstadoCatalogo
    ],
    columnas: [],
    campoOrden: 'nombre',
    textoBusqueda: (fila) => `${ValorTexto(fila, 'nombre')} ${ValorTexto(fila, 'tipo')} ${ValorTexto(fila, 'estado')}`,
    cargarOpciones: CargarTiposEquipoActivos
  };
}

/** Equipos a intervenir por central y, en cada equipo, sus subequipos (modal, como la maqueta). */
export default function MantenedorEquiposCentral(props: MantenedorEquiposCentralProps): React.ReactElement {
  const { context } = props;
  const pantalla = ObtenerPantallaMantenedor('equipos-central');

  const [centrales, setCentrales] = useState<OpcionCampoCatalogo[]>([]);
  const [errorCentrales, setErrorCentrales] = useState<string | undefined>();
  const [instalacionId, setInstalacionId] = useState<number | undefined>();
  const [conteoSubequipos, setConteoSubequipos] = useState<Map<number, number>>(new Map());
  const [versionConteo, setVersionConteo] = useState(0);
  const [modal, setModal] = useState<EstadoModal>({ visible: false });
  const [equipoSubequipos, setEquipoSubequipos] = useState<{ id: number; nombre: string } | undefined>();
  const [errorAccion, setErrorAccion] = useState<string | undefined>();

  const definicion = useMemo(
    () => (instalacionId === undefined ? undefined : DefinicionEquipos(instalacionId)),
    [instalacionId]
  );
  const { filas, opciones, estado, error, recargar } = UseCatalogo(context, definicion);

  useEffect(() => {
    let cancelado = false;
    // Mismo filtro que la página antigua: centrales activas (de cualquier módulo).
    ObtenerTodosLosItemsLista<Record<string, unknown>>(context, NombreListaCentrales, {
      select: 'Id,INSTALACION',
      filter: `ESTADO eq '${EstadoRegistroActivo}'`,
      orderby: 'INSTALACION asc'
    })
      .then((items) => {
        if (!cancelado) {
          setCentrales(items.map((item) => ({ valor: String(item.Id), etiqueta: TextoColumna(item.INSTALACION) })));
        }
      })
      .catch((err: unknown) => {
        if (!cancelado) {
          console.error(err);
          setErrorCentrales(err instanceof SharePointRestError ? err.message : 'No se pudieron cargar las centrales.');
        }
      });
    return () => {
      cancelado = true;
    };
  }, [context]);

  useEffect(() => {
    let cancelado = false;
    ObtenerConteoSubequiposPorEquipo(context)
      .then((conteo) => {
        if (!cancelado) {
          setConteoSubequipos(conteo);
        }
      })
      .catch((err: unknown) => console.error(err));
    return () => {
      cancelado = true;
    };
  }, [context, versionConteo]);

  const RefrescarConteo = useCallback(() => setVersionConteo((v) => v + 1), []);

  const Eliminar = async (fila: FilaCatalogo): Promise<void> => {
    if (!window.confirm(`¿Eliminar el equipo «${ValorTexto(fila, 'nombre')}»? Esta acción no se puede deshacer.`)) {
      return;
    }
    setErrorAccion(undefined);
    try {
      await EliminarItemLista(context, NombreListaEquiposConcentrador, fila.id);
      recargar();
    } catch (err) {
      console.error(err);
      setErrorAccion(err instanceof SharePointRestError ? err.message : 'No se pudo eliminar el equipo.');
    }
  };

  const columnas: GridColDef<FilaCatalogo>[] = [
    {
      ...ObtenerOpcionesBaseColumnaAccionesGrilla(88),
      renderCell: (params) => {
        const cantidad = conteoSubequipos.get(params.row.id) ?? 0;
        return (
          <CeldaAccionesCentrada>
            <button
              type="button"
              className="btn btn-sm btn-link p-0 me-2 text-primary"
              title="Editar equipo"
              aria-label={`Editar ${ValorTexto(params.row, 'nombre')}`}
              onClick={() => setModal({ visible: true, fila: params.row })}
            >
              <i className="bi bi-pencil-square" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-link p-0 text-danger"
              title={cantidad > 0 ? 'No se puede eliminar: tiene subequipos' : 'Eliminar equipo'}
              aria-label={`Eliminar ${ValorTexto(params.row, 'nombre')}`}
              disabled={cantidad > 0}
              onClick={() => {
                Eliminar(params.row).catch(() => undefined);
              }}
            >
              <i className="bi bi-trash" aria-hidden="true" />
            </button>
          </CeldaAccionesCentrada>
        );
      }
    },
    { field: 'nombre', headerName: 'Equipo', flex: 3, minWidth: 180, cellClassName: 'cowork-celda-texto-largo' },
    { field: 'tipo', headerName: 'Tipo', flex: 2, minWidth: 140, cellClassName: 'cowork-celda-texto-largo' },
    {
      field: 'subequipos',
      headerName: 'Subequipos',
      width: 160,
      sortable: false,
      renderCell: (params) => {
        const cantidad = conteoSubequipos.get(params.row.id) ?? 0;
        return (
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => setEquipoSubequipos({ id: params.row.id, nombre: ValorTexto(params.row, 'nombre') })}
          >
            <i className="bi bi-diagram-3 me-1" aria-hidden="true" />
            {cantidad > 0 ? `${cantidad} ${cantidad === 1 ? 'subequipo' : 'subequipos'}` : 'Agregar'}
          </button>
        );
      }
    },
    ColumnaEstadoCatalogo
  ];

  const nombreCentral = centrales.find((c) => c.valor === String(instalacionId))?.etiqueta ?? '';

  return (
    <CarcasaControlSitio icono={pantalla.icono} titulo={pantalla.etiqueta} descripcion={pantalla.descripcion}>
      {errorCentrales ? <div className="alert alert-warning">{errorCentrales}</div> : null}
      <div className="cowork-vista__barra-acciones d-flex flex-wrap align-items-end gap-3 mb-3">
        <div>
          <label className="form-label mb-1" htmlFor="cowork-equipos-central">
            Central GM
          </label>
          <select
            id="cowork-equipos-central"
            className="form-select form-select-sm"
            value={instalacionId === undefined ? '' : String(instalacionId)}
            onChange={(e) => setInstalacionId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">-- Seleccione una central --</option>
            {centrales.map((central) => (
              <option key={central.valor} value={central.valor}>
                {central.etiqueta}
              </option>
            ))}
          </select>
        </div>
      </div>
      {errorAccion ? <div className="alert alert-danger py-2">{errorAccion}</div> : null}

      {instalacionId === undefined || !definicion ? (
        <p className="text-muted">Seleccione una central para ver y gestionar sus equipos.</p>
      ) : (
        <>
          <h3 className="h6 mb-2">Equipos de {nombreCentral}</h3>
          <GrillaLocalMui<FilaCatalogo>
            filas={filas}
            columnas={columnas}
            estadoCarga={estado}
            mensajeError={error}
            onReintentar={recargar}
            etiquetaBusqueda="Buscar"
            textoBusquedaFila={definicion.textoBusqueda}
            campoOrdenInicial="nombre"
            mensajeSinRegistros="No hay equipos configurados para esta central."
            accionesBarra={
              <button
                type="button"
                className="btn btn-sm cowork-btn-primary"
                onClick={() => setModal({ visible: true })}
                disabled={estado === 'cargando'}
              >
                <i className="bi bi-plus-lg me-1" aria-hidden="true" />
                Agregar equipo
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
            cuerpoFijo={{ INSTALACIONId: instalacionId }}
            icono="bi-tools"
            onCerrar={() => setModal({ visible: false })}
            onGuardado={recargar}
          />
          <ModalSubequipos
            context={context}
            equipo={equipoSubequipos}
            instalacionId={instalacionId}
            tiposEquipo={opciones.tiposEquipo ?? []}
            onCerrar={() => setEquipoSubequipos(undefined)}
            onCambio={RefrescarConteo}
          />
        </>
      )}
    </CarcasaControlSitio>
  );
}
