import * as React from 'react';

export default function CargandoInicial(): React.ReactElement {
  return (
    <div className="cowork-cargando-inicial" role="status" aria-live="polite" aria-busy="true">
      <div
        className="spinner-border cowork-cargando-inicial__spinner"
        aria-hidden="true"
      />
      <p className="cowork-cargando-inicial__texto">Cargando…</p>
    </div>
  );
}
