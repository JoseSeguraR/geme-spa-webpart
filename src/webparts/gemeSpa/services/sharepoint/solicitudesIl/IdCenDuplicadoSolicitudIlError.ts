export class IdCenDuplicadoSolicitudIlError extends Error {
  constructor() {
    super('Ya existe una solicitud IL con el mismo ID CEN. Ingrese otro valor.');
    // El web part compila a ES5: sin esto, `instanceof IdCenDuplicadoSolicitudIlError` da false
    Object.setPrototypeOf(this, IdCenDuplicadoSolicitudIlError.prototype);
    this.name = 'IdCenDuplicadoSolicitudIlError';
  }
}
