import type { TipoSistemaAcceso } from '../../models/SistemaAcceso';

export type LookupSharePointBasico = {
  Id: number;
  Title?: string;
  HASH_TITLE?: string;
};

export type ElementoSistemaAccesoSharePoint = {
  Id: number;
  TIPOACCESO: TipoSistemaAcceso;
  PADREId?: number;
  PADRE?: LookupSharePointBasico;
  ORDEN: number;
  HASH_TITLE: string;
  HASH_KEY: string;
  GRUPOACCESOId?: number[];
  ACTIVO: boolean | number;
  ICONO: string;
};
