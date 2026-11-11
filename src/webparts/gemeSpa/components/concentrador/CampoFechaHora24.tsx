import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  ConvertirIsoAFechaLocalInput,
  FormatearValorLocalParaEdicion,
  InterpretarFechaHoraPegada
} from '../../utils/FechaHoraCorConecta';

export type CampoFechaHora24Props = {
  id: string;
  /** Valor local `AAAA-MM-DDTHH:mm` (mismo contrato que `datetime-local`); vacío si no hay fecha. */
  valor: string;
  onCambio: (valor: string) => void;
  min?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  'aria-describedby'?: string;
};

const MensajeFormatoInvalido = 'Formato dd/mm/aaaa hh:mm (00 a 23 h).';

/**
 * Campo de fecha y hora en 24 h para COR Conecta (reemplaza a `datetime-local`, que muestra AM/PM
 * según el idioma del sistema). Acepta escribir o pegar `dd/mm/aaaa hh:mm` o `dd-mm-aaaa hh:mm`;
 * sin hora toma la actual. El botón de calendario solo elige el día y conserva la hora.
 */
export default function CampoFechaHora24(props: CampoFechaHora24Props): React.ReactElement {
  const { id, valor, onCambio, min, disabled, readOnly, required } = props;
  const [texto, setTexto] = useState(FormatearValorLocalParaEdicion(valor));
  const [error, setError] = useState<string | undefined>();
  const selectorFechaRef = useRef<HTMLInputElement>(null);
  const bloqueado = Boolean(disabled || readOnly);

  useEffect(() => {
    setTexto(FormatearValorLocalParaEdicion(valor));
    setError(undefined);
  }, [valor]);

  const Aplicar = (valorLocal: string | undefined): void => {
    if (valorLocal === undefined) {
      setError(MensajeFormatoInvalido);
      return;
    }
    if (valorLocal && min && valorLocal < min) {
      setError(`Debe ser igual o posterior a ${FormatearValorLocalParaEdicion(min)}.`);
      return;
    }
    setError(undefined);
    setTexto(FormatearValorLocalParaEdicion(valorLocal));
    if (valorLocal !== valor) {
      onCambio(valorLocal);
    }
  };

  const Confirmar = (): void => {
    const limpio = texto.trim();
    Aplicar(limpio ? InterpretarFechaHoraPegada(limpio) : '');
  };

  const OnPegar = (evento: React.ClipboardEvent<HTMLInputElement>): void => {
    const interpretado = InterpretarFechaHoraPegada(evento.clipboardData.getData('text'));
    if (interpretado) {
      evento.preventDefault();
      Aplicar(interpretado);
    }
  };

  const AbrirCalendario = (): void => {
    const selector = selectorFechaRef.current;
    if (!selector) {
      return;
    }
    if (typeof selector.showPicker === 'function') {
      selector.showPicker();
    } else {
      selector.click();
    }
  };

  const OnElegirDia = (evento: React.ChangeEvent<HTMLInputElement>): void => {
    const dia = evento.target.value;
    if (!dia) {
      return;
    }
    const hora = (valor || ConvertirIsoAFechaLocalInput(new Date().toISOString())).substring(11, 16);
    Aplicar(`${dia}T${hora}`);
  };

  return (
    <>
      <div className="input-group input-group-sm position-relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          className={`form-control form-control-sm${error ? ' is-invalid' : ''}`}
          placeholder="dd/mm/aaaa hh:mm"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          onBlur={Confirmar}
          onKeyDown={(evento) => {
            if (evento.key === 'Enter') {
              evento.preventDefault();
              Confirmar();
            }
          }}
          onPaste={OnPegar}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={props['aria-describedby']}
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={AbrirCalendario}
          disabled={bloqueado}
          title="Elegir día en el calendario"
          aria-label="Elegir día en el calendario"
        >
          <i className="bi bi-calendar3" aria-hidden="true" />
        </button>
        <input
          ref={selectorFechaRef}
          type="date"
          className="cowork-campo-fecha-hora24__selector"
          value={valor.substring(0, 10)}
          min={min ? min.substring(0, 10) : undefined}
          onChange={OnElegirDia}
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
      {error ? <div className="invalid-feedback d-block">{error}</div> : null}
    </>
  );
}
