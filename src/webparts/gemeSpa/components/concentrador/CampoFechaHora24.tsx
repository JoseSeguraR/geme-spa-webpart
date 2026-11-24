import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
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

function ValorLocalParaSelectorNativo(valor: string): string {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(valor)) {
    return valor.substring(0, 16);
  }
  return '';
}

/**
 * Campo de fecha y hora en 24 h para COR Conecta. El texto visible evita AM/PM del sistema;
 * el botón de calendario abre `datetime-local` oculto (día y hora en un solo selector).
 */
export default function CampoFechaHora24(props: CampoFechaHora24Props): React.ReactElement {
  const { id, valor, onCambio, min, disabled, readOnly, required } = props;
  const [texto, setTexto] = useState(FormatearValorLocalParaEdicion(valor));
  const [error, setError] = useState<string | undefined>();
  const selectorFechaHoraRef = useRef<HTMLInputElement>(null);
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

  const AbrirSelectorFechaHora = (): void => {
    const selector = selectorFechaHoraRef.current;
    if (!selector) {
      return;
    }
    if (typeof selector.showPicker === 'function') {
      selector.showPicker();
    } else {
      selector.click();
    }
  };

  const OnElegirFechaHora = (evento: React.ChangeEvent<HTMLInputElement>): void => {
    const elegido = evento.target.value;
    if (!elegido) {
      return;
    }
    Aplicar(elegido.substring(0, 16));
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
          onClick={AbrirSelectorFechaHora}
          disabled={bloqueado}
          title="Elegir fecha y hora"
          aria-label="Elegir fecha y hora"
        >
          <i className="bi bi-calendar3" aria-hidden="true" />
        </button>
        <input
          ref={selectorFechaHoraRef}
          type="datetime-local"
          className="cowork-campo-fecha-hora24__selector"
          value={ValorLocalParaSelectorNativo(valor)}
          min={min ? ValorLocalParaSelectorNativo(min) || undefined : undefined}
          step={60}
          onChange={OnElegirFechaHora}
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
      {error ? <div className="invalid-feedback d-block">{error}</div> : null}
    </>
  );
}