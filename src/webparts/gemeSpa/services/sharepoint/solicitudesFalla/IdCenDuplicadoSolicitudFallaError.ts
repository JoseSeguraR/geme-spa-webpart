export class IdCenDuplicadoSolicitudFallaError extends Error {
  constructor() {
    super('Ya existe una solicitud de falla con ese ID CEN.');
    this.name = 'IdCenDuplicadoSolicitudFallaError';
  }
}