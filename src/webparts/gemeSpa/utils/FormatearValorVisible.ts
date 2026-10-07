export function FormatearValorVisible(valor: string | number | boolean | undefined): string {
  if (valor === undefined || valor === null) {
    return '';
  }
  if (typeof valor === 'boolean') {
    return valor ? 'Sí' : 'No';
  }
  return String(valor);
}
