import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { type IPropertyPaneConfiguration } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import GemeSpa from './components/GemeSpa';
import './styles/GemeSpa.global.scss';

export type GemeSpaWebPartProps = Record<string, never>;

export default class GemeSpaWebPart extends BaseClientSideWebPart<GemeSpaWebPartProps> {

  public render(): void {
    const urlWeb = this.context.pageContext.web.absoluteUrl;
    const element: React.ReactElement = React.createElement(GemeSpa, {
      context: this.context,
      userDisplayName: this.context.pageContext.user.displayName,
      signOutUrl: `${urlWeb}/_layouts/15/SignOut.aspx`,
      versionWebPart: this._obtenerVersionWebPart()
    });

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return super.onInit();
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  private _obtenerVersionWebPart(): string {
    try {
      return Version.parse(this.manifest.version).toString();
    } catch {
      return String(this.manifest.version);
    }
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: []
    };
  }
}
