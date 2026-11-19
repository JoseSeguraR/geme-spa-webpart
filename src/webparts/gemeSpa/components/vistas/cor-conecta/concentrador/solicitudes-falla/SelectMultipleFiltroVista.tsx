import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type OpcionSelectMultipleFiltro = {
  id: string;
  etiqueta: string;
};

export type SelectMultipleFiltroVistaProps = {
  id: string;
  opciones: readonly OpcionSelectMultipleFiltro[];
  valoresSeleccionados: readonly string[];
  onCambio: (valores: string[]) => void;
  deshabilitado?: boolean;
  textoSinSeleccion?: string;
  etiquetaAria?: string;
};

type PosicionPanel = {
  superior: number;
  izquierdo: number;
  ancho: number;
};

export default function SelectMultipleFiltroVista(props: SelectMultipleFiltroVistaProps): React.ReactElement {
  const {
    id,
    opciones,
    valoresSeleccionados,
    onCambio,
    deshabilitado = false,
    textoSinSeleccion = 'Todos',
    etiquetaAria
  } = props;

  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [posicionPanel, setPosicionPanel] = useState<PosicionPanel | null>(null);
  const [contenedorPortal, setContenedorPortal] = useState<HTMLElement | null>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const disparadorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const conjuntoSeleccionados = useMemo(() => new Set(valoresSeleccionados), [valoresSeleccionados]);

  const opcionesVisibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) {
      return opciones;
    }
    return opciones.filter((opcion) => opcion.etiqueta.toLowerCase().includes(texto));
  }, [busqueda, opciones]);

  const textoDisparador = useMemo(() => {
    if (valoresSeleccionados.length === 0) {
      return textoSinSeleccion;
    }
    if (valoresSeleccionados.length === 1) {
      const opcion = opciones.find((item) => item.id === valoresSeleccionados[0]);
      return opcion?.etiqueta ?? textoSinSeleccion;
    }
    return `${valoresSeleccionados.length} seleccionados`;
  }, [opciones, textoSinSeleccion, valoresSeleccionados]);

  const ActualizarPosicionPanel = useCallback((): void => {
    if (!disparadorRef.current) {
      return;
    }
    const rect = disparadorRef.current.getBoundingClientRect();
    setPosicionPanel({
      superior: rect.bottom + 2,
      izquierdo: rect.left,
      ancho: rect.width
    });
  }, []);

  useEffect(() => {
    if (!abierto) {
      setPosicionPanel(null);
      setContenedorPortal(null);
      setBusqueda('');
      return undefined;
    }
    const contenedorSpa = disparadorRef.current?.closest('.gemeSpaBootstrap');
    setContenedorPortal(contenedorSpa instanceof HTMLElement ? contenedorSpa : document.body);
    ActualizarPosicionPanel();
    window.addEventListener('resize', ActualizarPosicionPanel);
    window.addEventListener('scroll', ActualizarPosicionPanel, true);
    return () => {
      window.removeEventListener('resize', ActualizarPosicionPanel);
      window.removeEventListener('scroll', ActualizarPosicionPanel, true);
    };
  }, [abierto, ActualizarPosicionPanel]);

  useEffect(() => {
    if (!abierto) {
      return undefined;
    }
    const CerrarSiClickFuera = (evento: MouseEvent): void => {
      const objetivo = evento.target as Node;
      if (contenedorRef.current?.contains(objetivo) || panelRef.current?.contains(objetivo)) {
        return;
      }
      setAbierto(false);
    };
    const CerrarConEscape = (evento: KeyboardEvent): void => {
      if (evento.key === 'Escape') {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', CerrarSiClickFuera);
    document.addEventListener('keydown', CerrarConEscape);
    return () => {
      document.removeEventListener('mousedown', CerrarSiClickFuera);
      document.removeEventListener('keydown', CerrarConEscape);
    };
  }, [abierto]);

  const AlternarOpcion = (idOpcion: string): void => {
    const siguiente = new Set(valoresSeleccionados);
    if (siguiente.has(idOpcion)) {
      siguiente.delete(idOpcion);
    } else {
      siguiente.add(idOpcion);
    }
    onCambio(Array.from(siguiente));
  };

  const SeleccionarVisibles = (): void => {
    const siguiente = new Set(valoresSeleccionados);
    for (const opcion of opcionesVisibles) {
      siguiente.add(opcion.id);
    }
    onCambio(Array.from(siguiente));
  };

  const DeseleccionarVisibles = (): void => {
    const visibles = new Set(opcionesVisibles.map((opcion) => opcion.id));
    onCambio(valoresSeleccionados.filter((valor) => !visibles.has(valor)));
  };

  const panelPortal =
    abierto && posicionPanel && contenedorPortal
      ? createPortal(
          <div
            ref={panelRef}
            id={`${id}-panel`}
            className="cowork-select-multiple-filtro__panel shadow-sm"
            role="listbox"
            aria-multiselectable="true"
            style={{
              position: 'fixed',
              top: `${posicionPanel.superior}px`,
              left: `${posicionPanel.izquierdo}px`,
              width: `${posicionPanel.ancho}px`
            }}
          >
            <div className="cowork-select-multiple-filtro__busqueda border-bottom p-2">
              <input
                type="search"
                className="form-control form-control-sm"
                placeholder="Buscar…"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                aria-label="Buscar en la lista"
              />
            </div>
            <div className="cowork-select-multiple-filtro__acciones d-flex gap-2 px-2 py-1 border-bottom">
              <button type="button" className="btn btn-link btn-sm p-0" onClick={SeleccionarVisibles}>
                Seleccionar todo
              </button>
              <button type="button" className="btn btn-link btn-sm p-0" onClick={DeseleccionarVisibles}>
                Quitar todo
              </button>
            </div>
            <ul className="cowork-select-multiple-filtro__lista list-unstyled mb-0">
              {opcionesVisibles.length === 0 ? (
                <li className="px-2 py-2 text-muted small">Sin coincidencias</li>
              ) : (
                opcionesVisibles.map((opcion) => {
                  const marcada = conjuntoSeleccionados.has(opcion.id);
                  const idOpcion = `${id}-opcion-${opcion.id}`;
                  return (
                    <li key={opcion.id}>
                      <label htmlFor={idOpcion} className="cowork-select-multiple-filtro__opcion">
                        <input
                          id={idOpcion}
                          type="checkbox"
                          className="form-check-input me-2"
                          checked={marcada}
                          onChange={() => AlternarOpcion(opcion.id)}
                        />
                        <span>{opcion.etiqueta}</span>
                      </label>
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          contenedorPortal
        )
      : null;

  return (
    <div className="cowork-select-multiple-filtro" ref={contenedorRef}>
      <button
        type="button"
        id={id}
        ref={disparadorRef}
        className="form-select form-select-sm text-start cowork-select-multiple-filtro__disparador"
        disabled={deshabilitado}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={etiquetaAria}
        onClick={() => {
          if (!deshabilitado) {
            setAbierto((estaba) => !estaba);
          }
        }}
      >
        <span className="text-truncate d-inline-block w-100">{textoDisparador}</span>
      </button>
      {panelPortal}
    </div>
  );
}