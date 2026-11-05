import * as React from 'react';
import { useMemo } from 'react';
import DesplegableAccionesFilaGrilla from '../../../../concentrador/DesplegableAccionesFilaGrilla';
import { AccionMenuFilaGrillaConIcono } from '../../../../concentrador/accionesGrillaConcentrador';

export type ModoAccionesFilaSolicitudesIl = 'completo' | 'solo-ver-bitacora';

export type DesplegableAccionesFilaProps = {
  idRegistro: number;
  modoAcciones?: ModoAccionesFilaSolicitudesIl;
  onVer: (idRegistro: number) => void;
  onBitacora: (idRegistro: number) => void;
  onClonar?: (idRegistro: number) => void;
  onGestionar?: (idRegistro: number) => void;
};

export default function DesplegableAccionesFila(props: DesplegableAccionesFilaProps): React.ReactElement {
  const { idRegistro, modoAcciones = 'completo', onVer, onClonar, onBitacora, onGestionar } = props;
  const accionesCompletas = modoAcciones === 'completo';

  const acciones = useMemo(() => {
    const items = [
      AccionMenuFilaGrillaConIcono('ver', 'Ver', () => onVer(idRegistro)),
      AccionMenuFilaGrillaConIcono('bitacora', 'Bitácora', () => onBitacora(idRegistro))
    ];
    if (accionesCompletas && onClonar) {
      items.splice(1, 0, AccionMenuFilaGrillaConIcono('clonar', 'Clonar', () => onClonar(idRegistro)));
    }
    if (accionesCompletas && onGestionar) {
      items.push(AccionMenuFilaGrillaConIcono('gestionar', 'Gestionar', () => onGestionar(idRegistro)));
    }
    return items;
  }, [accionesCompletas, idRegistro, onBitacora, onClonar, onGestionar, onVer]);

  return (
    <DesplegableAccionesFilaGrilla
      idRegistro={idRegistro}
      acciones={acciones}
      etiquetaAria={`Acciones solicitud ${idRegistro}`}
    />
  );
}
