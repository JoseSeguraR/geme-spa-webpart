import VistaSolicitudesIlAdministrador from '../../components/vistas/cor-conecta/concentrador/administrador/VistaSolicitudesIl';
import VistaSolicitudesIlDespachador from '../../components/vistas/cor-conecta/concentrador/despachador/VistaSolicitudesIl';
import VistaSolicitudesIlSolicitante from '../../components/vistas/cor-conecta/concentrador/solicitante/VistaSolicitudesIl';
import { RutaHashSolicitudesIl } from '../../components/vistas/cor-conecta/concentrador/administrador/rutas';
import { RutaHashSolicitudesIlDespachador } from '../../components/vistas/cor-conecta/concentrador/despachador/rutas';
import { RutaHashSolicitudesIlSolicitante } from '../../components/vistas/cor-conecta/concentrador/solicitante/rutas';
import type { RegistroVistasMap } from './TiposRegistroVistas';

export const registroVistasCorConecta: RegistroVistasMap = {
  [RutaHashSolicitudesIl]: VistaSolicitudesIlAdministrador,
  [RutaHashSolicitudesIlSolicitante]: VistaSolicitudesIlSolicitante,
  [RutaHashSolicitudesIlDespachador]: VistaSolicitudesIlDespachador
};
