export type AtributosEnlaceExternoMenu = {
  href: string;
  target?: '_blank';
  rel?: 'noopener noreferrer';
};

/**
 * Une el prefijo de la colección (p. ej. `context.pageContext.site.serverRelativeUrl`) con una ruta bajo el web raíz.
 */
export function ConstruirRutaServidorRelativa(
  prefijoRutaServidorSitio: string,
  rutaDesdeRaizWebColeccion: string
): string {
  const base = prefijoRutaServidorSitio.trim().replace(/\/$/, '');
  const segmento = rutaDesdeRaizWebColeccion.trim().replace(/^\//, '');
  if (!base) {
    return `/${segmento}`;
  }
  if (!segmento) {
    return base;
  }
  return `${base}/${segmento}`;
}

function ResolverUrlAbsoluta(url: string, urlColeccionSitio: string): URL | undefined {
  const trimmed = url.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    if (trimmed.startsWith('/')) {
      const base = new URL(urlColeccionSitio);
      return new URL(trimmed, base.origin);
    }

    if (trimmed.startsWith('//')) {
      return new URL(`${window.location.protocol}${trimmed}`);
    }

    return new URL(trimmed);
  } catch {
    return undefined;
  }
}

export function EsUrlInternaColeccionSitio(url: string, urlColeccionSitio: string): boolean {
  const baseUrl = ResolverUrlAbsoluta(urlColeccionSitio, urlColeccionSitio);
  const enlaceUrl = ResolverUrlAbsoluta(url, urlColeccionSitio);

  if (!baseUrl || !enlaceUrl) {
    return false;
  }

  if (baseUrl.origin.toLowerCase() !== enlaceUrl.origin.toLowerCase()) {
    return false;
  }

  const pathBase = baseUrl.pathname.replace(/\/$/, '').toLowerCase();
  const pathEnlace = enlaceUrl.pathname.replace(/\/$/, '').toLowerCase();

  return pathEnlace === pathBase || pathEnlace.startsWith(`${pathBase}/`);
}

export function ObtenerAtributosEnlaceExternoMenu(
  url: string,
  urlColeccionSitio: string
): AtributosEnlaceExternoMenu {
  const trimmed = url.trim();
  const interna = EsUrlInternaColeccionSitio(trimmed, urlColeccionSitio);

  if (interna && trimmed.startsWith('/')) {
    return { href: trimmed };
  }

  const absoluta = ResolverUrlAbsoluta(trimmed, urlColeccionSitio);
  const href = absoluta?.href ?? trimmed;

  if (interna) {
    return { href };
  }

  return {
    href,
    target: '_blank',
    rel: 'noopener noreferrer'
  };
}
