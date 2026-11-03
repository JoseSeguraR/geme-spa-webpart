import * as React from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { SubequipoOperador } from '../../../../../../models/operadorRenovable/CatalogoEquiposOperador';
import FormularioMarcarIndisponibilidadSubequipo from './FormularioMarcarIndisponibilidadSubequipo';

export type ModalMarcarIndisponibilidadSubequipoProps = {
  context: WebPartContext;
  subequipo?: SubequipoOperador;
  subequipos?: SubequipoOperador[];
  nombreEquipo?: string;
  central?: string;
  visible: boolean;
  onCerrar: () => void;
  onGuardado: () => void;
};

export default function ModalMarcarIndisponibilidadSubequipo(
  props: ModalMarcarIndisponibilidadSubequipoProps
): React.ReactElement {
  const { context, subequipo, subequipos, nombreEquipo, central, visible, onCerrar, onGuardado } = props;
  const lista = subequipos ?? (subequipo ? [subequipo] : []);

  if (!visible || lista.length === 0) {
    return <></>;
  }

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5">Marcar indisponibilidad</h2>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCerrar} />
            </div>
            <div className="modal-body">
              <FormularioMarcarIndisponibilidadSubequipo
                context={context}
                subequipos={lista}
                nombreEquipo={nombreEquipo}
                central={central}
                onCancelar={onCerrar}
                onGuardado={onGuardado}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" aria-hidden="true" />
    </>
  );
}
