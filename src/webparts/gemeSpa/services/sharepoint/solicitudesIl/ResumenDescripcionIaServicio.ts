import { MaxLongitudDescripcionSolicitudIl } from '../../../components/vistas/cor-conecta/concentrador/solicitudes-il/constantesSolicitudesIl';

/** El endpoint responde en el peor caso en unos 80 s (llamada + reescritura, cada una con reintento). */
const LimiteEsperaResumenMs = 90000;

export type ResultadoResumenDescripcion = {
  resumen: string;
  /** false: el texto ya cabía en la descripción y se copió sin llamar a la IA. */
  generadoConIa: boolean;
};

export class ResumenDescripcionIaError extends Error {
  public constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ResumenDescripcionIaError';
  }
}

function MensajeErrorHttp(status: number): string {
  switch (status) {
    case 400:
      return 'La descripción larga no se pudo resumir: revise que tenga al menos 10 caracteres.';
    case 401:
    case 403:
      return 'El servicio de resumen rechazó la llave: revise «URL resumen con IA» en las propiedades del Web Part.';
    case 422:
      return 'El filtro de contenido de Azure rechazó el texto. Escriba la descripción a mano.';
    case 503:
      return 'El resumen con IA no está configurado en la App Function (Azure OpenAI).';
    case 504:
      return 'La IA no respondió a tiempo. Intente de nuevo.';
    default:
      return `No se pudo resumir la descripción (HTTP ${status}).`;
  }
}

/**
 * Resumen de la descripción larga en hasta {@link MaxLongitudDescripcionSolicitudIl} caracteres.
 * Si el texto ya cabe, se devuelve igual sin llamar a la App Function.
 */
export async function ResumirDescripcionSolicitudIl(
  urlResumenIa: string | undefined,
  descripcionLarga: string
): Promise<ResultadoResumenDescripcion> {
  const texto = descripcionLarga.trim();
  if (!texto) {
    throw new ResumenDescripcionIaError('Ingrese la descripción larga para resumirla.');
  }
  if (texto.length <= MaxLongitudDescripcionSolicitudIl) {
    return { resumen: texto, generadoConIa: false };
  }

  const url = urlResumenIa?.trim() ?? '';
  if (!url) {
    throw new ResumenDescripcionIaError(
      'Falta configurar «URL resumen con IA» en las propiedades del Web Part (App Function).'
    );
  }

  const controlador = new AbortController();
  const temporizador = window.setTimeout(() => controlador.abort(), LimiteEsperaResumenMs);
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: texto, language: 'es' }),
      signal: controlador.signal
    });
  } catch {
    throw new ResumenDescripcionIaError(
      controlador.signal.aborted
        ? 'La IA no respondió a tiempo. Intente de nuevo.'
        : 'No se pudo conectar con el servicio de resumen (App Function).'
    );
  } finally {
    window.clearTimeout(temporizador);
  }

  if (!response.ok) {
    throw new ResumenDescripcionIaError(MensajeErrorHttp(response.status));
  }
  const cuerpo = (await response.json().catch(() => ({}))) as { summary?: string };
  const resumen = (cuerpo.summary ?? '').trim();
  if (!resumen) {
    throw new ResumenDescripcionIaError('El servicio de resumen no devolvió texto.');
  }
  // La Function ya garantiza el largo; se corta igual para no superar el límite de la columna.
  return { resumen: resumen.slice(0, MaxLongitudDescripcionSolicitudIl), generadoConIa: true };
}
