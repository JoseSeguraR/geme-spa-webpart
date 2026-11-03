import * as React from 'react';
import { useCallback } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import ModalBitacoraEngine from '../../../../concentrador/ModalBitacoraEngine';
import { ObtenerFilasBitacoraSolicitudIl } from '../../../../../services/sharepoint/solicitudesIl/BitacoraListaServicio';
import { SharePointRestError } from '../../../../../services/sharepoint/SharePointRestError';

export type ModalBitacoraSolicitudIlProps = {
  context: WebPartContext;
  idSolicitudIl?: number;
  visible: boolean;
  onCerrar: () => void;
};

export default function ModalBitacoraSolicitudIl(props: ModalBitacoraSolicitudIlProps): React.ReactElement {
  const { context, idSolicitudIl, visible, onCerrar } = props;

  const cargarFilas = useCallback(
    async (idRegistro: number) => {
      try {
        return await ObtenerFilasBitacoraSolicitudIl(context, idRegistro);
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
    idSolicitudIl !== undefined ? `Bitácora — Solicitud IL #${idSolicitudIl}` : 'Bitácora — Solicitud IL';

  return (
    <ModalBitacoraEngine
      visible={visible}
      idRegistro={idSolicitudIl}
      tituloModal={titulo}
      onCerrar={onCerrar}
      cargarFilas={cargarFilas}
      mensajeSinRegistros="No hay registros de bitácora para esta solicitud."
      mensajeErrorGenerico="No se pudo cargar la bitácora de la solicitud."
    />
  );
}
