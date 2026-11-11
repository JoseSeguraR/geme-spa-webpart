import * as React from 'react';
import MantenedorCatalogo from '../../components/vistas/cor-conecta/control-sitio/mantenedores/MantenedorCatalogo';
import MantenedorEquiposCentral from '../../components/vistas/cor-conecta/control-sitio/mantenedores/MantenedorEquiposCentral';
import MantenedorPlazos from '../../components/vistas/cor-conecta/control-sitio/mantenedores/MantenedorPlazos';
import {
  DefinicionAfectaciones,
  DefinicionCentrales,
  DefinicionEmpresas,
  DefinicionTiposEquipos,
  DefinicionTiposTecnologia,
  DefinicionTiposTrabajo
} from '../../components/vistas/cor-conecta/control-sitio/mantenedores/DefinicionesCatalogos';
import type { DefinicionCatalogo } from '../../components/vistas/cor-conecta/control-sitio/mantenedores/TiposCatalogo';
import VistaPermisosUsuarios from '../../components/vistas/cor-conecta/control-sitio/permisos-usuarios/VistaPermisosUsuarios';
import {
  HashKeyPermisosUsuarios,
  SufijoRutaMantenedor,
  type ClaveMantenedor
} from '../../components/vistas/cor-conecta/control-sitio/rutas';
import type { ComponenteVistaSpa, PropsVistaSpa, RegistroVistasMap } from './TiposRegistroVistas';

function VistaCatalogo(clave: ClaveMantenedor, definicion: DefinicionCatalogo): ComponenteVistaSpa {
  const Vista = (props: PropsVistaSpa): React.ReactElement => (
    <MantenedorCatalogo key={clave} context={props.context} clave={clave} definicion={definicion} />
  );
  return Vista;
}

function VistaPlazos(clave: 'plazo-programadas' | 'plazo-sodi'): ComponenteVistaSpa {
  const Vista = (props: PropsVistaSpa): React.ReactElement => (
    <MantenedorPlazos key={clave} context={props.context} clave={clave} />
  );
  return Vista;
}

/**
 * Vistas de «Control Sitio» registradas por **sufijo** de la ruta: el prefijo depende de los HASH_KEY de
 * «Control Sitio» en SISTEMA_ACCESOS (ver `ObtenerComponenteDelRegistro`).
 */
export const registroVistasControlSitioPorSufijo: RegistroVistasMap = {
  [HashKeyPermisosUsuarios]: VistaPermisosUsuarios,
  [SufijoRutaMantenedor('plazo-programadas')]: VistaPlazos('plazo-programadas'),
  [SufijoRutaMantenedor('plazo-sodi')]: VistaPlazos('plazo-sodi'),
  [SufijoRutaMantenedor('empresas')]: VistaCatalogo('empresas', DefinicionEmpresas),
  [SufijoRutaMantenedor('centrales')]: VistaCatalogo('centrales', DefinicionCentrales),
  [SufijoRutaMantenedor('tipos-tecnologia')]: VistaCatalogo('tipos-tecnologia', DefinicionTiposTecnologia),
  [SufijoRutaMantenedor('equipos-central')]: (props: PropsVistaSpa) => <MantenedorEquiposCentral context={props.context} />,
  [SufijoRutaMantenedor('tipos-equipos')]: VistaCatalogo('tipos-equipos', DefinicionTiposEquipos),
  [SufijoRutaMantenedor('afectaciones')]: VistaCatalogo('afectaciones', DefinicionAfectaciones),
  [SufijoRutaMantenedor('tipos-trabajo')]: VistaCatalogo('tipos-trabajo', DefinicionTiposTrabajo)
};
