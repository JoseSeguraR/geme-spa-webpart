export type TipoSistemaAcceso = 'Header' | 'Route' | 'ExternalLink';

export type RegistroSistemaAccesoNormalizado = {
  id: number;
  tipo: TipoSistemaAcceso;
  /** Ids de ítems PADRE (lookup multivalor); vacío = raíz del menú. */
  padreIds: number[];
  orden: number;
  hashTitle: string;
  hashKey: string;
  gruposAccesoIds: number[];
  activo: boolean;
  icono: string;
};
