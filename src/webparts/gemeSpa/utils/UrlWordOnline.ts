/** URL para abrir un documento en Word Online (?web=1). */
export function ConstruirUrlEdicionWordOnline(url: string): string {
  if (!url.trim()) {
    return url;
  }
  if (/[?&]web=1(?:&|$)/i.test(url)) {
    return url;
  }
  const separador = url.includes('?') ? '&' : '?';
  return `${url}${separador}web=1`;
}
