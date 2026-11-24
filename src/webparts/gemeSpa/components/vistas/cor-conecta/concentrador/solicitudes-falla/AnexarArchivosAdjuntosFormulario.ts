/** Acumula selecciones sucesivas del input file sin duplicar por nombre y tamaño. */
export function AnexarArchivosAdjuntosFormulario(actuales: File[], seleccionados: File[]): File[] {
  const clave = (archivo: File): string => `${archivo.name}\u0000${archivo.size}`;
  const porClave = new Map<string, File>();
  for (const archivo of actuales) {
    porClave.set(clave(archivo), archivo);
  }
  for (const archivo of seleccionados) {
    porClave.set(clave(archivo), archivo);
  }
  return Array.from(porClave.values());
}