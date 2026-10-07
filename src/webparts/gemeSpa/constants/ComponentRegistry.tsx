import * as React from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import VistaAdqAbastecimiento from '../components/vistas/VistaAdqAbastecimiento';
import VistaAdqProveedoresAprobadores from '../components/vistas/VistaAdqProveedoresAprobadores';
import VistaAdqProveedoresSolicitante from '../components/vistas/VistaAdqProveedoresSolicitante';
import VistaCorConcentradorAdministrador from '../components/vistas/VistaCorConcentradorAdministrador';
import VistaCorConcentradorDespachador from '../components/vistas/VistaCorConcentradorDespachador';
import VistaCorConcentradorSolicitante from '../components/vistas/VistaCorConcentradorSolicitante';
import VistaCorControlMantenedores from '../components/vistas/VistaCorControlMantenedores';
import VistaCorControlPermisosUsuarios from '../components/vistas/VistaCorControlPermisosUsuarios';
import VistaCorSistemaMonitoreoDatos from '../components/vistas/VistaCorSistemaMonitoreoDatos';
import VistaInicio from '../components/vistas/VistaInicio';

/** Props comunes que el enrutador puede pasar a cualquier vista registrada. */
export type PropsVistaSpa = {
  userDisplayName: string;
  context: WebPartContext;
};

export type ComponenteVistaSpa = React.ComponentType<PropsVistaSpa>;

export type ComponentRegistryMap = Record<string, ComponenteVistaSpa>;

function RegistrarVistaSinProps(Vista: React.ComponentType): ComponenteVistaSpa {
  const VistaRegistrada = (_props: PropsVistaSpa): React.ReactElement => {
    return <Vista />;
  };
  return VistaRegistrada;
}

/**
 * Registro centralizado de vistas implementadas, desacoplado de SISTEMA_ACCESOS.
 * Clave = ruta hash completa (segmentos acumulados por HASH_KEY).
 */
export const componentRegistry: ComponentRegistryMap = {
  inicio: VistaInicio,
  'cor-conecta/concentrador-solicitudes/solicitante': VistaCorConcentradorSolicitante,
  'cor-conecta/concentrador-solicitudes/administrador': RegistrarVistaSinProps(VistaCorConcentradorAdministrador),
  'cor-conecta/concentrador-solicitudes/despachador': RegistrarVistaSinProps(VistaCorConcentradorDespachador),
  'cor-conecta/sistema-monitoreo-datos': RegistrarVistaSinProps(VistaCorSistemaMonitoreoDatos),
  'cor-conecta/control/permisos-usuarios': RegistrarVistaSinProps(VistaCorControlPermisosUsuarios),
  'cor-conecta/control/mantenedores': RegistrarVistaSinProps(VistaCorControlMantenedores),
  'adquisiciones/proveedores/solicitante': RegistrarVistaSinProps(VistaAdqProveedoresSolicitante),
  'adquisiciones/proveedores/aprobadores': RegistrarVistaSinProps(VistaAdqProveedoresAprobadores),
  'adquisiciones/abastecimiento': RegistrarVistaSinProps(VistaAdqAbastecimiento)
};

export function ObtenerComponenteDelRegistro(rutaHash: string): ComponenteVistaSpa | undefined {
  return componentRegistry[rutaHash];
}
