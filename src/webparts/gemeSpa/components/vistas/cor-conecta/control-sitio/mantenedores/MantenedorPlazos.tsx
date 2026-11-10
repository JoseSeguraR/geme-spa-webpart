import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import {
  NombreListaPlazoProgramadas,
  NombreListaPlazoSodi
} from '../../../../../services/sharepoint/concentradorComun/NombresListasConcentrador';
import {
  ActualizarItemLista,
  ObtenerTodosLosItemsLista,
  type ConsultaItemsLista
} from '../../../../../services/sharepoint/listaGenerica/ListaSharePointServicio';
import { SharePointRestError } from '../../../../../services/sharepoint/SharePointRestError';
import { InterpretarHora24 } from '../../../../../utils/FechaHoraCorConecta';
import CampoHora24 from '../../../../concentrador/CampoHora24';
import CarcasaControlSitio from '../CarcasaControlSitio';
import { ObtenerPantallaMantenedor, type ClaveMantenedor } from '../rutas';
import { CampoLookup, TextoColumna } from './UtilidadesCatalogo';

/** Máximo de días hábiles de anticipación (mismo tope que la maqueta). */
const MaximoDiasAnticipacion = 30;

type FilaPlazo = {
  id: number;
  etiqueta: string;
  dias: string;
  hora: string;
};

type EstadoFilaPlazo = {
  guardando?: boolean;
  error?: string;
  guardado?: boolean;
};

type ConfiguracionPlazos = {
  lista: string;
  consulta: ConsultaItemsLista;
  encabezadoEtiqueta: string;
  leerEtiqueta: (item: Record<string, unknown>) => string;
  nota: string;
};

const ConfiguracionesPlazos: Record<'plazo-programadas' | 'plazo-sodi', ConfiguracionPlazos> = {
  'plazo-programadas': {
    lista: NombreListaPlazoProgramadas,
    consulta: { select: 'Id,DIA_SEMANA,DIA_ANTICIPACION,HORA_LIMITE', orderby: 'ID asc' },
    encabezadoEtiqueta: 'Día de la semana',
    leerEtiqueta: (item) => TextoColumna(item.DIA_SEMANA),
    nota: 'Ejemplo: Lunes, 5 días hábiles antes de las 12:00. Cada día se guarda por separado.'
  },
  'plazo-sodi': {
    lista: NombreListaPlazoSodi,
    consulta: {
      select: 'Id,INSTALACION/INSTALACION,DIA_ANTICIPACION,HORA_LIMITE',
      expand: 'INSTALACION',
      orderby: 'ID asc'
    },
    encabezadoEtiqueta: 'Central GM',
    leerEtiqueta: (item) => CampoLookup(item.INSTALACION, 'INSTALACION'),
    nota: 'Los plazos SODI son independientes de los de solicitudes programadas. Cada central se guarda por separado.'
  }
};

export type MantenedorPlazosProps = {
  context: WebPartContext;
  clave: 'plazo-programadas' | 'plazo-sodi';
};

