/**
 * Pantallas de «Control Sitio» del Concentrador (pie del sidebar). SISTEMA_ACCESOS sigue apuntando a las
 * páginas antiguas (`CONC/Administracion/admuserfn.aspx`, `mantenedores.aspx`); el menú reemplaza esos
 * enlaces por estas pantallas. Las vistas se registran por sufijo (`registro-vistas/controlSitio.tsx`):
 * `…/permisos-usuarios`, `…/mantenedores/empresas`, etc.
 */

/** Último segmento de la ruta de Permisos de usuario. */
export const HashKeyPermisosUsuarios = 'permisos-usuarios';

/** Segmento de la ruta de los mantenedores (`…/mantenedores/<clave>`). */
export const HashKeyGrupoMantenedores = 'mantenedores';

/**
 * Prefijo de las rutas que arma el menú al reemplazar los enlaces antiguos de SISTEMA_ACCESOS
 * (`services/menu/ReemplazarEnlacesLegadoControlSitio.ts`).
 */
export const PrefijoRutaControlSitio = 'control-sitio';

export type ClaveMantenedor =
  | 'plazo-programadas'
  | 'plazo-sodi'
  | 'empresas'
  | 'centrales'
  | 'tipos-tecnologia'
  | 'equipos-central'
  | 'tipos-equipos'
  | 'afectaciones'
  | 'tipos-trabajo';

export type DefinicionPantallaMantenedor = {
  /** HASH_KEY del Route en SISTEMA_ACCESOS (hijo de «Mantenedores»). */
  clave: ClaveMantenedor;
  /** HASH_TITLE: texto del menú y título de la pantalla. */
  etiqueta: string;
  /** Ícono Bootstrap (columna ICONO de SISTEMA_ACCESOS sin el prefijo `bi-`). */
  icono: string;
  descripcion: string;
};

/** Orden del menú Mantenedores (mismo que la página antigua `CONC/Administracion/mantenedores.aspx`). */
export const PantallasMantenedores: readonly DefinicionPantallaMantenedor[] = [
  {
    clave: 'plazo-programadas',
    etiqueta: 'Plazo de envío de solicitudes programadas',
    icono: 'clock',
    descripcion:
      'Días hábiles de anticipación y hora límite para enviar una solicitud programada, según el día de la semana.'
  },
  {
    clave: 'plazo-sodi',
    etiqueta: 'Plazo de envío de solicitudes SODI',
    icono: 'exclamation-triangle',
    descripcion: 'Días hábiles de anticipación y hora límite para enviar una solicitud SODI, por central.'
  },
  {
    clave: 'empresas',
    etiqueta: 'Empresas solicitantes/receptoras',
    icono: 'building',
    descripcion: 'Empresas que se eligen como solicitante o receptora en las solicitudes.'
  },
  {
    clave: 'centrales',
    etiqueta: 'Centrales GM',
    icono: 'geo-alt',
    descripcion: 'Centrales (instalaciones) de GM, su tecnología, código SIOD y módulos en que se usan.'
  },
  {
    clave: 'tipos-tecnologia',
    etiqueta: 'Tipos de tecnología',
    icono: 'lightning-charge',
    descripcion: 'Tecnologías de generación que se asignan a cada central.'
  },
  {
    clave: 'equipos-central',
    etiqueta: 'Equipos a intervenir por central',
    icono: 'tools',
    descripcion: 'Equipos de cada central y, en cada equipo, sus subequipos con sus capacidades en MW.'
  },
  {
    clave: 'tipos-equipos',
    etiqueta: 'Tipos de equipos',
    icono: 'gear-wide-connected',
    descripcion: 'Tipos que se asignan a los equipos y subequipos.'
  },
  {
    clave: 'afectaciones',
    etiqueta: 'Afectaciones',
    icono: 'exclamation-circle',
    descripcion: 'Afectaciones que se indican en las solicitudes.'
  },
  {
    clave: 'tipos-trabajo',
    etiqueta: 'Tipos de trabajo',
    icono: 'briefcase',
    descripcion: 'Tipos de trabajo de las solicitudes (por ejemplo SDCN, IL, SODI).'
  }
];

export function SufijoRutaMantenedor(clave: ClaveMantenedor): string {
  return `${HashKeyGrupoMantenedores}/${clave}`;
}

export function ObtenerPantallaMantenedor(clave: ClaveMantenedor): DefinicionPantallaMantenedor {
  const pantalla = PantallasMantenedores.find((p) => p.clave === clave);
  if (!pantalla) {
    throw new Error(`Mantenedor no definido: ${clave}`);
  }
  return pantalla;
}
