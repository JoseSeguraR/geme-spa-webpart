/** Propiedades del Web Part para el Operador renovable (App Function geme-cope-app-function). */
export type PropiedadesWebPartOperadorRenovable = {
  /** GET /api/meteologica-facilities (con ?code=<function key>): capacidad instalada en Meteológica. */
  concOperadorRenovableUrlMeteologicaFacilities?: string;
  /**
   * Base de /api/concentrador-periodos (con ?code=<function key>): indisponibilidades con fecha estimada de
   * fin y perfil de capacidad a Meteológica. Es obligatoria para marcar subequipos: sin ella el formulario no guarda.
   */
  concOperadorRenovableUrlPeriodos?: string;
};
