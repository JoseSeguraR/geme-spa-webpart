export type IdRuta =
  | 'inicio'
  | 'cor-conecta/concentrador-solicitudes/solicitante'
  | 'cor-conecta/concentrador-solicitudes/administrador'
  | 'cor-conecta/concentrador-solicitudes/despachador'
  | 'cor-conecta/sistema-monitoreo-datos'
  | 'cor-conecta/control/permisos-usuarios'
  | 'cor-conecta/control/mantenedores'
  | 'adquisiciones/proveedores/solicitante'
  | 'adquisiciones/proveedores/aprobadores'
  | 'adquisiciones/abastecimiento';

export const RutaInicio: IdRuta = 'inicio';
