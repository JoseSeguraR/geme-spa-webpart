const CaracteresProhibidosSharePoint = /[~"#%&*:<>?/\\{|}]/g;

/** Nombre apto para adjuntos: sin tildes ni caracteres prohibidos por SharePoint; conserva espacios. */
export function SanearNombreArchivoAdjunto(nombreOriginal: string): string {
  const nombreBase = nombreOriginal.trim() || 'archivo';
  const sinTildes = nombreBase.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const sinProhibidos = sinTildes.replace(CaracteresProhibidosSharePoint, '_');
  const sinControl = sinProhibidos
    .split('')
    .filter((caracter) => {
      const codigo = caracter.charCodeAt(0);
      return codigo >= 32;
    })
    .join('');
  const colapsado = sinControl.replace(/\s+/g, ' ').trim();
  const sinPuntosExtremos = colapsado.replace(/^\.+/, '').replace(/\.+$/, '');
  return sinPuntosExtremos || 'archivo';
}

export function ArchivoConNombreSanitizado(archivo: File): File {
  const nombreSanitizado = SanearNombreArchivoAdjunto(archivo.name);
  if (nombreSanitizado === archivo.name) {
    return archivo;
  }
  return new File([archivo], nombreSanitizado, {
    type: archivo.type,
    lastModified: archivo.lastModified
  });
}
