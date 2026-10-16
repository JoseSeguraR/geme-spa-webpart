import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  type IPropertyPanePage,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import GemeSpa from './components/GemeSpa';
import type { PropiedadesWebPartSolicitudesIl } from './models/ConfiguracionSolicitudesIl';
import './styles/GemeSpa.global.scss';

export type GemeSpaWebPartProps = PropiedadesWebPartSolicitudesIl;

const GrupoFlujoBitacoraSolicitudesIl = 'Solicitudes IL · Flujo (bitácora)';
const GrupoEnlacesSolicitudesIl = 'Solicitudes IL · Enlaces';
const GrupoSiodSolicitudesIl = 'Solicitudes IL · SIOD (Azure Functions)';

function CampoUrlPropertyPane(
  clave: keyof PropiedadesWebPartSolicitudesIl,
  label: string,
  description: string
): ReturnType<typeof PropertyPaneTextField> {
  return PropertyPaneTextField(clave, {
    label,
    description,
    placeholder: 'https://…',
    multiline: true,
    rows: 3
  });
}

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
        concSolicitudesIlIdAccionReactivar: this.properties.concSolicitudesIlIdAccionReactivar,
        concSolicitudesIlUrlExcelVinculado: this.properties.concSolicitudesIlUrlExcelVinculado,
        concSolicitudesIlUrlInsertSIOD: this.properties.concSolicitudesIlUrlInsertSIOD,
        concSolicitudesIlUrlDeleteSIOD: this.properties.concSolicitudesIlUrlDeleteSIOD,
        concSolicitudesIlUrlUpdateSIOD: this.properties.concSolicitudesIlUrlUpdateSIOD
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
    const paginaCorConecta = {
      displayName: 'COR Conecta',
      header: {
        description:
          'Concentrador · Solicitudes IL. Expanda cada grupo según lo que deba configurar.'
      },
      displayGroupsAsAccordion: true,
      groups: [
            {
              groupName: GrupoFlujoBitacoraSolicitudesIl,
              isCollapsed: true,
              groupFields: [
                PropertyPaneTextField('concSolicitudesIlIdTareaCrear', {
                  label: 'ID Tarea Crear',
                  description: 'Ítem lookup en listas del motor (número entero).',
                  placeholder: 'Ej.: 1'
                }),
                PropertyPaneTextField('concSolicitudesIlIdTareaFinalizar', {
                  label: 'ID Tarea Finalizar',
                  description: 'Ítem lookup en listas del motor (número entero).',
                  placeholder: 'Ej.: 2'
                }),
                PropertyPaneTextField('concSolicitudesIlIdTareaAnular', {
                  label: 'ID Tarea Anular',
                  description: 'Ítem lookup en listas del motor (número entero).',
                  placeholder: 'Ej.: 3'
                }),
                PropertyPaneTextField('concSolicitudesIlIdTareaReactivar', {
                  label: 'ID Tarea Reactivar',
                  description: 'Ítem lookup en listas del motor (número entero).',
                  placeholder: 'Ej.: 4'
                }),
                PropertyPaneTextField('concSolicitudesIlIdAccionFinalizar', {
                  label: 'ID Acción Finalizar',
                  description: 'Ítem lookup de acción de avance (número entero).',
                  placeholder: 'Ej.: 5'
                }),
                PropertyPaneTextField('concSolicitudesIlIdAccionAnular', {
                  label: 'ID Acción Anular',
                  description: 'Ítem lookup de acción de avance (número entero).',
                  placeholder: 'Ej.: 6'
                }),
                PropertyPaneTextField('concSolicitudesIlIdAccionReactivar', {
                  label: 'ID Acción Reactivar',
                  description: 'Ítem lookup de acción de avance (número entero).',
                  placeholder: 'Ej.: 7'
                })
              ]
            },
            {
              groupName: GrupoEnlacesSolicitudesIl,
              isCollapsed: true,
              groupFields: [
                CampoUrlPropertyPane(
                  'concSolicitudesIlUrlExcelVinculado',
                  'URL Excel vinculado',
                  'Enlace al archivo Excel vinculado (URL absoluta o relativa al sitio).'
                )
              ]
            },
            {
              groupName: GrupoSiodSolicitudesIl,
              isCollapsed: true,
              groupFields: [
                CampoUrlPropertyPane(
                  'concSolicitudesIlUrlInsertSIOD',
                  'URL Insert SIOD',
                  'Endpoint de inserción en SIOD (Azure Function u otro servicio).'
                ),
                CampoUrlPropertyPane(
                  'concSolicitudesIlUrlDeleteSIOD',
                  'URL Delete SIOD',
                  'Endpoint de eliminación en SIOD (Azure Function u otro servicio).'
                ),
                CampoUrlPropertyPane(
                  'concSolicitudesIlUrlUpdateSIOD',
                  'URL Update SIOD',
                  'Endpoint de actualización en SIOD (Azure Function u otro servicio).'
                )
              ]
            }
          ]
    } as IPropertyPanePage & { displayName: string };

    return {
      pages: [paginaCorConecta as IPropertyPanePage]
    };
  }
}
