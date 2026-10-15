import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import GemeSpa from './components/GemeSpa';
import type { PropiedadesWebPartSolicitudesIl } from './models/ConfiguracionSolicitudesIl';
import './styles/GemeSpa.global.scss';

export type GemeSpaWebPartProps = PropiedadesWebPartSolicitudesIl;

const GrupoPropiedadesSolicitudesIl = 'Concentrador - Solicitudes IL';

export default class GemeSpaWebPart extends BaseClientSideWebPart<GemeSpaWebPartProps> {

  public render(): void {
    const urlWeb = this.context.pageContext.web.absoluteUrl;
    const element: React.ReactElement = React.createElement(GemeSpa, {
      context: this.context,
      userDisplayName: this.context.pageContext.user.displayName,
      signOutUrl: `${urlWeb}/_layouts/15/SignOut.aspx`,
      versionWebPart: this._obtenerVersionWebPart(),
      propiedadesSolicitudesIl: {
        concSolicitudesIlIdTareaCrear: this.properties.concSolicitudesIlIdTareaCrear,
        concSolicitudesIlIdTareaFinalizar: this.properties.concSolicitudesIlIdTareaFinalizar,
        concSolicitudesIlIdTareaAnular: this.properties.concSolicitudesIlIdTareaAnular,
        concSolicitudesIlIdTareaReactivar: this.properties.concSolicitudesIlIdTareaReactivar,
        concSolicitudesIlIdAccionFinalizar: this.properties.concSolicitudesIlIdAccionFinalizar,
        concSolicitudesIlIdAccionAnular: this.properties.concSolicitudesIlIdAccionAnular,
        concSolicitudesIlIdAccionReactivar: this.properties.concSolicitudesIlIdAccionReactivar
      }
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
      pages: [
        {
          header: {
            description: 'Configuración de la SPA GEME'
          },
          groups: [
            {
              groupName: GrupoPropiedadesSolicitudesIl,
              groupFields: [
                PropertyPaneTextField('concSolicitudesIlIdTareaCrear', {
                  label: 'ID Tarea Crear'
                }),
                PropertyPaneTextField('concSolicitudesIlIdTareaFinalizar', {
                  label: 'ID Tarea Finalizar'
                }),
                PropertyPaneTextField('concSolicitudesIlIdTareaAnular', {
                  label: 'ID Tarea Anular'
                }),
                PropertyPaneTextField('concSolicitudesIlIdTareaReactivar', {
                  label: 'ID Tarea Reactivar'
                }),
                PropertyPaneTextField('concSolicitudesIlIdAccionFinalizar', {
                  label: 'ID Acción Finalizar'
                }),
                PropertyPaneTextField('concSolicitudesIlIdAccionAnular', {
                  label: 'ID Acción Anular'
                }),
                PropertyPaneTextField('concSolicitudesIlIdAccionReactivar', {
                  label: 'ID Acción Reactivar'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
