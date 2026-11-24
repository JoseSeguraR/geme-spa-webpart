import * as React from 'react';
import { useMemo } from 'react';
import type { SolicitudFalla } from '../../../../../models/SolicitudFalla';
import DesplegableAccionesFilaGrilla from '../../../../concentrador/DesplegableAccionesFilaGrilla';
import { AccionMenuFilaGrillaConIcono } from '../../../../concentrador/accionesGrillaConcentrador';
import { EstadoSolicitudFallaVigente } from './constantesSolicitudFalla';
import type { ModoAccionesFilaSolicitudFalla } from './PerfilVistaSolicitudFalla';

export type DesplegableAccionesFilaSolicitudFallaProps = {
  fila: SolicitudFalla;
  modoAcciones?: ModoAccionesFilaSolicitudFalla;
  onVer: (fila: SolicitudFalla) => void;
  onEditar?: (fila: SolicitudFalla) => void;
  onBitacora?: (fila: SolicitudFalla) => void;
};

export default function DesplegableAccionesFilaSolicitudFalla(
  props: DesplegableAccionesFilaSolicitudFallaProps
): React.ReactElement {
  const {
    fila,
    modoAcciones = 'completo',
    onVer,
    onEditar,
    onBitacora
  } = props;
  const accionesCompletas = modoAcciones === 'completo';

  const acciones = useMemo(() => {
    if (!accionesCompletas) {
      const itemsSoloLectura = [AccionMenuFilaGrillaConIcono('ver', 'Ver', () => onVer(fila))];
      if (onBitacora) {
        itemsSoloLectura.push(AccionMenuFilaGrillaConIcono('bitacora', 'Bitácora', () => onBitacora(fila)));
      }
      return itemsSoloLectura;
    }

    const items = [
      AccionMenuFilaGrillaConIcono('ver', 'Ver', () => onVer(fila)),
      ...(onEditar && fila.estado === EstadoSolicitudFallaVigente
        ? [AccionMenuFilaGrillaConIcono('editar', 'Editar', () => onEditar(fila))]
        : []),
      ...(onBitacora
        ? [AccionMenuFilaGrillaConIcono('bitacora', 'Bitácora', () => onBitacora(fila))]
        : [])
    ];

    return items;
  }, [accionesCompletas, fila, onBitacora, onEditar, onVer]);

  return (
    <DesplegableAccionesFilaGrilla
      idRegistro={fila.id}
      acciones={acciones}
      etiquetaAria={`Acciones solicitud de falla ${fila.idCen}`}
      mostrarDosPuntosEnDisparador
      claseMenu="cowork-desplegable-acciones__menu--solicitud-falla"
    />
  );
}