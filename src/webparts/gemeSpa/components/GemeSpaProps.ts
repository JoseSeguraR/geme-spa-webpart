import type { WebPartContext } from '@microsoft/sp-webpart-base';

export interface GemeSpaProps {
  context: WebPartContext;
  userDisplayName: string;
  signOutUrl: string;
  versionWebPart: string;
}
