import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { PropiedadesWebPartSolicitudesIl } from '../models/ConfiguracionSolicitudesIl';

export interface GemeSpaProps {
  context: WebPartContext;
  userDisplayName: string;
  signOutUrl: string;
  versionWebPart: string;
  propiedadesSolicitudesIl: PropiedadesWebPartSolicitudesIl;
  /** Solo con la página en edición: abre el panel de propiedades del web part (la SPA tapa su barra). */
  onAbrirPropiedades?: () => void;
}
