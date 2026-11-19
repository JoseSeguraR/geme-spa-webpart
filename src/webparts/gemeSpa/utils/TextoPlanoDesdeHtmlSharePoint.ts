/**
 * Convierte HTML enriquecido de SharePoint (p. ej. `<div class="ExternalClass…">`) a texto legible.
 */
export function TextoPlanoDesdeHtmlSharePoint(html: string): string {
  const entrada = html?.trim() ?? '';
  if (!entrada) {
    return '';
  }
  if (!entrada.includes('<')) {
    return entrada;
  }

  let conSaltos = entrada
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n');

  let textoPlano = '';
  if (typeof DOMParser !== 'undefined') {
    const documento = new DOMParser().parseFromString(conSaltos, 'text/html');
    textoPlano = documento.body.textContent ?? '';
  } else {
    textoPlano = conSaltos.replace(/<[^>]+>/g, '');
  }

  return textoPlano
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}