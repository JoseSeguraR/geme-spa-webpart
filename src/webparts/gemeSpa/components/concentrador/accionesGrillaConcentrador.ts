export type AccionMenuFilaGrilla = {
  id: string;
  etiqueta: string;
  onEjecutar: () => void;
  iconoBootstrap?: string;
  claseIcono?: string;
};

const IconosPorIdAccion: Record<string, { icono: string; clase: string }> = {
  ver: { icono: 'bi-eye', clase: 'text-primary' },
  clonar: { icono: 'bi-pencil-square', clase: 'text-warning' },
  bitacora: { icono: 'bi-clipboard-check', clase: 'text-success' },
  gestionar: { icono: 'bi-arrow-right-circle-fill', clase: 'text-danger' },
  editar: { icono: 'bi-pencil', clase: 'text-warning' },
  finalizar: { icono: 'bi-check-circle', clase: 'text-success' },
  'lista-equipos': { icono: 'bi-list-ul', clase: 'text-secondary' }
};

export function AccionMenuFilaGrillaConIcono(
  id: string,
  etiqueta: string,
  onEjecutar: () => void
): AccionMenuFilaGrilla {
  const catalogo = IconosPorIdAccion[id];
  return {
    id,
    etiqueta,
    onEjecutar,
    iconoBootstrap: catalogo?.icono,
    claseIcono: catalogo?.clase
  };
}
