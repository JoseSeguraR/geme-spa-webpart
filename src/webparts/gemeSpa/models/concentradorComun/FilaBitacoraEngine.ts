export type FilaBitacoraEngine = {
  id: number;
  tarea: string;
  fechaInicioTarea: string;
  estadoInicial: string;
  accionCierre: string;
  fechaCierre: string;
  responsableCierre: string;
  estadoFinal: string;
  tareaIdentificador: string;
  /** Nombres de usuario en líneas separadas (lookup multivalor tarea origen). */
  responsablesOrigen: string;
  usuarioAvance: string;
  responsableComentarios: string;
};
