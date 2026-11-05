import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { SubequipoOperador } from '../../../../../../models/operadorRenovable/CatalogoEquiposOperador';
import { MarcarSubequipoIndisponibleEnSharePoint } from '../../../../../../services/sharepoint/operadorRenovable/ActualizarDisponibilidadSubequipoServicio';
import {
  MotivoIndisponibilidadFalla,
  MotivoIndisponibilidadTrabajo
} from '../../../../../../services/sharepoint/operadorRenovable/CamposOperadorRenovable';
import { ObtenerCapacidadesActualesPermitidas } from '../../../../../../services/sharepoint/operadorRenovable/UtilidadesCapacidadSubequipo';
import { SharePointRestError } from '../../../../../../services/sharepoint/SharePointRestError';
import {
  ConvertirEntradaLocalAIsoUtc,
  ConvertirIsoAFechaLocalInput
} from '../../../../../../utils/FechaHoraCorConecta';
import CampoFechaHora24 from '../../../../../concentrador/CampoFechaHora24';

export type FormularioMarcarIndisponibilidadSubequipoProps = {
  context: WebPartContext;
  subequipos: SubequipoOperador[];
  nombreEquipo?: string;
  central?: string;
  onCancelar: () => void;
  onGuardado: () => void;
};

export default function FormularioMarcarIndisponibilidadSubequipo(
  props: FormularioMarcarIndisponibilidadSubequipoProps
): React.ReactElement {
  const { context, subequipos, nombreEquipo, central, onCancelar, onGuardado } = props;
  const subequipo = subequipos[0];
  const esLote = subequipos.length > 1;

  const [motivo, setMotivo] = useState(MotivoIndisponibilidadTrabajo);
  const [descripcion, setDescripcion] = useState('');
  const [fechaLocal, setFechaLocal] = useState('');
  const [capacidadMw, setCapacidadMw] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const opcionesMw = useMemo(() => {
    if (!subequipo) {
      return [] as number[];
    }
    return ObtenerCapacidadesActualesPermitidas(subequipo);
  }, [subequipo]);

  useEffect(() => {
    if (!subequipo) {
      return;
    }
    setMotivo(MotivoIndisponibilidadTrabajo);
    setDescripcion('');
    setFechaLocal(ConvertirIsoAFechaLocalInput(new Date().toISOString()));
    setCapacidadMw(String(opcionesMw.indexOf(0) >= 0 ? 0 : (opcionesMw[0] ?? 0)));
    setError(undefined);
    setGuardando(false);
  }, [subequipo, subequipos, opcionesMw]);

  if (!subequipo) {
    return <></>;
  }

  const Confirmar = async (): Promise<void> => {
    const fechaIso = ConvertirEntradaLocalAIsoUtc(fechaLocal);
    if (!fechaIso) {
      setError('Indique la fecha de indisponibilidad.');
      return;
    }
    const mw = Number.parseFloat(capacidadMw.replace(',', '.'));
    if (!Number.isFinite(mw) || mw < 0 || mw > subequipo.capacidadMw) {
      setError(`Indique MW operativos entre 0 y ${subequipo.capacidadMw}.`);
      return;
    }
    if (opcionesMw.indexOf(mw) < 0) {
      setError('Seleccione una capacidad permitida para este subequipo.');
      return;
    }

    setGuardando(true);
    setError(undefined);
    try {
      for (const sub of subequipos) {
        const opcionesSub = ObtenerCapacidadesActualesPermitidas(sub);
        const mwSub = opcionesSub.indexOf(mw) >= 0 ? mw : opcionesSub[0] ?? 0;
        await MarcarSubequipoIndisponibleEnSharePoint(context, {
          subequipoId: sub.id,
          motivo,
          descripcion: descripcion.trim() || undefined,
          fechaIndisponibilidadIso: fechaIso,
          capacidadActualMw: mwSub,
          capacidadMaximaMw: sub.capacidadMw,
          disponibilidadAnterior: sub.disponibilidad
        });
      }
      onGuardado();
      onCancelar();
    } catch (err) {
      const mensaje =
        err instanceof SharePointRestError ? err.message : 'No se pudo registrar la indisponibilidad.';
      setError(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <h3 className="h6 mb-2">
        Marcar indisponibilidad
        {esLote ? ` (${subequipos.length} subequipos)` : ''}
      </h3>
      <p className="small text-muted mb-3">
        {subequipo.codigo}
        {esLote ? '' : ` · ${nombreEquipo ?? ''} · ${central ?? ''}`}
      </p>
      {error ? <div className="alert alert-danger py-2">{error}</div> : null}
      <div className="mb-3">
        <label className="form-label" htmlFor="or-indisp-motivo">
          Motivo
        </label>
        <select
          id="or-indisp-motivo"
          className="form-select form-select-sm"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          disabled={guardando}
        >
          <option value={MotivoIndisponibilidadTrabajo}>Trabajo</option>
          <option value={MotivoIndisponibilidadFalla}>Falla</option>
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="or-indisp-fecha">
          Fecha indisponibilidad
        </label>
        <CampoFechaHora24
          id="or-indisp-fecha"
          valor={fechaLocal}
          onCambio={setFechaLocal}
          disabled={guardando}
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="or-indisp-mw">
          MW operativos {esLote ? '(referencia del primero)' : `(máx. ${subequipo.capacidadMw})`}
        </label>
        {opcionesMw.length > 1 ? (
          <select
            id="or-indisp-mw"
            className="form-select form-select-sm"
            value={capacidadMw}
            onChange={(e) => setCapacidadMw(e.target.value)}
            disabled={guardando}
          >
            {opcionesMw.map((valorMw) => (
              <option key={valorMw} value={String(valorMw)}>
                {valorMw} MW
              </option>
            ))}
          </select>
        ) : (
          <input
            id="or-indisp-mw"
            type="number"
            step="0.1"
            min={0}
            max={subequipo.capacidadMw}
            className="form-control form-control-sm"
            value={capacidadMw}
            onChange={(e) => setCapacidadMw(e.target.value)}
            disabled={guardando}
          />
        )}
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="or-indisp-desc">
          Descripción (opcional)
        </label>
        <textarea
          id="or-indisp-desc"
          className="form-control form-control-sm"
          rows={2}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
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
