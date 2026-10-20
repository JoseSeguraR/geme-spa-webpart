export function ParsearIdCentralDesdeCodigoSiod(codigo: string, etiquetaCentral?: string): number {
  const texto = codigo.trim();
  if (!texto) {
    const sufijo = etiquetaCentral ? ` (${etiquetaCentral})` : '';
    throw new Error(`La central seleccionada no tiene código SIOD (CODIGO_SIOD) configurado${sufijo}.`);
  }

  const numero = Number(texto);
  if (!Number.isFinite(numero)) {
    const sufijo = etiquetaCentral ? ` (${etiquetaCentral})` : '';
    throw new Error(`El código SIOD de la central no es un número válido${sufijo}.`);
  }

  return numero;
}
