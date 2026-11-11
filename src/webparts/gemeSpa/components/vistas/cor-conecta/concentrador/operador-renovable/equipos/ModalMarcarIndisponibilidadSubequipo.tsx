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
  /** Con la App Function de períodos, el formulario pide también la fecha estimada de fin. */
  centralId?: number;
  capacidadEquipoMw?: number;
  visible: boolean;
  onCerrar: () => void;
  onGuardado: () => void;
};

export default function ModalMarcarIndisponibilidadSubequipo(
  props: ModalMarcarIndisponibilidadSubequipoProps
): React.ReactElement {
  const { context, subequipo, subequipos, nombreEquipo, central, centralId, capacidadEquipoMw, visible, onCerrar, onGuardado } = props;
  const lista = subequipos ?? (subequipo ? [subequipo] : []);

  if (!visible || lista.length === 0) {
    return <></>;
  }

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-scrollable modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h2 className="modal-title h5">
                <i className="bi bi-x-circle me-2" aria-hidden="true" />
                Marcar indisponibilidad
              </h2>
              <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={onCerrar} />
            </div>
            <div className="modal-body">
              <FormularioMarcarIndisponibilidadSubequipo
                context={context}
                subequipos={lista}
                nombreEquipo={nombreEquipo}
                central={central}
                centralId={centralId}
                capacidadEquipoMw={capacidadEquipoMw}
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