/** Plazos de envío (programadas por día, SODI por central): solo se editan, como en la página antigua. */
export default function MantenedorPlazos(props: MantenedorPlazosProps): React.ReactElement {
  const { context, clave } = props;
  const configuracion = ConfiguracionesPlazos[clave];
  const pantalla = ObtenerPantallaMantenedor(clave as ClaveMantenedor);

  const [filas, setFilas] = useState<FilaPlazo[]>([]);
  const [estadosFila, setEstadosFila] = useState<Record<number, EstadoFilaPlazo>>({});
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | undefined>();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setErrorCarga(undefined);
    ObtenerTodosLosItemsLista<Record<string, unknown>>(context, configuracion.lista, configuracion.consulta)
      .then((items) => {
        if (cancelado) {
          return;
        }
        setFilas(
          items.map((item) => ({
            id: Number(item.Id),
            etiqueta: configuracion.leerEtiqueta(item) || `#${String(item.Id)}`,
            dias: TextoColumna(item.DIA_ANTICIPACION),
            hora: InterpretarHora24(TextoColumna(item.HORA_LIMITE)) ?? TextoColumna(item.HORA_LIMITE)
          }))
        );
        setEstadosFila({});
      })
      .catch((err: unknown) => {
        if (!cancelado) {
          console.error(err);
          setErrorCarga(
            err instanceof SharePointRestError
              ? `No se pudieron cargar los plazos: ${err.message}`
              : 'No se pudieron cargar los plazos.'
          );
        }
      })
      .then(() => {
        if (!cancelado) {
          setCargando(false);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelado = true;
    };
  }, [context, configuracion, version]);

  const CambiarFila = useCallback((id: number, cambios: Partial<FilaPlazo>): void => {
    setFilas((previas) => previas.map((fila) => (fila.id === id ? { ...fila, ...cambios } : fila)));
    setEstadosFila((previos) => ({ ...previos, [id]: {} }));
  }, []);

  const GuardarFila = async (fila: FilaPlazo): Promise<void> => {
    const dias = fila.dias.trim();
    const hora = InterpretarHora24(fila.hora);
    let error: string | undefined;
    if (!/^\d+$/.test(dias) || Number(dias) > MaximoDiasAnticipacion) {
      error = `Indique los días de anticipación (entero de 0 a ${MaximoDiasAnticipacion}).`;
    } else if (!hora) {
      error = 'Indique la hora límite en formato hh:mm (00 a 23 h).';
    }
    if (error) {
      setEstadosFila((previos) => ({ ...previos, [fila.id]: { error } }));
      return;
    }

    setEstadosFila((previos) => ({ ...previos, [fila.id]: { guardando: true } }));
    try {
      await ActualizarItemLista(context, configuracion.lista, fila.id, {
        DIA_ANTICIPACION: Number(dias),
        HORA_LIMITE: hora
      });
      setEstadosFila((previos) => ({ ...previos, [fila.id]: { guardado: true } }));
    } catch (err) {
      console.error(err);
      setEstadosFila((previos) => ({
        ...previos,
        [fila.id]: { error: err instanceof SharePointRestError ? err.message : 'No se pudo guardar.' }
      }));
    }
  };

  return (
    <CarcasaControlSitio icono={pantalla.icono} titulo={pantalla.etiqueta} descripcion={pantalla.descripcion}>
      <p className="small text-muted">{configuracion.nota}</p>
      {errorCarga ? (
        <div className="alert alert-warning d-flex align-items-center justify-content-between" role="alert">
          <span>{errorCarga}</span>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setVersion((v) => v + 1)}>
            Reintentar
          </button>
        </div>
      ) : null}
      {cargando ? (
        <div className="text-muted py-3">
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
          Cargando…
        </div>
      ) : !errorCarga && filas.length === 0 ? (
        <p className="text-muted">No hay plazos configurados en {configuracion.lista}.</p>
      ) : !errorCarga ? (
        <table className="table table-sm align-middle cowork-tabla-fichas cowork-tabla-plazos">
          <thead>
            <tr>
              <th scope="col">{configuracion.encabezadoEtiqueta}</th>
              <th scope="col">Días de anticipación (hábiles)</th>
              <th scope="col">Hora límite</th>
              <th scope="col" className="text-center">
                Guardar
              </th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => {
              const estado = estadosFila[fila.id] ?? {};
              const idDias = `cowork-plazo-dias-${fila.id}`;
              return (
                <tr key={fila.id}>
                  <th scope="row" data-label={configuracion.encabezadoEtiqueta}>
                    {fila.etiqueta}
                    {estado.error ? <div className="small text-danger fw-normal mt-1">{estado.error}</div> : null}
                  </th>
                  <td data-label="Días de anticipación (hábiles)">
                    <div className="input-group input-group-sm cowork-plazo-dias">
                      <input
                        id={idDias}
                        type="text"
                        inputMode="numeric"
                        className="form-control"
                        value={fila.dias}
                        aria-label={`Días de anticipación de ${fila.etiqueta}`}
                        onChange={(e) => CambiarFila(fila.id, { dias: e.target.value })}
                      />
                      <span className="input-group-text">días</span>
                    </div>
                  </td>
                  <td data-label="Hora límite">
                    <div className="cowork-plazo-hora">
                      <CampoHora24
                        id={`cowork-plazo-hora-${fila.id}`}
                        valor={fila.hora}
                        aria-label={`Hora límite de ${fila.etiqueta}`}
                        onCambio={(hora) => CambiarFila(fila.id, { hora })}
                      />
                    </div>
                  </td>
                  <td data-label="Guardar" className="text-center">
                    <button
                      type="button"
                      className={`btn btn-sm ${estado.guardado ? 'btn-success' : 'cowork-btn-primary'}`}
                      disabled={estado.guardando}
                      title={`Guardar ${fila.etiqueta}`}
                      aria-label={`Guardar ${fila.etiqueta}`}
                      onClick={() => {
                        GuardarFila(fila).catch(() => undefined);
                      }}
                    >
                      {estado.guardando ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      ) : (
                        <i className={`bi ${estado.guardado ? 'bi-check-lg' : 'bi-save'}`} aria-hidden="true" />
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
    </CarcasaControlSitio>
  );
}
