import * as React from 'react';
import { useCallback } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import ModalBitacoraEngine from '../../../../../concentrador/ModalBitacoraEngine';
import { TipoRegistroBitacoraConcentrador } from '../../../../../../services/sharepoint/concentradorComun/NombresListasConcentrador';
import { ObtenerFilasBitacoraEngine } from '../../../../../../services/sharepoint/concentradorComun/BitacoraEngineListaServicio';
import { SharePointRestError } from '../../../../../../services/sharepoint/SharePointRestError';

export type ModalBitacoraSolicitudConcentradorOperadorProps = {
  context: WebPartContext;
  idSolicitudConcentrador?: number;
  etiquetaIdSolicitud?: string;
  visible: boolean;
  onCerrar: () => void;
};

export default function ModalBitacoraSolicitudConcentradorOperador(
  props: ModalBitacoraSolicitudConcentradorOperadorProps
): React.ReactElement {
  const { context, idSolicitudConcentrador, etiquetaIdSolicitud, visible, onCerrar } = props;

  const cargarFilas = useCallback(
    async (idRegistro: number) => {
      try {
        return await ObtenerFilasBitacoraEngine(context, idRegistro, TipoRegistroBitacoraConcentrador);
      } catch (err) {
        if (err instanceof SharePointRestError) {
          throw err;
        }
        throw new Error('No se pudo cargar la bitácora de la solicitud.');
      }
    },
    [context]
  );

  const titulo =
    idSolicitudConcentrador !== undefined
      ? `Bitácora — Solicitud ${etiquetaIdSolicitud ?? `#${idSolicitudConcentrador}`}`
      : 'Bitácora — Solicitud';

  return (
    <ModalBitacoraEngine
      visible={visible}
      idRegistro={idSolicitudConcentrador}
      tituloModal={titulo}
      onCerrar={onCerrar}
      cargarFilas={cargarFilas}
      mensajeSinRegistros="No hay registros de bitácora del motor de flujos para esta solicitud."
      mensajeErrorGenerico="No se pudo cargar la bitácora de la solicitud."
    />
  );
}
