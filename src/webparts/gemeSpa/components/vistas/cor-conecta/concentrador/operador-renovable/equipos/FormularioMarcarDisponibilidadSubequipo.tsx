import * as React from 'react';
import { useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { SubequipoOperador } from '../../../../../../models/operadorRenovable/CatalogoEquiposOperador';
import { MarcarSubequipoDisponibleEnSharePoint } from '../../../../../../services/sharepoint/operadorRenovable/ActualizarDisponibilidadSubequipoServicio';
import { SharePointRestError } from '../../../../../../services/sharepoint/SharePointRestError';
import {
  ConvertirEntradaLocalAIsoUtc,
  ConvertirIsoAFechaLocalInput
} from '../../solicitudes-il/UtilidadesFechaSolicitudIl';

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

  useEffect(() => {
    if (!subequipo) {
      return;
    }
    setFechaLocal(ConvertirIsoAFechaLocalInput(new Date().toISOString()));
    setError(undefined);
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

    setGuardando(true);
    setError(undefined);
    try {
      for (const sub of subequipos) {
        await MarcarSubequipoDisponibleEnSharePoint(context, {
          subequipoId: sub.id,
          fechaDisponibilidadIso: fechaIso,
          capacidadMaximaMw: sub.capacidadMw,
          capacidadActualAnteriorMw: sub.capacidadActualMw,
          disponibilidadAnterior: sub.disponibilidad
        });
      }
      onGuardado();
      onCancelar();
    } catch (err) {
      const mensaje =
        err instanceof SharePointRestError ? err.message : 'No se pudo registrar la disponibilidad.';
      setError(mensaje);
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
        {esLote ? '' : ` · ${nombreEquipo ?? ''} · ${central ?? ''}`}
      </p>
      {error ? <div className="alert alert-danger py-2">{error}</div> : null}
      <div className="mb-3">
        <label className="form-label" htmlFor="or-disp-fecha">
          Fecha retorno a servicio
        </label>
        <input
          id="or-disp-fecha"
          type="datetime-local"
          className="form-control form-control-sm"
          value={fechaLocal}
          onChange={(e) => setFechaLocal(e.target.value)}
          disabled={guardando}
        />
      </div>
      <div className="d-flex gap-2">
        <button type="button" className="btn btn-sm btn-secondary" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-sm cowork-btn-primary"
          onClick={() => {
            Confirmar().catch(() => undefined);
          }}
          disabled={guardando}
        >
          {guardando ? 'Guardando…' : 'Confirmar'}
        </button>
      </div>
    </div>
  );
}
