import VistaSolicitudesIlAdministrador from '../../components/vistas/cor-conecta/concentrador/administrador/VistaSolicitudesIl';
import VistaSolicitudesIlDespachador from '../../components/vistas/cor-conecta/concentrador/despachador/VistaSolicitudesIl';
import VistaSolicitudesIlSolicitante from '../../components/vistas/cor-conecta/concentrador/solicitante/VistaSolicitudesIl';
import VistaSolicitudFallaAdministrador from '../../components/vistas/cor-conecta/concentrador/administrador/VistaSolicitudFalla';
import VistaSolicitudFallaDespachador from '../../components/vistas/cor-conecta/concentrador/despachador/VistaSolicitudFalla';
import VistaSolicitudFallaSolicitante from '../../components/vistas/cor-conecta/concentrador/solicitante/VistaSolicitudFalla';
import { RutaHashSolicitudesIl } from '../../components/vistas/cor-conecta/concentrador/administrador/rutas';
import { RutaHashSolicitudesIlDespachador } from '../../components/vistas/cor-conecta/concentrador/despachador/rutas';
import { RutaHashSolicitudesIlSolicitante } from '../../components/vistas/cor-conecta/concentrador/solicitante/rutas';
import {
  RutaHashSolicitudFallaAdministrador,
  RutaHashSolicitudFallaDespachador,
  RutaHashSolicitudFallaSolicitante
} from '../../components/vistas/cor-conecta/concentrador/solicitudes-falla/rutas';
import VistaOperadorRenovableSolicitudes from '../../components/vistas/cor-conecta/concentrador/operador-renovable/solicitudes/VistaOperadorRenovableSolicitudes';
import VistaOperadorRenovableEquipos from '../../components/vistas/cor-conecta/concentrador/operador-renovable/equipos/VistaOperadorRenovableEquipos';
import VistaOperadorRenovableSubestacion from '../../components/vistas/cor-conecta/concentrador/operador-renovable/subestacion/VistaOperadorRenovableSubestacion';
import {
  RutaHashOperadorRenovableEquipos,
  RutaHashOperadorRenovableSolicitudes,
  RutaHashOperadorRenovableSubestacion
} from '../../components/vistas/cor-conecta/concentrador/operador-renovable/rutas';
import type { RegistroVistasMap } from './TiposRegistroVistas';

export const registroVistasCorConecta: RegistroVistasMap = {
  [RutaHashSolicitudesIl]: VistaSolicitudesIlAdministrador,
  [RutaHashSolicitudesIlSolicitante]: VistaSolicitudesIlSolicitante,
  [RutaHashSolicitudesIlDespachador]: VistaSolicitudesIlDespachador,
  [RutaHashSolicitudFallaAdministrador]: VistaSolicitudFallaAdministrador,
  [RutaHashSolicitudFallaSolicitante]: VistaSolicitudFallaSolicitante,
  [RutaHashSolicitudFallaDespachador]: VistaSolicitudFallaDespachador,
  [RutaHashOperadorRenovableSolicitudes]: VistaOperadorRenovableSolicitudes,
  [RutaHashOperadorRenovableEquipos]: VistaOperadorRenovableEquipos,
  [RutaHashOperadorRenovableSubestacion]: VistaOperadorRenovableSubestacion
};
