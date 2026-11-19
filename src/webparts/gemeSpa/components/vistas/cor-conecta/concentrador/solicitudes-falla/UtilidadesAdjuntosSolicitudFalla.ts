export function IconoAdjuntoPorNombre(nombreArchivo: string): string {
  const extension = nombreArchivo.split('.').pop()?.toLowerCase() ?? '';
  if (extension === 'pdf') {
    return 'bi-file-earmark-pdf text-danger';
  }
  if (extension === 'zip' || extension === 'rar' || extension === '7z') {
    return 'bi-file-earmark-zip text-warning';
  }
  return 'bi-file-earmark';
}