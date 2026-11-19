import * as React from 'react';
import { useMemo } from 'react';
import type { SolicitudFalla } from '../../../../../models/SolicitudFalla';
import DesplegableAccionesFilaGrilla from '../../../../concentrador/DesplegableAccionesFilaGrilla';
import { AccionMenuFilaGrillaConIcono } from '../../../../concentrador/accionesGrillaConcentrador';
import { EstadoSolicitudFallaFinalizada, EstadoSolicitudFallaVigente } from './constantesSolicitudFalla';
import type { ModoAccionesFilaSolicitudFalla } from './PerfilVistaSolicitudFalla';

export type DesplegableAccionesFilaSolicitudFallaProps = {
  fila: SolicitudFalla;
  modoAcciones?: ModoAccionesFilaSolicitudFalla;
  onVer: (fila: SolicitudFalla) => void;
  onEditar?: (fila: SolicitudFalla) => void;
  onGestionar?: (fila: SolicitudFalla) => void;
  onIntegrarSiod?: (fila: SolicitudFalla) => void;
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
    onGestionar,
    onIntegrarSiod,
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
      ...(onEditar
        ? [AccionMenuFilaGrillaConIcono('editar', 'Editar', () => onEditar(fila))]
        : []),
      ...(onBitacora
        ? [AccionMenuFilaGrillaConIcono('bitacora', 'Bitácora', () => onBitacora(fila))]
        : [])
    ];

    if (fila.estado !== EstadoSolicitudFallaFinalizada) {
      if (fila.estado === EstadoSolicitudFallaVigente && onGestionar) {
        items.push(AccionMenuFilaGrillaConIcono('gestionar', 'Gestionar', () => onGestionar(fila)));
      }

      if (!fila.integradoSiod && onIntegrarSiod) {
        items.push(
          AccionMenuFilaGrillaConIcono('integrar-siod', 'Integrar a SIOD', () => onIntegrarSiod(fila))
        );
      }
    }

    return items;
  }, [accionesCompletas, fila, onBitacora, onEditar, onGestionar, onIntegrarSiod, onVer]);

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