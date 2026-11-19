import { RutaHashSolicitudFallaAdministrador } from '../solicitudes-falla/rutas';

/** Debe coincidir con la rutaHash del menú (HASH_KEY acumulados). */
export const RutaHashSolicitudesIl = 'cor-conecta/concentrador/administrador/solicitudes-il' as const;

/** Ancla del grupo de tabs Solicitudes (menú o tab principal cuando exista en SPA). */
export const RutaHashAnclaSolicitudesAdministrador =
  'cor-conecta/concentrador/administrador/solicitudes' as const;

/**
 * Pantallas del mismo grupo de tabs que resaltan la ancla en el menú lateral.
 * Ampliar al registrar guías de maniobra u otras rutas hermanas.
 */
export const RutasHashGrupoTabsSolicitudesAdministrador: readonly string[] = [
  RutaHashSolicitudesIl,
  RutaHashSolicitudFallaAdministrador
];
