import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { PropiedadesWebPartSolicitudesIl } from '../models/ConfiguracionSolicitudesIl';

export interface GemeSpaProps {
  context: WebPartContext;
  userDisplayName: string;
  signOutUrl: string;
  versionWebPart: string;
  propiedadesSolicitudesIl: PropiedadesWebPartSolicitudesIl;
}
