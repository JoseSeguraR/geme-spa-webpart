import * as React from 'react';

export type BarraFiltrosDesplegableVistaProps = {
  panelVisible: boolean;
  onAlternarPanel: () => void;
  onLimpiar: () => void;
  /** La vista define qué criterios aplicar y dispara la consulta a SharePoint. */
  onFiltrar: () => void;
  /** Criterios opcionales dentro del bloque (p. ej. radios) si una vista los requiere aquí. */
  criteriosComplementarios?: React.ReactNode;
  children?: React.ReactNode;
  etiquetaBotonFiltrar?: string;
};

export default function BarraFiltrosDesplegableVista(
  props: BarraFiltrosDesplegableVistaProps
): React.ReactElement {
  const {
    panelVisible,
    onAlternarPanel,
    onLimpiar,
    onFiltrar,
    criteriosComplementarios,
    children,
    etiquetaBotonFiltrar = 'Filtrar'
  } = props;
  const panelExpandido = panelVisible && Boolean(children);

  return (
    <section
      className={`cowork-vista-filtros${panelExpandido ? ' cowork-vista-filtros--expandido' : ''}`}
      aria-label="Filtros de la vista"
    >
      <div className="cowork-vista-filtros__cabecera">
        <div className="cowork-vista-filtros__acciones d-flex flex-wrap gap-2">
          <button type="button" className="btn btn-sm cowork-btn-filtro" onClick={onAlternarPanel}>
            <i
              className={`bi ${panelVisible ? 'bi-funnel-fill' : 'bi-funnel'} me-1`}
              aria-hidden="true"
            />
            {panelVisible ? 'Ocultar filtro' : 'Mostrar filtro'}
          </button>
          <button type="button" className="btn btn-sm cowork-btn-filtro-alt" onClick={onLimpiar}>
            <i className="bi bi-eraser me-1" aria-hidden="true" />
            Limpiar filtro
          </button>
          <button type="button" className="btn btn-sm cowork-btn-acento" onClick={onFiltrar}>
            <i className="bi bi-search me-1" aria-hidden="true" />
            {etiquetaBotonFiltrar}
          </button>
        </div>
        <p className="cowork-vista-filtros__titulo mb-0">
          Filtros
          <i className="bi bi-sliders2 ms-2" aria-hidden="true" />
        </p>
      </div>
      {criteriosComplementarios ? (
        <div className="cowork-vista-filtros__criterios">{criteriosComplementarios}</div>
      ) : null}
      {panelExpandido ? (
        <div className="cowork-vista-filtros__panel d-flex flex-wrap align-items-end gap-3">{children}</div>
      ) : null}
    </section>
  );
}
