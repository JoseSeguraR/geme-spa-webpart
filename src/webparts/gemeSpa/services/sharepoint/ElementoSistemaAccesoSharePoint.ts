import type { TipoSistemaAcceso } from '../../models/SistemaAcceso';

export type LookupSharePointBasico = {
  Id: number;
  Title?: string;
  HASH_TITLE?: string;
};

export type LookupSharePointMultivalor = {
  results?: (number | LookupSharePointBasico)[];
};

export type ElementoSistemaAccesoSharePoint = {
  Id: number;
  TIPOACCESO: TipoSistemaAcceso;
  PADREId?: number | string | number[] | LookupSharePointMultivalor;
  PADRE?: LookupSharePointBasico | LookupSharePointMultivalor | string | number[];
  ORDEN: number;
  HASH_TITLE: string;
  HASH_KEY: string;
  GRUPOACCESOId?: number[];
  ACTIVO: boolean | number;
  ICONO: string;
};
