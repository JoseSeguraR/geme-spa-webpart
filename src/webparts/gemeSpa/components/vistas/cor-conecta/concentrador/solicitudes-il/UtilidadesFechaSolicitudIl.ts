const OpcionesFechaHoraEs: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
};

export function FormatearFechaHoraVisible(valor: string | undefined): string {
  if (!valor) {
    return '';
  }
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    return valor;
  }
  return fecha.toLocaleString('es-CL', OpcionesFechaHoraEs);
}

/** Convierte valor de input datetime-local a ISO UTC para SharePoint. */
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
  const pad = (n: number): string => (n < 10 ? `0${n}` : String(n));
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
}
