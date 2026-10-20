export class IdCenDuplicadoSolicitudIlError extends Error {
  constructor() {
    super('Ya existe una solicitud IL con el mismo ID CEN. Ingrese otro valor.');
    this.name = 'IdCenDuplicadoSolicitudIlError';
  }
}
