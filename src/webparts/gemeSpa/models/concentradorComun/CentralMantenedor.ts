export type CentralMantenedor = {
  id: number;
  central: string;
  codigoSiod: string;
  /** Operador renovable: true si `ESTADO = Activo` en Instalaciones. */
  esRenovable?: boolean;
};
