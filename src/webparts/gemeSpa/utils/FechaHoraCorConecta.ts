/**
 * Fecha y hora en COR Conecta: siempre `dd/mm/aaaa hh:mm`, 00–23 h, sin AM/PM.
 * Mostrar con `FormatearFechaHoraVisible`; ingresar con `CampoFechaHora24`.
 */
const Rellenar = (n: number): string => (n < 10 ? `0${n}` : String(n));

function ConstruirValorLocal(anio: number, mes: number, dia: number, hora: number, minuto: number): string {
  return `${anio}-${Rellenar(mes)}-${Rellenar(dia)}T${Rellenar(hora)}:${Rellenar(minuto)}`;
}

function EsFechaHoraValida(anio: number, mes: number, dia: number, hora: number, minuto: number): boolean {
  if (hora > 23 || minuto > 59 || mes < 1 || mes > 12 || dia < 1) {
    return false;
  }
  const fecha = new Date(anio, mes - 1, dia);
  return fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
}

export function FormatearFechaHoraVisible(valor: string | undefined): string {
  if (!valor) {
    return '';
  }
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    return valor;
  }
  return FormatearValorLocalParaEdicion(ConvertirIsoAFechaLocalInput(valor));
}

/** Convierte valor local `AAAA-MM-DDTHH:mm` a ISO UTC para SharePoint. */
export function ConvertirEntradaLocalAIsoUtc(valorLocal: string): string {
  if (!valorLocal.trim()) {
    return '';
  }
  const fecha = new Date(valorLocal);
  if (Number.isNaN(fecha.getTime())) {
    return '';
  }
  return fecha.toISOString();
}

export function ConvertirIsoAFechaLocalInput(valorIso: string | undefined): string {
  if (!valorIso) {
    return '';
  }
  const fecha = new Date(valorIso);
  if (Number.isNaN(fecha.getTime())) {
    return '';
  }
  return ConstruirValorLocal(
    fecha.getFullYear(),
    fecha.getMonth() + 1,
    fecha.getDate(),
    fecha.getHours(),
    fecha.getMinutes()
  );
}

/**
 * Interpreta texto escrito o pegado: `dd/mm/aaaa hh:mm`, `dd-mm-aaaa hh:mm` (segundos opcionales)
 * o `aaaa-mm-ddThh:mm`. Sin hora usa la hora actual. Devuelve `AAAA-MM-DDTHH:mm` o `undefined`.
 */
export function InterpretarFechaHoraPegada(texto: string): string | undefined {
  const limpio = texto.trim();
  const ahora = new Date();

  const latino = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ T,]+(\d{1,2}):(\d{2})(?::\d{2})?)?$/.exec(limpio);
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?)?$/.exec(limpio);

  let anio: number;
  let mes: number;
  let dia: number;
  let horaTexto: string | undefined;
  let minutoTexto: string | undefined;
  if (latino) {
    dia = Number(latino[1]);
    mes = Number(latino[2]);
    anio = Number(latino[3]);
    horaTexto = latino[4];
    minutoTexto = latino[5];
  } else if (iso) {
    anio = Number(iso[1]);
    mes = Number(iso[2]);
    dia = Number(iso[3]);
    horaTexto = iso[4];
    minutoTexto = iso[5];
  } else {
    return undefined;
  }

  const hora = horaTexto === undefined ? ahora.getHours() : Number(horaTexto);
  const minuto = minutoTexto === undefined ? ahora.getMinutes() : Number(minutoTexto);
  if (!EsFechaHoraValida(anio, mes, dia, hora, minuto)) {
    return undefined;
  }
  return ConstruirValorLocal(anio, mes, dia, hora, minuto);
}

/** `AAAA-MM-DDTHH:mm` → `dd/mm/aaaa hh:mm` para mostrar en el campo de edición. */
export function FormatearValorLocalParaEdicion(valorLocal: string | undefined): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(valorLocal ?? '');
  if (!partes) {
    return '';
  }
  return `${partes[3]}/${partes[2]}/${partes[1]} ${partes[4]}:${partes[5]}`;
}
