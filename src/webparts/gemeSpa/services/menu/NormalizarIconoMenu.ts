export function NormalizarIconoMenu(icono: string | undefined): string | undefined {
  if (!icono) {
    return undefined;
  }

  const valor = icono.trim();
  if (!valor) {
    return undefined;
  }

  if (valor.startsWith('bi bi-')) {
    return valor.slice(6).trim();
  }

  if (valor.startsWith('bi-')) {
    return valor.slice(3);
  }

  if (valor.startsWith('bi ')) {
    return valor.slice(3).trim();
  }

  return valor;
}
