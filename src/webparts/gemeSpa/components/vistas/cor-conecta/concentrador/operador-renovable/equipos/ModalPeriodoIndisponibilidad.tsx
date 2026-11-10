import * as React from 'react';
import { useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import {
  AnularIndisponibilidadPeriodo,
  ModificarFechaEstimadaPeriodo
} from '../../../../../../services/sharepoint/operadorRenovable/ActualizarDisponibilidadSubequipoServicio';
import {
  PeriodosApiError,
  type PeriodoIndisponibilidad
} from '../../../../../../services/sharepoint/operadorRenovable/PeriodosIndisponibilidadApiServicio';
import {
  ConvertirEntradaLocalAIsoUtc,
  ConvertirIsoAFechaLocalInput,
  FormatearFechaHoraVisible
} from '../../../../../../utils/FechaHoraCorConecta';
import ModalFormulario from '../../../../../comunes/ModalFormulario';
import CampoFechaHora24 from '../../../../../concentrador/CampoFechaHora24';

export type ModoModalPeriodo = 'fechaEstimada' | 'anular';

export type ModalPeriodoIndisponibilidadProps = {
  context: WebPartContext;
  periodo?: PeriodoIndisponibilidad;
  modo: ModoModalPeriodo;
  onCerrar: () => void;
  /** Tras guardar; con aviso si el perfil no se pudo enviar a Meteológica. */
  onGuardado: (aviso?: string) => void;
};

const EtiquetasEstado: Record<string, string> = {
  PROGRAMADO: 'Programada',
  VIGENTE: 'Vigente',
  VENCIDO: 'Vencida',
  FINALIZADO: 'Finalizada',
  ANULADO: 'Anulada'
};

export function EtiquetaEstadoPeriodo(estado: string): string {
  return EtiquetasEstado[estado] ?? estado;
}

/** «Modificar fecha estimada» o «Anular» de una indisponibilidad (períodos de la App Function). */
export default function ModalPeriodoIndisponibilidad(props: ModalPeriodoIndisponibilidadProps): React.ReactElement {
  const { context, periodo, modo, onCerrar, onGuardado } = props;
  const [fechaLocal, setFechaLocal] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setFechaLocal(periodo ? ConvertirIsoAFechaLocalInput(periodo.fechaFinEstimada) : '');
    setError(undefined);
    setGuardando(false);
  }, [periodo, modo]);

  if (!periodo) {
    return <></>;
  }

  const Guardar = async (): Promise<void> => {
    let fechaIso = '';
    if (modo === 'fechaEstimada') {
      fechaIso = ConvertirEntradaLocalAIsoUtc(fechaLocal);
      if (!fechaIso) {
        setError('Ingrese la fecha estimada de fin.');
        return;
      }
      if (fechaIso <= periodo.fechaInicio) {
        setError('La fecha estimada de fin debe ser posterior al inicio.');
        return;
      }
    }
    setGuardando(true);
    setError(undefined);
    try {
      const resultado =
        modo === 'fechaEstimada'
          ? await ModificarFechaEstimadaPeriodo(context, periodo, fechaIso)
          : await AnularIndisponibilidadPeriodo(context, periodo);
      const avisos = [resultado.envio.enviado ? '' : resultado.envio.mensaje].concat(resultado.avisos).filter((p) => p);
      onGuardado(avisos.length > 0 ? `Cambio guardado. ${avisos.join(' ')}` : undefined);
      onCerrar();
    } catch (err) {
      setError(err instanceof PeriodosApiError ? err.message : 'No se pudo guardar el cambio.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ModalFormulario
      visible={true}
      titulo={modo === 'fechaEstimada' ? 'Modificar fecha estimada de fin' : 'Anular indisponibilidad'}
      icono={modo === 'fechaEstimada' ? 'bi-calendar-event' : 'bi-x-octagon'}
      error={error}
      guardando={guardando}
      textoGuardar={modo === 'fechaEstimada' ? 'Guardar' : 'Anular'}
      onGuardar={() => {
        Guardar().catch(() => undefined);
      }}
      onCerrar={onCerrar}
    >
      <p className="mb-1">
        <strong>{periodo.subequipoCodigo}</strong> · {periodo.instalacionCodigo}
      </p>
      <p className="small text-muted mb-3">
        {EtiquetaEstadoPeriodo(periodo.estadoCalculado)} · {periodo.motivo} · desde {FormatearFechaHoraVisible(periodo.fechaInicio)} ·
        fin estimado {FormatearFechaHoraVisible(periodo.fechaFinEstimada)} · fuera {periodo.mwFuera.toLocaleString('es-CL')} MW
      </p>
      {modo === 'fechaEstimada' ? (
        <div>
          <label className="form-label fw-semibold" htmlFor="or-periodo-fin-estimado">
            Fecha estimada de fin
          </label>
          <CampoFechaHora24
            id="or-periodo-fin-estimado"
            valor={fechaLocal}
            onCambio={setFechaLocal}
            min={ConvertirIsoAFechaLocalInput(periodo.fechaInicio)}
            disabled={guardando}
          />
          <div className="form-text">Se recalcula la capacidad de la central y se vuelve a informar a Meteológica.</div>
        </div>
      ) : (
        <div className="alert alert-warning py-2 mb-0">
          La indisponibilidad deja de contar como si nunca hubiera existido y se vuelve a informar la capacidad de la
          central a Meteológica. Use esta acción solo si se registró por error; si el equipo volvió, márquelo disponible.
        </div>
      )}
    </ModalFormulario>
  );
}
