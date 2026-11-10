import * as React from 'react';
import { useEffect, useState } from 'react';
import { InterpretarHora24 } from '../../utils/FechaHoraCorConecta';

export type CampoHora24Props = {
  id: string;
  /** Hora `HH:mm` (00 a 23); vacío si no hay hora. */
  valor: string;
  onCambio: (valor: string) => void;
  disabled?: boolean;
  'aria-label'?: string;
};

const MensajeFormatoInvalido = 'Formato hh:mm (00 a 23 h).';

/**
 * Hora en 24 h para COR Conecta (reemplaza a `type="time"`, que muestra AM/PM según el idioma del sistema).
 * Acepta escribir o pegar `9:05`, `09:05` o `0905`; el valor se toma al salir del campo o con Enter.
 */
export default function CampoHora24(props: CampoHora24Props): React.ReactElement {
  const { id, valor, onCambio, disabled } = props;
  const [texto, setTexto] = useState(valor);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setTexto(valor);
    setError(undefined);
  }, [valor]);

  const Aplicar = (entrada: string): void => {
    const hora = InterpretarHora24(entrada);
    if (hora === undefined) {
      setError(MensajeFormatoInvalido);
      return;
    }
    setError(undefined);
    setTexto(hora);
    if (hora !== valor) {
      onCambio(hora);
    }
  };

  return (
    <div className="cowork-campo-hora24">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        className={`form-control form-control-sm${error ? ' is-invalid' : ''}`}
        placeholder="hh:mm"
        maxLength={8}
        value={texto}
        disabled={disabled}
        aria-label={props['aria-label']}
        aria-invalid={error ? true : undefined}
        onChange={(evento) => setTexto(evento.target.value)}
        onBlur={() => Aplicar(texto)}
        onKeyDown={(evento) => {
          if (evento.key === 'Enter') {
            evento.preventDefault();
            Aplicar(texto);
          }
        }}
        onPaste={(evento) => {
          const pegado = evento.clipboardData.getData('text');
          if (InterpretarHora24(pegado)) {
            evento.preventDefault();
            Aplicar(pegado);
          }
        }}
      />
      {error ? <div className="invalid-feedback d-block">{error}</div> : null}
    </div>
  );
}
