export type TipoSistemaAcceso = 'Header' | 'Route' | 'ExternalLink';

export type RegistroSistemaAccesoNormalizado = {
  id: number;
  tipo: TipoSistemaAcceso;
  padreId?: number;
  orden: number;
  hashTitle: string;
  hashKey: string;
  gruposAccesoIds: number[];
  activo: boolean;
  icono: string;
};
