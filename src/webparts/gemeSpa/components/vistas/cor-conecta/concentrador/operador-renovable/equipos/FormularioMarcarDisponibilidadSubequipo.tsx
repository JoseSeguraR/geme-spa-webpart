import * as React from 'react';
import { useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { SubequipoOperador } from '../../../../../../models/operadorRenovable/CatalogoEquiposOperador';
import { MarcarDisponibilidadConPeriodos } from '../../../../../../services/sharepoint/operadorRenovable/ActualizarDisponibilidadSubequipoServicio';
import {
  HayServicioPeriodos,
  PeriodosApiError
} from '../../../../../../services/sharepoint/operadorRenovable/PeriodosIndisponibilidadApiServicio';
import { SharePointRestError } from '../../../../../../services/sharepoint/SharePointRestError';
import {
  ConvertirEntradaLocalAIsoUtc,
  ConvertirIsoAFechaLocalInput,
  FormatearFechaHoraVisible
} from '../../../../../../utils/FechaHoraCorConecta';
import CampoFechaHora24 from '../../../../../concentrador/CampoFechaHora24';

export type FormularioMarcarDisponibilidadSubequipoProps = {
  context: WebPartContext;
  subequipos: SubequipoOperador[];
  nombreEquipo?: string;
  central?: string;
  onCancelar: () => void;
  onGuardado: () => void;
};

export default function FormularioMarcarDisponibilidadSubequipo(
  props: FormularioMarcarDisponibilidadSubequipoProps
): React.ReactElement {
  const { context, subequipos, nombreEquipo, central, onCancelar, onGuardado } = props;
  const subequipo = subequipos[0];
  const esLote = subequipos.length > 1;

  const [fechaLocal, setFechaLocal] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>();
  /** Guardado, pero sin envío a Meteológica: se informa y el formulario queda solo para cerrar. */
  const [aviso, setAviso] = useState<string | undefined>();

  useEffect(() => {
    if (!subequipo) {
      return;
    }
    setFechaLocal(ConvertirIsoAFechaLocalInput(new Date().toISOString()));
    setError(undefined);
    setAviso(undefined);
    setGuardando(false);
  }, [subequipo, subequipos]);

  if (!subequipo) {
    return <></>;
  }

  const Confirmar = async (): Promise<void> => {
    const fechaIso = ConvertirEntradaLocalAIsoUtc(fechaLocal);
    if (!fechaIso) {
      setError('Indique la fecha de retorno a servicio.');
      return;
    }

    if (!HayServicioPeriodos()) {
      setError('No se puede registrar: falta configurar «URL indisponibilidades (períodos)» en el Web Part (App Function).');
      return;
    }

    setGuardando(true);
    setError(undefined);
    try {
      // Con período: se guarda su fin real. Sin período (dato anterior a la migración): solo SharePoint.
      const resultado = await MarcarDisponibilidadConPeriodos(context, subequipos, fechaIso);
      onGuardado();
      // Solo subequipos sin período: no hay envío a Meteológica
      const huboEnvio = subequipos.some((sub) => sub.periodoVigente);
      if ((huboEnvio && !resultado.envio.enviado) || resultado.avisos.length > 0) {
        setAviso(['La disponibilidad quedó guardada.', !huboEnvio || resultado.envio.enviado ? '' : resultado.envio.mensaje]
          .concat(resultado.avisos).filter((parte) => parte).join(' '));
        return;
      }
      onCancelar();
    } catch (err) {
      setError(
        err instanceof PeriodosApiError || err instanceof SharePointRestError
          ? err.message
          : 'No se pudo registrar la disponibilidad.'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <h3 className="h6 mb-2">
        Marcar disponibilidad
        {esLote ? ` (${subequipos.length} subequipos)` : ''}
      </h3>
      <p className="small text-muted mb-3">
        {subequipo.codigo}
        {esLote ? '' : [nombreEquipo, central].filter((parte) => parte).map((parte) => ` · ${parte}`).join('')}
      </p>
      {error ? <div className="alert alert-danger py-2">{error}</div> : null}
      {aviso ? <div className="alert alert-warning py-2">{aviso}</div> : null}
      {!esLote && subequipo.periodoVigente ? (
        <p className="small mb-3">
          Indisponible desde <strong>{FormatearFechaHoraVisible(subequipo.periodoVigente.fechaInicio)}</strong> · fin estimado{' '}
          <strong>{FormatearFechaHoraVisible(subequipo.periodoVigente.fechaFinEstimada)}</strong>
          {subequipo.periodoVigente.estadoCalculado === 'VENCIDO' ? (
            <span className="badge text-bg-danger ms-2">Vencida</span>
          ) : null}
        </p>
      ) : null}
      <div className="mb-3">
        <label className="form-label" htmlFor="or-disp-fecha">
          Fecha retorno a servicio
        </label>
        <CampoFechaHora24
          id="or-disp-fecha"
          valor={fechaLocal}
          onCambio={setFechaLocal}
          disabled={guardando}
        />
      </div>
      <div className="d-flex gap-2">
        <button type="button" className="btn btn-sm btn-secondary" onClick={onCancelar} disabled={guardando}>
          {aviso ? 'Cerrar' : 'Cancelar'}
        </button>
        <button
          type="button"
          className="btn btn-sm cowork-btn-primary"
          onClick={() => {
            Confirmar().catch(() => undefined);
          }}
          disabled={guardando || aviso !== undefined}
        >
          {guardando ? 'Guardando…' : 'Confirmar'}
        </button>
      </div>
    </div>
  );
}
