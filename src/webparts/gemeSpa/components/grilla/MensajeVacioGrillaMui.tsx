import * as React from 'react';

export type MensajeVacioGrillaMuiProps = {
  mensaje: string;
  /** Altura mínima al reemplazar la grilla (p. ej. `AlturaGrillaPredeterminadaPx`). */
  alturaMinimaPx?: number;
  /**
   * `contenedor`: bloque a ancho completo con borde (sin DataGrid).
   * `overlay`: centrado dentro del área de la grilla (sin borde extra).
   */
  variante?: 'contenedor' | 'overlay';
};

export default function MensajeVacioGrillaMui(props: MensajeVacioGrillaMuiProps): React.ReactElement {
  const { mensaje, alturaMinimaPx, variante = 'contenedor' } = props;

  const clases = ['cowork-grilla-vacio'];
  if (variante === 'overlay') {
    clases.push('cowork-grilla-vacio--overlay');
  }

  return (
    <div
      className={clases.join(' ')}
      role="status"
      style={alturaMinimaPx !== undefined ? { minHeight: alturaMinimaPx } : undefined}
    >
      <p className="cowork-grilla-vacio__texto">{mensaje}</p>
    </div>
  );
}
