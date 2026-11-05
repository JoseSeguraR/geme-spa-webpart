/** Debe coincidir con la rutaHash del menú (HASH_KEY acumulados). */
export const RutaHashOperadorRenovableSolicitudes =
  'cor-conecta/concentrador/operador-renovable/solicitudes' as const;

export const RutaHashOperadorRenovableEquipos =
  'cor-conecta/concentrador/operador-renovable/equipos' as const;

export const RutaHashOperadorRenovableSubestacion =
  'cor-conecta/concentrador/operador-renovable/subestacion' as const;

/** Ancla del menú lateral para resaltar el módulo en cualquier tab. */
export const RutaHashAnclaOperadorRenovable = RutaHashOperadorRenovableSolicitudes;

export const RutasHashGrupoTabsOperadorRenovable: readonly string[] = [
  RutaHashOperadorRenovableSolicitudes,
  RutaHashOperadorRenovableEquipos,
  RutaHashOperadorRenovableSubestacion
];

export type TabOperadorRenovable = 'solicitudes' | 'equipos' | 'subestacion';

export type DefinicionTabOperadorRenovable = {
  id: TabOperadorRenovable;
  etiqueta: string;
  iconoBootstrap: string;
  rutaHash: string;
};

export const TabsOperadorRenovableDefinicion: readonly DefinicionTabOperadorRenovable[] = [
  {
    id: 'solicitudes',
    etiqueta: 'Solicitudes con indisponibilidad',
    iconoBootstrap: 'bi-sun',
    rutaHash: RutaHashOperadorRenovableSolicitudes
  },
  {
    id: 'equipos',
    etiqueta: 'Disponibilidad de equipos',
    iconoBootstrap: 'bi-building',
    rutaHash: RutaHashOperadorRenovableEquipos
  },
  {
    id: 'subestacion',
    etiqueta: 'Limitación por subestación',
    iconoBootstrap: 'bi-lightning-charge',
    rutaHash: RutaHashOperadorRenovableSubestacion
  }
];
